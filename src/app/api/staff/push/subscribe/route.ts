import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const subscribeSchema = z.object({
  endpoint: z.string().url('Endpoint push không hợp lệ'),
  keys: z.object({
    p256dh: z.string().min(1, 'Khóa p256dh không hợp lệ'),
    auth: z.string().min(1, 'Khóa auth không hợp lệ'),
  }),
  userAgent: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(true);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập hoặc phiên hết hạn' }, { status: 401 });
    }

    const rawBody = await request.json().catch(() => ({}));
    const validation = subscribeSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Dữ liệu đăng ký không hợp lệ' },
        { status: 400 }
      );
    }

    const { endpoint, keys, userAgent } = validation.data;
    const ua = userAgent || request.headers.get('user-agent') || 'Unknown device';

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        user_id: user.userId,
        restaurant_id: user.restaurantId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: ua,
        is_active: true,
        last_seen_at: new Date(),
      },
      update: {
        user_id: user.userId,
        restaurant_id: user.restaurantId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: ua,
        is_active: true,
        last_seen_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đăng ký nhận thông báo đẩy thành công',
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error('Lỗi POST /api/staff/push/subscribe:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi lưu đăng ký thông báo' },
      { status: 500 }
    );
  }
}
