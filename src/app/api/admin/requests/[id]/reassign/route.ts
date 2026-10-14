import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { reassignServiceRequest } from '@/lib/service-requests';

const reassignSchema = z.object({
  targetUserId: z.string().uuid('ID nhân viên không hợp lệ'),
  reason: z.string().max(200, 'Lý do tối đa 200 ký tự').optional(),
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

    if (!hasPermission(user.role, 'reassign_service_request')) {
      return NextResponse.json(
        { error: 'Bạn không có quyền phân lại người nhận yêu cầu' },
        { status: 403 }
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    const validation = reassignSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const result = await reassignServiceRequest({
      requestId: params.id,
      restaurantId: user.restaurantId,
      actorUserId: user.userId,
      targetUserId: validation.data.targetUserId,
      reason: validation.data.reason,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Lỗi reassign request:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi phân lại yêu cầu' },
      { status: 500 }
    );
  }
}
