import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkAndRecordServiceRequestRateLimit } from '@/lib/rate-limit';
import { broadcastQrEvent } from '@/lib/events';

const requestSchema = z.object({
  token: z.string().min(10, 'Mã token bàn không hợp lệ'),
  type: z.enum(['call_staff', 'request_bill']),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // 1. Xác thực schema Zod
    const validation = requestSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { token, type } = validation.data;

    // 2. Xác thực bàn
    const table = await prisma.table.findFirst({
      where: {
        token: token.trim(),
        is_active: true,
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Bàn không tồn tại hoặc đã ngừng phục vụ' },
        { status: 404 }
      );
    }

    // 3. Rate limit: 1 lần / 60 giây / bàn
    const rateCheck = checkAndRecordServiceRequestRateLimit(table.id, type);
    if (!rateCheck.allowed) {
      const typeLabel = type === 'call_staff' ? 'gọi nhân viên' : 'yêu cầu thanh toán';
      return NextResponse.json(
        {
          error: `Bạn vừa gửi yêu cầu ${typeLabel}. Vui lòng đợi ${rateCheck.waitSeconds}s trước khi gửi tiếp.`,
        },
        { status: 429 }
      );
    }

    const restaurantId = table.restaurant_id;

    // 4. Tìm hoặc tạo phiên 'open' của bàn
    let session = await prisma.tableSession.findFirst({
      where: {
        table_id: table.id,
        restaurant_id: restaurantId,
        status: 'open',
      },
    });

    if (!session) {
      session = await prisma.tableSession.create({
        data: {
          restaurant_id: restaurantId,
          table_id: table.id,
          status: 'open',
          total: 0,
        },
      });
    }

    // 5. Kiểm tra nếu đã có yêu cầu cùng loại đang chờ hoặc đang xử lý cho bàn này
    const existingActiveRequest = await prisma.serviceRequest.findFirst({
      where: {
        table_id: table.id,
        restaurant_id: restaurantId,
        type,
        status: { in: ['pending', 'claimed'] },
      },
      include: {
        claimed_by_user: { select: { name: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    const typeDesc = type === 'call_staff' ? 'Gọi nhân viên' : 'Yêu cầu thanh toán';

    if (existingActiveRequest) {
      // Đã có yêu cầu đang mở -> Ghi log nhắc lại nhưng KHÔNG tạo record trùng lặp
      await prisma.requestEvent.create({
        data: {
          request_id: existingActiveRequest.id,
          restaurant_id: restaurantId,
          actor_user_id: null,
          event: 'notified',
          meta: {
            tableName: table.name,
            type,
            reminder: true,
            at: new Date().toISOString(),
          },
        },
      });

      // Nếu đã có nhân viên nhận việc: không spam còi hú, báo khách nhân viên đang đến
      if (existingActiveRequest.status === 'claimed') {
        const staffName = existingActiveRequest.claimed_by_user?.name;
        const msg = staffName
          ? `Nhân viên ${staffName} đã nhận yêu cầu và đang trên đường đến bàn!`
          : 'Nhân viên đã tiếp nhận và đang trên đường đến bàn!';

        return NextResponse.json({
          success: true,
          message: msg,
          request: {
            id: existingActiveRequest.id,
            type,
            status: existingActiveRequest.status,
            description: typeDesc,
            createdAt: existingActiveRequest.created_at,
            isReminder: true,
          },
        });
      }

      // Nếu vẫn đang pending: Bắn SSE cập nhật nhẹ nhàng mà KHÔNG hú còi báo động lặp lại gây hối thúc
      await broadcastQrEvent({
        type: 'request_created',
        restaurantId,
        tableId: table.id,
        sessionId: session.id,
        requestId: existingActiveRequest.id,
        status: 'pending',
        data: {
          type,
          tableName: table.name,
          zoneId: table.zone_id,
          isReminder: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Nhân viên đã ghi nhận yêu cầu của bàn và sẽ đến ngay!',
        request: {
          id: existingActiveRequest.id,
          type,
          status: existingActiveRequest.status,
          description: typeDesc,
          createdAt: existingActiveRequest.created_at,
          isReminder: true,
        },
      });
    }

    // 6. Chưa có yêu cầu nào đang mở -> Tạo ServiceRequest mới
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        restaurant_id: restaurantId,
        table_id: table.id,
        session_id: session.id,
        type,
        status: 'pending',
      },
    });

    // 7. Ghi log sự kiện tạo mới
    await prisma.requestEvent.create({
      data: {
        request_id: serviceRequest.id,
        restaurant_id: restaurantId,
        actor_user_id: null,
        event: 'created',
        meta: {
          tableName: table.name,
          type,
        },
      },
    });

    // 8. Bắn tín hiệu Realtime SSE tạo yêu cầu mới
    await broadcastQrEvent({
      type: 'request_created',
      restaurantId,
      tableId: table.id,
      sessionId: session.id,
      requestId: serviceRequest.id,
      status: 'pending',
      data: {
        type,
        tableName: table.name,
        zoneId: table.zone_id,
      },
    });

    // 9. Gửi thông báo Web Push + In-App cho nhân viên & quản lý (Lần đầu tiên)
    try {
      const { findRecipientsForTable } = await import('@/lib/service-requests');
      const { notificationDispatcher } = await import('@/lib/notifications');
      const recipients = await findRecipientsForTable(restaurantId, table.id);
      notificationDispatcher.dispatchAsync(recipients, {
        title: `${table.name} – ${typeDesc}`,
        body: `Khách tại ${table.name} đang cần hỗ trợ phục vụ.`,
        tag: serviceRequest.id,
        url: `/staff?request=${serviceRequest.id}`,
        priority: 'normal',
        restaurantId,
      });
    } catch (notifErr) {
      console.error('Lỗi dispatch thông báo gọi nhân viên:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Nhân viên sẽ đến ngay!',
      request: {
        id: serviceRequest.id,
        type,
        status: serviceRequest.status,
        description: typeDesc,
        createdAt: serviceRequest.created_at,
      },
    });
  } catch (error: any) {
    console.error('Lỗi API POST /api/customer/service-request:', error);
    return NextResponse.json(
      { error: error?.message || 'Đã xảy ra lỗi khi gửi yêu cầu' },
      { status: 500 }
    );
  }
}
