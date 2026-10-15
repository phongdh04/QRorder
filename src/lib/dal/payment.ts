import { prisma } from '@/lib/prisma';

export interface BillReceiptData {
  restaurant: {
    name: string;
    logo_url: string | null;
  };
  session: {
    id: string;
    tableName: string;
    status: string;
    openedAt: Date;
    paidAt: Date | null;
    paymentMethod: string | null;
    total: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  unservedOrdersCount: number;
}

/**
 * Thanh toán phiên bàn (Table Checkout)
 * Quy tắc:
 * 1. Chạy trong Transaction với SELECT ... FOR UPDATE khóa dòng session.
 * 2. Xác thực session thuộc quán của admin.
 * 3. Chặn thanh toán hai lần (Idempotent: nếu đã paid thì từ chối).
 * 4. Tự tính lại tổng tiền ở server từ các đơn KHÔNG bị hủy (status != 'cancelled').
 */
export async function adminPayTableSession(
  restaurantId: string,
  sessionId: string,
  paymentMethod: 'cash' | 'transfer'
) {
  return prisma.$transaction(async (tx) => {
    // 1. Khóa dòng session bằng SELECT ... FOR UPDATE
    const rawSessions = await tx.$queryRaw<Array<{ id: string; restaurant_id: string; table_id: string; status: string }>>`
      SELECT id, restaurant_id, table_id, status
      FROM table_sessions
      WHERE id = ${sessionId}
      FOR UPDATE
    `;

    const sessionRow = rawSessions[0];
    if (!sessionRow) {
      throw new Error('Phiên gọi món không tồn tại.');
    }

    if (sessionRow.restaurant_id !== restaurantId) {
      throw new Error('Bạn không có quyền thao tác trên phiên bàn của quán khác.');
    }

    // 2. Chặn thanh toán 2 lần
    if (sessionRow.status === 'paid') {
      throw new Error('Phiên bàn này đã được thanh toán trước đó (Không được thanh toán lặp lại).');
    }

    if (sessionRow.status !== 'open') {
      throw new Error(`Trạng thái phiên không hợp lệ để thanh toán (${sessionRow.status}).`);
    }

    // 3. Lấy tất cả đơn của session KHÔNG bị hủy
    const validOrders = await tx.order.findMany({
      where: {
        session_id: sessionId,
        status: { not: 'cancelled' },
      },
      include: {
        order_items: true,
      },
    });

    // 4. Tính toán tổng tiền ở server (tuyệt đối không tin client)
    let calculatedTotal = 0;
    const itemMap = new Map<string, { name: string; quantity: number; price: number; subtotal: number }>();

    validOrders.forEach((order) => {
      order.order_items.forEach((item) => {
        const itemSubtotal = item.price_snapshot * item.quantity;
        calculatedTotal += itemSubtotal;

        const existing = itemMap.get(item.name_snapshot);
        if (existing) {
          existing.quantity += item.quantity;
          existing.subtotal += itemSubtotal;
        } else {
          itemMap.set(item.name_snapshot, {
            name: item.name_snapshot,
            quantity: item.quantity,
            price: item.price_snapshot,
            subtotal: itemSubtotal,
          });
        }
      });
    });

    if (calculatedTotal <= 0 && itemMap.size === 0) {
      throw new Error('Không thể thanh toán phiên bàn chưa có món nào hoặc toàn bộ món đã bị hủy.');
    }

    const now = new Date();

    // 5. Cập nhật phiên thành 'paid' và hoàn thành các đơn còn treo
    await tx.order.updateMany({
      where: {
        session_id: sessionId,
        status: { in: ['pending', 'preparing'] },
      },
      data: {
        status: 'served',
      },
    });

    const updatedSession = await tx.tableSession.update({
      where: { id: sessionId },
      data: {
        status: 'paid',
        total: calculatedTotal,
        payment_method: paymentMethod,
        paid_at: now,
      },
      include: {
        table: true,
        restaurant: true,
      },
    });

    return {
      session: updatedSession,
      items: Array.from(itemMap.values()),
      calculatedTotal,
    };
  });
}

/**
 * Mở lại bill đã thanh toán (Reopen Bill)
 * Quy tắc:
 * 1. Chỉ dành riêng cho role 'owner'.
 * 2. Bắt buộc nhập lý do mở lại.
 * 3. Chỉ cho phép nếu bàn đó chưa có phiên 'open' mới.
 * 4. Ghi nhật ký vào bảng audit_logs.
 */
export async function adminReopenTableSession(
  restaurantId: string,
  userId: string,
  userRole: string,
  sessionId: string,
  reason: string
) {
  if (userRole !== 'owner') {
    throw new Error('Chỉ có chủ quán (Role: Owner) mới có quyền mở lại bill đã thanh toán.');
  }

  const cleanReason = reason?.trim();
  if (!cleanReason || cleanReason.length < 3) {
    throw new Error('Vui lòng nhập lý do mở lại bill (tối thiểu 3 ký tự).');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Khóa dòng session bằng SELECT ... FOR UPDATE
    const rawSessions = await tx.$queryRaw<Array<{ id: string; restaurant_id: string; table_id: string; status: string }>>`
      SELECT id, restaurant_id, table_id, status
      FROM table_sessions
      WHERE id = ${sessionId}
      FOR UPDATE
    `;

    const sessionRow = rawSessions[0];
    if (!sessionRow) {
      throw new Error('Phiên bàn không tồn tại.');
    }

    if (sessionRow.restaurant_id !== restaurantId) {
      throw new Error('Bạn không có quyền thao tác trên hóa đơn của quán khác.');
    }

    if (sessionRow.status !== 'paid') {
      throw new Error('Chỉ có thể mở lại phiên bàn đang ở trạng thái đã thanh toán (paid).');
    }

    // 2. Kiểm tra bàn hiện tại đã có session 'open' mới hay chưa
    const existingOpenSession = await tx.tableSession.findFirst({
      where: {
        table_id: sessionRow.table_id,
        status: 'open',
      },
    });

    if (existingOpenSession) {
      throw new Error('Không thể mở lại bill vì bàn này hiện đang có lượt khách mới đang ngồi.');
    }

    // 3. Khôi phục session về 'open'
    const reopenedSession = await tx.tableSession.update({
      where: { id: sessionId },
      data: {
        status: 'open',
        paid_at: null,
        payment_method: null,
      },
      include: {
        table: true,
      },
    });

    // 4. Ghi log kiểm toán (Audit Log)
    await tx.auditLog.create({
      data: {
        restaurant_id: restaurantId,
        user_id: userId,
        action: 'reopen_session',
        session_id: sessionId,
        reason: cleanReason,
      },
    });

    return reopenedSession;
  });
}

