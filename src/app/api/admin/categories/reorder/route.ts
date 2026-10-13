import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminReorderCategories } from '@/lib/dal/management';
import { z } from 'zod';

const reorderSchema = z.object({
  categoryIds: z.array(z.string().min(1)),
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
        { error: 'Danh sách ID danh mục không hợp lệ.' },
        { status: 400 }
      );
    }

    await adminReorderCategories(user.restaurantId, validated.data.categoryIds);
    return NextResponse.json({ success: true, message: 'Đã cập nhật thứ tự danh mục.' });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/categories/reorder:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi sắp xếp danh mục.' },
      { status: 400 }
    );
  }
}
