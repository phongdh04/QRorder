import { prisma } from '@/lib/prisma';
import { generateTableToken } from '@/lib/utils';

/**
 * DATA ACCESS LAYER (DAL) CHO ADMIN / STAFF
 * Quy tắc bảo mật: MỌI truy vấn BẮT BUỘC phải nhận và lọc theo restaurant_id
 * nhằm đảm bảo cô lập dữ liệu hoàn toàn giữa các quán (Multi-tenant isolation).
 */

export async function adminGetRestaurant(restaurantId: string) {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });
}

export async function adminGetDashboardStats(restaurantId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Doanh thu hôm nay (từ các session đã thanh toán)
  const paidSessionsToday = await prisma.tableSession.findMany({
    where: {
      restaurant_id: restaurantId,
      status: 'paid',
      paid_at: { gte: startOfDay },
    },
    select: { total: true },
  });

  const revenueToday = paidSessionsToday.reduce((sum, s) => sum + s.total, 0);

  // Số bàn đang mở session phục vụ khách
  const activeTablesCount = await prisma.tableSession.count({
    where: {
      restaurant_id: restaurantId,
      status: 'open',
    },
  });

  // Tổng số bàn
  const totalTables = await prisma.table.count({
    where: { restaurant_id: restaurantId, is_active: true },
  });

  // Đơn hàng đang chờ xử lý
  const pendingOrdersCount = await prisma.order.count({
    where: {
      restaurant_id: restaurantId,
      status: 'pending',
    },
  });

  // Đơn hàng đang pha chế
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

export async function adminUpdateOrderStatus(
  restaurantId: string,
  orderId: string,
  status: 'pending' | 'preparing' | 'served' | 'cancelled',
  cancelReason?: string
) {
  // Đảm bảo đơn hàng thuộc về quán của admin
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurant_id: restaurantId },
  });

  if (!order) {
    throw new Error('Đơn hàng không tồn tại hoặc không thuộc quyền quản lý của quán này.');
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      cancel_reason: status === 'cancelled' ? cancelReason || 'Hủy bởi quầy bar' : null,
    },
    include: {
      table: true,
      order_items: true,
    },
  });
}

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
    return {
      id: t.id,
      name: t.name,
      token: t.token,
      is_active: t.is_active,
      activeSession: activeSession
        ? {
            id: activeSession.id,
            total: activeSession.total,
            opened_at: activeSession.opened_at,
            ordersCount: activeSession.orders.length,
            orders: activeSession.orders,
          }
        : null,
    };
  });
}

export async function adminCloseTableSession(
  restaurantId: string,
  tableId: string,
  paymentMethod: 'cash' | 'transfer'
) {
  // Lấy session đang mở của bàn thuộc quán
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

  // Tính lại tổng tiền chính xác từ các order chưa bị hủy
  const calculatedTotal = activeSession.orders.reduce((orderSum, order) => {
    const itemsSum = order.order_items.reduce(
      (itemSum, item) => itemSum + item.price_snapshot * item.quantity,
      0
    );
    return orderSum + itemsSum;
  }, 0);

  // Đóng session, cập nhật thời gian và phương thức thanh toán
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

export async function adminRegenerateTableToken(restaurantId: string, tableId: string) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurant_id: restaurantId },
  });

  if (!table) {
    throw new Error('Không tìm thấy bàn.');
  }

  const newToken = generateTableToken(`table_${table.name.replace(/\s+/g, '').toLowerCase()}`);

  return prisma.table.update({
    where: { id: tableId },
    data: { token: newToken },
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
