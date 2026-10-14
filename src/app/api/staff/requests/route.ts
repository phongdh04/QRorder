import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(true);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập hoặc phiên hết hạn' }, { status: 401 });
    }

    const restaurantId = user.restaurantId;

    // Lấy thông tin nhà hàng (ngưỡng escalation)
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { escalation_seconds: true, name: true },
    });

    const escalationSeconds = restaurant?.escalation_seconds || 60;

    // Tìm ca trực đang mở và phân công của user
    const activeShift = await prisma.shift.findFirst({
      where: { restaurant_id: restaurantId, ended_at: null },
      include: {
        duty_assignments: {
          where: { user_id: user.userId, on_duty: true },
          include: { zone: true },
        },
      },
    });

    const isManagerOrOwner = user.role === 'manager' || user.role === 'owner';
    const isFlexibleStaff = activeShift?.duty_assignments.some((da) => da.zone_id === null);
    const assignedZoneIds = new Set(
      activeShift?.duty_assignments.map((da) => da.zone_id).filter(Boolean) as string[]
    );

    // Lấy tất cả request chưa 'done' và chưa 'cancelled' của quán
    const allActiveRequests = await prisma.serviceRequest.findMany({
      where: {
        restaurant_id: restaurantId,
        status: { in: ['pending', 'claimed'] },
      },
      include: {
        table: {
          select: {
            id: true,
            name: true,
            zone: true,
            zone_id: true,
            assigned_zone: { select: { id: true, name: true } },
          },
        },
        claimed_by_user: {
          select: { id: true, name: true, role: true },
        },
        order: {
          include: {
            order_items: true,
          },
        },
      },
      orderBy: [
        { escalated_at: 'desc' },
        { created_at: 'asc' },
      ],
    });

    const now = Date.now();

    const formattedRequests = allActiveRequests.map((r) => {
      const createdAtMs = new Date(r.created_at).getTime();
      const elapsedSeconds = Math.max(0, Math.floor((now - createdAtMs) / 1000));
      const isEscalated = r.escalated_at != null;

      // Tóm tắt món nếu là order
      const itemsSummary = r.order?.order_items
        ? r.order.order_items.map((i) => ({
            name: i.name_snapshot,
            quantity: i.quantity,
            note: i.note,
          }))
        : [];

      return {
        id: r.id,
        tableId: r.table_id,
        tableName: r.table.name,
        zoneId: r.table.zone_id,
        zoneName: r.table.assigned_zone?.name || r.table.zone || 'Khu chung',
        type: r.type,
        status: r.status,
        orderId: r.order_id,
        itemsSummary,
        claimedBy: r.claimed_by,
        claimedByName: r.claimed_by_user?.name || null,
        claimedAt: r.claimed_at,
        escalatedAt: r.escalated_at,
        isEscalated,
        createdAt: r.created_at,
        elapsedSeconds,
        escalationSeconds,
      };
    });

    // Gom nhóm các yêu cầu gọi nhân viên / xin bill theo từng bàn để nhân viên chỉ thấy 1 thẻ duy nhất
    const consolidatedRequests: any[] = [];
    const callStaffByTable = new Map<string, any>();
    const requestBillByTable = new Map<string, any>();

    for (const r of formattedRequests) {
      if (r.type === 'call_staff') {
        const existing = callStaffByTable.get(r.tableId);
        if (!existing) {
          callStaffByTable.set(r.tableId, { ...r, callCount: 1 });
        } else {
          // Nếu có bản ghi đã claimed thì ưu tiên trạng thái claimed
          if (existing.status !== 'claimed' && r.status === 'claimed') {
            existing.status = 'claimed';
            existing.claimedBy = r.claimedBy;
            existing.claimedByName = r.claimedByName;
            existing.claimedAt = r.claimedAt;
          }
          if (r.isEscalated) existing.isEscalated = true;
          existing.callCount = (existing.callCount || 1) + 1;
        }
      } else if (r.type === 'request_bill') {
        const existing = requestBillByTable.get(r.tableId);
        if (!existing) {
          requestBillByTable.set(r.tableId, { ...r, callCount: 1 });
        } else {
          if (existing.status !== 'claimed' && r.status === 'claimed') {
            existing.status = 'claimed';
            existing.claimedBy = r.claimedBy;
            existing.claimedByName = r.claimedByName;
            existing.claimedAt = r.claimedAt;
          }
          if (r.isEscalated) existing.isEscalated = true;
          existing.callCount = (existing.callCount || 1) + 1;
        }
      } else {
        // Đơn hàng món ăn giữ riêng từng đơn
        consolidatedRequests.push(r);
      }
    }

    consolidatedRequests.push(...Array.from(callStaffByTable.values()));
    consolidatedRequests.push(...Array.from(requestBillByTable.values()));

    // Phân loại vào 3 tab:
    // 1. "pending" (Chờ nhận): các việc pending trong khu mình (hoặc linh hoạt/escalated/manager)
    // 2. "claimed" (Của tôi): các việc do chính user đang nhận
    // 3. "other_zones" (Khu khác): các việc của đồng nghiệp hoặc việc khu khác chưa đến lượt mình
    const myClaimed = consolidatedRequests.filter((r) => r.status === 'claimed' && r.claimedBy === user.userId);

    const pendingForMe = consolidatedRequests.filter((r) => {
      if (r.status !== 'pending') return false;
      if (isManagerOrOwner || isFlexibleStaff || r.isEscalated) return true;
      if (r.zoneId && assignedZoneIds.has(r.zoneId)) return true;
      if (!r.zoneId) return true; // Bàn không phân khu
      return false;
    });

    const otherZones = consolidatedRequests.filter((r) => {
      // Đang được ai khác nhận
      if (r.status === 'claimed' && r.claimedBy !== user.userId) return true;
      // Hoặc pending ở khu khác mà mình không phụ trách (và chưa escalate)
      if (r.status === 'pending' && !isManagerOrOwner && !isFlexibleStaff && !r.isEscalated) {
        if (r.zoneId && !assignedZoneIds.has(r.zoneId)) return true;
      }
      return false;
    });

    return NextResponse.json({
      success: true,
      data: {
        pending: pendingForMe,
        myClaimed,
        otherZones,
        activeShift: activeShift
          ? {
              id: activeShift.id,
              startedAt: activeShift.started_at,
              dutyAssignments: activeShift.duty_assignments,
            }
          : null,
        userAssignment: activeShift?.duty_assignments[0] || null,
        escalationSeconds,
      },
    });
  } catch (error: any) {
    console.error('Lỗi GET /api/staff/requests:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi tải danh sách yêu cầu' },
      { status: 500 }
    );
  }
}
