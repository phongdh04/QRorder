import { prisma } from '@/lib/prisma';
import { generateTableToken } from '@/lib/utils';

/**
 * DATA ACCESS LAYER (DAL) CHO ADMIN / STAFF
 * Quy tắc bảo mật: MỌI truy vấn BẮT BUỘC phải nhận và lọc theo restaurant_id
 * xác định từ phiên đăng nhập, TUYỆT ĐỐI không nhận từ client.
 */

// Định nghĩa luồng chuyển trạng thái hợp lệ (State Machine)
const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['preparing', 'cancelled'],
  preparing: ['served', 'cancelled'],
  served: [], // Trạng thái cuối, không thể quay ngược lại
  cancelled: [], // Trạng thái cuối
};

export async function adminGetRestaurant(restaurantId: string) {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });
}

export async function adminGetDashboardStats(restaurantId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const paidSessionsToday = await prisma.tableSession.findMany({
    where: {
      restaurant_id: restaurantId,
      status: 'paid',
      paid_at: { gte: startOfDay },
    },
    select: { total: true },
  });

  const revenueToday = paidSessionsToday.reduce((sum, s) => sum + s.total, 0);

  const activeTablesCount = await prisma.tableSession.count({
    where: {
      restaurant_id: restaurantId,
      status: 'open',
    },
  });

  const totalTables = await prisma.table.count({
    where: { restaurant_id: restaurantId, is_active: true },
  });

  const pendingOrdersCount = await prisma.order.count({
    where: {
      restaurant_id: restaurantId,
      status: 'pending',
    },
  });

  const preparingOrdersCount = await prisma.order.count({
    where: {
      restaurant_id: restaurantId,
      status: 'preparing',
    },
  });

  return {
    revenueToday,
    paidCountToday: paidSessionsToday.length,
    activeTablesCount,
    totalTables,
    pendingOrdersCount,
    preparingOrdersCount,
  };
}

export async function adminGetOrders(
  restaurantId: string,
  filter?: { status?: string; tableId?: string; limit?: number }
) {
  return prisma.order.findMany({
    where: {
      restaurant_id: restaurantId,
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.tableId ? { table_id: filter.tableId } : {}),
    },
    include: {
      table: {
        select: { id: true, name: true },
      },
      order_items: true,
    },
    orderBy: { created_at: 'desc' },
    take: filter?.limit || 50,
  });
}

/**
 * Cập nhật trạng thái đơn hàng có kiểm tra quy tắc luồng trạng thái
 * và dùng transaction để trừ tiền session nếu hủy đơn.
 */
export async function adminUpdateOrderStatus(
  restaurantId: string,
  orderId: string,
  targetStatus: 'pending' | 'preparing' | 'served' | 'cancelled',
  cancelReason?: string
) {
  return prisma.$transaction(async (tx) => {
    // 1. Kiểm tra đơn hàng thuộc quyền quản lý của quán
    const order = await tx.order.findFirst({
      where: { id: orderId, restaurant_id: restaurantId },
      include: {
        order_items: true,
      },
    });

    if (!order) {
      throw new Error('Đơn hàng không tồn tại hoặc không thuộc quyền quản lý của quán này.');
    }

    // 2. Kiểm tra tính hợp lệ của luồng chuyển trạng thái
    const allowed = VALID_ORDER_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(targetStatus)) {
      const statusLabels: Record<string, string> = {
        pending: 'Chờ xác nhận',
        preparing: 'Đang pha chế',
        served: 'Đã phục vụ',
        cancelled: 'Đã hủy',
      };
      throw new Error(
        `Không thể chuyển trạng thái từ "${statusLabels[order.status] || order.status}" sang "${
          statusLabels[targetStatus] || targetStatus
        }".`
      );
    }

    if (targetStatus === 'cancelled' && (!cancelReason || cancelReason.trim().length === 0)) {
      throw new Error('Vui lòng nhập lý do hủy đơn hàng.');
    }

    // 3. Nếu đơn bị hủy -> Tính tiền đơn đó và trừ khỏi tổng tiền session
    if (targetStatus === 'cancelled' && order.status !== 'cancelled') {
      const orderAmount = order.order_items.reduce(
        (sum, item) => sum + item.price_snapshot * item.quantity,
        0
      );

      await tx.tableSession.update({
        where: { id: order.session_id },
        data: {
          total: { decrement: orderAmount },
        },
      });
    }

    // 4. Cập nhật trạng thái đơn
    return tx.order.update({
      where: { id: orderId },
      data: {
        status: targetStatus,
        cancel_reason: targetStatus === 'cancelled' ? cancelReason?.trim() : null,
      },
      include: {
        table: true,
        order_items: true,
      },
    });
  });
}

