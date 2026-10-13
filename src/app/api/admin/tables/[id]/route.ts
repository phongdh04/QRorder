import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminUpdateTable } from '@/lib/dal/management';
import { z } from 'zod';

const updateTableSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateTableSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' },
        { status: 400 }
      );
    }

    const table = await adminUpdateTable(user.restaurantId, params.id, validated.data);
    return NextResponse.json({ success: true, table });
  } catch (error: any) {
    console.error('Lỗi PATCH /api/admin/tables/[id]:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi cập nhật bàn.' },
      { status: 400 }
    );
  }
}
