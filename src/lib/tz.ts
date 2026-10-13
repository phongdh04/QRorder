/**
 * Tiện ích xử lý múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7)
 * Đảm bảo các mốc thời gian bắt đầu và kết thúc ngày chính xác 00:00:00 - 23:59:59.999 theo giờ VN.
 */

const VN_OFFSET_HOURS = 7;
const VN_OFFSET_MS = VN_OFFSET_HOURS * 60 * 60 * 1000;

export type RevenueRangeType = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'custom';

export interface DateRangeResult {
  startUtc: Date;
  endUtc: Date;
  prevStartUtc: Date;
  prevEndUtc: Date;
  label: string;
  isSingleDay: boolean;
}

/**
 * Lấy thời gian hiện tại theo giờ VN (dạng Date đối tượng biểu diễn giờ VN)
 */
export function getVnNow(): Date {
  const nowUtc = Date.now();
  return new Date(nowUtc + VN_OFFSET_MS);
}

/**
 * Chuyển một ngày YYYY-MM-DD theo giờ VN sang mốc UTC bắt đầu (00:00:00.000) và kết thúc (23:59:59.999)
 */
export function getVnDayRangeUtc(year: number, month: number, day: number): { startUtc: Date; endUtc: Date } {
  // startUtc = VN 00:00:00 - 7h
  const startUtc = new Date(Date.UTC(year, month - 1, day, -VN_OFFSET_HOURS, 0, 0, 0));
  // endUtc = VN 23:59:59.999 - 7h
  const endUtc = new Date(Date.UTC(year, month - 1, day, 23 - VN_OFFSET_HOURS, 59, 59, 999));
  return { startUtc, endUtc };
}

/**
 * Parse chuỗi YYYY-MM-DD thành ngày VN
 */
export function parseVnDateString(dateStr: string): { year: number; month: number; day: number } | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10),
  };
}

/**
 * Định dạng UTC Date thành chuỗi ngày giờ VN: DD/MM/YYYY HH:mm
 */
export function formatVnDateTime(utcDate: Date | string | null): string {
  if (!utcDate) return '-';
  const d = new Date(utcDate);
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Định dạng UTC Date thành ngày VN: DD/MM/YYYY
 */
export function formatVnDate(utcDate: Date | string | null): string {
  if (!utcDate) return '-';
  const d = new Date(utcDate);
  return d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Lấy chuỗi YYYY-MM-DD theo giờ VN từ UTC Date
 */
export function getVnDateKey(utcDate: Date | string): string {
  const d = new Date(utcDate);
  // Sử dụng Intl với múi giờ Asia/Ho_Chi_Minh
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d); // YYYY-MM-DD
}

/**
 * Lấy giờ trong ngày (0 - 23) theo giờ VN từ UTC Date
 */
export function getVnHour(utcDate: Date | string): number {
  const d = new Date(utcDate);
  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: 'numeric',
    hour12: false,
  }).format(d);
  const h = parseInt(hourStr, 10);
  return h === 24 ? 0 : h;
}

/**
 * Tính toán mốc khoảng thời gian lọc và khoảng so sánh kỳ trước tương ứng
 */
