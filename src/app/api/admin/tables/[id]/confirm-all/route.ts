import { NextRequest, NextResponse } from 'next/server';
import { adminBatchConfirmTableOrders } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';
import { broadcastQrEvent } from '@/lib/events';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }
    const restaurantId = user.restaurantId;
    const tableId = params.id;

    const result = await adminBatchConfirmTableOrders(restaurantId, tableId);

    // Phát sự kiện realtime cho từng đơn đã xác nhận
    if (result.count > 0) {
      for (const orderId of result.updatedIds) {
        await broadcastQrEvent({
          type: 'order_status_changed',
          restaurantId,
          tableId,
          orderId,
          status: 'preparing',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã xác nhận ${result.count} đơn sang pha chế.`,
      count: result.count,
    });
  } catch (error: any) {
    console.error('Lỗi admin/tables/[id]/confirm-all:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi xác nhận tất cả đơn.' },
      { status: 400 }
    );
  }
}
