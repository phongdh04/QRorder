import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(true);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';

    const activeCount = await prisma.pushSubscription.count({
      where: {
        user_id: user.userId,
        restaurant_id: user.restaurantId,
        is_active: true,
      },
    });

    return NextResponse.json({
      success: true,
      vapidPublicKey,
      isConfigured: Boolean(vapidPublicKey),
      hasActiveSubscription: activeCount > 0,
      activeSubscriptionCount: activeCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Lỗi kiểm tra trạng thái push' },
      { status: 500 }
    );
  }
}
