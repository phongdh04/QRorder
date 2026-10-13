import { NextRequest, NextResponse } from 'next/server';
import { adminGetRevenueAnalytics } from '@/lib/dal/revenue';
import { getCurrentUser } from '@/lib/auth';
import { RevenueRangeType } from '@/lib/tz';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || 'today') as RevenueRangeType;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const analytics = await adminGetRevenueAnalytics(
      user.restaurantId,
      user.role,
      range,
      startDate,
      endDate
    );

    return NextResponse.json({ success: true, analytics });
  } catch (error: any) {
    console.error('Lỗi API admin/revenue/analytics:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi tải thống kê doanh thu.' },
      { status: 500 }
    );
  }
}
