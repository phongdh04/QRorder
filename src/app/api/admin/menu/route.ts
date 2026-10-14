import { NextRequest, NextResponse } from 'next/server';
import { adminGetMenu } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';
import { adminCreateMenuItem } from '@/lib/dal/management';
import { z } from 'zod';

const createMenuItemSchema = z.object({
  category_id: z.string().min(1, 'Vui lòng chọn danh mục'),
  name: z.string().min(1, 'Tên món không được để trống').max(100),
  price: z.number().min(0, 'Giá tiền không được nhỏ hơn 0'),
  description: z.string().max(500).optional().nullable(),
  image_url: z.string().optional().nullable(),
  is_available: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }
    const restaurantId = user.restaurantId;

    const menu = await adminGetMenu(restaurantId);
    const { getRestaurantQuotaStats } = await import('@/lib/image/quota');
    const quota = await getRestaurantQuotaStats(restaurantId);
    return NextResponse.json({ success: true, menu, quota });
  } catch (error) {
    console.error('Lỗi admin/menu:', error);
    return NextResponse.json({ error: 'Lỗi tải thực đơn.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createMenuItemSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Dữ liệu món ăn không hợp lệ.' },
        { status: 400 }
      );
    }

    const item = await adminCreateMenuItem(user.restaurantId, validated.data);
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/menu:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi thêm món ăn mới.' },
      { status: 400 }
    );
  }
}
