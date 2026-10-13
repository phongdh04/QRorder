import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminResetStaffPassword } from '@/lib/dal/management';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
});

export async function POST(
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
        { error: 'Chỉ có Chủ quán (Owner) mới có quyền đổi mật khẩu cho nhân viên.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = resetPasswordSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Mật khẩu không hợp lệ.' },
        { status: 400 }
      );
    }

    await adminResetStaffPassword(user.restaurantId, params.id, validated.data.password);
    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu nhân viên thành công.',
    });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/staff/[id]/reset-password:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi đổi mật khẩu nhân viên.' },
      { status: 400 }
    );
  }
}
