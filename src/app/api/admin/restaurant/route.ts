import { NextRequest, NextResponse } from 'next/server';
import { adminGetRestaurant } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';

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
      },
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Lỗi admin/restaurant:', error);
    return NextResponse.json({ error: 'Lỗi tải thông tin quán.' }, { status: 500 });
  }
}
