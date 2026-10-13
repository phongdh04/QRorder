import { prisma } from '@/lib/prisma';
import {
  RevenueRangeType,
  calculateRevenueDateRange,
  getVnHour,
  getVnDateKey,
  formatVnDateTime,
  formatVnDate,
} from '@/lib/tz';

/**
 * Cấu hình phân quyền nhân viên cho trang doanh thu:
 * - 'today_only': Nhân viên chỉ được xem doanh thu của ca hôm nay, không được xem lịch sử cũ.
 * - 'hidden': Ẩn hoàn toàn trang doanh thu đối với nhân viên (Staff).
 */
export const STAFF_REVENUE_ACCESS: 'today_only' | 'hidden' = 'today_only';

export interface RevenueKPIs {
  totalRevenue: number;
  billCount: number;
  averageOrderValue: number;
  cashRevenue: number;
  cashCount: number;
  cashPercent: number;
  transferRevenue: number;
  transferCount: number;
  transferPercent: number;
  // So sánh với kỳ trước
  prevTotalRevenue: number;
  prevBillCount: number;
  growthRevenuePercent: number | null;
  growthBillsPercent: number | null;
  growthAovPercent: number | null;
}

export interface ChartPoint {
  key: string;
  label: string;
  revenue: number;
  billCount: number;
}

export interface TopDishItem {
  name: string;
  quantity: number;
  revenue: number;
  percentOfTotal: number;
}

export interface RevenueAnalyticsData {
  rangeType: RevenueRangeType;
  rangeLabel: string;
  isSingleDay: boolean;
  kpis: RevenueKPIs;
  chartData: ChartPoint[];
  topItems: TopDishItem[];
}

export interface PaidBillItem {
  id: string;
  tableName: string;
  openedAt: Date;
  paidAt: Date;
  paymentMethod: string;
  total: number;
  ordersCount: number;
  itemsSummary: string;
}

/**
 * Lấy dữ liệu phân tích doanh thu (KPI, biểu đồ Recharts, top món bán chạy)
 */
