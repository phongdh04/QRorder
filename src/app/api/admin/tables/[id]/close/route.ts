import { NextRequest, NextResponse } from 'next/server';
import { adminCloseTableSession } from '@/lib/dal/admin';
import { getCurrentUser } from '@/lib/auth';
import { broadcastQrEvent } from '@/lib/events';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }
    const restaurantId = user.restaurantId;

    const body = await request.json();
    const paymentMethod = body.paymentMethod || 'cash';

    const closedSession = await adminCloseTableSession(
      restaurantId,
      params.id,
      paymentMethod
    );

    // Phát sự kiện Realtime qua Postgres NOTIFY tới SSE
    await broadcastQrEvent({
      type: 'session_closed',
      restaurantId,
      tableId: params.id,
      sessionId: closedSession.id,
      status: 'paid',
      total: closedSession.total,
    });

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
