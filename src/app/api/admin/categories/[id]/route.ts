import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminUpdateCategory, adminDeleteCategory } from '@/lib/dal/management';
import { z } from 'zod';

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
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
    const validated = updateCategorySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' },
        { status: 400 }
      );
    }

    const updated = await adminUpdateCategory(user.restaurantId, params.id, validated.data);
    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    console.error('Lỗi PATCH /api/admin/categories/[id]:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi cập nhật danh mục.' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    await adminDeleteCategory(user.restaurantId, params.id);
    return NextResponse.json({ success: true, message: 'Đã xóa danh mục thành công.' });
  } catch (error: any) {
    console.error('Lỗi DELETE /api/admin/categories/[id]:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi xóa danh mục.' },
      { status: 400 }
    );
  }
}
