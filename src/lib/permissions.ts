import { UserRole } from '@/types';

/**
 * HỆ THỐNG PHÂN QUYỀN TRUNG TÂM (PERMISSION MATRIX)
 * Định nghĩa ma trận Role -> Quyền hạn chuẩn cho toàn bộ ứng dụng.
 * Mọi API endpoint, Server Action và Middleware đều kiểm tra qua file này.
 */

export type Permission =
  // 1. Nghiệp vụ Phục vụ & Nhận việc
  | 'view_assigned_zone'       // Xem yêu cầu/việc trong khu vực được phân công
  | 'claim_service_request'    // Nhận việc từ bàn
  | 'release_service_request'  // Nhả việc đã nhận kèm lý do
  | 'complete_service_request' // Báo "Đã phục vụ" / hoàn tất yêu cầu
  // 2. Quản lý Điều phối & Ca trực
  | 'view_all_zones'           // Xem toàn bộ sơ đồ bàn, mọi khu vực và danh sách nhân sự
  | 'reassign_service_request' // Phân công hoặc đổi người nhận việc
  | 'manage_shifts'            // Mở ca, chốt ca, phân công nhân viên vào khu
  | 'cancel_order'             // Hủy đơn gọi món (yêu cầu bắt buộc nhập lý do)
  | 'pay_bill'                 // Xác nhận thanh toán bàn (Đã thanh toán)
  | 'manage_staff'             // Tạo/khóa/đổi mật khẩu nhân viên staff, tạo link mời staff
  // 3. Toàn quyền Chủ quán (Owner)
  | 'view_revenue'             // Xem báo cáo doanh thu, phân tích giờ cao điểm, xuất file CSV
  | 'manage_menu'              // Thêm/sửa/xóa danh mục, món ăn, cập nhật giá và upload ảnh
  | 'manage_store'             // Đổi tên quán, logo, màu sắc thương hiệu, chế độ hiển thị
  | 'manage_managers'          // Tạo/khóa/phân quyền tài khoản Quản lý (Manager)
  | 'reopen_bill';             // Mở lại hóa đơn đã thanh toán để sửa sai / thêm món

/**
 * Cờ cấu hình tính năng có thể bật/tắt linh hoạt (Feature Flags)
 * Mặc định: staff KHÔNG được bấm thanh toán. Có thể bật qua biến môi trường STAFF_CAN_PAY_BILLS=true.
 */
export const PERMISSION_FLAGS = {
  STAFF_CAN_PAY_BILLS:
    typeof process !== 'undefined' && process.env.STAFF_CAN_PAY_BILLS === 'true',
};

/**
 * Ma trận phân quyền mặc định:
 * - staff: xem việc khu mình, nhận việc, nhả việc, báo "Đã phục vụ".
 *   KHÔNG hủy đơn, KHÔNG thanh toán (trừ khi bật cờ), KHÔNG xem doanh thu.
 * - manager: thấy toàn bộ sơ đồ bàn & nhân viên, phân công/phân lại, hủy đơn (có lý do),
 *   thanh toán bàn, quản lý ca trực, tạo/khóa staff.
 * - owner: mọi quyền của manager + doanh thu, menu, thông tin quán, quản lý manager, mở lại bill.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  staff: [
    'view_assigned_zone',
    'claim_service_request',
    'release_service_request',
    'complete_service_request',
  ],
  manager: [
    'view_assigned_zone',
    'claim_service_request',
    'release_service_request',
    'complete_service_request',
    'view_all_zones',
    'reassign_service_request',
    'manage_shifts',
    'cancel_order',
    'pay_bill',
    'manage_staff',
  ],
  owner: [
    'view_assigned_zone',
    'claim_service_request',
    'release_service_request',
    'complete_service_request',
    'view_all_zones',
    'reassign_service_request',
    'manage_shifts',
    'cancel_order',
    'pay_bill',
    'manage_staff',
    'view_revenue',
    'manage_menu',
    'manage_store',
    'manage_managers',
    'reopen_bill',
  ],
};

/**
 * Kiểm tra người dùng có quyền cụ thể hay không
 */
export function hasPermission(
  role: UserRole | string | undefined | null,
  permission: Permission,
  customFlags?: Partial<typeof PERMISSION_FLAGS>
): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase() as UserRole;

  const flags = { ...PERMISSION_FLAGS, ...customFlags };

  // Trường hợp đặc biệt: Staff được thanh toán nếu cờ cấu hình bật
  if (normalizedRole === 'staff' && permission === 'pay_bill' && flags.STAFF_CAN_PAY_BILLS) {
    return true;
  }

  const permissions = ROLE_PERMISSIONS[normalizedRole];
  if (!permissions) return false;

  return permissions.includes(permission);
}

/**
 * Kiểm tra quyền truy cập đường dẫn giao diện (URL Guard cho Middleware & Layouts)
 */
export function canAccessPath(
  role: UserRole | string | undefined | null,
  pathname: string
): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase() as UserRole;

  // 1. Owner có toàn quyền vào mọi trang (/admin, /admin/revenue, /admin/menu, /staff, ...)
  if (normalizedRole === 'owner') {
    return true;
  }

  // 2. Manager được vào /staff và các trang /admin (NGOẠI TRỪ revenue, menu, store)
  if (normalizedRole === 'manager') {
    if (
      pathname.startsWith('/admin/revenue') ||
      pathname.startsWith('/admin/menu') ||
      pathname.startsWith('/admin/store')
    ) {
      return false;
    }
    return pathname.startsWith('/admin') || pathname.startsWith('/staff');
  }

  // 3. Staff CHỈ được vào /staff và các trang con. Bị chặn hoàn toàn khỏi /admin
  if (normalizedRole === 'staff') {
    if (pathname.startsWith('/admin')) {
      return false;
    }
    return pathname.startsWith('/staff');
  }

  return false;
}
