import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminReopenTableSession } from '@/lib/dal/payment';
import { getCurrentUser } from '@/lib/auth';
import { broadcastQrEvent } from '@/lib/events';

const reopenSessionSchema = z.object({
  reason: z.string().min(3, 'Lý do mở lại bill phải có ít nhất 3 ký tự').max(500),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Chỉ có tài khoản chủ quán (Role: Owner) mới có quyền mở lại bill đã thanh toán.' },
        { status: 403 }
      );
    }

    const sessionId = params.id;
    const rawBody = await request.json().catch(() => ({}));
    const validation = reopenSessionSchema.safeParse(rawBody);

    if (!validation.success) {
      const err = validation.error.issues[0]?.message || 'Vui lòng nhập lý do mở lại bill.';
      return NextResponse.json({ error: err }, { status: 400 });
    }

    const reopened = await adminReopenTableSession(
      user.restaurantId,
      user.userId,
      user.role,
      sessionId,
      validation.data.reason
    );

    // Phát sự kiện Realtime qua Postgres NOTIFY tới SSE để lưới bàn cập nhật lại phiên mở
    await broadcastQrEvent({
      type: 'session_updated',
      restaurantId: user.restaurantId,
      tableId: reopened.table_id,
      sessionId: reopened.id,
      status: 'open',
      total: reopened.total,
    });

    return NextResponse.json({
      success: true,
      message: 'Mở lại bill thành công. Bàn đã chuyển về trạng thái đang mở.',
      session: reopened,
    });
  } catch (error: any) {
    console.error('Lỗi API admin/sessions/[id]/reopen:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi mở lại bill.' },
      { status: 400 }
    );
  }
}
