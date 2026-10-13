import { NextRequest, NextResponse } from 'next/server';
import { adminGetKitchenQueue } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }
    const restaurantId = user.restaurantId;

    const queue = await adminGetKitchenQueue(restaurantId);
    return NextResponse.json({ success: true, queue });
  } catch (error) {
    console.error('Lỗi admin/kitchen-queue:', error);
    return NextResponse.json({ error: 'Lỗi tải hàng đợi món.' }, { status: 500 });
  }
}
