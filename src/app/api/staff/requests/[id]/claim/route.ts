import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { claimServiceRequest } from '@/lib/service-requests';
import { checkAndRecordClaimRateLimit } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(true);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập hoặc phiên hết hạn' }, { status: 401 });
    }

    const rateCheck = checkAndRecordClaimRateLimit(user.userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Thao tác quá nhanh, vui lòng chờ ${rateCheck.waitSeconds} giây`, code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    const result = await claimServiceRequest({
      requestId: params.id,
      restaurantId: user.restaurantId,
      userId: user.userId,
      userRole: user.role,
    });

    if (!result.success) {
      if (result.code === 'ALREADY_CLAIMED') {
        // Phản hồi nhẹ nhàng không phải lỗi hệ thống đỏ
        return NextResponse.json(
          {
            success: false,
            code: 'ALREADY_CLAIMED',
            message: result.message,
            claimedByName: result.claimedByName,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: result.message, code: result.code },
        { status: result.code === 'FORBIDDEN_ZONE' ? 403 : 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Lỗi claim request:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi nhận việc' },
      { status: 500 }
    );
  }
}
