import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'qrorder_session';
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'super-secret-jwt-key-qrorder-bar-32chars-minimum-key'
);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Cho phép trang đăng nhập admin
  if (pathname === '/admin/login') {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      try {
        await jwtVerify(token, SECRET_KEY);
        // Nếu đã đăng nhập thì chuyển hướng thẳng vào /admin
        return NextResponse.redirect(new URL('/admin', request.url));
      } catch {
        // Token không hợp lệ thì cho tiếp tục vào login
      }
    }
    return NextResponse.next();
  }

  // Bảo vệ các route API Admin
  if (pathname.startsWith('/api/admin')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Yêu cầu đăng nhập quản trị viên (Chưa xác thực)' },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      // Gắn thông tin người dùng vào request headers để API routes sử dụng
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', String(payload.userId || ''));
      requestHeaders.set('x-restaurant-id', String(payload.restaurantId || ''));
      requestHeaders.set('x-user-role', String(payload.role || ''));

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      return NextResponse.json(
        { error: 'Phiên làm việc hết hạn hoặc không hợp lệ' },
        { status: 401 }
      );
    }
  }

  // Bảo vệ các trang giao diện Admin: /admin, /admin/orders, /admin/tables, /admin/menu
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, SECRET_KEY);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
