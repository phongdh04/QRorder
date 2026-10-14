import { NextRequest, NextResponse } from 'next/server';
import { adminGetRestaurant } from '@/lib/dal/admin';
import { adminUpdateStoreInfo } from '@/lib/dal/management';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const updateStoreSchema = z.object({
  name: z.string().min(1, 'Tên quán không được để trống').max(100).optional(),
  logo_url: z.string().optional().nullable(),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Mã màu HEX không hợp lệ').optional(),
  theme: z.record(z.string(), z.any()).optional(),
  menu_display_mode: z.enum(['photo', 'minimal']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const restaurant = await adminGetRestaurant(user.restaurantId);
    if (!restaurant) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin quán.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logo_url: restaurant.logo_url,
        theme: restaurant.theme,
        menu_display_mode: restaurant.menu_display_mode || 'photo',
      },
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Lỗi GET admin/restaurant:', error);
    return NextResponse.json({ error: 'Lỗi tải thông tin quán.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateStoreSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' },
        { status: 400 }
      );
    }

    const updated = await adminUpdateStoreInfo(user.restaurantId, validated.data);
    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin quán thành công.',
      restaurant: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        logo_url: updated.logo_url,
        theme: updated.theme,
        menu_display_mode: updated.menu_display_mode || 'photo',
      },
    });
  } catch (error: any) {
    console.error('Lỗi PATCH admin/restaurant:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi cập nhật thông tin quán.' },
      { status: 400 }
    );
  }
}
