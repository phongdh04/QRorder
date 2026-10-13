import { NextRequest, NextResponse } from 'next/server';
import { adminCloseTableSession } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
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
    const paymentMethod = body.paymentMethod || 'cash';

    const closedSession = await adminCloseTableSession(
      restaurantId,
      params.id,
      paymentMethod
    );

    return NextResponse.json({
      success: true,
      message: 'Đã thanh toán và đóng phiên thành công.',
      session: closedSession,
    });
  } catch (error: any) {
    console.error('Lỗi admin/tables/[id]/close:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi đóng bàn thanh toán.' },
      { status: 400 }
    );
  }
}
