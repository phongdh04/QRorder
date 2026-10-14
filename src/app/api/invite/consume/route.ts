import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { consumeStaffInvite } from '@/lib/invites';
import { signSessionToken, COOKIE_NAME } from '@/lib/auth';

const consumeSchema = z.object({
  rawToken: z.string().min(10, 'Mã mời không hợp lệ'),
  email: z.string().email('Email không hợp lệ'),
  name: z.string().min(2, 'Tên nhân viên tối thiểu 2 ký tự'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const validation = consumeSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const result = await consumeStaffInvite(validation.data);
    if (!result.success) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
    }

    // Tự động cấp phiên đăng nhập để nhân viên vào thẳng /staff
    const sessionToken = await signSessionToken({
      userId: result.user.id,
      restaurantId: result.user.restaurantId,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Kích hoạt tài khoản thành công',
      user: result.user,
    });

    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Lỗi POST /api/invite/consume:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi kích hoạt tài khoản' },
      { status: 500 }
    );
  }
}
