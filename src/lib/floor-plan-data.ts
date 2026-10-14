/**
 * SƠ ĐỒ MẶT BẰNG & KHU VỰC QUÁN (FLOOR PLAN DATA)
 * Phản ánh chính xác 100% bản vẽ tay thực tế của quán:
 * - Vùng 6 cạnh (Hexagon) trung tâm: KHU VỰC NGOÀI TRỜI (33 bàn đối xứng).
 * - Cánh trái: Sân khấu DJ & ÂM NHẠC + cụm bàn DJ.
 * - Cạnh dưới: QUẦY BAR + QUẦY THANH TOÁN.
 * - Góc trên bên phải: CỔNG VÀO (Entrance).
 * - Vòng bao quanh: KHU TRONG NHÀ / VIP LOUNGE (các cụm bàn pod 2x2 & bàn đơn).
 */

export type ZoneId = 'all' | 'outdoor' | 'indoor' | 'bar' | 'dj';

export interface ZoneMeta {
  id: ZoneId;
  name: string;
  shortName: string;
  icon: string;
  color: string; // Tailwind color token
  glowColor: string;
  borderColor: string;
  bgColor: string;
  description: string;
}

export const VENUE_ZONES: ZoneMeta[] = [
  {
    id: 'all',
    name: 'Toàn bộ quán',
    shortName: 'Tất cả',
    icon: '🌟',
    color: 'text-amber-400',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    description: 'Tổng thể mặt bằng quán bar',
  },
  {
    id: 'outdoor',
    name: 'Khu Ngoài Trời (Sân Lục Giác)',
    shortName: 'Ngoài trời',
    icon: '🌿',
    color: 'text-emerald-400',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-950/30',
    description: 'Vùng lục giác 6 cạnh trung tâm thoáng đãng, lộng gió',
  },
  {
    id: 'indoor',
    name: 'Khu VIP / Trong Nhà',
    shortName: 'Trong nhà / VIP',
    icon: '👑',
    color: 'text-purple-400',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    borderColor: 'border-purple-500/40',
    bgColor: 'bg-purple-950/30',
    description: 'Các cụm bàn sofa VIP 4 ghế 2x2 sang trọng',
  },
  {
    id: 'dj',
    name: 'Khu DJ & Sân Khấu',
    shortName: 'Khu DJ',
    icon: '🎵',
    color: 'text-cyan-400',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    borderColor: 'border-cyan-500/40',
    bgColor: 'bg-cyan-950/30',
    description: 'Cạnh sân khấu DJ, sôi động và náo nhiệt',
  },
  {
    id: 'bar',
    name: 'Quầy Bar & Pha Chế',
    shortName: 'Quầy Bar',
    icon: '🍸',
    color: 'text-amber-300',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    borderColor: 'border-amber-400/40',
    bgColor: 'bg-amber-950/30',
    description: 'Ghế cao tại quầy cocktail và thu ngân',
  },
];

// Định nghĩa tọa độ đa giác 6 cạnh (Hexagon) trung tâm (viewBox: 1000 x 1000)
export const HEXAGON_CONFIG = {
  // 6 đỉnh của hình lục giác đối xứng thẳng đứng
  points: '500,190 770,330 770,670 500,810 230,670 230,330',
  center: { x: 500, y: 500 },
  label: 'KHU VỰC NGOÀI TRỜI (OPEN AIR)',
  subLabel: 'Vùng lục giác 33 bàn trung tâm',
};

// Định nghĩa các khu vực chức năng (Landmarks)
export const VENUE_LANDMARKS = {
  // Cổng vào góc trên bên phải
  entrance: {
    x: 840,
    y: 50,
    width: 140,
    height: 60,
    title: 'CỔNG VÀO',
    subTitle: 'MAIN ENTRANCE',
    arrowFrom: { x: 910, y: 110 },
    arrowTo: { x: 840, y: 150 },
  },
  // Sân khấu DJ & Âm nhạc bên cánh trái
  djStage: {
    x: 15,
    y: 410,
    width: 95,
    height: 180,
    title: 'DJ VÀ NHẠC',
    subTitle: 'LIVE STAGE & SOUND',
    icon: '🎧',
  },
  // Quầy Bar chính ở phía dưới
  barCounter: {
    x: 230,
    y: 890,
    width: 440,
    height: 75,
    title: 'QUẦY BAR',
    subTitle: 'COCKTAIL & DRAFT BEER',
    icon: '🍸',
  },
  // Quầy Thanh toán cạnh quầy bar
  cashier: {
    x: 690,
    y: 890,
    width: 170,
    height: 75,
    title: 'QUẦY THANH TOÁN',
    subTitle: 'CASHIER / POS',
    icon: '💳',
  },
};

