import { prisma } from './prisma';
import { broadcastQrEvent } from './events';

export type TableColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'gray';
export type TableColorStatus = TableColor;

export interface MinimalRequest {
  status: string; // 'pending' | 'claimed' | 'done' | 'cancelled'
  escalated_at?: Date | string | null;
}

/**
 * Hàm thuần tính trạng thái màu của bàn trên sơ đồ:
 * - Xám = không có session (bàn trống)
 * - XANH = có session và mọi request đã 'done' (hoặc không còn việc chờ)
 * - CAM = có request 'pending'
 * - VÀNG = có request đang 'claimed'
 * - ĐỎ = có request đã escalate chưa ai nhận
 * Ưu tiên hiển thị: Đỏ > Cam > Vàng > Xanh > Xám.
 */
export function getTableColorStatus(
  hasSession: boolean,
  requests: MinimalRequest[] = []
): TableColor {
  if (!hasSession) {
    return 'gray';
  }

  const activeRequests = requests.filter(
    (r) => r.status !== 'done' && r.status !== 'cancelled'
  );

  // 1. ĐỎ = có request đã escalate chưa ai nhận
  const hasEscalatedPending = activeRequests.some(
    (r) => r.status === 'pending' && r.escalated_at != null
  );
  if (hasEscalatedPending) {
    return 'red';
  }

  // 2. CAM = có request 'pending'
  const hasPending = activeRequests.some((r) => r.status === 'pending');
  if (hasPending) {
    return 'orange';
  }

  // 3. VÀNG = có request đang 'claimed'
  const hasClaimed = activeRequests.some((r) => r.status === 'claimed');
  if (hasClaimed) {
    return 'yellow';
  }

  // 4. XANH = có session và mọi request đã hoàn thành
  return 'green';
}

/**
 * Xác định danh sách UserId người nhận thông báo khi có yêu cầu mới:
 * - Nhân viên đang trong ca (on_duty) được phân công khu của bàn đó + tất cả manager đang online/trong ca.
 * - Nếu khu chưa có ai phụ trách: gửi cho tất cả nhân viên đang trong ca.
 */
export async function findRecipientsForTable(
  restaurantId: string,
  tableId: string
): Promise<string[]> {
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    select: { id: true, zone_id: true },
  });

  // Tìm ca làm việc đang mở
  const activeShift = await prisma.shift.findFirst({
    where: { restaurant_id: restaurantId, ended_at: null },
    include: {
      duty_assignments: {
        where: { on_duty: true },
        include: {
          user: {
            select: { id: true, role: true, is_active: true },
          },
        },
      },
    },
  });

  // Tất cả manager/owner đang active của quán
  const managers = await prisma.user.findMany({
    where: {
      restaurant_id: restaurantId,
      role: { in: ['manager', 'owner'] },
      is_active: true,
    },
    select: { id: true },
  });

  const recipientIds = new Set<string>(managers.map((m) => m.id));

  if (activeShift) {
    const staffAssignments = activeShift.duty_assignments.filter(
      (da) => da.user.role === 'staff' && da.user.is_active
    );

    if (table && table.zone_id) {
      // Nhân viên phụ trách khu của bàn này hoặc linh hoạt (zone_id === null)
      const zoneStaff = staffAssignments.filter(
        (da) => da.zone_id === table.zone_id || da.zone_id === null
      );

      if (zoneStaff.length > 0) {
        zoneStaff.forEach((s) => recipientIds.add(s.user.id));
      } else {
        // Khu chưa có ai phụ trách -> gửi cho tất cả nhân viên trong ca
        staffAssignments.forEach((s) => recipientIds.add(s.user.id));
      }
    } else {
      // Bàn chưa gắn khu -> gửi toàn bộ nhân viên trong ca
      staffAssignments.forEach((s) => recipientIds.add(s.user.id));
    }
  }

  return Array.from(recipientIds);
}

/**
 * Nhận việc nguyên tử (atomic claim chống race condition):
 * UPDATE service_requests SET status='claimed', claimed_by=$user, claimed_at=now()
 * WHERE id=$id AND restaurant_id=$r AND status='pending'
 */
export async function claimServiceRequest(params: {
  requestId: string;
  restaurantId: string;
  userId: string;
  userRole: string;
}): Promise<
  | { success: true; message: string; request: any }
  | { success: false; code: string; message: string; claimedByName?: string }