export function calculateRevenueDateRange(
  rangeType: RevenueRangeType,
  customStartStr?: string | null,
  customEndStr?: string | null
): DateRangeResult {
  const vnNow = getVnNow();
  const y = vnNow.getUTCFullYear();
  const m = vnNow.getUTCMonth() + 1; // 1-12
  const d = vnNow.getUTCDate(); // 1-31

  if (rangeType === 'today') {
    const { startUtc, endUtc } = getVnDayRangeUtc(y, m, d);
    // Kỳ trước: Hôm qua
    const prevDay = new Date(Date.UTC(y, m - 1, d - 1));
    const py = prevDay.getUTCFullYear();
    const pm = prevDay.getUTCMonth() + 1;
    const pd = prevDay.getUTCDate();
    const prev = getVnDayRangeUtc(py, pm, pd);

    return {
      startUtc,
      endUtc,
      prevStartUtc: prev.startUtc,
      prevEndUtc: prev.endUtc,
      label: 'Hôm nay',
      isSingleDay: true,
    };
  }

  if (rangeType === 'yesterday') {
    const yesterday = new Date(Date.UTC(y, m - 1, d - 1));
    const yy = yesterday.getUTCFullYear();
    const ym = yesterday.getUTCMonth() + 1;
    const yd = yesterday.getUTCDate();
    const { startUtc, endUtc } = getVnDayRangeUtc(yy, ym, yd);

    // Kỳ trước: Hôm kia
    const dayBefore = new Date(Date.UTC(y, m - 1, d - 2));
    const by = dayBefore.getUTCFullYear();
    const bm = dayBefore.getUTCMonth() + 1;
    const bd = dayBefore.getUTCDate();
    const prev = getVnDayRangeUtc(by, bm, bd);

    return {
      startUtc,
      endUtc,
      prevStartUtc: prev.startUtc,
      prevEndUtc: prev.endUtc,
      label: 'Hôm qua',
      isSingleDay: true,
    };
  }

  if (rangeType === 'last7days') {
    // 7 ngày qua tính cả hôm nay: từ (d - 6) đến d
    const startDay = new Date(Date.UTC(y, m - 1, d - 6));
    const startRange = getVnDayRangeUtc(startDay.getUTCFullYear(), startDay.getUTCMonth() + 1, startDay.getUTCDate());
    const endRange = getVnDayRangeUtc(y, m, d);

    // Kỳ trước: 7 ngày trước đó nữa: từ (d - 13) đến (d - 7)
    const pStartDay = new Date(Date.UTC(y, m - 1, d - 13));
    const pEndDay = new Date(Date.UTC(y, m - 1, d - 7));
    const pStart = getVnDayRangeUtc(pStartDay.getUTCFullYear(), pStartDay.getUTCMonth() + 1, pStartDay.getUTCDate());
    const pEnd = getVnDayRangeUtc(pEndDay.getUTCFullYear(), pEndDay.getUTCMonth() + 1, pEndDay.getUTCDate());

    return {
      startUtc: startRange.startUtc,
      endUtc: endRange.endUtc,
      prevStartUtc: pStart.startUtc,
      prevEndUtc: pEnd.endUtc,
      label: '7 ngày qua',
      isSingleDay: false,
    };
  }

  if (rangeType === 'last30days') {
    // 30 ngày qua: từ (d - 29) đến d
    const startDay = new Date(Date.UTC(y, m - 1, d - 29));
    const startRange = getVnDayRangeUtc(startDay.getUTCFullYear(), startDay.getUTCMonth() + 1, startDay.getUTCDate());
    const endRange = getVnDayRangeUtc(y, m, d);

    // Kỳ trước: 30 ngày trước đó nữa: từ (d - 59) đến (d - 30)
    const pStartDay = new Date(Date.UTC(y, m - 1, d - 59));
    const pEndDay = new Date(Date.UTC(y, m - 1, d - 30));
    const pStart = getVnDayRangeUtc(pStartDay.getUTCFullYear(), pStartDay.getUTCMonth() + 1, pStartDay.getUTCDate());
    const pEnd = getVnDayRangeUtc(pEndDay.getUTCFullYear(), pEndDay.getUTCMonth() + 1, pEndDay.getUTCDate());

    return {
      startUtc: startRange.startUtc,
      endUtc: endRange.endUtc,
      prevStartUtc: pStart.startUtc,
      prevEndUtc: pEnd.endUtc,
      label: '30 ngày qua',
      isSingleDay: false,
    };
  }

  if (rangeType === 'thisMonth') {
    // Từ ngày 1 tháng này đến hôm nay
    const startRange = getVnDayRangeUtc(y, m, 1);
    const endRange = getVnDayRangeUtc(y, m, d);

    // Kỳ trước: Cùng khoảng ngày của tháng trước (từ ngày 1 tháng trước đến cùng ngày tháng trước)
    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;
    const pStartRange = getVnDayRangeUtc(prevYear, prevMonth, 1);
    const pEndRange = getVnDayRangeUtc(prevYear, prevMonth, Math.min(d, 28));

    return {
      startUtc: startRange.startUtc,
      endUtc: endRange.endUtc,
      prevStartUtc: pStartRange.startUtc,
      prevEndUtc: pEndRange.endUtc,
      label: 'Tháng này',
      isSingleDay: false,
    };
  }

  if (rangeType === 'custom' && customStartStr && customEndStr) {
    const pStart = parseVnDateString(customStartStr);
    const pEnd = parseVnDateString(customEndStr);

    if (pStart && pEnd) {
      const sRange = getVnDayRangeUtc(pStart.year, pStart.month, pStart.day);
      const eRange = getVnDayRangeUtc(pEnd.year, pEnd.month, pEnd.day);

      const daysDiff = Math.max(1, Math.round((eRange.endUtc.getTime() - sRange.startUtc.getTime()) / (24 * 3600 * 1000)));
      const prevEndUtc = new Date(sRange.startUtc.getTime() - 1);
      const prevStartUtc = new Date(prevEndUtc.getTime() - daysDiff * 24 * 3600 * 1000 + 1);

      return {
        startUtc: sRange.startUtc,
        endUtc: eRange.endUtc,
        prevStartUtc,
        prevEndUtc,
        label: `${customStartStr} - ${customEndStr}`,
        isSingleDay: customStartStr === customEndStr,
      };
    }
  }

  // Fallback về today
  const def = getVnDayRangeUtc(y, m, d);
  return {
    startUtc: def.startUtc,
    endUtc: def.endUtc,
    prevStartUtc: def.startUtc,
    prevEndUtc: def.endUtc,
    label: 'Hôm nay',
    isSingleDay: true,
  };
}
