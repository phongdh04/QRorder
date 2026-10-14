'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sparkles,
  Flame,
  Clock,
  DollarSign,
  Coffee,
  Info,
  MapPin,
  Compass,
} from 'lucide-react';
import { TableItemData } from './TableCard';
import {
  VENUE_ZONES,
  ZoneId,
  HEXAGON_CONFIG,
  VENUE_LANDMARKS,
  resolveTableLayout,
  TableBlueprint,
  ALL_BLUEPRINT_TABLES,
} from '@/lib/floor-plan-data';
import { formatVND } from '@/lib/utils';

interface FloorPlanMapProps {
  tables: TableItemData[];
  selectedTableId: string | null;
  onSelectTable: (table: TableItemData) => void;
  isLoading?: boolean;
}

export function FloorPlanMap({
  tables,
  selectedTableId,
  onSelectTable,
  isLoading = false,
}: FloorPlanMapProps) {
  const [selectedZone, setSelectedZone] = useState<ZoneId>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'occupied' | 'pending'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredTable, setHoveredTable] = useState<{
    table: TableItemData | null;
    blueprint: TableBlueprint | null;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Ánh xạ danh sách bàn DB với dữ liệu tọa độ Blueprint
  const mappedTables = useMemo(() => {
    // Tạo map theo id hoặc theo name để tra cứu nhanh bàn từ DB
    const dbTableMapByName = new Map<string, TableItemData>();
    tables.forEach((t) => {
      dbTableMapByName.set(t.name.toLowerCase().trim(), t);
      // Gán thêm biến thể nếu có số
      const numMatch = t.name.match(/\d+/);
      if (numMatch) {
        dbTableMapByName.set(`bàn ${numMatch[0]}`, t);
        dbTableMapByName.set(`nt-${numMatch[0].padStart(2, '0')}`, t);
      }
    });

    // Duyệt qua tất cả các vị trí trong blueprint bản vẽ
    return ALL_BLUEPRINT_TABLES.map((bp) => {
      // Tìm xem có bàn nào trong DB ứng với blueprint này không
      let matchedDbTable = tables.find((t) => {
        if (t.name.toLowerCase() === bp.name.toLowerCase()) return true;
        if (t.name.toLowerCase().includes(bp.code.toLowerCase())) return true;
        return false;
      });

      // Nếu là NT-01 đến NT-33 thì ánh xạ tương ứng "Bàn 01" đến "Bàn 33" hiện có
      if (!matchedDbTable && bp.zone === 'outdoor') {
        const num = parseInt(bp.code.replace('NT-', ''), 10);
        if (!isNaN(num)) {
          const paddedNum = num < 10 ? `0${num}` : `${num}`;
          matchedDbTable = tables.find(
            (t) => t.name === `Bàn ${paddedNum}` || t.name === `Bàn ${num}`
          );
        }
      }

      return {
        blueprint: bp,
        dbTable: matchedDbTable || null,
        // Dữ liệu hiển thị chuẩn tuyệt đối theo Blueprint mặt bằng
        id: matchedDbTable?.id || `virtual-${bp.code}`,
        name: matchedDbTable?.name || bp.name,
        code: bp.code,
        zone: bp.zone,
        x: bp.x,
        y: bp.y,
        shape: bp.shape,
        capacity: bp.capacity,
        statusType: matchedDbTable?.statusType || 'empty',
        unservedCount: matchedDbTable?.unservedCount || 0,
        totalAmount: matchedDbTable?.totalAmount || 0,
        is_active: matchedDbTable ? matchedDbTable.is_active : true,
        isDbRecord: Boolean(matchedDbTable),
      };
    });
  }, [tables]);

  // Lọc theo Khu vực và theo Trạng thái
  const visibleTables = useMemo(() => {
    return mappedTables.filter((item) => {
      // Lọc theo khu vực
      if (selectedZone !== 'all' && item.zone !== selectedZone) {
        return false;
      }

      // Lọc theo trạng thái
      if (statusFilter === 'occupied' && item.statusType === 'empty') {
        return false;
      }
      if (statusFilter === 'pending' && item.statusType !== 'pending') {
        return false;
      }

      return true;
    });
  }, [mappedTables, selectedZone, statusFilter]);

  // Đếm số lượng bàn theo từng khu vực
  const zoneCounts = useMemo(() => {
    const counts: Record<ZoneId, number> = {
      all: mappedTables.length,
      outdoor: 0,
      indoor: 0,
      bar: 0,
      dj: 0,
    };
    mappedTables.forEach((t) => {
      if (counts[t.zone] !== undefined) {
        counts[t.zone]++;
      }
    });
    return counts;
  }, [mappedTables]);

  // Thống kê trạng thái bàn
  const statusStats = useMemo(() => {
    let pendingCount = 0;
    let occupiedCount = 0;
    let emptyCount = 0;

    mappedTables.forEach((t) => {
      if (t.statusType === 'pending') pendingCount++;
      else if (t.statusType === 'occupied' || t.statusType === 'preparing') occupiedCount++;
      else emptyCount++;
    });

    return { pendingCount, occupiedCount, emptyCount };
  }, [mappedTables]);

  // Xử lý zoom
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(0.7, prev + delta), 1.8));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar: Bộ lọc khu vực & Thống kê nhanh */}
      <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs chuyển đổi các phân khu */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
            {VENUE_ZONES.map((zone) => {
              const isSelected = selectedZone === zone.id;
              const count = zoneCounts[zone.id];
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZone(zone.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{zone.icon}</span>
                  <span>{zone.shortName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-black/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Công cụ Zoom & Reset */}
          <div className="flex items-center gap-1.5 self-end md:self-auto">
            <button
              type="button"
              onClick={() => handleZoom(-0.15)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Thu nhỏ sơ đồ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 px-1">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.15)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Phóng to sơ đồ"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Đặt lại kích thước chuẩn"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thanh chú thích trạng thái & Lọc nhanh */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span className="font-semibold text-slate-300">Chú thích sơ đồ:</span>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-800 border border-slate-600" />
              <span>Bàn trống ({statusStats.emptyCount})</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 border border-blue-400" />
              <span>Có khách ({statusStats.occupiedCount})</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-orange-500 animate-pulse border border-orange-300 shadow-sm shadow-orange-500/50" />
              <span className="text-orange-400 font-bold">
                Có đơn mới ({statusStats.pendingCount})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 border border-amber-300" />
              <span>Đang pha chế</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả bàn
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('occupied')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                statusFilter === 'occupied'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đang có khách
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                statusFilter === 'pending'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cần xác nhận đơn
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bản đồ trực quan 2D (Interactive Floor Plan Canvas) */}
      <div
        ref={containerRef}
        className="relative w-full overflow-auto rounded-3xl border border-slate-800/90 bg-[#090A0D] shadow-2xl p-2 sm:p-4 transition-all flex items-center justify-center min-h-[640px]"
      >
        {/* Glow ambient background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.06),transparent_60%)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 blur-3xl pointer-events-none" />

        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
          }}
          className="w-full max-w-[880px] aspect-[1000/1100] relative"
        >
          <svg
            viewBox="0 0 1000 1100"
            className="w-full h-full select-none"
            style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))' }}
          >
            <defs>
              {/* Pattern lưới sàn vũ trường */}
              <pattern id="venueGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.025)"
                  strokeWidth="1"
                />
              </pattern>

              {/* Gradient cho Khu Ngoài Trời (Lục giác 6 cạnh) */}
              <linearGradient id="outdoorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#064E3B" stopOpacity="0.22" />
                <stop offset="50%" stopColor="#047857" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#064E3B" stopOpacity="0.22" />
              </linearGradient>

              {/* Gradient cho Quầy Bar */}
              <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#78350F" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#B45309" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#78350F" stopOpacity="0.8" />
              </linearGradient>

              {/* Gradient cho Sân khấu DJ */}
              <linearGradient id="djGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4C1D95" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#2E1065" stopOpacity="0.85" />
              </linearGradient>

              {/* Bộ lọc phát sáng Glow cho đơn mới */}
              <filter id="pendingGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Sàn tổng thể (Venue Floor Base) */}
            <rect
              x="5"
              y="5"
              width="990"
              height="1090"
              rx="32"
              fill="#0D0E12"
              stroke="#1E293B"
              strokeWidth="2"
            />
            <rect x="5" y="5" width="990" height="1090" rx="32" fill="url(#venueGrid)" />

            {/* Viền chu vi sàn quán */}
            <rect
              x="20"
              y="20"
              width="960"
              height="1060"
              rx="24"
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeDasharray="6 6"
              strokeWidth="1.5"
            />

            {/* ======================================================== */}
            {/* 1. KHU VỰC NGOÀI TRỜI (HÌNH LỤC GIÁC 6 CẠNH TRUNG TÂM)    */}
            {/* ======================================================== */}
            <g id="zone-outdoor-hexagon">
              {/* Nền Đa Giác 6 Cạnh */}
              <polygon
                points={HEXAGON_CONFIG.points}
                fill="url(#outdoorGrad)"
                stroke="#10B981"
                strokeWidth={selectedZone === 'outdoor' ? '4' : '2.5'}
                strokeDasharray={selectedZone === 'outdoor' ? 'none' : '8 6'}
                className="transition-all duration-300"
                style={{
                  filter:
                    selectedZone === 'outdoor'
                      ? 'drop-shadow(0 0 16px rgba(16,185,129,0.5))'
                      : 'drop-shadow(0 0 8px rgba(16,185,129,0.25))',
                }}
              />

              {/* Vòng đệm mờ phía trong lục giác tạo chiều sâu */}
              <polygon
                points={HEXAGON_CONFIG.innerPoints}
                fill="none"
                stroke="rgba(16, 185, 129, 0.12)"
                strokeWidth="1"
              />

              {/* Huy hiệu & Tiêu đề Khu Ngoài Trời */}
              <g transform="translate(500, 186)">
                <rect
                  x="-125"
                  y="-14"
                  width="250"
                  height="26"
                  rx="13"
                  fill="#064E3B"
                  stroke="#34D399"
                  strokeWidth="1.5"
                  opacity="0.95"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#A7F3D0"
                  fontSize="10"
                  fontWeight="900"
                  letterSpacing="1"
                  className="font-mono"
                >
                  🌿 KHU NGOÀI TRỜI (33 BÀN)
                </text>
              </g>

              {/* Biểu tượng cây trang trí tại 6 góc lục giác */}
              {[
                { x: 500, y: 170 },
                { x: 780, y: 310 },
                { x: 780, y: 600 },
                { x: 500, y: 710 },
                { x: 220, y: 600 },
                { x: 220, y: 310 },
              ].map((pt, idx) => (
                <circle
                  key={`hex-corner-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="6"
                  fill="#065F46"
                  stroke="#34D399"
                  strokeWidth="1.5"
                />
              ))}
            </g>

            {/* ======================================================== */}
            {/* 2. CỔNG VÀO (MAIN ENTRANCE) GÓC TRÊN BÊN PHẢI            */}
            {/* ======================================================== */}
            <g
              id="landmark-entrance"
              transform={`translate(${VENUE_LANDMARKS.entrance.x}, ${VENUE_LANDMARKS.entrance.y})`}
            >
              <rect
                x="0"
                y="0"
                width={VENUE_LANDMARKS.entrance.width}
                height={VENUE_LANDMARKS.entrance.height}
                rx="14"
                fill="#131B2A"
                stroke="#3B82F6"
                strokeWidth="2"
                className="transition-all"
              />
              <text
                x={VENUE_LANDMARKS.entrance.width / 2}
                y="24"
                textAnchor="middle"
                fill="#93C5FD"
                fontSize="12"
                fontWeight="900"
                letterSpacing="1.5"
              >
                🚪 CỔNG VÀO
              </text>
              <text
                x={VENUE_LANDMARKS.entrance.width / 2}
                y="42"
                textAnchor="middle"
                fill="#60A5FA"
                fontSize="9"
                fontWeight="700"
                letterSpacing="1"
                opacity="0.8"
              >
                MAIN ENTRANCE
              </text>

              {/* Mũi tên chỉ hướng khách vào quán */}
              <path
                d="M -15 70 L -45 95 M -45 95 L -30 95 M -45 95 L -45 80"
                stroke="#60A5FA"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>

            {/* ======================================================== */}
            {/* 3. SÂN KHẤU DJ & ÂM NHẠC (CÁNH TRÁI)                    */}
            {/* ======================================================== */}
            <g
              id="landmark-dj"
              transform={`translate(${VENUE_LANDMARKS.djStage.x}, ${VENUE_LANDMARKS.djStage.y})`}
            >
              <rect
                x="0"
                y="0"
                width={VENUE_LANDMARKS.djStage.width}
                height={VENUE_LANDMARKS.djStage.height}
                rx="14"
                fill="url(#djGrad)"
                stroke="#A855F7"
                strokeWidth={selectedZone === 'dj' ? '3' : '2'}
                style={{
                  filter:
                    selectedZone === 'dj'
                      ? 'drop-shadow(0 0 16px rgba(168,85,247,0.6))'
                      : 'drop-shadow(0 0 8px rgba(168,85,247,0.3))',
                }}
              />

              {/* Đĩa DJ & Equalizer */}
              <circle
                cx={VENUE_LANDMARKS.djStage.width / 2}
                cy="45"
                r="22"
                fill="#1E1B4B"
                stroke="#C084FC"
                strokeWidth="2"
              />
              <circle
                cx={VENUE_LANDMARKS.djStage.width / 2}
                cy="45"
                r="8"
                fill="#E9D5FF"
              />

              <text
                x={VENUE_LANDMARKS.djStage.width / 2}
                y="100"
                textAnchor="middle"
                fill="#F3E8FF"
                fontSize="12"
                fontWeight="900"
                letterSpacing="1"
              >
                🎧 DJ & NHẠC
              </text>
              <text
                x={VENUE_LANDMARKS.djStage.width / 2}
                y="120"
                textAnchor="middle"
                fill="#D8B4FE"
                fontSize="8"
                fontWeight="700"
                letterSpacing="0.8"
              >
                LIVE STAGE
              </text>

              {/* Vạch sóng âm thanh */}
              <g transform="translate(25, 140)">
                <rect x="0" y="4" width="6" height="16" rx="2" fill="#C084FC" />
                <rect x="10" y="0" width="6" height="24" rx="2" fill="#E879F9" />
                <rect x="20" y="8" width="6" height="12" rx="2" fill="#A855F7" />
                <rect x="30" y="2" width="6" height="20" rx="2" fill="#C084FC" />
                <rect x="40" y="6" width="6" height="14" rx="2" fill="#E879F9" />
              </g>
            </g>

            {/* ======================================================== */}
            {/* 4. QUẦY BAR CHÍNH (CẠNH DƯỚI)                           */}
            {/* ======================================================== */}
            <g
              id="landmark-bar"
              transform={`translate(${VENUE_LANDMARKS.barCounter.x}, ${VENUE_LANDMARKS.barCounter.y})`}
            >
              <rect
                x="0"
                y="0"
                width={VENUE_LANDMARKS.barCounter.width}
                height={VENUE_LANDMARKS.barCounter.height}
                rx="16"
                fill="url(#barGrad)"
                stroke="#F59E0B"
                strokeWidth={selectedZone === 'bar' ? '3' : '2'}
                style={{
                  filter:
                    selectedZone === 'bar'
                      ? 'drop-shadow(0 0 16px rgba(245,158,11,0.6))'
                      : 'drop-shadow(0 0 8px rgba(245,158,11,0.25))',
                }}
              />

              {/* Rãnh mặt bàn gỗ quầy pha chế */}
              <rect
                x="12"
                y="10"
                width={VENUE_LANDMARKS.barCounter.width - 24}
                height="12"
                rx="6"
                fill="#451A03"
                opacity="0.8"
              />

              <text
                x={VENUE_LANDMARKS.barCounter.width / 2}
                y="46"
                textAnchor="middle"
                fill="#FEF3C7"
                fontSize="14"
                fontWeight="900"
                letterSpacing="2"
              >
                🍸 QUẦY BAR (COCKTAIL & SPIRITS)
              </text>
              <text
                x={VENUE_LANDMARKS.barCounter.width / 2}
                y="63"
                textAnchor="middle"
                fill="#FDE68A"
                fontSize="9"
                fontWeight="700"
                letterSpacing="1"
                opacity="0.8"
              >
                MAIN MIXOLOGY COUNTER
              </text>
            </g>

            {/* ======================================================== */}
            {/* 5. QUẦY THANH TOÁN (CẠNH QUẦY BAR)                      */}
            {/* ======================================================== */}
            <g
              id="landmark-cashier"
              transform={`translate(${VENUE_LANDMARKS.cashier.x}, ${VENUE_LANDMARKS.cashier.y})`}
            >
              <rect
                x="0"
                y="0"
                width={VENUE_LANDMARKS.cashier.width}
                height={VENUE_LANDMARKS.cashier.height}
                rx="16"
                fill="#1E293B"
                stroke="#64748B"
                strokeWidth="2"
              />
              <text
                x={VENUE_LANDMARKS.cashier.width / 2}
                y="38"
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize="11"
                fontWeight="900"
                letterSpacing="1"
              >
                💳 THANH TOÁN
              </text>
              <text
                x={VENUE_LANDMARKS.cashier.width / 2}
                y="56"
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="9"
                fontWeight="700"
                letterSpacing="0.8"
              >
                CASHIER / POS
              </text>
            </g>

            {/* ======================================================== */}
            {/* 6. HIỂN THỊ CÁC Ô BÀN TRỰC QUAN (INTERACTIVE TABLES)       */}
            {/* ======================================================== */}
            {visibleTables.map((item) => {
              const isSelected = selectedTableId === item.id;
              const isPending = item.statusType === 'pending';
              const isPreparing = item.statusType === 'preparing';
              const isOccupied = item.statusType === 'occupied';
              const isStool = item.shape === 'bar_stool';

              // Kích thước ô bàn
              const tableWidth = isStool ? 28 : 34;
              const tableHeight = isStool ? 28 : 34;

              // Màu sắc theo trạng thái
              let fillColor = '#181C26';
              let strokeColor = '#334155';
              let textColor = '#94A3B8';
              let glowFilter = '';

              if (isPending) {
                fillColor = '#C2410C';
                strokeColor = '#FB923C';
                textColor = '#FFFFFF';
                glowFilter = 'url(#pendingGlow)';
              } else if (isPreparing) {
                fillColor = '#B45309';
                strokeColor = '#FBBF24';
                textColor = '#FFFFFF';
              } else if (isOccupied) {
                fillColor = '#1E3A8A';
                strokeColor = '#60A5FA';
                textColor = '#DBEAFE';
              }

              if (isSelected) {
                strokeColor = '#F59E0B';
              }

              return (
                <g
                  key={item.id}
                  transform={`translate(${item.x}, ${item.y})`}
                  className="cursor-pointer transition-transform duration-150 hover:scale-125"
                  onClick={() => {
                    // Nếu đã có trong DB thì mở drawer tương ứng
                    if (item.dbTable) {
                      onSelectTable(item.dbTable);
                    } else {
                      // Tạo object giả lập nếu bàn đang ở dạng blueprint
                      onSelectTable({
                        id: item.id,
                        name: item.name,
                        token: `sample_${item.code}`,
                        is_active: true,
                        statusType: 'empty',
                        unservedCount: 0,
                        totalAmount: 0,
                        openedAt: null,
                        activeSession: null,
                        zone: item.zone,
                        pos_x: item.x,
                        pos_y: item.y,
                        shape: item.shape,
                        capacity: item.capacity,
                      });
                    }
                  }}
                  onMouseEnter={() =>
                    setHoveredTable({
                      table: item.dbTable,
                      blueprint: item.blueprint,
                      x: item.x,
                      y: item.y,
                    })
                  }
                  onMouseLeave={() => setHoveredTable(null)}
                >
                  {/* Vòng lan tỏa (ping ring) nếu có đơn mới */}
                  {isPending && (
                    <circle
                      cx="0"
                      cy="0"
                      r="26"
                      fill="none"
                      stroke="#FB923C"
                      strokeWidth="2.5"
                      className="animate-ping opacity-75"
                    />
                  )}

                  {/* Khung bàn chính */}
                  {isStool ? (
                    <circle
                      cx="0"
                      cy="0"
                      r={tableWidth / 2}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3.5 : 2}
                      style={{ filter: glowFilter }}
                    />
                  ) : (
                    <rect
                      x={-tableWidth / 2}
                      y={-tableHeight / 2}
                      width={tableWidth}
                      height={tableHeight}
                      rx="7"
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3.5 : 2}
                      style={{ filter: glowFilter }}
                    />
                  )}

                  {/* Chấm hiển thị ghế xung quanh cho bàn vuông */}
                  {!isStool && (
                    <g opacity="0.4">
                      {/* 4 ghế mini xung quanh */}
                      <rect x="-10" y={-tableHeight / 2 - 4} width="20" height="3" rx="1.5" fill={strokeColor} />
                      <rect x="-10" y={tableHeight / 2 + 1} width="20" height="3" rx="1.5" fill={strokeColor} />
                      <rect x={-tableWidth / 2 - 4} y="-10" width="3" height="20" rx="1.5" fill={strokeColor} />
                      <rect x={tableWidth / 2 + 1} y="-10" width="3" height="20" rx="1.5" fill={strokeColor} />
                    </g>
                  )}

                  {/* Tên mã bàn */}
                  <text
                    x="0"
                    y={isPending || isOccupied ? -1 : 3.5}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={item.code.length > 5 ? '8' : '9'}
                    fontWeight="900"
                    className="font-mono tracking-tight pointer-events-none"
                  >
                    {item.code}
                  </text>

                  {/* Chỉ số món hoặc tiền thu gọn nếu đang có khách */}
                  {(isPending || isPreparing) && (
                    <circle
                      cx="12"
                      cy="-12"
                      r="6.5"
                      fill="#EA580C"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  )}
                  {isPending && (
                    <text
                      x="12"
                      y="-9.5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="7"
                      fontWeight="900"
                      className="pointer-events-none"
                    >
                      !
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Popup trên Canvas */}
          {hoveredTable && (
            <div
              style={{
                left: `${(hoveredTable.x / 1000) * 100}%`,
                top: `${(hoveredTable.y / 1000) * 100}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-full mb-3 pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs w-48 space-y-1.5 text-slate-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-extrabold text-white text-sm">
                    {hoveredTable.table?.name || hoveredTable.blueprint?.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 font-mono text-slate-400">
                    {hoveredTable.blueprint?.code}
                  </span>
                </div>

                <div className="text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Phân khu:</span>
                    <span className="font-semibold text-slate-300">
                      {hoveredTable.blueprint?.zone === 'outdoor'
                        ? '🌿 Ngoài trời'
                        : hoveredTable.blueprint?.zone === 'dj'
                        ? '🎵 Cạnh DJ'
                        : hoveredTable.blueprint?.zone === 'bar'
                        ? '🍸 Quầy Bar'
                        : '👑 VIP / Trong nhà'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Trạng thái:</span>
                    <span
                      className={`font-bold ${
                        hoveredTable.table?.statusType === 'pending'
                          ? 'text-orange-400 animate-pulse'
                          : hoveredTable.table?.statusType === 'occupied'
                          ? 'text-blue-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {hoveredTable.table?.statusType === 'pending'
                        ? 'Có đơn mới gọi'
                        : hoveredTable.table?.statusType === 'preparing'
                        ? 'Đang làm đồ'
                        : hoveredTable.table?.statusType === 'occupied'
                        ? 'Đang phục vụ'
                        : 'Bàn trống'}
                    </span>
                  </div>

                  {hoveredTable.table && hoveredTable.table.totalAmount > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 font-bold">
                      <span className="text-slate-400">Tạm tính:</span>
                      <span className="text-amber-400 font-mono">
                        {formatVND(hoveredTable.table.totalAmount)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 pt-1 text-center font-medium">
                  Bấm để mở hóa đơn & gọi món
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer giải thích & ghi chú bàn */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Bấm vào bất kỳ bàn nào trên sơ đồ để quản lý chi tiết đơn hàng, in bill thanh toán hoặc xem mã QR.
          </span>
        </div>
        <div className="text-slate-500 font-mono text-[11px] self-end sm:self-auto">
          Mặt bằng 2D chuẩn hoá theo bản vẽ quán
        </div>
      </div>
    </div>
  );
}
