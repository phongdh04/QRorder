import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  createStaffInvite,
  consumeStaffInvite,
  hashInviteToken,
} from '../src/lib/invites';
import { verifyPassword } from '../src/lib/auth';

describe('Part 10 - Staff Invite Link Lifecycle & Single-Use Security', () => {
  let restaurantId: string;
  let ownerUserId: string;

  beforeAll(async () => {
    // Tạo quán và chủ quán thử nghiệm
    const r = await prisma.restaurant.create({
      data: {
        name: 'Test Invite Restaurant ' + Date.now(),
        slug: 'test-invite-' + Date.now(),
      },
    });
    restaurantId = r.id;

    const owner = await prisma.user.create({
      data: {
        restaurant_id: restaurantId,
        email: `owner_${Date.now()}@test.local`,
        name: 'Owner Test',
        role: 'owner',
        password_hash: 'dummy',
      },
    });
    ownerUserId = owner.id;
  });

  afterAll(async () => {
    if (restaurantId) {
      await prisma.restaurant.delete({
        where: { id: restaurantId },
      });
    }
  });

  it('tạo link mời: token thô là chuỗi ngẫu nhiên dài, DB chỉ lưu SHA-256 hash', async () => {
    const invite = await createStaffInvite({
      restaurantId,
      createdBy: ownerUserId,
      role: 'staff',
      name: 'Nhân viên A',
    });

    expect(invite.rawToken).toBeDefined();
    expect(invite.rawToken.length).toBeGreaterThanOrEqual(40);

    // Kiểm tra bản ghi trong DB
    const dbRecord = await prisma.staffInvite.findUnique({
      where: { id: invite.inviteId },
    });

    expect(dbRecord).not.toBeNull();
    // Database KHÔNG ĐƯỢC LƯU token thô
    expect((dbRecord as any).token).toBeUndefined();
    // Database CHỈ LƯU token_hash
    expect(dbRecord?.token_hash).toBe(hashInviteToken(invite.rawToken));
    expect(dbRecord?.used_at).toBeNull();
    expect(new Date(dbRecord!.expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  it('dùng lần đầu: nhân viên đặt mật khẩu thành công, cập nhật used_at và kích hoạt tài khoản', async () => {
    const invite = await createStaffInvite({
      restaurantId,
      createdBy: ownerUserId,
      role: 'staff',
      name: 'Nhân viên Mới',
    });

    const result = await consumeStaffInvite({
      rawToken: invite.rawToken,
      email: `staff_new_${Date.now()}@test.local`,
      password: 'StrongPassword123@',
      name: 'Nguyễn Văn Mới',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.user.name).toBe('Nguyễn Văn Mới');
    expect(result.user.role).toBe('staff');
    expect(result.user.is_active).toBe(true);

    // Kiểm tra mật khẩu đã được hash đúng trong bảng users
    const dbUser = await prisma.user.findUnique({
      where: { id: result.user.id },
    });
    expect(dbUser).not.toBeNull();
    const isPasswordValid = await verifyPassword('StrongPassword123@', dbUser!.password_hash);
    expect(isPasswordValid).toBe(true);

    // Kiểm tra staff_invites đã được cập nhật used_at
    const dbInvite = await prisma.staffInvite.findUnique({
      where: { id: invite.inviteId },
    });
    expect(dbInvite?.used_at).not.toBeNull();
  });

  it('dùng lần hai: bị từ chối với lỗi INVITE_USED (bảo đảm tính chất single-use)', async () => {
    const invite = await createStaffInvite({
      restaurantId,
      createdBy: ownerUserId,
      role: 'staff',
    });

    // Lần 1: thành công
    const firstConsume = await consumeStaffInvite({
      rawToken: invite.rawToken,
      email: `staff_first_${Date.now()}@test.local`,
      password: 'PassWord123!',
    });
    expect(firstConsume.success).toBe(true);

    // Lần 2: dùng lại cùng token
    const secondConsume = await consumeStaffInvite({
      rawToken: invite.rawToken,
      email: `attacker_${Date.now()}@test.local`,
      password: 'HackerPassword123!',
    });

    expect(secondConsume.success).toBe(false);
    if (!secondConsume.success) {
      expect(secondConsume.code).toBe('INVITE_USED');
      expect(secondConsume.message).toContain('đã được sử dụng');
    }
  });

  it('link mời đã hết hạn (> 24 giờ): bị từ chối với mã INVITE_EXPIRED', async () => {
    const invite = await createStaffInvite({
      restaurantId,
      createdBy: ownerUserId,
      role: 'staff',
      expiresInHours: -1, // Đã hết hạn từ 1 giờ trước
    });

    const consume = await consumeStaffInvite({
      rawToken: invite.rawToken,
      email: `expired_${Date.now()}@test.local`,
      password: 'PassWord123!',
    });

    expect(consume.success).toBe(false);
    if (!consume.success) {
      expect(consume.code).toBe('INVITE_EXPIRED');
      expect(consume.message).toContain('đã hết hạn');
    }
  });

  it('token ngẫu nhiên không tồn tại: bị từ chối với mã INVITE_NOT_FOUND', async () => {
    const fakeToken = 'random_fake_token_that_does_not_exist_in_database_1234567890';
    const consume = await consumeStaffInvite({
      rawToken: fakeToken,
      email: `fake_${Date.now()}@test.local`,
      password: 'PassWord123!',
    });

    expect(consume.success).toBe(false);
    if (!consume.success) {
      expect(consume.code).toBe('INVITE_NOT_FOUND');
    }
  });
});
