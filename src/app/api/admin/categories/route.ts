import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminCreateCategory } from '@/lib/dal/management';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống').max(100),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createCategorySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' },
        { status: 400 }
      );
    }

    const category = await adminCreateCategory(user.restaurantId, validated.data);
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/categories:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi thêm danh mục mới.' },
      { status: 400 }
    );
  }
}
