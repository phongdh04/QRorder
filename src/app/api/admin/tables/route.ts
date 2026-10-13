import { NextRequest, NextResponse } from 'next/server';
import { adminGetTables } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const restaurantId = user?.restaurantId || request.headers.get('x-restaurant-id');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin quán.' }, { status: 401 });
    }

    const tables = await adminGetTables(restaurantId);
    return NextResponse.json({ success: true, tables });
  } catch (error) {
    console.error('Lỗi admin/tables:', error);
    return NextResponse.json({ error: 'Lỗi tải danh sách bàn.' }, { status: 500 });
  }
}