> {
  const { requestId, restaurantId, userId, userRole } = params;

  // 1. Kiểm tra yêu cầu tồn tại và quyền khu vực nếu là staff
  const request = await prisma.serviceRequest.findFirst({
    where: { id: requestId, restaurant_id: restaurantId },
    include: {
      table: { select: { id: true, name: true, zone_id: true } },
      order: { select: { id: true, status: true } },
    },
  });

  if (!request) {
    return { success: false, code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' };
  }

  // Nếu là staff, kiểm tra đang trong ca và khu vực
  if (userRole === 'staff') {
    const activeShift = await prisma.shift.findFirst({
      where: { restaurant_id: restaurantId, ended_at: null },
      include: {
        duty_assignments: {
          where: { user_id: userId, on_duty: true },
        },
      },
    });

    if (!activeShift || activeShift.duty_assignments.length === 0) {
      return {
        success: false,
        code: 'NOT_ON_DUTY',
        message: 'Bạn phải đang trong ca trực để nhận việc',
      };
    }

    // Quy tắc: Nếu chưa escalate thì chỉ nhận việc thuộc khu mình (hoặc phân công linh hoạt)
    const isEscalated = request.escalated_at != null;
    if (!isEscalated) {
      const assignment = activeShift.duty_assignments[0];
      const hasFlexibleZone = assignment.zone_id === null;
      const isMyZone = assignment.zone_id === request.table.zone_id;

      if (!hasFlexibleZone && !isMyZone) {
        return {
          success: false,
          code: 'FORBIDDEN_ZONE',
          message: 'Yêu cầu này thuộc khu vực khác. Bạn chỉ có thể nhận khi yêu cầu được chuyển khẩn cấp.',
        };
      }
    }
  }

  // 2. Thực thi UPDATE nguyên tử với điều kiện status = 'pending'
  const affected = await prisma.$executeRaw`
    UPDATE service_requests
    SET status = 'claimed',
        claimed_by = ${userId},
        claimed_at = NOW()
    WHERE id = ${requestId}
      AND restaurant_id = ${restaurantId}
      AND status = 'pending'
  `;

  if (affected === 0) {
    // Không nhận được: tìm xem ai đã nhận để phản hồi nhẹ nhàng
    const current = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        claimed_by_user: { select: { name: true } },
      },
    });

    return {
      success: false,
      code: 'ALREADY_CLAIMED',
      message: 'Đã có người nhận yêu cầu này',
      claimedByName: current?.claimed_by_user?.name || 'Đồng nghiệp',
    };
  }

  // 3. Đã nhận thành công: Nếu là đơn hàng thì cập nhật sang 'preparing'
  if (request.order_id) {
    await prisma.order.updateMany({
      where: { id: request.order_id, status: 'pending' },
      data: { status: 'preparing' },
    });
  }

  // Nếu là gọi nhân viên hoặc xin bill: đồng bộ nhận tất cả các tín hiệu chờ của bàn này
  if (request.type === 'call_staff' || request.type === 'request_bill') {
    await prisma.serviceRequest.updateMany({
      where: {
        table_id: request.table.id,
        restaurant_id: restaurantId,
        type: request.type,
        status: 'pending',
      },
      data: {
        status: 'claimed',
        claimed_by: userId,
        claimed_at: new Date(),
      },
    });
  }

  // Ghi nhật ký sự kiện
  await prisma.requestEvent.create({
    data: {
      request_id: requestId,
      restaurant_id: restaurantId,
      actor_user_id: userId,
      event: 'claimed',
      meta: { tableName: request.table.name, type: request.type },
    },
  });

  // Phát tín hiệu Realtime SSE
  await broadcastQrEvent({
    type: 'request_claimed',
    restaurantId,
    tableId: request.table_id,
    requestId,
    status: 'claimed',
    data: {
      claimedBy: userId,
      tableName: request.table.name,
      orderId: request.order_id,
    },
  });

  return {
    success: true,
    message: 'Nhận việc thành công',
    request: { id: requestId, status: 'claimed', claimedBy: userId },
  };
}

/**
 * Nhả việc (Release service request):
 * Chuyển status về 'pending' và re-notify
 */
export async function releaseServiceRequest(params: {
  requestId: string;
  restaurantId: string;
  userId: string;
  userRole: string;
  reason: string;
}): Promise<
  | { success: true; message: string }
  | { success: false; code: string; message: string }
