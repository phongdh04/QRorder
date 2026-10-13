import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminPayTableSession } from '@/lib/dal/payment';
import { getCurrentUser } from '@/lib/auth';
import { broadcastQrEvent } from '@/lib/events';

const paySessionSchema = z.object({
  paymentMethod: z.enum(['cash', 'transfer']),
});

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
    const sessionId = params.id;

    const rawBody = await request.json().catch(() => ({}));
    const validation = paySessionSchema.safeParse(rawBody);

    if (!validation.success) {
      const err = validation.error.issues[0]?.message || 'Phương thức thanh toán không hợp lệ (cash hoặc transfer).';
      return NextResponse.json({ error: err }, { status: 400 });
    }

    const { paymentMethod } = validation.data;

    // Tiến hành thanh toán có khóa dòng và transaction
    const result = await adminPayTableSession(restaurantId, sessionId, paymentMethod);

    // Phát sự kiện Realtime qua Postgres NOTIFY tới SSE
    await broadcastQrEvent({
      type: 'session_closed',
      restaurantId,
      tableId: result.session.table_id,
      sessionId: result.session.id,
      status: 'paid',
      total: result.calculatedTotal,
      data: {
        paymentMethod: result.session.payment_method,
        tableName: result.session.table.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thanh toán và chốt hóa đơn thành công.',
      session: result.session,
      items: result.items,
      total: result.calculatedTotal,
    });
  } catch (error: any) {
    console.error('Lỗi API admin/sessions/[id]/pay:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi xử lý thanh toán phiên bàn.' },
      { status: 400 }
    );
  }
}