export async function adminGetRevenueAnalytics(
  restaurantId: string,
  userRole: string,
  rangeType: RevenueRangeType,
  customStart?: string | null,
  customEnd?: string | null
): Promise<RevenueAnalyticsData> {
  // Kiểm tra phân quyền: nếu là staff thì chỉ cho phép 'today'
  let effectiveRange = rangeType;
  if (userRole === 'staff') {
    effectiveRange = 'today';
  }

  const dateRange = calculateRevenueDateRange(effectiveRange, customStart, customEnd);
  const { startUtc, endUtc, prevStartUtc, prevEndUtc, label, isSingleDay } = dateRange;

  // 1. Lấy tất cả session 'paid' trong khoảng thời gian hiện tại
  const currentSessions = await prisma.tableSession.findMany({
    where: {
      restaurant_id: restaurantId,
      status: 'paid',
      paid_at: {
        gte: startUtc,
        lte: endUtc,
      },
    },
    select: {
      id: true,
      total: true,
      payment_method: true,
      paid_at: true,
    },
    orderBy: { paid_at: 'asc' },
  });

  // 2. Lấy dữ liệu kỳ trước để tính % tăng trưởng
  const prevSessions = await prisma.tableSession.findMany({
    where: {
      restaurant_id: restaurantId,
      status: 'paid',
      paid_at: {
        gte: prevStartUtc,
        lte: prevEndUtc,
      },
    },
    select: {
      total: true,
    },
  });

  // Tính toán KPIs hiện tại
  const totalRevenue = currentSessions.reduce((sum, s) => sum + s.total, 0);
  const billCount = currentSessions.length;
  const averageOrderValue = billCount > 0 ? Math.round(totalRevenue / billCount) : 0;

  let cashRevenue = 0;
  let cashCount = 0;
  let transferRevenue = 0;
  let transferCount = 0;

  currentSessions.forEach((s) => {
    if (s.payment_method === 'cash') {
      cashRevenue += s.total;
      cashCount += 1;
    } else {
      transferRevenue += s.total;
      transferCount += 1;
    }
  });

  const cashPercent = totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0;
  const transferPercent = totalRevenue > 0 ? Math.round((transferRevenue / totalRevenue) * 100) : 0;

  // Tính toán KPIs kỳ trước
  const prevTotalRevenue = prevSessions.reduce((sum, s) => sum + s.total, 0);
  const prevBillCount = prevSessions.length;
  const prevAov = prevBillCount > 0 ? Math.round(prevTotalRevenue / prevBillCount) : 0;

  const calcGrowth = (curr: number, prev: number): number | null => {
    if (prev <= 0) return curr > 0 ? 100 : null;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const growthRevenuePercent = calcGrowth(totalRevenue, prevTotalRevenue);
  const growthBillsPercent = calcGrowth(billCount, prevBillCount);
  const growthAovPercent = calcGrowth(averageOrderValue, prevAov);

  // 3. Biểu đồ doanh thu (điền số 0 cho các mốc không có đơn để biểu đồ liền mạch)
  const chartData: ChartPoint[] = [];

  if (isSingleDay) {
    // Gom nhóm theo 24 giờ trong ngày (0h - 23h)
    const hourlyMap = new Map<number, { revenue: number; bills: number }>();
    for (let h = 0; h < 24; h++) {
      hourlyMap.set(h, { revenue: 0, bills: 0 });
    }

    currentSessions.forEach((s) => {
      if (s.paid_at) {
        const h = getVnHour(s.paid_at);
        const entry = hourlyMap.get(h);
        if (entry) {
          entry.revenue += s.total;
          entry.bills += 1;
        }
      }
    });

    for (let h = 0; h < 24; h++) {
      const entry = hourlyMap.get(h)!;
      const hourPad = h.toString().padStart(2, '0');
      chartData.push({
        key: `${hourPad}:00`,
        label: `${hourPad}:00`,
        revenue: entry.revenue,
        billCount: entry.bills,
      });
    }
  } else {
    // Gom nhóm theo ngày YYYY-MM-DD
    const dailyMap = new Map<string, { revenue: number; bills: number; label: string }>();

    // Sinh tất cả các ngày từ startUtc đến endUtc
    const curDate = new Date(startUtc);
    while (curDate <= endUtc) {
      const key = getVnDateKey(curDate);
      if (!dailyMap.has(key)) {
        dailyMap.set(key, {
          revenue: 0,
          bills: 0,
          label: formatVnDate(curDate).slice(0, 5), // DD/MM
        });
      }
      curDate.setDate(curDate.getDate() + 1);
    }

    currentSessions.forEach((s) => {
      if (s.paid_at) {
        const key = getVnDateKey(s.paid_at);
        const entry = dailyMap.get(key);
        if (entry) {
          entry.revenue += s.total;
          entry.bills += 1;
        }
      }
    });

    dailyMap.forEach((val, key) => {
      chartData.push({
        key,
        label: val.label,
        revenue: val.revenue,
        billCount: val.bills,
      });
    });
  }

  // 4. Bảng Top món bán chạy (chỉ tính món của đơn KHÔNG bị hủy trong session đã thanh toán)
  const rawTopItems = await prisma.$queryRaw<Array<{ name: string; quantity: number; revenue: number }>>`
    SELECT
      oi.name_snapshot AS name,
      SUM(oi.quantity)::int AS quantity,
      SUM(oi.price_snapshot * oi.quantity)::int AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN table_sessions s ON s.id = o.session_id
    WHERE s.restaurant_id = ${restaurantId}
      AND s.status = 'paid'
      AND s.paid_at >= ${startUtc}
      AND s.paid_at <= ${endUtc}
      AND o.status != 'cancelled'
    GROUP BY oi.name_snapshot
    ORDER BY revenue DESC
    LIMIT 30;
  `;

  const topItems: TopDishItem[] = rawTopItems.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    revenue: item.revenue,
    percentOfTotal: totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0,
  }));

  return {
    rangeType: effectiveRange,
    rangeLabel: label,
    isSingleDay,
    kpis: {
      totalRevenue,
      billCount,
      averageOrderValue,
      cashRevenue,
      cashCount,
      cashPercent,
      transferRevenue,
      transferCount,
      transferPercent,
      prevTotalRevenue,
      prevBillCount,
      growthRevenuePercent,
      growthBillsPercent,
      growthAovPercent,
    },
    chartData,
    topItems,
  };
}

