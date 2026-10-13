import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminReorderMenuItems } from '@/lib/dal/management';
import { z } from 'zod';

const reorderSchema = z.object({
  category_id: z.string().min(1),
  itemIds: z.array(z.string().min(1)),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const body = await request.json();
    const validated = reorderSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Danh sách ID món ăn không hợp lệ.' },
        { status: 400 }
      );
    }

    await adminReorderMenuItems(
      user.restaurantId,
      validated.data.category_id,
      validated.data.itemIds
    );
    return NextResponse.json({ success: true, message: 'Đã cập nhật thứ tự món ăn.' });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/menu/reorder:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi sắp xếp món ăn.' },
      { status: 400 }
    );
  }
}
