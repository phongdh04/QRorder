import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminToggleStaffActive } from '@/lib/dal/management';
import { z } from 'zod';

const toggleStaffSchema = z.object({
  is_active: z.boolean(),
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

    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Chỉ có Chủ quán (Owner) mới có quyền khóa hoặc mở tài khoản nhân viên.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = toggleStaffSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Trạng thái hoạt động không hợp lệ.' },
        { status: 400 }
      );
    }

    const updated = await adminToggleStaffActive(
      user.restaurantId,
      params.id,
      validated.data.is_active
    );
    return NextResponse.json({
      success: true,
      message: validated.data.is_active
        ? 'Đã mở khóa tài khoản nhân viên.'
        : 'Đã khóa tài khoản nhân viên thành công.',
      staff: updated,
    });
  } catch (error: any) {
    console.error('Lỗi PATCH /api/admin/staff/[id]:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi cập nhật trạng thái nhân viên.' },
      { status: 400 }
    );
  }
}