/**
 * Lấy danh sách hóa đơn đã thanh toán kèm phân trang và tìm kiếm
 */
export async function adminGetPaidBills(
  restaurantId: string,
  userRole: string,
  rangeType: RevenueRangeType,
  customStart?: string | null,
  customEnd?: string | null,
  page: number = 1,
  limit: number = 15,
  searchTable?: string | null
) {
  let effectiveRange = rangeType;
  if (userRole === 'staff') {
    effectiveRange = 'today';
  }

  const { startUtc, endUtc } = calculateRevenueDateRange(effectiveRange, customStart, customEnd);
  const skip = (Math.max(1, page) - 1) * limit;

  const whereClause: any = {
    restaurant_id: restaurantId,
    status: 'paid',
    paid_at: {
      gte: startUtc,
      lte: endUtc,
    },
  };

  if (searchTable?.trim()) {
    whereClause.table = {
      name: {
        contains: searchTable.trim(),
        mode: 'insensitive',
      },
    };
  }

  const [totalCount, sessions] = await Promise.all([
    prisma.tableSession.count({ where: whereClause }),
    prisma.tableSession.findMany({
      where: whereClause,
      include: {
        table: { select: { name: true } },
        orders: {
          where: { status: { not: 'cancelled' } },
          include: { order_items: true },
        },
      },
      orderBy: { paid_at: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const bills: PaidBillItem[] = sessions.map((s) => {
    const itemNames: string[] = [];
    s.orders.forEach((o) => {
      o.order_items.forEach((item) => {
        itemNames.push(`${item.name_snapshot} (${item.quantity})`);
      });
    });

    return {
      id: s.id,
      tableName: s.table.name,
      openedAt: s.opened_at,
      paidAt: s.paid_at || s.opened_at,
      paymentMethod: s.payment_method || 'cash',
      total: s.total,
      ordersCount: s.orders.length,
      itemsSummary: itemNames.slice(0, 3).join(', ') + (itemNames.length > 3 ? '...' : ''),
    };
  });

  return {
    bills,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

/**
 * Xuất dữ liệu hóa đơn thành chuỗi CSV (mã hóa UTF-8 có BOM \uFEFF cho Excel Windows)
 */
export async function adminExportRevenueCsv(
  restaurantId: string,
  userRole: string,
  rangeType: RevenueRangeType,
  customStart?: string | null,
  customEnd?: string | null
): Promise<string> {
  let effectiveRange = rangeType;
  if (userRole === 'staff') {
    effectiveRange = 'today';
  }

  const { startUtc, endUtc, label } = calculateRevenueDateRange(effectiveRange, customStart, customEnd);

  const sessions = await prisma.tableSession.findMany({
    where: {
      restaurant_id: restaurantId,
      status: 'paid',
      paid_at: {
        gte: startUtc,
        lte: endUtc,
      },
    },
    include: {
      table: { select: { name: true } },
      orders: {
        where: { status: { not: 'cancelled' } },
        include: { order_items: true },
      },
    },
    orderBy: { paid_at: 'desc' },
  });

  const BOM = '\uFEFF';
  const headers = ['Mã Hóa Đơn', 'Bàn', 'Giờ Mở Bàn', 'Giờ Thanh Toán', 'Phương Thức', 'Số Lần Gọi Món', 'Tổng Tiền (VND)', 'Danh Sách Món'];

  const rows = sessions.map((s) => {
    const openedStr = formatVnDateTime(s.opened_at);
    const paidStr = formatVnDateTime(s.paid_at);
    const methodStr = s.payment_method === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt';

    const itemsSummary = s.orders
      .flatMap((o) => o.order_items.map((i) => `${i.name_snapshot} x${i.quantity}`))
      .join('; ');

    // Escape CSV cell
    const escapeCell = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

    return [
      escapeCell(s.id),
      escapeCell(s.table.name),
      escapeCell(openedStr),
      escapeCell(paidStr),
      escapeCell(methodStr),
      escapeCell(s.orders.length),
      escapeCell(s.total),
      escapeCell(itemsSummary),
    ].join(',');
  });

  return BOM + headers.join(',') + '\n' + rows.join('\n');
}
