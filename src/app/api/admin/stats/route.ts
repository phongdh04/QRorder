import { NextRequest, NextResponse } from 'next/server';
import { adminGetDashboardStats } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }
    const restaurantId = user.restaurantId;

    const stats = await adminGetDashboardStats(restaurantId);
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Lỗi admin/stats:', error);
    return NextResponse.json({ error: 'Lỗi tải thống kê quán.' }, { status: 500 });
  }
}
