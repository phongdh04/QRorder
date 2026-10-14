import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminUpdateStaffRole } from '@/lib/dal/management';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['staff', 'manager']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    // Chỉ có Chủ quán (owner) mới có quyền đổi vai trò
    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Chỉ có Chủ quán (Owner) mới có quyền thay đổi vai trò tài khoản.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateRoleSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Vai trò chỉ định không hợp lệ.' }, { status: 400 });
    }

    const updated = await adminUpdateStaffRole(
      user.restaurantId,
      params.id,
      validated.data.role
    );

    return NextResponse.json({
      success: true,
      message: `Đã đổi vai trò thành ${validated.data.role === 'manager' ? 'Quản lý' : 'Nhân viên'} thành công.`,
      staff: updated,
    });
  } catch (error: any) {
    console.error('Lỗi PATCH /api/admin/staff/[id]/role:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi cập nhật vai trò.' },
      { status: 400 }
    );
  }
}