> {
  const { requestId, restaurantId, userId, userRole, reason } = params;

  const request = await prisma.serviceRequest.findFirst({
    where: { id: requestId, restaurant_id: restaurantId },
    include: { table: true },
  });

  if (!request) {
    return { success: false, code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' };
  }

  if (request.status !== 'claimed') {
    return { success: false, code: 'INVALID_STATUS', message: 'Yêu cầu không ở trạng thái đang nhận' };
  }

  // Staff chỉ được nhả việc của chính mình; manager/owner có thể nhả thay
  if (userRole === 'staff' && request.claimed_by !== userId) {
    return { success: false, code: 'FORBIDDEN', message: 'Bạn không thể nhả việc của nhân viên khác' };
  }

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: 'pending',
      claimed_by: null,
      claimed_at: null,
    },
  });

  // Ghi log sự kiện
  await prisma.requestEvent.create({
    data: {
      request_id: requestId,
      restaurant_id: restaurantId,
      actor_user_id: userId,
      event: 'released',
      meta: { reason, previousClaimedBy: request.claimed_by },
    },
  });

  // Phát realtime để các nhân viên khác nhận lại
  await broadcastQrEvent({
    type: 'request_released',
    restaurantId,
    tableId: request.table_id,
    requestId,
    status: 'pending',
    data: {
      reason,
      tableName: request.table.name,
    },
  });

  return { success: true, message: 'Đã nhả việc về hàng đợi chung' };
}

/**
 * Hoàn thành yêu cầu (Done):
 * Chuyển status sang 'done'; nếu là order thì order.status chuyển sang 'served'
 */
export async function completeServiceRequest(params: {
  requestId: string;
  restaurantId: string;
  userId: string;
  userRole: string;
}): Promise<
  | { success: true; message: string }
  | { success: false; code: string; message: string }
> {
  const { requestId, restaurantId, userId, userRole } = params;

  const request = await prisma.serviceRequest.findFirst({
    where: { id: requestId, restaurant_id: restaurantId },
    include: { table: true },
  });

  if (!request) {
    return { success: false, code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' };
  }

  if (request.status === 'done') {
    return { success: true, message: 'Yêu cầu đã được hoàn thành trước đó' };
  }

  // Chỉ người đã nhận hoặc manager/owner được bấm hoàn thành
  if (userRole === 'staff' && request.claimed_by !== userId) {
    return { success: false, code: 'FORBIDDEN', message: 'Bạn chỉ có thể hoàn thành việc mình đã nhận' };
  }

  await prisma.$transaction(async (tx) => {
    // Nếu là gọi nhân viên hoặc xin bill: hoàn tất toàn bộ tín hiệu của bàn đó
    if (request.type === 'call_staff' || request.type === 'request_bill') {
      await tx.serviceRequest.updateMany({
        where: {
          table_id: request.table_id,
          restaurant_id: restaurantId,
          type: request.type,
          status: { in: ['pending', 'claimed'] },
        },
        data: {
          status: 'done',
          completed_by: userId,
          completed_at: new Date(),
        },
      });
    } else {
      await tx.serviceRequest.update({
        where: { id: requestId },
        data: {
          status: 'done',
          completed_by: userId,
          completed_at: new Date(),
        },
      });
    }

    if (request.order_id) {
      await tx.order.update({
        where: { id: request.order_id },
        data: { status: 'served' },
      });
    }

    await tx.requestEvent.create({
      data: {
        request_id: requestId,
        restaurant_id: restaurantId,
        actor_user_id: userId,
        event: 'done',
        meta: { orderId: request.order_id, tableName: request.table.name },
      },
    });
  });

  // Phát realtime cập nhật trạng thái bàn sang xanh nếu không còn việc
  await broadcastQrEvent({
    type: 'request_done',
    restaurantId,
    tableId: request.table_id,
    requestId,
    status: 'done',
    data: {
      completedBy: userId,
      tableName: request.table.name,
      orderId: request.order_id,
    },
  });

  return { success: true, message: 'Đã phục vụ thành công' };
}

/**
 * Phân lại người nhận (Reassign dành cho Manager/Owner)
 */
export async function reassignServiceRequest(params: {
  requestId: string;
  restaurantId: string;
  actorUserId: string;
  targetUserId: string;
  reason?: string;
}): Promise<
  | { success: true; message: string }
  | { success: false; code: string; message: string }
> {
  const { requestId, restaurantId, actorUserId, targetUserId, reason } = params;

  const targetUser = await prisma.user.findFirst({
    where: { id: targetUserId, restaurant_id: restaurantId, is_active: true },
  });

  if (!targetUser) {
    return { success: false, code: 'USER_NOT_FOUND', message: 'Nhân viên chỉ định không hợp lệ hoặc đã bị khóa' };
  }

  const request = await prisma.serviceRequest.findFirst({
    where: { id: requestId, restaurant_id: restaurantId },
    include: { table: true },
  });

  if (!request) {
    return { success: false, code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'claimed',
        claimed_by: targetUserId,
        claimed_at: new Date(),
      },
    });

    if (request.order_id) {
      await tx.order.updateMany({
        where: { id: request.order_id, status: 'pending' },
        data: { status: 'preparing' },
      });
    }

    await tx.requestEvent.create({
      data: {
        request_id: requestId,
        restaurant_id: restaurantId,
        actor_user_id: actorUserId,
        event: 'reassigned',
        meta: {
          targetUserId,
          targetUserName: targetUser.name,
          previousClaimedBy: request.claimed_by,
          reason,
        },
      },
    });
  });

  await broadcastQrEvent({
    type: 'request_reassigned',
    restaurantId,
    tableId: request.table_id,
    requestId,
    status: 'claimed',
    data: {
      targetUserId,
      targetUserName: targetUser.name,
      tableName: request.table.name,
    },
  });

  return { success: true, message: `Đã phân công lại cho ${targetUser.name}` };
}