/**
 * Lấy dữ liệu chi tiết hóa đơn tóm tắt để xem và in (Receipt)
 */
export async function adminGetBillReceipt(
  restaurantId: string,
  sessionId: string
): Promise<BillReceiptData> {
  const session = await prisma.tableSession.findFirst({
    where: {
      id: sessionId,
      restaurant_id: restaurantId,
    },
    include: {
      table: true,
      restaurant: true,
      orders: {
        where: { status: { not: 'cancelled' } },
        include: { order_items: true },
      },
    },
  });

  if (!session) {
    throw new Error('Không tìm thấy thông tin hóa đơn.');
  }

  // Gom nhóm danh sách món
  const itemMap = new Map<string, { name: string; quantity: number; price: number; subtotal: number }>();
  let unservedCount = 0;

  session.orders.forEach((order) => {
    if (order.status === 'pending' || order.status === 'preparing') {
      unservedCount += 1;
    }

    order.order_items.forEach((item) => {
      const sub = item.price_snapshot * item.quantity;
      const exist = itemMap.get(item.name_snapshot);
      if (exist) {
        exist.quantity += item.quantity;
        exist.subtotal += sub;
      } else {
        itemMap.set(item.name_snapshot, {
          name: item.name_snapshot,
          quantity: item.quantity,
          price: item.price_snapshot,
          subtotal: sub,
        });
      }
    });
  });

  return {
    restaurant: {
      name: session.restaurant.name,
      logo_url: session.restaurant.logo_url,
    },
    session: {
      id: session.id,
      tableName: session.table.name,
      status: session.status,
      openedAt: session.opened_at,
      paidAt: session.paid_at,
      paymentMethod: session.payment_method,
      total: session.total,
    },
    items: Array.from(itemMap.values()),
    unservedOrdersCount: unservedCount,
  };
}
