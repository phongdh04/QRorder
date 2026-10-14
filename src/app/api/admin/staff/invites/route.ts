import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { createStaffInvite } from '@/lib/invites';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(true);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    if (!hasPermission(user.role, 'manage_staff')) {
      return NextResponse.json({ error: 'Không có quyền tạo link mời' }, { status: 403 });
    }

    const invite = await createStaffInvite({
      restaurantId: user.restaurantId,
      createdByUserId: user.userId,
    });

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const inviteUrl = `${protocol}://${host}/invite/${invite.rawToken}`;

    return NextResponse.json({
      success: true,
      rawToken: invite.rawToken,
      inviteUrl,
      expiresAt: invite.expiresAt,
    });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/staff/invites:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi tạo link mời' },
      { status: 500 }
    );
  }
}
