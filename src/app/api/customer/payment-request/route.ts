import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, paymentMethod } = body;

    if (!token) {
      return NextResponse.json({ error: 'Thiếu token bàn.' }, { status: 400 });
    }

    const table = await prisma.table.findUnique({
      where: { token },
      include: {
        table_sessions: {
          where: { status: 'open' },
        },
      },
    });

    if (!table || table.table_sessions.length === 0) {
      return NextResponse.json(
        { error: 'Bàn không có phiên gọi món nào đang hoạt động.' },
        { status: 400 }
      );
    }

    const session = table.table_sessions[0];

    // Cập nhật phương thức thanh toán dự kiến
    await prisma.tableSession.update({
      where: { id: session.id },
      data: {
        payment_method: paymentMethod || 'cash',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã gửi yêu cầu thanh toán (${paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}) tới nhân viên quầy bar!`,
    });
  } catch (error) {
    console.error('Lỗi payment-request:', error);
    return NextResponse.json({ error: 'Lỗi gửi yêu cầu thanh toán.' }, { status: 500 });
  }
}
