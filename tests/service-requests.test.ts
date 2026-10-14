import { describe, it, expect, beforeEach } from 'vitest';
import { getTableColorStatus } from '../src/lib/service-requests';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

describe('Part 3 - Service Requests & Table Status Engine', () => {
  describe('getTableColorStatus - Pure function color matrix', () => {
    it('trả về xám (gray) khi bàn không có phiên (hasSession = false)', () => {
      expect(getTableColorStatus(false, [])).toBe('gray');
      expect(getTableColorStatus(false, [{ status: 'pending' }])).toBe('gray');
    });

    it('trả về xanh (green) khi có session và không có yêu cầu nào chờ hoặc mọi việc đã done', () => {
      expect(getTableColorStatus(true, [])).toBe('green');
      expect(getTableColorStatus(true, [{ status: 'done' }, { status: 'cancelled' }])).toBe('green');
    });

    it('trả về vàng (yellow) khi có request đang claimed', () => {
      expect(getTableColorStatus(true, [{ status: 'claimed' }])).toBe('yellow');
      expect(getTableColorStatus(true, [{ status: 'done' }, { status: 'claimed' }])).toBe('yellow');
    });

    it('trả về cam (orange) khi có request pending chưa ai nhận', () => {
      expect(getTableColorStatus(true, [{ status: 'pending' }])).toBe('orange');
      // Cam ưu tiên hơn Vàng
      expect(
        getTableColorStatus(true, [{ status: 'claimed' }, { status: 'pending' }])
      ).toBe('orange');
    });

    it('trả về đỏ (red) khi có request pending đã bị leo thang (escalated_at != null)', () => {
      expect(
        getTableColorStatus(true, [
          { status: 'pending', escalated_at: new Date() },
        ])
      ).toBe('red');
    });

    it('tuân thủ đúng thứ tự ưu tiên: Đỏ > Cam > Vàng > Xanh > Xám', () => {
      // Đỏ > Cam
      expect(
        getTableColorStatus(true, [
          { status: 'pending', escalated_at: new Date() },
          { status: 'pending' },
        ])
      ).toBe('red');

      // Đỏ > Vàng
      expect(
        getTableColorStatus(true, [
          { status: 'pending', escalated_at: new Date() },
          { status: 'claimed' },
        ])
      ).toBe('red');

      // Cam > Vàng
      expect(
        getTableColorStatus(true, [
          { status: 'pending' },
          { status: 'claimed' },
        ])
      ).toBe('orange');

      // Vàng > Xanh
      expect(
        getTableColorStatus(true, [
          { status: 'claimed' },
          { status: 'done' },
        ])
      ).toBe('yellow');
    });
  });

  describe('Atomic Claim & Zone Rules', () => {
    let restaurantId: string;
    let zoneAId: string;
    let zoneBId: string;
    let tableAId: string;
    let tableBId: string;
    let staff1Id: string;
    let staff2Id: string;
    let managerId: string;
    let shiftId: string;

    beforeEach(async () => {
      // Tìm hoặc tạo nhà hàng test
      let restaurant = await prisma.restaurant.findUnique({
        where: { slug: 'demo-bar' },
      });
      if (!restaurant) {
        restaurant = await prisma.restaurant.create({
          data: {
            name: 'Test Bar',
            slug: 'demo-bar',
            escalation_seconds: 60,
          },
        });
      }
      restaurantId = restaurant.id;

      // Tìm 2 zones
      const zoneA = await prisma.zone.findFirst({
        where: { restaurant_id: restaurantId, name: { contains: 'Khu A' } },
      });
      const zoneB = await prisma.zone.findFirst({
        where: { restaurant_id: restaurantId, name: { contains: 'Khu B' } },
      });
      zoneAId = zoneA!.id;
      zoneBId = zoneB!.id;

      // Tìm 2 bàn thuộc 2 zones
      const tableA = await prisma.table.findFirst({
        where: { restaurant_id: restaurantId, zone_id: zoneAId },
      });
      const tableB = await prisma.table.findFirst({
        where: { restaurant_id: restaurantId, zone_id: zoneBId },
      });
      tableAId = tableA!.id;
      tableBId = tableB!.id;

      // Tìm user
      const staff1 = await prisma.user.findUnique({ where: { email: 'staff1@demobar.vn' } });
      const staff2 = await prisma.user.findUnique({ where: { email: 'staff2@demobar.vn' } });
      const manager = await prisma.user.findUnique({ where: { email: 'manager@demobar.vn' } });
      staff1Id = staff1!.id;
      staff2Id = staff2!.id;
      managerId = manager!.id;

      // Ca làm việc đang mở
      const shift = await prisma.shift.findFirst({
        where: { restaurant_id: restaurantId, ended_at: null },
      });
      shiftId = shift!.id;
    });

    async function getOrCreateSession(tId: string) {
      let s = await prisma.tableSession.findFirst({
        where: { table_id: tId, restaurant_id: restaurantId, status: 'open' },
      });
      if (!s) {
        s = await prisma.tableSession.create({
          data: {
            table_id: tId,
            restaurant_id: restaurantId,
            status: 'open',
            total: 0,
          },
        });
      }
      return s;
    }

    it('chống race condition: 2 người claim cùng lúc, đúng 1 người thành công và người kia nhận ALREADY_CLAIMED', async () => {
      const { claimServiceRequest } = await import('../src/lib/service-requests');

      // Tạo một service request mới
      const session = await getOrCreateSession(tableAId);

      const req = await prisma.serviceRequest.create({
        data: {
          restaurant_id: restaurantId,
          table_id: tableAId,
          session_id: session.id,
          type: 'call_staff',
          status: 'pending',
        },
      });

      // Hai người cùng nhận đồng thời (Staff 1 & Manager)
      const [res1, res2] = await Promise.all([
        claimServiceRequest({
          requestId: req.id,
          restaurantId,
          userId: staff1Id,
          userRole: 'staff',
        }),
        claimServiceRequest({
          requestId: req.id,
          restaurantId,
          userId: managerId,
          userRole: 'manager',
        }),
      ]);

      const successCount = (res1.success ? 1 : 0) + (res2.success ? 1 : 0);
      expect(successCount).toBe(1);

      const failedResult = !res1.success ? res1 : res2;
      expect(failedResult.success).toBe(false);
      if (!failedResult.success) {
        expect(failedResult.code).toBe('ALREADY_CLAIMED');
        expect(failedResult.claimedByName).toBeDefined();
      }

      // Kiểm tra DB chỉ có 1 người duy nhất lưu làm claimed_by
      const finalReq = await prisma.serviceRequest.findUnique({
        where: { id: req.id },
      });
      expect(finalReq?.status).toBe('claimed');
      expect([staff1Id, managerId]).toContain(finalReq?.claimed_by);
    });

    it('nhân viên khu A không thể nhận việc thuộc khu B khi chưa escalate', async () => {
      const { claimServiceRequest } = await import('../src/lib/service-requests');

      const session = await getOrCreateSession(tableBId);

      const req = await prisma.serviceRequest.create({
        data: {
          restaurant_id: restaurantId,
          table_id: tableBId,
          session_id: session.id,
          type: 'call_staff',
          status: 'pending',
          escalated_at: null, // Chưa leo thang
        },
      });

      // Staff 1 (được phân công Khu A) cố nhận việc ở Khu B
      const result = await claimServiceRequest({
        requestId: req.id,
        restaurantId,
        userId: staff1Id,
        userRole: 'staff',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('FORBIDDEN_ZONE');
      }
    });

    it('khi đã escalate, nhân viên khu A có thể nhận việc ở bất kỳ khu nào', async () => {
      const { claimServiceRequest } = await import('../src/lib/service-requests');

      const session = await getOrCreateSession(tableBId);

      const req = await prisma.serviceRequest.create({
        data: {
          restaurant_id: restaurantId,
          table_id: tableBId,
          session_id: session.id,
          type: 'call_staff',
          status: 'pending',
          escalated_at: new Date(), // Đã leo thang
        },
      });

      // Staff 1 nhận việc ở Khu B thành công vì đã escalate
      const result = await claimServiceRequest({
        requestId: req.id,
        restaurantId,
        userId: staff1Id,
        userRole: 'staff',
      });

      expect(result.success).toBe(true);
      const updated = await prisma.serviceRequest.findUnique({ where: { id: req.id } });
      expect(updated?.status).toBe('claimed');
      expect(updated?.claimed_by).toBe(staff1Id);

      // Dọn dẹp dữ liệu test để không ảnh hưởng dữ liệu màn hình
      await prisma.serviceRequest.delete({ where: { id: req.id } });
    });

    it('escalation query chỉ chạy đúng 1 lần cho mỗi request quá hạn', async () => {
      const { checkAndEscalateRequests } = await import('../src/lib/service-requests');

      const session = await getOrCreateSession(tableAId);

      // Tạo một request cũ (tạo cách đây 100 giây, vượt ngưỡng 60s)
      const pastDate = new Date(Date.now() - 100 * 1000);
      const oldReq = await prisma.serviceRequest.create({
        data: {
          restaurant_id: restaurantId,
          table_id: tableAId,
          session_id: session.id,
          type: 'call_staff',
          status: 'pending',
          created_at: pastDate,
          escalated_at: null,
        },
      });

      // Lần chạy 1
      const res1 = await checkAndEscalateRequests();
      const foundInRes1 = res1.find((r) => r.id === oldReq.id);
      expect(foundInRes1).toBeDefined();

      // Lần chạy 2 (chạy ngay sau đó)
      const res2 = await checkAndEscalateRequests();
      const foundInRes2 = res2.find((r) => r.id === oldReq.id);
      // Đã leo thang rồi thì không bị escalate lặp lại
      expect(foundInRes2).toBeUndefined();

      // Dọn dẹp
      await prisma.serviceRequest.delete({ where: { id: oldReq.id } });
    });
  });
});
