import { NextRequest, NextResponse } from 'next/server';
import { adminUpdateOrderStatus } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const restaurantId = user?.restaurantId || request.headers.get('x-restaurant-id');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin quán.' }, { status: 401 });
    }

    const body = await request.json();
    const { status, cancelReason } = body;

    if (!['pending', 'preparing', 'served', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Trạng thái đơn không hợp lệ.' }, { status: 400 });
    }

    const updated = await adminUpdateOrderStatus(
      restaurantId,
      params.id,
      status,
      cancelReason
    );

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('Lỗi admin/orders/[id]:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi cập nhật trạng thái đơn.' },
      { status: 400 }
    );
  }
}
