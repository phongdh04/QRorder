import { NextRequest, NextResponse } from 'next/server';
import { adminGetTables } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }
    const restaurantId = user.restaurantId;

    const tables = await adminGetTables(restaurantId);
    return NextResponse.json({ success: true, tables });
  } catch (error) {
    console.error('Lỗi admin/tables:', error);
    return NextResponse.json({ error: 'Lỗi tải danh sách bàn.' }, { status: 500 });
  }
}
