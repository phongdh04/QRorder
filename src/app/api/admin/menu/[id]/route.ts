import { NextRequest, NextResponse } from 'next/server';
import { adminUpdateMenuItem, adminToggleMenuItemAvailability } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const restaurantId = user?.restaurantId || request.headers.get('x-restaurant-id');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin quán.' }, { status: 401 });
    }

    const body = await request.json();

    if (typeof body.is_available === 'boolean') {
      const updated = await adminToggleMenuItemAvailability(
        restaurantId,
        params.id,
        body.is_available
      );
      return NextResponse.json({ success: true, item: updated });
    }

    const updated = await adminUpdateMenuItem(restaurantId, params.id, body);
    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error('Lỗi admin/menu/[id]:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi cập nhật món ăn.' },
      { status: 400 }
    );
  }
}
