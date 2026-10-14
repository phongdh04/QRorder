import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { canAccessPath } from '@/lib/permissions';
import { UserRole } from '@/types';

const COOKIE_NAME = 'qrorder_session';
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'super-secret-jwt-key-qrorder-bar-32chars-minimum-key'
);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Chống CSRF cho các API ghi dữ liệu (POST, PUT, PATCH, DELETE)
  const isMutatingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  if (isMutatingMethod && (pathname.startsWith('/api/admin') || pathname.startsWith('/api/staff'))) {
    const origin = request.headers.get('origin');
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const host = request.headers.get('host') || request.nextUrl.host;
        const isMatch =
          originUrl.host === host ||
          originUrl.hostname === 'localhost' ||
          originUrl.hostname === '127.0.0.1';
        if (!isMatch) {
          return NextResponse.json(
            { error: 'Yêu cầu bị từ chối do vi phạm bảo mật nguồn gốc (CSRF protection)' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Nguồn gốc yêu cầu không hợp lệ (Invalid Origin)' },
          { status: 403 }
        );
      }
    }
  }

  // 1. Trang đăng nhập admin / staff
  if (pathname === '/admin/login') {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        const role = (payload.role as UserRole) || 'staff';
        // Điều hướng thông minh theo vai trò
        if (role === 'staff') {
          return NextResponse.redirect(new URL('/staff', request.url));
        }
        return NextResponse.redirect(new URL('/admin', request.url));
      } catch {
        // Token không hợp lệ thì cho tiếp tục vào login
      }
    }
    return NextResponse.next();
  }

  // 2. Bảo vệ các route API Admin (/api/admin/...)
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
      const role = (payload.role as UserRole) || 'staff';

      // Staff TUYỆT ĐỐI không được gọi API admin
      if (role === 'staff') {
        return NextResponse.json(
          { error: 'Tài khoản nhân viên không có quyền truy cập API quản trị.' },
          { status: 403 }
        );
      }

      // Manager không được thao tác trên revenue, menu, store
      if (
        role === 'manager' &&
        (pathname.startsWith('/api/admin/revenue') ||
          pathname.startsWith('/api/admin/menu') ||
          pathname.startsWith('/api/admin/restaurant'))
      ) {
        return NextResponse.json(
          { error: 'Chỉ Chủ quán (Owner) mới có quyền truy cập chức năng này.' },
          { status: 403 }
        );
      }

      // Gắn thông tin người dùng vào request headers để API routes sử dụng
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', String(payload.userId || ''));
      requestHeaders.set('x-restaurant-id', String(payload.restaurantId || ''));
      requestHeaders.set('x-user-role', role);

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

  // 3. Bảo vệ các route API Staff (/api/staff/...)
  if (pathname.startsWith('/api/staff')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Yêu cầu đăng nhập nhân viên (Chưa xác thực)' },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      const role = (payload.role as UserRole) || 'staff';

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', String(payload.userId || ''));
      requestHeaders.set('x-restaurant-id', String(payload.restaurantId || ''));
      requestHeaders.set('x-user-role', role);

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

  // 4. Bảo vệ các trang giao diện Admin: /admin, /admin/orders, /admin/tables, /admin/menu, ...
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      const role = (payload.role as UserRole) || 'staff';

      // Staff vào /admin -> Tự động chuyển hướng về trang /staff
      if (role === 'staff') {
        return NextResponse.redirect(new URL('/staff', request.url));
      }

      // Manager vào các trang chỉ Owner mới có quyền -> chuyển hướng về /admin
      if (!canAccessPath(role, pathname)) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      return NextResponse.next();
    } catch {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Bảo vệ các trang giao diện Staff: /staff
  if (pathname.startsWith('/staff')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, SECRET_KEY);
      // Staff, Manager, Owner đều có quyền vào /staff
      return NextResponse.next();
    } catch {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/staff/:path*', '/api/staff/:path*'],
};
