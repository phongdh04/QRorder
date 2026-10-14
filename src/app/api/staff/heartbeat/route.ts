import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(true);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const now = new Date();
    await prisma.user.update({
      where: { id: user.userId },
      data: { last_seen_at: now },
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      userId: user.userId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Lỗi cập nhật hiện diện' },
      { status: 500 }
    );
  }
}
