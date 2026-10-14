'use client';

import React from 'react';
import { Clock, Utensils, DollarSign } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { StatusBadge, TableStatusType } from './StatusBadge';

export interface TableItemData {
  id: string;
  name: string;
  token: string;
  is_active: boolean;
  statusType: TableStatusType;
  unservedCount: number;
  totalAmount: number;
  openedAt: string | Date | null;
  activeSession: any | null;
  zone?: string | null;
  pos_x?: number | null;
  pos_y?: number | null;
  shape?: string | null;
  capacity?: number | null;
}

interface TableCardProps {
  table: TableItemData;
  isSelected?: boolean;
  onClick: () => void;
}

function formatElapsed(openedAt: string | Date | null): string {
  if (!openedAt) return '';
  const start = new Date(openedAt).getTime();
  const diffMinutes = Math.max(0, Math.floor((Date.now() - start) / 60000));
  if (diffMinutes < 1) return 'Vừa mở';
  if (diffMinutes < 60) return `${diffMinutes} phút`;
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
}

export function TableCard({ table, isSelected = false, onClick }: TableCardProps) {
  const elapsed = formatElapsed(table.openedAt);

  // Card themes based on table status
  const cardThemes = {
    empty: {
      card: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300',
      header: 'text-slate-700 dark:text-slate-200',
      totalText: 'text-slate-400 dark:text-slate-500',
    },
    occupied: {
      card: 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 hover:border-blue-400 text-slate-800 dark:text-slate-200',
      header: 'text-blue-950 dark:text-blue-200 font-bold',
      totalText: 'text-blue-700 dark:text-blue-300 font-bold',
    },
    pending: {
      card: 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-400 dark:border-orange-600 hover:border-orange-500 ring-2 ring-orange-400/40 dark:ring-orange-500/30 animate-pulse text-slate-900 dark:text-slate-100',
      header: 'text-orange-950 dark:text-orange-200 font-bold',
      totalText: 'text-orange-700 dark:text-orange-400 font-bold',
    },
    preparing: {
      card: 'bg-amber-50/60 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800 hover:border-amber-400 text-slate-900 dark:text-slate-100',
      header: 'text-amber-950 dark:text-amber-200 font-bold',
      totalText: 'text-amber-700 dark:text-amber-400 font-bold',
    },
  };

  const theme = cardThemes[table.statusType] || cardThemes.empty;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between min-h-[142px] cursor-pointer relative shadow-sm hover:shadow-md active:scale-[0.99] ${
        theme.card
      } ${
        isSelected
          ? 'ring-2 ring-blue-600 dark:ring-blue-500 border-transparent shadow-lg'
          : ''
      }`}
    >
      {/* Top row: Table name & Status badge */}
      <div className="flex items-start justify-between gap-2 w-full">
        <div>
          <h3 className={`text-base font-bold tracking-tight ${theme.header}`}>
            {table.name}
          </h3>
          {elapsed && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{elapsed}</span>
            </div>
          )}
        </div>
        <StatusBadge type="table" status={table.statusType} size="sm" />
      </div>

      {/* Middle row: Unserved items indicator */}
      <div className="mt-2.5 mb-1 flex items-center justify-between text-xs">
        {table.statusType !== 'empty' ? (
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Utensils className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {table.unservedCount > 0 ? (
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {table.unservedCount} món chưa phục vụ
                </span>
              ) : (
                <span className="text-slate-400">Đã ra đủ món</span>
              )}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Sẵn sàng nhận khách</span>
        )}
      </div>

      {/* Bottom row: Total amount */}
      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between w-full">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">Tạm tính:</span>
        <span className={`text-sm ${theme.totalText}`}>
          {table.totalAmount > 0 ? formatVND(table.totalAmount) : '0đ'}
        </span>
      </div>
    </button>
  );
}
