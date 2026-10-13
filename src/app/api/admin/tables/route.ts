import { NextRequest, NextResponse } from 'next/server';
import { adminGetTables } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';
import { adminCreateTable } from '@/lib/dal/management';
import { z } from 'zod';

const createTableSchema = z.object({
  name: z.string().min(1, 'Tên bàn không được để trống').max(50),
});

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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createTableSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Tên bàn không hợp lệ.' },
        { status: 400 }
      );
    }

    const table = await adminCreateTable(user.restaurantId, validated.data.name);
    return NextResponse.json({ success: true, table }, { status: 201 });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/tables:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi thêm bàn mới.' },
      { status: 400 }
    );
  }
}
