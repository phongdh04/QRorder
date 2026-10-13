import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkAndRecordOrderRateLimit } from '@/lib/rate-limit';
import { broadcastQrEvent } from '@/lib/events';

// Zod Schema xác thực dữ liệu gửi lên
const orderSchema = z.object({
  token: z.string().min(10, 'Mã token bàn không hợp lệ'),
  items: z
    .array(
      z.object({
        menu_item_id: z.string().min(1, 'Mã món không hợp lệ'),
        quantity: z
          .number()
          .int('Số lượng phải là số nguyên')
          .min(1, 'Số lượng tối thiểu là 1')
          .max(20, 'Tối đa 20 phần cho mỗi món'),
        note: z.string().max(200, 'Ghi chú mỗi món tối đa 200 ký tự').optional().nullable(),
      })
    )
    .min(1, 'Vui lòng chọn ít nhất 1 món để đặt')
    .max(50, 'Đơn hàng vượt quá giới hạn tối đa 50 món'),
  note: z.string().max(500, 'Ghi chú chung tối đa 500 ký tự').optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // 1. Xác thực bằng Zod
    const validationResult = orderSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'Dữ liệu đơn hàng không hợp lệ';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { token, items, note } = validationResult.data;

    // 2. Chống spam: Rate limit theo token bàn và IP
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateCheck = checkAndRecordOrderRateLimit(`${token}:${clientIp}`);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Bạn vừa gửi đơn gọi món. Vui lòng đợi ${rateCheck.waitSeconds} giây trước khi gửi tiếp để quầy bar kịp tiếp nhận.`,
        },
        { status: 429 }
      );
    }

    // 3. Xác thực bàn
    const table = await prisma.table.findFirst({
      where: {
        token: token.trim(),
        is_active: true,
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Mã QR này không còn hiệu lực hoặc bàn đã ngừng hoạt động.' },
        { status: 404 }
      );
    }

    const restaurantId = table.restaurant_id;

    // 4. LẤY GIÁ VÀ THÔNG TIN MÓN TỪ DATABASE (Tuyệt đối không tin giá client gửi)
    const itemIds = items.map((i) => i.menu_item_id);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: itemIds },
        restaurant_id: restaurantId,
      },
    });

    if (dbMenuItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: 'Một số món không tồn tại trong thực đơn của quán.' },
        { status: 400 }
      );
    }

    // Kiểm tra món còn phục vụ không
    for (const dbItem of dbMenuItems) {
      if (!dbItem.is_available) {
        return NextResponse.json(
          { error: `Món "${dbItem.name}" hiện vừa hết nguyên liệu. Vui lòng chọn món khác.` },
          { status: 400 }
        );
      }
    }

    const itemMap = new Map(dbMenuItems.map((item) => [item.id, item]));

    // 5. Transaction: Tìm hoặc tạo session 'open' của bàn, tạo order + order_items snapshot
    const result = await prisma.$transaction(async (tx) => {
      // Tìm session 'open' hiện tại của bàn
      let session = await tx.tableSession.findFirst({
        where: {
          table_id: table.id,
          restaurant_id: restaurantId,
          status: 'open',
        },
      });

      // Nếu chưa có hoặc phiên trước đã đóng/thanh toán -> Tự tạo session 'open' mới
      if (!session) {
        session = await tx.tableSession.create({
          data: {
            restaurant_id: restaurantId,
            table_id: table.id,
            status: 'open',
            total: 0,
          },
        });
      }

      // Tạo Order mới với trạng thái pending
      const newOrder = await tx.order.create({
        data: {
          session_id: session.id,
          restaurant_id: restaurantId,
          table_id: table.id,
          status: 'pending',
          note: note?.trim() || null,
        },
      });

      // Tính tổng tiền từ giá snapshot gốc trong Database
      let orderTotalAmount = 0;
      const orderItemsData = items.map((clientItem) => {
        const dbItem = itemMap.get(clientItem.menu_item_id)!;
        const lineTotal = dbItem.price * clientItem.quantity;
        orderTotalAmount += lineTotal;

        return {
          order_id: newOrder.id,
          menu_item_id: dbItem.id,
          name_snapshot: dbItem.name,
          price_snapshot: dbItem.price,
          quantity: clientItem.quantity,
          note: clientItem.note?.trim() || null,
        };
      });

      // Tạo các dòng order_items
      await tx.orderItem.createMany({
        data: orderItemsData,
      });

      // Cập nhật tổng tiền của session
      const updatedSession = await tx.tableSession.update({
        where: { id: session.id },
        data: {
          total: { increment: orderTotalAmount },
        },
      });

      return {
        orderId: newOrder.id,
        sessionId: session.id,
        orderTotalAmount,
        sessionTotal: updatedSession.total,
        orderCreatedAt: newOrder.created_at,
        orderStatus: newOrder.status,
      };
    });

    // 6. Sau khi ghi thành công, gọi pg_notify báo sự kiện realtime
    await broadcastQrEvent({
      type: 'order_created',
      restaurantId,
      tableId: table.id,
      sessionId: result.sessionId,
      orderId: result.orderId,
      status: 'pending',
      total: result.sessionTotal,
      data: {
        tableName: table.name,
        orderAmount: result.orderTotalAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Gửi đơn gọi món thành công tới quầy bar!',
      order: {
        id: result.orderId,
        status: result.orderStatus,
        total: result.orderTotalAmount,
        createdAt: result.orderCreatedAt,
      },
      sessionTotal: result.sessionTotal,
    });
  } catch (error: any) {
    console.error('Lỗi API POST /api/orders:', error);
    return NextResponse.json(
      { error: error?.message || 'Đã xảy ra lỗi trên hệ thống khi tạo đơn.' },
      { status: 500 }
    );
  }
}
