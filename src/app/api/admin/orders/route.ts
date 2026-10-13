import { NextRequest, NextResponse } from 'next/server';
import { adminGetOrders } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const restaurantId = user?.restaurantId || request.headers.get('x-restaurant-id');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin quán.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const tableId = searchParams.get('tableId') || undefined;

    const orders = await adminGetOrders(restaurantId, { status, tableId });
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Lỗi admin/orders:', error);
    return NextResponse.json({ error: 'Lỗi tải danh sách đơn.' }, { status: 500 });
  }
}
