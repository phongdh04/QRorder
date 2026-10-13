import { NextRequest, NextResponse } from 'next/server';
import { customerCreateOrder } from '@/lib/dal/customer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, items, note } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Thiếu mã token bàn.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng chọn ít nhất một món để gọi.' },
        { status: 400 }
      );
    }

    const order = await customerCreateOrder(token, items, note);

    return NextResponse.json({
      success: true,
      message: 'Đặt món thành công! Quầy bar đang tiếp nhận yêu cầu.',
      order,
    });
  } catch (error: any) {
    console.error('Lỗi API customer/order:', error);
    return NextResponse.json(
      { error: error?.message || 'Không thể tạo đơn hàng.' },
      { status: 400 }
    );
  }
}