export interface TableBlueprint {
  name: string;
  code: string;
  zone: ZoneId;
  x: number; // Tọa độ X trên viewBox 1000
  y: number; // Tọa độ Y trên viewBox 1000
  shape: 'square' | 'circle' | 'bar_stool';
  capacity: number;
}

/**
 * 33 BÀN TRONG KHU VỰC NGOÀI TRỜI (HÌNH LỤC GIÁC 6 CẠNH)
 * Xếp theo 9 hàng đối xứng chuẩn theo bản vẽ:
 * Hàng 1: 1 bàn đỉnh
 * Hàng 2: 3 bàn
 * Hàng 3-7: 5 bàn mỗi hàng (25 bàn)
 * Hàng 8: 3 bàn
 * Hàng 9: 1 bàn đáy
 */
const OUTDOOR_TABLES: TableBlueprint[] = [
  // Hàng 1 (Đỉnh lục giác) - 1 bàn
  { name: 'Bàn 01 (NT-01)', code: 'NT-01', zone: 'outdoor', x: 500, y: 245, shape: 'square', capacity: 4 },

  // Hàng 2 - 3 bàn
  { name: 'Bàn 02 (NT-02)', code: 'NT-02', zone: 'outdoor', x: 415, y: 300, shape: 'square', capacity: 4 },
  { name: 'Bàn 03 (NT-03)', code: 'NT-03', zone: 'outdoor', x: 500, y: 300, shape: 'square', capacity: 4 },
  { name: 'Bàn 04 (NT-04)', code: 'NT-04', zone: 'outdoor', x: 585, y: 300, shape: 'square', capacity: 4 },

  // Hàng 3 - 5 bàn
  { name: 'Bàn 05 (NT-05)', code: 'NT-05', zone: 'outdoor', x: 310, y: 365, shape: 'square', capacity: 4 },
  { name: 'Bàn 06 (NT-06)', code: 'NT-06', zone: 'outdoor', x: 405, y: 365, shape: 'square', capacity: 4 },
  { name: 'Bàn 07 (NT-07)', code: 'NT-07', zone: 'outdoor', x: 500, y: 365, shape: 'square', capacity: 4 },
  { name: 'Bàn 08 (NT-08)', code: 'NT-08', zone: 'outdoor', x: 595, y: 365, shape: 'square', capacity: 4 },
  { name: 'Bàn 09 (NT-09)', code: 'NT-09', zone: 'outdoor', x: 690, y: 365, shape: 'square', capacity: 4 },

  // Hàng 4 - 5 bàn
  { name: 'Bàn 10 (NT-10)', code: 'NT-10', zone: 'outdoor', x: 310, y: 430, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-11', code: 'NT-11', zone: 'outdoor', x: 405, y: 430, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-12', code: 'NT-12', zone: 'outdoor', x: 500, y: 430, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-13', code: 'NT-13', zone: 'outdoor', x: 595, y: 430, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-14', code: 'NT-14', zone: 'outdoor', x: 690, y: 430, shape: 'square', capacity: 4 },

  // Hàng 5 (Hàng ngang trung tâm) - 5 bàn
  { name: 'Bàn NT-15', code: 'NT-15', zone: 'outdoor', x: 310, y: 495, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-16', code: 'NT-16', zone: 'outdoor', x: 405, y: 495, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-17', code: 'NT-17', zone: 'outdoor', x: 500, y: 495, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-18', code: 'NT-18', zone: 'outdoor', x: 595, y: 495, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-19', code: 'NT-19', zone: 'outdoor', x: 690, y: 495, shape: 'square', capacity: 4 },

  // Hàng 6 - 5 bàn
  { name: 'Bàn NT-20', code: 'NT-20', zone: 'outdoor', x: 310, y: 560, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-21', code: 'NT-21', zone: 'outdoor', x: 405, y: 560, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-22', code: 'NT-22', zone: 'outdoor', x: 500, y: 560, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-23', code: 'NT-23', zone: 'outdoor', x: 595, y: 560, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-24', code: 'NT-24', zone: 'outdoor', x: 690, y: 560, shape: 'square', capacity: 4 },

  // Hàng 7 - 5 bàn
  { name: 'Bàn NT-25', code: 'NT-25', zone: 'outdoor', x: 310, y: 625, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-26', code: 'NT-26', zone: 'outdoor', x: 405, y: 625, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-27', code: 'NT-27', zone: 'outdoor', x: 500, y: 625, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-28', code: 'NT-28', zone: 'outdoor', x: 595, y: 625, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-29', code: 'NT-29', zone: 'outdoor', x: 690, y: 625, shape: 'square', capacity: 4 },

  // Hàng 8 - 3 bàn
  { name: 'Bàn NT-30', code: 'NT-30', zone: 'outdoor', x: 415, y: 690, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-31', code: 'NT-31', zone: 'outdoor', x: 500, y: 690, shape: 'square', capacity: 4 },
  { name: 'Bàn NT-32', code: 'NT-32', zone: 'outdoor', x: 585, y: 690, shape: 'square', capacity: 4 },

  // Hàng 9 (Đáy lục giác) - 1 bàn
  { name: 'Bàn NT-33', code: 'NT-33', zone: 'outdoor', x: 500, y: 750, shape: 'square', capacity: 4 },
];

/**
 * CÁC BÀN KHU TRONG NHÀ / VIP XUNG QUANH (THEO BẢN VẼ TAY)
 */
const INDOOR_VIP_TABLES: TableBlueprint[] = [
  // Cụm phía Bắc (trên đỉnh lục giác): pod 2x2 + 2 bàn cánh
  { name: 'VIP 01', code: 'VIP-01', zone: 'indoor', x: 475, y: 75, shape: 'square', capacity: 4 },
  { name: 'VIP 02', code: 'VIP-02', zone: 'indoor', x: 525, y: 75, shape: 'square', capacity: 4 },
  { name: 'VIP 03', code: 'VIP-03', zone: 'indoor', x: 475, y: 115, shape: 'square', capacity: 4 },
  { name: 'VIP 04', code: 'VIP-04', zone: 'indoor', x: 525, y: 115, shape: 'square', capacity: 4 },
  { name: 'Bàn VIP-T1', code: 'VIP-T1', zone: 'indoor', x: 360, y: 150, shape: 'square', capacity: 2 },
  { name: 'Bàn VIP-T2', code: 'VIP-T2', zone: 'indoor', x: 640, y: 150, shape: 'square', capacity: 2 },

  // Cụm Tây Bắc (Top-Left): pod 2x2
  { name: 'VIP 05', code: 'VIP-05', zone: 'indoor', x: 185, y: 185, shape: 'square', capacity: 4 },
  { name: 'VIP 06', code: 'VIP-06', zone: 'indoor', x: 230, y: 185, shape: 'square', capacity: 4 },
  { name: 'VIP 07', code: 'VIP-07', zone: 'indoor', x: 185, y: 225, shape: 'square', capacity: 4 },
  { name: 'VIP 08', code: 'VIP-08', zone: 'indoor', x: 230, y: 225, shape: 'square', capacity: 4 },

  // Cụm Đông Bắc (Top-Right): pod 2x2
  { name: 'VIP 09', code: 'VIP-09', zone: 'indoor', x: 765, y: 185, shape: 'square', capacity: 4 },
  { name: 'VIP 10', code: 'VIP-10', zone: 'indoor', x: 810, y: 185, shape: 'square', capacity: 4 },
  { name: 'VIP 11', code: 'VIP-11', zone: 'indoor', x: 765, y: 225, shape: 'square', capacity: 4 },
  { name: 'VIP 12', code: 'VIP-12', zone: 'indoor', x: 810, y: 225, shape: 'square', capacity: 4 },

  // Cụm Phía Đông (Cánh Phải đối diện DJ): 2 pod 2x2 và 1 bàn đơn ở giữa
  { name: 'VIP 13', code: 'VIP-13', zone: 'indoor', x: 865, y: 330, shape: 'square', capacity: 4 },
  { name: 'VIP 14', code: 'VIP-14', zone: 'indoor', x: 905, y: 330, shape: 'square', capacity: 4 },
  { name: 'VIP 15', code: 'VIP-15', zone: 'indoor', x: 865, y: 370, shape: 'square', capacity: 4 },
  { name: 'VIP 16', code: 'VIP-16', zone: 'indoor', x: 905, y: 370, shape: 'square', capacity: 4 },
  { name: 'VIP 17 (Solo)', code: 'VIP-17', zone: 'indoor', x: 885, y: 500, shape: 'square', capacity: 2 },
  { name: 'VIP 18', code: 'VIP-18', zone: 'indoor', x: 865, y: 630, shape: 'square', capacity: 4 },
  { name: 'VIP 19', code: 'VIP-19', zone: 'indoor', x: 905, y: 630, shape: 'square', capacity: 4 },
  { name: 'VIP 20', code: 'VIP-20', zone: 'indoor', x: 865, y: 670, shape: 'square', capacity: 4 },
  { name: 'VIP 21', code: 'VIP-21', zone: 'indoor', x: 905, y: 670, shape: 'square', capacity: 4 },

  // Cụm Đông Nam (Bottom-Right): pod 2x2 + 1 bàn đơn
  { name: 'VIP 22', code: 'VIP-22', zone: 'indoor', x: 765, y: 755, shape: 'square', capacity: 4 },
  { name: 'VIP 23', code: 'VIP-23', zone: 'indoor', x: 810, y: 755, shape: 'square', capacity: 4 },
  { name: 'VIP 24', code: 'VIP-24', zone: 'indoor', x: 765, y: 795, shape: 'square', capacity: 4 },
  { name: 'VIP 25', code: 'VIP-25', zone: 'indoor', x: 810, y: 795, shape: 'square', capacity: 4 },
  { name: 'Bàn VIP-B2', code: 'VIP-B2', zone: 'indoor', x: 655, y: 825, shape: 'square', capacity: 2 },

  // Cụm Tây Nam (Bottom-Left): pod 2x2 + 1 bàn đơn
  { name: 'VIP 26', code: 'VIP-26', zone: 'indoor', x: 185, y: 755, shape: 'square', capacity: 4 },
  { name: 'VIP 27', code: 'VIP-27', zone: 'indoor', x: 230, y: 755, shape: 'square', capacity: 4 },
  { name: 'VIP 28', code: 'VIP-28', zone: 'indoor', x: 185, y: 795, shape: 'square', capacity: 4 },
  { name: 'VIP 29', code: 'VIP-29', zone: 'indoor', x: 230, y: 795, shape: 'square', capacity: 4 },
  { name: 'Bàn VIP-B1', code: 'VIP-B1', zone: 'indoor', x: 345, y: 825, shape: 'square', capacity: 2 },

  // Cụm Phía Nam (Dưới đáy lục giác): pod 2x2
  { name: 'VIP 30', code: 'VIP-30', zone: 'indoor', x: 475, y: 835, shape: 'square', capacity: 4 },
  { name: 'VIP 31', code: 'VIP-31', zone: 'indoor', x: 525, y: 835, shape: 'square', capacity: 4 },
  { name: 'VIP 32', code: 'VIP-32', zone: 'indoor', x: 475, y: 870, shape: 'square', capacity: 4 },
  { name: 'VIP 33', code: 'VIP-33', zone: 'indoor', x: 525, y: 870, shape: 'square', capacity: 4 },
];

/**
 * CÁC BÀN KHU DJ & SÂN KHẤU (CÁNH TRÁI)
 */
const DJ_TABLES: TableBlueprint[] = [
  // Cụm trên cạnh DJ: pod 2x2
  { name: 'Bàn DJ 01', code: 'DJ-01', zone: 'dj', x: 135, y: 330, shape: 'square', capacity: 4 },
  { name: 'Bàn DJ 02', code: 'DJ-02', zone: 'dj', x: 175, y: 330, shape: 'square', capacity: 4 },
  { name: 'Bàn DJ 03', code: 'DJ-03', zone: 'dj', x: 135, y: 370, shape: 'square', capacity: 4 },
  { name: 'Bàn DJ 04', code: 'DJ-04', zone: 'dj', x: 175, y: 370, shape: 'square', capacity: 4 },

  // Bàn đơn chính diện sân khấu
  { name: 'Bàn DJ Center', code: 'DJ-05', zone: 'dj', x: 155, y: 500, shape: 'square', capacity: 2 },

  // Cụm dưới cạnh DJ: pod 2x2
  { name: 'Bàn DJ 06', code: 'DJ-06', zone: 'dj', x: 135, y: 630, shape: 'square', capacity: 4 },
  { name: 'Bàn DJ 07', code: 'DJ-07', zone: 'dj', x: 175, y: 630, shape: 'square', capacity: 4 },
  { name: 'Bàn DJ 08', code: 'DJ-08', zone: 'dj', x: 135, y: 670, shape: 'square', capacity: 4 },
  { name: 'Bàn DJ 09', code: 'DJ-09', zone: 'dj', x: 175, y: 670, shape: 'square', capacity: 4 },
];

/**
 * CÁC VỊ TRÍ GHẾ TẠI QUẦY BAR
 */
const BAR_TABLES: TableBlueprint[] = [
  { name: 'Ghế Bar 01', code: 'BAR-01', zone: 'bar', x: 270, y: 875, shape: 'bar_stool', capacity: 1 },
  { name: 'Ghế Bar 02', code: 'BAR-02', zone: 'bar', x: 335, y: 875, shape: 'bar_stool', capacity: 1 },
  { name: 'Ghế Bar 03', code: 'BAR-03', zone: 'bar', x: 400, y: 875, shape: 'bar_stool', capacity: 1 },
  { name: 'Ghế Bar 04', code: 'BAR-04', zone: 'bar', x: 465, y: 875, shape: 'bar_stool', capacity: 1 },
  { name: 'Ghế Bar 05', code: 'BAR-05', zone: 'bar', x: 530, y: 875, shape: 'bar_stool', capacity: 1 },
  { name: 'Ghế Bar 06', code: 'BAR-06', zone: 'bar', x: 595, y: 875, shape: 'bar_stool', capacity: 1 },
];

// Danh sách hợp nhất tất cả các bàn trong sơ đồ
export const ALL_BLUEPRINT_TABLES: TableBlueprint[] = [
  ...OUTDOOR_TABLES,
  ...INDOOR_VIP_TABLES,
  ...DJ_TABLES,
  ...BAR_TABLES,
];

/**
 * Tìm tọa độ và thông tin hiển thị cho một bàn cụ thể
 * Tự động khớp theo pos_x/pos_y lưu trong DB hoặc theo tên bàn (vd: "Bàn 01", "Bàn 02")
 */
export function resolveTableLayout(table: {
  id: string;
  name: string;
  zone?: string | null;
  pos_x?: number | null;
  pos_y?: number | null;
  shape?: string | null;
  capacity?: number | null;
}): {
  x: number;
  y: number;
  zone: ZoneId;
  shape: 'square' | 'circle' | 'bar_stool';
  capacity: number;
} {
  // 1. Nếu bàn đã có pos_x, pos_y cụ thể trong database (0-1000 scale)
  if (typeof table.pos_x === 'number' && typeof table.pos_y === 'number') {
    const zoneVal = (table.zone as ZoneId) || 'outdoor';
    return {
      x: table.pos_x,
      y: table.pos_y,
      zone: zoneVal,
      shape: (table.shape as any) || 'square',
      capacity: table.capacity || 4,
    };
  }

  // 2. Tìm theo tên bàn hoặc mã code trong bản vẽ
  const cleanName = table.name.toLowerCase().trim();

  // Khớp "Bàn 01" -> NT-01, "Bàn 02" -> NT-02, ...
  const numMatch = cleanName.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    // Nếu từ bàn 1 đến 33 -> ánh xạ tương ứng vào Khu Ngoài Trời NT-01 đến NT-33
    if (num >= 1 && num <= OUTDOOR_TABLES.length) {
      const blueprint = OUTDOOR_TABLES[num - 1];
      return {
        x: blueprint.x,
        y: blueprint.y,
        zone: blueprint.zone,
        shape: blueprint.shape,
        capacity: blueprint.capacity,
      };
    }
  }

  // Khớp theo tên chứa chữ VIP, DJ, Bar, NT
  const matched = ALL_BLUEPRINT_TABLES.find((bp) => {
    return (
      cleanName.includes(bp.code.toLowerCase()) ||
      bp.name.toLowerCase().includes(cleanName) ||
      cleanName.includes(bp.name.toLowerCase())
    );
  });

  if (matched) {
    return {
      x: matched.x,
      y: matched.y,
      zone: matched.zone,
      shape: matched.shape,
      capacity: matched.capacity,
    };
  }

  // Dự phòng an toàn: Đặt vào vị trí trung tâm trong vùng lục giác
  return {
    x: 500,
    y: 500,
    zone: 'outdoor',
    shape: 'square',
    capacity: 4,
  };
}
