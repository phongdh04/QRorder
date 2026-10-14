import crypto from 'crypto';
import { prisma } from './prisma';
import { hashPassword } from './auth';

export function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function generateRawInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Tạo link mời nhân viên 1 lần (Single-use invite link)
 * Token thô chỉ hiển thị một lần, DB chỉ lưu băm SHA-256, hết hạn sau 24h.
 */
export async function createStaffInvite(params: {
  restaurantId: string;
  createdBy?: string;
  createdByUserId?: string;
  role?: 'staff' | 'manager';
  name?: string;
  expiresInHours?: number;
}): Promise<{ rawToken: string; expiresAt: Date; inviteId: string }> {
  const { restaurantId } = params;
  const createdBy = params.createdBy || params.createdByUserId || 'system';
  const hours = params.expiresInHours ?? 24;
  const rawToken = generateRawInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  const invite = await prisma.staffInvite.create({
    data: {
      restaurant_id: restaurantId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_by: createdBy,
    },
  });

  return {
    rawToken,
    expiresAt,
    inviteId: invite.id,
  };
}

/**
 * Xác thực và sử dụng link mời để nhân viên tự đặt tài khoản & mật khẩu
 */
export async function consumeStaffInvite(params: {
  rawToken: string;
  email: string;
  password: string;
  name?: string;
}): Promise<
  | { success: true; message: string; user: any }
  | { success: false; error: string; message: string; code: string }
> {
  const { rawToken, email, password } = params;
  const name = params.name || 'Nhân viên';
  const tokenHash = hashInviteToken(rawToken);
  const now = new Date();

  const invite = await prisma.staffInvite.findUnique({
    where: { token_hash: tokenHash },
    include: { restaurant: true },
  });

  if (!invite) {
    return {
      success: false,
      code: 'INVITE_NOT_FOUND',
      error: 'Liên kết mời không tồn tại hoặc không hợp lệ',
      message: 'Liên kết mời không tồn tại hoặc không hợp lệ',
    };
  }

  if (invite.used_at) {
    return {
      success: false,
      code: 'INVITE_USED',
      error: 'Liên kết mời này đã được sử dụng trước đó',
      message: 'Liên kết mời này đã được sử dụng trước đó',
    };
  }

  if (invite.expires_at < now) {
    return {
      success: false,
      code: 'INVITE_EXPIRED',
      error: 'Liên kết mời đã hết hạn (chỉ có hiệu lực trong 24 giờ)',
      message: 'Liên kết mời đã hết hạn (chỉ có hiệu lực trong 24 giờ)',
    };
  }

  // Kiểm tra email trùng
  const existingUser = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (existingUser) {
    return {
      success: false,
      code: 'EMAIL_EXISTS',
      error: 'Email này đã tồn tại trong hệ thống',
      message: 'Email này đã tồn tại trong hệ thống',
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        restaurant_id: invite.restaurant_id,
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
        name: name.trim(),
        role: 'staff',
        is_active: true,
        last_seen_at: now,
      },
    });

    await tx.staffInvite.update({
      where: { id: invite.id },
      data: {
        used_at: now,
        user_id: user.id,
      },
    });

    return user;
  });

  return {
    success: true,
    message: 'Tạo tài khoản thành công',
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      restaurantId: newUser.restaurant_id,
      is_active: newUser.is_active,
    },
  };
}
