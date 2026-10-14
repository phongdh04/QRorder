import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user) {
      const body = await request.json().catch(() => ({}));
      if (body && typeof body.endpoint === 'string' && body.endpoint) {
        await prisma.pushSubscription.deleteMany({
          where: {
            endpoint: body.endpoint,
            user_id: user.userId,
          },
        });
      }
    }
  } catch {}

  const response = NextResponse.json({ success: true, message: 'Đã đăng xuất.' });
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

