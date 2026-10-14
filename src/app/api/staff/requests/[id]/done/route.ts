import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { completeServiceRequest } from '@/lib/service-requests';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(true);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập hoặc phiên hết hạn' }, { status: 401 });
    }

    const result = await completeServiceRequest({
      requestId: params.id,
      restaurantId: user.restaurantId,
      userId: user.userId,
      userRole: user.role,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status: result.code === 'FORBIDDEN' ? 403 : 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Lỗi done request:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi hoàn thành việc' },
      { status: 500 }
    );
  }
}
