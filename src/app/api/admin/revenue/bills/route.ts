import { NextRequest, NextResponse } from 'next/server';
import { adminGetPaidBills } from '@/lib/dal/revenue';
import { getCurrentUser } from '@/lib/auth';
import { RevenueRangeType } from '@/lib/tz';

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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const searchTable = searchParams.get('searchTable');

    const result = await adminGetPaidBills(
      user.restaurantId,
      user.role,
      range,
      startDate,
      endDate,
      page,
      limit,
      searchTable
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Lỗi API admin/revenue/bills:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi tải danh sách hóa đơn.' },
      { status: 500 }
    );
  }
}
