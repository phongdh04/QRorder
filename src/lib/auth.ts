import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SessionPayload } from '@/types';

export const COOKIE_NAME = 'qrorder_session';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'super-secret-jwt-key-qrorder-bar-32chars-minimum-key'
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(verifyDb = false): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = await verifySessionToken(token);
    if (!payload) return null;

    payload.id = payload.userId;
    payload.restaurant_id = payload.restaurantId;

    if (verifyDb) {
      const { prisma } = await import('@/lib/prisma');
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, is_active: true, role: true, restaurant_id: true },
      });
      // Nếu tài khoản không tồn tại hoặc đã bị khóa (is_active = false)
      if (!user || !user.is_active || user.restaurant_id !== payload.restaurantId) {
        return null;
      }
      payload.role = user.role as any;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}
