import { NextRequest, NextResponse } from 'next/server';
import { adminGetMenu } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const restaurantId = user?.restaurantId || request.headers.get('x-restaurant-id');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin quán.' }, { status: 401 });
    }

    const menu = await adminGetMenu(restaurantId);
    return NextResponse.json({ success: true, menu });
  } catch (error) {
    console.error('Lỗi admin/menu:', error);
    return NextResponse.json({ error: 'Lỗi tải thực đơn.' }, { status: 500 });
  }
}
