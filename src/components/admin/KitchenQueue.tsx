'use client';

import React from 'react';
import { ChefHat, Clock, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { StatusBadge, OrderStatusType } from './StatusBadge';

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
  isLoading?: boolean;
}

export function KitchenQueue({
  items,
  onSelectTableById,
  onQuickConfirmOrder,
  isLoading = false,
}: KitchenQueueProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Món Cần Làm
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Màn hình quầy bar / pha chế
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {items.length} món
        </span>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[calc(100vh-280px)]">
        {isLoading && items.length === 0 ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <ChefHat className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Không có món nào đang chờ
            </p>
            <p className="text-[11px] text-slate-400">
              Khi khách gọi món mới, danh sách sẽ tự động xuất hiện tại đây.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isOver10Min = item.minutesElapsed >= 10;

            return (
              <div
                key={item.id}
                onClick={() => onSelectTableById(item.tableId)}
                className={`p-3 rounded-xl border transition-all cursor-pointer group hover:shadow-md ${
                  isOver10Min
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900 hover:border-rose-400'
                    : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-blue-300'
                }`}
              >
                {/* Top: Tên món x số lượng & Bàn */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                        {item.quantity}x
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.name}
                      </span>
                    </div>

                    {/* Ghi chú món */}
                    {item.itemNote && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 italic">
                        Ghi chú: {item.itemNote}
                      </p>
                    )}
                  </div>

                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700">
                    {item.tableName}
                  </span>
                </div>

                {/* Bottom: Thời gian chờ & Nút chuyển nhanh */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div
                    className={`flex items-center gap-1 font-semibold ${
                      isOver10Min
                        ? 'text-rose-600 dark:text-rose-400 font-bold animate-pulse'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isOver10Min ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    ) : (
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    )}
                    <span>
                      {item.minutesElapsed < 1
                        ? 'Vừa gọi'
                        : `Chờ ${item.minutesElapsed} phút`}
                    </span>
                    {isOver10Min && (
                      <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold ml-1">
                        Quá 10p
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 opacity-90 group-hover:opacity-100 font-semibold text-[11px]">
                    <span>Xem bàn</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
