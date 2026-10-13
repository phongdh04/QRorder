import { NextRequest, NextResponse } from 'next/server';
import { adminGetDashboardStats } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const restaurantId = user?.restaurantId || request.headers.get('x-restaurant-id');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Không xác định được quán bar.' }, { status: 401 });
    }

    const stats = await adminGetDashboardStats(restaurantId);
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Lỗi admin/stats:', error);
    return NextResponse.json({ error: 'Lỗi tải thống kê quán.' }, { status: 500 });
  }
}