/**
 * Escalation tự động: chạy atomic SQL với RETURNING
 * Đảm bảo mỗi request chỉ escalate đúng 1 lần duy nhất ngay cả khi chạy song song nhiều worker.
 */
export async function checkAndEscalateRequests(): Promise<any[]> {
  try {
    const escalated = await prisma.$queryRaw<
      Array<{
        id: string;
        restaurant_id: string;
        table_id: string;
        table_name: string;
        zone_id: string | null;
        type: string;
        created_at: Date;
        escalated_at: Date;
      }>
    >`
      UPDATE service_requests sr
      SET escalated_at = NOW()
      FROM restaurants r, tables t
      WHERE sr.restaurant_id = r.id
        AND sr.table_id = t.id
        AND sr.escalated_at IS NULL
        AND sr.status = 'pending'
        AND sr.created_at < (NOW() - (r.escalation_seconds || ' seconds')::interval)
      RETURNING sr.id, sr.restaurant_id, sr.table_id, t.name as table_name, t.zone_id, sr.type, sr.created_at, sr.escalated_at
    `;

    for (const item of escalated) {
      await prisma.requestEvent.create({
        data: {
          request_id: item.id,
          restaurant_id: item.restaurant_id,
          actor_user_id: null,
          event: 'escalated',
          meta: { escalatedAt: item.escalated_at },
        },
      });

      // Broadcast sự kiện khẩn cấp tới nhân viên phụ trách và quản lý
      await broadcastQrEvent({
        type: 'request_escalated',
        restaurantId: item.restaurant_id,
        tableId: item.table_id,
        requestId: item.id,
        status: 'pending',
        urgent: true,
        data: {
          type: item.type,
          tableName: item.table_name,
          zoneId: item.zone_id,
          escalatedAt: item.escalated_at,
        },
      });

      // Gửi thông báo Web Push mức khẩn cấp
      try {
        const { notificationDispatcher } = await import('./notifications');
        const recipients = await findRecipientsForTable(item.restaurant_id, item.table_id);
        notificationDispatcher.dispatchAsync(recipients, {
          title: `[KHẨN CẤP] ${item.table_name || 'Bàn'} cần tiếp nhận ngay!`,
          body: `Yêu cầu tại ${item.table_name || 'bàn'} đã quá hạn chờ tiếp nhận. Vui lòng kiểm tra ngay!`,
          tag: item.id,
          url: `/staff?request=${item.id}`,
          priority: 'urgent',
          requireInteraction: true,
          restaurantId: item.restaurant_id,
          data: {
            tableId: item.table_id,
            tableName: item.table_name,
            zoneId: item.zone_id,
          },
        });
      } catch (pushErr) {
        console.error('Lỗi dispatch push khi leo thang:', pushErr);
      }
    }

    return escalated;
  } catch (err) {
    console.error('Lỗi khi thực thi checkAndEscalateRequests:', err);
    return [];
  }
}
