import { describe, it, expect } from 'vitest';
import { hasPermission, canAccessPath } from '../src/lib/permissions';
import { UserRole } from '../src/types';

describe('Permissions Matrix & Route Access Control (Phần 1)', () => {
  describe('hasPermission matrix', () => {
    it('staff có quyền tác nghiệp trong khu nhưng KHÔNG có quyền quản lý, hủy đơn, doanh thu', () => {
      const role: UserRole = 'staff';

      // Quyền được phép
      expect(hasPermission(role, 'view_assigned_zone')).toBe(true);
      expect(hasPermission(role, 'claim_service_request')).toBe(true);
      expect(hasPermission(role, 'release_service_request')).toBe(true);
      expect(hasPermission(role, 'complete_service_request')).toBe(true);

      // Quyền BỊ CẤM
      expect(hasPermission(role, 'cancel_order')).toBe(false);
      expect(hasPermission(role, 'view_revenue')).toBe(false);
      expect(hasPermission(role, 'manage_menu')).toBe(false);
      expect(hasPermission(role, 'manage_store')).toBe(false);
      expect(hasPermission(role, 'manage_staff')).toBe(false);
      expect(hasPermission(role, 'reopen_bill')).toBe(false);

      // Mặc định staff KHÔNG được bấm thanh toán
      expect(hasPermission(role, 'pay_bill')).toBe(false);

      // Nhưng NẾU cờ cấu hình STAFF_CAN_PAY_BILLS bật -> Cho phép
      expect(hasPermission(role, 'pay_bill', { STAFF_CAN_PAY_BILLS: true })).toBe(true);
    });

    it('manager thấy toàn bộ sơ đồ, phân công, hủy đơn, thanh toán, quản ca nhưng KHÔNG xem doanh thu/menu', () => {
      const role: UserRole = 'manager';

      // Quyền quản lý điều phối
      expect(hasPermission(role, 'view_all_zones')).toBe(true);
      expect(hasPermission(role, 'reassign_service_request')).toBe(true);
      expect(hasPermission(role, 'cancel_order')).toBe(true);
      expect(hasPermission(role, 'pay_bill')).toBe(true);
      expect(hasPermission(role, 'manage_shifts')).toBe(true);
      expect(hasPermission(role, 'manage_staff')).toBe(true);

      // Quyền CHỈ dành cho Owner
      expect(hasPermission(role, 'view_revenue')).toBe(false);
      expect(hasPermission(role, 'manage_menu')).toBe(false);
      expect(hasPermission(role, 'manage_store')).toBe(false);
      expect(hasPermission(role, 'manage_managers')).toBe(false);
      expect(hasPermission(role, 'reopen_bill')).toBe(false);
    });

    it('owner có toàn bộ mọi quyền hạn', () => {
      const role: UserRole = 'owner';

      expect(hasPermission(role, 'view_revenue')).toBe(true);
      expect(hasPermission(role, 'manage_menu')).toBe(true);
      expect(hasPermission(role, 'manage_store')).toBe(true);
      expect(hasPermission(role, 'manage_managers')).toBe(true);
      expect(hasPermission(role, 'reopen_bill')).toBe(true);
      expect(hasPermission(role, 'cancel_order')).toBe(true);
      expect(hasPermission(role, 'pay_bill')).toBe(true);
      expect(hasPermission(role, 'manage_shifts')).toBe(true);
    });
  });

  describe('canAccessPath route guard', () => {
    it('staff chỉ được vào /staff, bị chặn khỏi mọi route /admin', () => {
      expect(canAccessPath('staff', '/staff')).toBe(true);
      expect(canAccessPath('staff', '/staff/tasks')).toBe(true);
      expect(canAccessPath('staff', '/admin')).toBe(false);
      expect(canAccessPath('staff', '/admin/tables')).toBe(false);
      expect(canAccessPath('staff', '/admin/revenue')).toBe(false);
    });

    it('manager được vào /staff và các trang /admin điều hành, nhưng bị chặn khỏi revenue/menu/store', () => {
      expect(canAccessPath('manager', '/staff')).toBe(true);
      expect(canAccessPath('manager', '/admin')).toBe(true);
      expect(canAccessPath('manager', '/admin/tables')).toBe(true);
      expect(canAccessPath('manager', '/admin/orders')).toBe(true);
      expect(canAccessPath('manager', '/admin/staff')).toBe(true);

      // Bị chặn các trang riêng của Owner
      expect(canAccessPath('manager', '/admin/revenue')).toBe(false);
      expect(canAccessPath('manager', '/admin/menu')).toBe(false);
      expect(canAccessPath('manager', '/admin/store')).toBe(false);
    });

    it('owner được vào mọi route /admin và /staff', () => {
      expect(canAccessPath('owner', '/admin')).toBe(true);
      expect(canAccessPath('owner', '/admin/revenue')).toBe(true);
      expect(canAccessPath('owner', '/admin/menu')).toBe(true);
      expect(canAccessPath('owner', '/admin/store')).toBe(true);
      expect(canAccessPath('owner', '/staff')).toBe(true);
    });
  });
});