/**
 * Xác nhận tất cả các đơn pending của một bàn sang preparing
 */
export async function adminBatchConfirmTableOrders(restaurantId: string, tableId: string) {
  return prisma.$transaction(async (tx) => {
    const table = await tx.table.findFirst({
      where: { id: tableId, restaurant_id: restaurantId },
    });

    if (!table) {
      throw new Error('Bàn không tồn tại.');
    }

    const pendingOrders = await tx.order.findMany({
      where: {
        restaurant_id: restaurantId,
        table_id: tableId,
        status: 'pending',
      },
    });

    if (pendingOrders.length === 0) {
      return { count: 0, updatedIds: [] };
    }

    const updatedIds = pendingOrders.map((o) => o.id);

    await tx.order.updateMany({
      where: { id: { in: updatedIds } },
      data: { status: 'preparing' },
    });

    return { count: updatedIds.length, updatedIds };
  });
}

/**
 * Lấy danh sách 10 bàn kèm phiên và thống kê trạng thái chi tiết cho Lưới Bàn
 */
export async function adminGetTables(restaurantId: string) {
  const tables = await prisma.table.findMany({
    where: { restaurant_id: restaurantId },
    include: {
      table_sessions: {
        where: { status: 'open' },
        include: {
          orders: {
            include: {
              order_items: true,
            },
            orderBy: { created_at: 'desc' },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return tables.map((t) => {
    const activeSession = t.table_sessions[0] || null;

    const baseTableData = {
      id: t.id,
      name: t.name,
      token: t.token,
      is_active: t.is_active,
      zone: t.zone || 'outdoor',
      pos_x: t.pos_x,
      pos_y: t.pos_y,
      shape: t.shape || 'square',
      capacity: t.capacity || 4,
    };

    if (!activeSession) {
      return {
        ...baseTableData,
        statusType: 'empty' as const, // Trống (xám nhạt)
        activeSession: null,
        unservedCount: 0,
        totalAmount: 0,
        openedAt: null,
      };
    }

    const orders = activeSession.orders;
    const hasPending = orders.some((o) => o.status === 'pending');
    const hasPreparing = orders.some((o) => o.status === 'preparing');

    // Đếm số món chưa phục vụ (thuộc các đơn pending và preparing)
    let unservedCount = 0;
    orders.forEach((o) => {
      if (o.status === 'pending' || o.status === 'preparing') {
        o.order_items.forEach((item) => {
          unservedCount += item.quantity;
        });
      }
    });

    // Tính tổng tiền chỉ từ các đơn không bị hủy
    const calculatedTotal = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, order) => {
        return (
          sum +
          order.order_items.reduce(
            (iSum, item) => iSum + item.price_snapshot * item.quantity,
            0
          )
        );
      }, 0);

    // Xác định loại trạng thái hiển thị
    let statusType: 'pending' | 'preparing' | 'occupied' | 'empty' = 'occupied';
    if (hasPending) {
      statusType = 'pending'; // Có đơn mới chờ xác nhận (cam nhấp nháy)
    } else if (hasPreparing) {
      statusType = 'preparing'; // Có món đang làm (vàng)
    }

    return {
      ...baseTableData,
      statusType,
      unservedCount,
      totalAmount: calculatedTotal,
      openedAt: activeSession.opened_at,
      activeSession: {
        id: activeSession.id,
        status: activeSession.status,
        total: calculatedTotal,
        opened_at: activeSession.opened_at,
        ordersCount: orders.length,
        orders,
      },
    };
  });
}

/**
 * Lấy danh sách hàng đợi các món cần làm cho quầy pha chế / bếp
 */
export async function adminGetKitchenQueue(restaurantId: string) {
  const activeOrders = await prisma.order.findMany({
    where: {
      restaurant_id: restaurantId,
      status: { in: ['pending', 'preparing'] },
    },
    include: {
      table: {
        select: { id: true, name: true },
      },
      order_items: true,
    },
    orderBy: { created_at: 'desc' },
  });

  const queueItems: Array<{
    id: string;
    orderId: string;
    tableId: string;
    tableName: string;
    orderStatus: string;
    name: string;
    quantity: number;
    itemNote: string | null;
    orderNote: string | null;
    createdAt: Date;
    minutesElapsed: number;
  }> = [];

  const now = Date.now();

  activeOrders.forEach((order) => {
    const elapsed = Math.floor((now - new Date(order.created_at).getTime()) / 60000);

    order.order_items.forEach((item) => {
      queueItems.push({
        id: `${order.id}-${item.id}`,
        orderId: order.id,
        tableId: order.table.id,
        tableName: order.table.name,
        orderStatus: order.status,
        name: item.name_snapshot,
        quantity: item.quantity,
        itemNote: item.note,
        orderNote: order.note,
        createdAt: order.created_at,
        minutesElapsed: elapsed,
      });
    });
  });

  return queueItems;
}

export async function adminCloseTableSession(
  restaurantId: string,
  tableId: string,
  paymentMethod: 'cash' | 'transfer'
) {
  const activeSession = await prisma.tableSession.findFirst({
    where: {
      restaurant_id: restaurantId,
      table_id: tableId,
      status: 'open',
    },
    include: {
      orders: {
        where: { status: { not: 'cancelled' } },
        include: { order_items: true },
      },
    },
  });

  if (!activeSession) {
    throw new Error('Bàn này hiện không có phiên gọi món nào đang mở.');
  }

  const calculatedTotal = activeSession.orders.reduce((orderSum, order) => {
    const itemsSum = order.order_items.reduce(
      (itemSum, item) => itemSum + item.price_snapshot * item.quantity,
      0
    );
    return orderSum + itemsSum;
  }, 0);

  return prisma.tableSession.update({
    where: { id: activeSession.id },
    data: {
      status: 'paid',
      total: calculatedTotal,
      payment_method: paymentMethod,
      paid_at: new Date(),
    },
  });
}

export async function adminGetMenu(restaurantId: string) {
  return prisma.category.findMany({
    where: { restaurant_id: restaurantId },
    include: {
      menu_items: {
        orderBy: { sort_order: 'asc' },
      },
    },
    orderBy: { sort_order: 'asc' },
  });
}

export async function adminToggleMenuItemAvailability(
  restaurantId: string,
  menuItemId: string,
  isAvailable: boolean
) {
  const item = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurant_id: restaurantId },
  });

  if (!item) {
    throw new Error('Món không tồn tại.');
  }

  return prisma.menuItem.update({
    where: { id: menuItemId },
    data: { is_available: isAvailable },
  });
}

export async function adminUpdateMenuItem(
  restaurantId: string,
  menuItemId: string,
  data: {
    name?: string;
    price?: number;
    description?: string;
    is_available?: boolean;
    image_url?: string;
  }
) {
  const item = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurant_id: restaurantId },
  });

  if (!item) {
    throw new Error('Món không tồn tại hoặc không thuộc quán.');
  }

  return prisma.menuItem.update({
    where: { id: menuItemId },
    data,
  });
}
