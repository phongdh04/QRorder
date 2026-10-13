import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminUpdateOrderStatus } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';
import { broadcastQrEvent } from '@/lib/events';

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'served', 'cancelled']),
  cancelReason: z.string().max(250).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }
    const restaurantId = user.restaurantId;

    const rawBody = await request.json();
    const validation = updateOrderStatusSchema.safeParse(rawBody);

    if (!validation.success) {
      const err = validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ.';
      return NextResponse.json({ error: err }, { status: 400 });
    }

    const { status, cancelReason } = validation.data;

    const updated = await adminUpdateOrderStatus(
      restaurantId,
      params.id,
      status,
      cancelReason
    );

    // Phát sự kiện Realtime qua Postgres NOTIFY tới SSE
    await broadcastQrEvent({
      type: 'order_status_changed',
      restaurantId,
      tableId: updated.table_id,
      sessionId: updated.session_id,
      orderId: updated.id,
      status: updated.status,
      data: {
        cancelReason: updated.cancel_reason,
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('Lỗi admin/orders/[id]:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi cập nhật trạng thái đơn.' },
      { status: 400 }
    );
  }
}
