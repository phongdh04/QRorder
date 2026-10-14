import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminGetStaffList, adminCreateStaff } from '@/lib/dal/management';
import { z } from 'zod';

const createStaffSchema = z.object({
  name: z.string().trim().min(1, 'Họ tên nhân viên không được để trống').max(100),
  email: z.string().trim().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  role: z.enum(['staff', 'manager']).default('staff'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Không có quyền xem danh sách nhân viên.' },
        { status: 403 }
      );
    }

    // Owner xem được tất cả vai trò, Manager chỉ xem được danh sách staff
    const allowedRoles = user.role === 'owner' ? ['owner', 'manager', 'staff'] : ['staff'];
    const staffList = await adminGetStaffList(user.restaurantId, allowedRoles);

    return NextResponse.json({
      success: true,
      currentUserRole: user.role,
      staff: staffList,
    });
  } catch (error) {
    console.error('Lỗi GET /api/admin/staff:', error);
    return NextResponse.json({ error: 'Lỗi tải danh sách nhân viên.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Không có quyền tạo tài khoản nhân viên.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createStaffSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' },
        { status: 400 }
      );
    }

    // Chỉ có Owner mới được tạo tài khoản Quản lý (manager)
    if (validated.data.role === 'manager' && user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Chỉ có Chủ quán (Owner) mới có quyền tạo tài khoản Quản lý (Manager).' },
        { status: 403 }
      );
    }

    const newStaff = await adminCreateStaff(user.restaurantId, validated.data);
    return NextResponse.json(
      { success: true, message: 'Tạo tài khoản nhân viên thành công.', staff: newStaff },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/staff:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi tạo nhân viên mới.' },
      { status: 400 }
    );
  }
}
