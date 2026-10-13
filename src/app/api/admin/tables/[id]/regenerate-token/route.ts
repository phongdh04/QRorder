import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminRegenerateTableToken } from '@/lib/dal/management';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const table = await adminRegenerateTableToken(user.restaurantId, params.id);
    return NextResponse.json({
      success: true,
      message: 'Đã tạo mới mã token cho bàn. Mã QR cũ đã bị vô hiệu hóa.',
      table,
    });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/tables/[id]/regenerate-token:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi tạo lại mã token cho bàn.' },
      { status: 400 }
    );
  }
}
