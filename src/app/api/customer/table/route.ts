import { NextRequest, NextResponse } from 'next/server';
import { customerGetTableAndMenu } from '@/lib/dal/customer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Thiếu mã token bàn.' },
        { status: 400 }
      );
    }

    const data = await customerGetTableAndMenu(token);
    if (!data) {
      return NextResponse.json(
        { error: 'Bàn không tồn tại hoặc đã ngừng hoạt động.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Lỗi API customer/table:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tải thông tin bàn.' },
      { status: 500 }
    );
  }
}
