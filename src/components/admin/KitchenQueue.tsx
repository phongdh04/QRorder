'use client';

import React, { useState, useMemo } from 'react';
import {
  ChefHat,
  Clock,
  AlertTriangle,
  ArrowRight,
  Check,
  LayoutGrid,
  UtensilsCrossed,
  Sparkles,
  Layers,
} from 'lucide-react';

export interface KitchenQueueItem {
  id: string;
  orderId: string;
  tableId: string;
  tableName: string;
  orderStatus: string;
  name: string;
  quantity: number;
  itemNote: string | null;
  orderNote: string | null;
  createdAt: string | Date;
  minutesElapsed: number;
}

interface KitchenQueueProps {
  items: KitchenQueueItem[];
  onSelectTableById: (tableId: string) => void;
  onQuickConfirmOrder?: (orderId: string) => void;
  onCompleteTableOrders?: (tableId: string, orderIds: string[]) => void;
  isLoading?: boolean;
}

export function KitchenQueue({
  items,
  onSelectTableById,
  onQuickConfirmOrder,
  onCompleteTableOrders,
  isLoading = false,
}: KitchenQueueProps) {
  // Tab: 'by_table' (Hiển thị theo bàn) | 'by_dish' (Tổng hợp theo món - sắp xếp giảm dần)
  const [activeTab, setActiveTab] = useState<'by_table' | 'by_dish'>('by_table');
  const [completingTableId, setCompletingTableId] = useState<string | null>(null);

  // 1. GOM NHÓM THEO BÀN
  const tablesGroup = useMemo(() => {
    const map = new Map<
      string,
      {
        tableId: string;
        tableName: string;
        orderIds: Set<string>;
        rawItems: KitchenQueueItem[];
        maxMinutesElapsed: number;
        totalQuantity: number;
      }
    >();

    items.forEach((item) => {
      if (!map.has(item.tableId)) {
        map.set(item.tableId, {
          tableId: item.tableId,
          tableName: item.tableName,
          orderIds: new Set<string>(),
          rawItems: [],
          maxMinutesElapsed: item.minutesElapsed,
          totalQuantity: 0,
        });
      }
      const group = map.get(item.tableId)!;
      group.orderIds.add(item.orderId);
      group.rawItems.push(item);
      group.totalQuantity += item.quantity;
      if (item.minutesElapsed > group.maxMinutesElapsed) {
        group.maxMinutesElapsed = item.minutesElapsed;
      }
    });

    // Gom các món trùng tên trong cùng 1 bàn để hiển thị gọn gàng
    return Array.from(map.values())
      .map((grp) => {
        const dishMap = new Map<
          string,
          { name: string; quantity: number; notes: string[] }
        >();
        grp.rawItems.forEach((it) => {
          if (!dishMap.has(it.name)) {
            dishMap.set(it.name, { name: it.name, quantity: 0, notes: [] });
          }
          const d = dishMap.get(it.name)!;
          d.quantity += it.quantity;
          if (it.itemNote) d.notes.push(it.itemNote);
        });

        return {
          ...grp,
          consolidatedDishes: Array.from(dishMap.values()),
        };
      })
      .sort((a, b) => b.maxMinutesElapsed - a.maxMinutesElapsed);
  }, [items]);

  // 2. GOM NHÓM THEO MÓN (Sắp xếp giảm dần theo số lượng đặt)
  const dishesGroup = useMemo(() => {
    const map = new Map<
      string,
      {
        dishName: string;
        totalQuantity: number;
        maxMinutesElapsed: number;
        tableBreakdown: Array<{
          tableId: string;
          tableName: string;
          quantity: number;
          notes: string[];
          minutesElapsed: number;
        }>;
      }
    >();

    items.forEach((item) => {
      const key = item.name.trim();
      if (!map.has(key)) {
        map.set(key, {
          dishName: key,
          totalQuantity: 0,
          maxMinutesElapsed: item.minutesElapsed,
          tableBreakdown: [],
        });
      }
      const d = map.get(key)!;
      d.totalQuantity += item.quantity;
      if (item.minutesElapsed > d.maxMinutesElapsed) {
        d.maxMinutesElapsed = item.minutesElapsed;
      }

      // Kiểm tra xem bàn này đã có trong breakdown của món chưa
      const existingTbl = d.tableBreakdown.find((tb) => tb.tableId === item.tableId);
      if (existingTbl) {
        existingTbl.quantity += item.quantity;
        if (item.itemNote) existingTbl.notes.push(item.itemNote);
        if (item.minutesElapsed > existingTbl.minutesElapsed) {
          existingTbl.minutesElapsed = item.minutesElapsed;
        }
      } else {
        d.tableBreakdown.push({
          tableId: item.tableId,
          tableName: item.tableName,
          quantity: item.quantity,
          notes: item.itemNote ? [item.itemNote] : [],
          minutesElapsed: item.minutesElapsed,
        });
      }
    });

    // SẮP XẾP GIẢM DẦN: Món nào đặt nhiều nhất lên đầu tiên!
    return Array.from(map.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );
  }, [items]);

  // Tổng số phần tử món
  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, it) => sum + it.quantity, 0);
  }, [items]);

  // Xử lý hoàn thành nhanh tất cả món của 1 bàn
  const handleQuickCompleteTable = async (
    e: React.MouseEvent,
    tableId: string,
    orderIds: string[]
  ) => {
    e.stopPropagation();
    if (!onCompleteTableOrders) return;
    setCompletingTableId(tableId);
    try {
      await onCompleteTableOrders(tableId, orderIds);
    } finally {
      setCompletingTableId(null);
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-full overflow-hidden text-slate-100">
      {/* 1. Header chính */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>Món Cần Làm</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Bar / Bếp
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {tablesGroup.length} bàn đang chờ • Tổng {totalItemsCount} ly/phần
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
          {items.length} đơn
        </span>
      </div>

      {/* 2. Thanh Tabs chuyển đổi: Theo Bàn vs Tổng Hợp Theo Món */}
      <div className="p-2 bg-slate-950 border-b border-slate-800/80 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('by_table')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'by_table'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Theo bàn ({tablesGroup.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('by_dish')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'by_dish'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Tổng hợp món ({dishesGroup.length})</span>
        </button>
      </div>

      {/* 3. Nội dung danh sách */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[calc(100vh-280px)]">
        {isLoading && items.length === 0 ? (
          <div className="space-y-2.5 p-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-slate-800/50 animate-pulse border border-slate-800"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-emerald-400 flex items-center justify-center mx-auto border border-slate-700/60">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-200">
              Không có món nào đang chờ làm
            </p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Khi khách gửi order mới từ mã QR, các món sẽ hiển thị theo bàn và được thống kê tại đây.
            </p>
          </div>
        ) : activeTab === 'by_table' ? (
          /* ======================================================== */
          /* TAB 1: HIỂN THỊ THEO BÀN (GROUPED BY TABLE)               */
          /* ======================================================== */
          tablesGroup.map((tbl) => {
            const isOver10Min = tbl.maxMinutesElapsed >= 10;
            const isCompleting = completingTableId === tbl.tableId;

            return (
              <div
                key={tbl.tableId}
                onClick={() => onSelectTableById(tbl.tableId)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer group shadow-sm hover:shadow-lg ${
                  isOver10Min
                    ? 'bg-rose-950/20 border-rose-900/80 hover:border-rose-500/80'
                    : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Header Thẻ Bàn */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white tracking-tight">
                      {tbl.tableName}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {tbl.totalQuantity} phần
                    </span>
                  </div>

                  {/* Thời gian chờ */}
                  <div
                    className={`flex items-center gap-1 text-[11px] font-semibold ${
                      isOver10Min
                        ? 'text-rose-400 animate-pulse font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {isOver10Min ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span>
                      {tbl.maxMinutesElapsed < 1
                        ? 'Vừa gọi'
                        : `Chờ ${tbl.maxMinutesElapsed} phút`}
                    </span>
                    {isOver10Min && (
                      <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-black ml-0.5">
                        Quá 10p
                      </span>
                    )}
                  </div>
                </div>

                {/* Danh sách các món ăn của bàn */}
                <div className="py-2.5 space-y-1.5">
                  {tbl.consolidatedDishes.map((dish) => (
                    <div
                      key={dish.name}
                      className="flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono font-black text-amber-400 shrink-0">
                            {dish.quantity}x
                          </span>
                          <span className="font-semibold text-slate-200 truncate">
                            {dish.name}
                          </span>
                        </div>
                        {dish.notes.length > 0 && (
                          <p className="text-[10.5px] text-amber-400/90 italic pl-5 line-clamp-1">
                            Ghi chú: {dish.notes.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Thẻ Bàn: Nút Xem bàn & Nút Ra món nhanh */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-amber-400 transition-colors font-medium text-[11px]">
                    <span>Xem chi tiết bàn</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>

                  {onCompleteTableOrders && (
                    <button
                      type="button"
                      disabled={isCompleting}
                      onClick={(e) =>
                        handleQuickCompleteTable(
                          e,
                          tbl.tableId,
                          Array.from(tbl.orderIds)
                        )
                      }
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                      title="Đánh dấu tất cả món của bàn này đã phục vụ xong"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isCompleting ? 'Đang lưu...' : '✓ Xong tất cả'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* ======================================================== */
          /* TAB 2: TỔNG HỢP THEO MÓN (GIẢM DẦN THEO SỐ LƯỢNG ĐẶT)    */
          /* ======================================================== */
          dishesGroup.map((dish, idx) => {
            const isTopDish = idx === 0 && dish.totalQuantity > 1;

            return (
              <div
                key={dish.dishName}
                className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                  isTopDish
                    ? 'bg-gradient-to-br from-amber-500/10 via-slate-950/70 to-slate-950/70 border-amber-500/40 shadow-md shadow-amber-500/5'
                    : 'bg-slate-950/70 border-slate-800/90'
                }`}
              >
                {/* Header món: Số lượng lớn nổi bật + Tên món */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`text-base font-black px-2.5 py-1 rounded-xl border shrink-0 font-mono ${
                        isTopDish
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      x{dish.totalQuantity}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white tracking-tight truncate flex items-center gap-1.5">
                        <span>{dish.dishName}</span>
                        {isTopDish && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold shrink-0">
                            🔥 Đặt nhiều nhất
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Đang chờ làm ở {dish.tableBreakdown.length} bàn
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono shrink-0">
                    Chờ {dish.maxMinutesElapsed}p
                  </span>
                </div>

                {/* Danh sách các bàn đang đặt món này */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  {dish.tableBreakdown.map((tb) => (
                    <div
                      key={tb.tableId}
                      onClick={() => onSelectTableById(tb.tableId)}
                      className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/60 flex items-center justify-between text-xs cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                          {tb.tableName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-mono text-[11px] font-bold">
                          {tb.quantity} ly
                        </span>
                        {tb.notes.length > 0 && (
                          <span className="text-[10.5px] text-slate-400 italic truncate max-w-[140px]">
                            ({tb.notes.join(', ')})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 group-hover:text-slate-300">
                        <span>Xem bàn</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
