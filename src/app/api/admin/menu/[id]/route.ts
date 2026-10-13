import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminUpdateMenuItem, adminDeleteMenuItem } from '@/lib/dal/management';
import { z } from 'zod';

const updateMenuItemSchema = z.object({
  category_id: z.string().optional(),
  name: z.string().min(1).max(100).optional(),
  price: z.number().min(0).optional(),
  description: z.string().max(500).optional().nullable(),
  image_url: z.string().optional().nullable(),
  is_available: z.boolean().optional(),
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
    const validated = updateMenuItemSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' },
        { status: 400 }
      );
    }

    const updated = await adminUpdateMenuItem(user.restaurantId, params.id, validated.data);
    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error('Lỗi PATCH admin/menu/[id]:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi cập nhật món ăn.' },
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

    await adminDeleteMenuItem(user.restaurantId, params.id);
    return NextResponse.json({ success: true, message: 'Đã xóa món ăn thành công.' });
  } catch (error: any) {
    console.error('Lỗi DELETE admin/menu/[id]:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi xóa món ăn.' },
      { status: 400 }
    );
  }
}
