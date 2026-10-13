import { NextRequest, NextResponse } from 'next/server';
import { adminExportRevenueCsv } from '@/lib/dal/revenue';
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

    const csvContent = await adminExportRevenueCsv(
      user.restaurantId,
      user.role,
      range,
      startDate,
      endDate
    );

    const filename = `doanh_thu_${range}_${Date.now()}.csv`;

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Lỗi API admin/revenue/export:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi xuất file CSV.' },
      { status: 500 }
    );
  }
}
