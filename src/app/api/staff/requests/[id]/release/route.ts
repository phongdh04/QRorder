import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { releaseServiceRequest } from '@/lib/service-requests';

const releaseSchema = z.object({
  reason: z.string().min(1, 'Vui lòng nhập lý do nhả việc').max(200, 'Lý do tối đa 200 ký tự'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(true);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập hoặc phiên hết hạn' }, { status: 401 });
    }

    const rawBody = await request.json().catch(() => ({}));
    const validation = releaseSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Lý do không hợp lệ' },
        { status: 400 }
      );
    }

    const result = await releaseServiceRequest({
      requestId: params.id,
      restaurantId: user.restaurantId,
      userId: user.userId,
      userRole: user.role,
      reason: validation.data.reason,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status: result.code === 'FORBIDDEN' ? 403 : 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Lỗi release request:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi nhả việc' },
      { status: 500 }
    );
  }
}
