import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const unsubscribeSchema = z.object({
  endpoint: z.string().url('Endpoint push không hợp lệ'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(true);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const rawBody = await request.json().catch(() => ({}));
    const validation = unsubscribeSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { endpoint } = validation.data;

    await prisma.pushSubscription.updateMany({
      where: {
        endpoint,
        user_id: user.userId,
      },
      data: {
        is_active: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã hủy đăng ký nhận thông báo đẩy',
    });
  } catch (error: any) {
    console.error('Lỗi POST /api/staff/push/unsubscribe:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi hủy đăng ký thông báo' },
      { status: 500 }
    );
  }
}
