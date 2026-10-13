import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signSessionToken, COOKIE_NAME } from '@/lib/auth';
import { checkLoginRateLimit, recordFailedLogin, resetLoginAttempts } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ email và mật khẩu.' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `${email.toLowerCase()}:${ip}`;

    // Kiểm tra giới hạn số lần thử đăng nhập
    const rateCheck = checkLoginRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${rateCheck.lockRemainingSeconds} giây.`,
        },
        { status: 429 }
      );
    }

    // Tìm người dùng theo email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      const record = recordFailedLogin(rateLimitKey);
      return NextResponse.json(
        {
          error: 'Email hoặc mật khẩu không chính xác.',
          remainingAttempts: record.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Kiểm tra mật khẩu băm
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      const record = recordFailedLogin(rateLimitKey);
      return NextResponse.json(
        {
          error: 'Email hoặc mật khẩu không chính xác.',
          remainingAttempts: record.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Kiểm tra trạng thái kích hoạt tài khoản
    if (!user.is_active) {
      return NextResponse.json(
        {
          error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản lý quán để được hỗ trợ.',
        },
        { status: 403 }
      );
    }

    // Reset lịch sử đăng nhập sai sau khi thành công
    resetLoginAttempts(rateLimitKey);

    // Ký JWT session token
    const token = await signSessionToken({
      userId: user.id,
      restaurantId: user.restaurant_id,
      email: user.email,
      name: user.name,
      role: user.role as 'owner' | 'staff',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurant_id,
      },
    });

    // Thiết lập Cookie phiên httpOnly + secure + sameSite
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
    });

    return response;
  } catch (error) {
    console.error('Lỗi API Login:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi trên máy chủ khi đăng nhập.' },
      { status: 500 }
    );
  }
}
