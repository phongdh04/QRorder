import { NextRequest, NextResponse } from 'next/server';
import { adminGetBillReceipt } from '@/lib/dal/payment';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const receipt = await adminGetBillReceipt(user.restaurantId, params.id);
    return NextResponse.json({ success: true, receipt });
  } catch (error: any) {
    console.error('Lỗi API admin/sessions/[id]/receipt:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi tải thông tin hóa đơn.' },
      { status: 400 }
    );
  }
}
