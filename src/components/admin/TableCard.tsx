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
  colorStatus?: 'gray' | 'green' | 'yellow' | 'orange' | 'red';
  unservedCount: number;
  totalAmount: number;
  openedAt: string | Date | null;
  activeSession: any | null;
  zone?: string | null;
  zone_id?: string | null;
  zoneName?: string | null;
  pos_x?: number | null;
  pos_y?: number | null;
  shape?: string | null;
  capacity?: number | null;
  longestWaitSeconds?: number;
  assignedStaffNames?: string[];
  activeRequests?: any[];
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

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  return `${mins}m${remSec > 0 ? `${remSec}s` : ''}`;
}

export function TableCard({ table, isSelected = false, onClick }: TableCardProps) {
  const elapsed = formatElapsed(table.openedAt);
  const color = table.colorStatus || (table.statusType === 'empty' ? 'gray' : table.statusType === 'pending' ? 'orange' : table.statusType === 'preparing' ? 'yellow' : 'green');

  // Themes based on 5 standard color statuses: Red > Orange > Yellow > Green > Gray
  const colorThemes = {
    red: {
      card: 'bg-red-500/10 border-red-500 hover:border-red-400 ring-2 ring-red-500/50 animate-pulse text-red-100',
      badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
      badgeText: 'Khẩn cấp',
      header: 'text-red-400 font-bold',
      totalText: 'text-red-300 font-bold',
    },
    orange: {
      card: 'bg-orange-500/10 border-orange-500 hover:border-orange-400 ring-1 ring-orange-500/40 animate-pulse text-orange-100',
      badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      badgeText: 'Chờ nhận',
      header: 'text-orange-400 font-bold',
      totalText: 'text-orange-300 font-bold',
    },
    yellow: {
      card: 'bg-amber-500/10 border-amber-500 hover:border-amber-400 text-amber-100',
      badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      badgeText: 'Đang làm',
      header: 'text-amber-400 font-bold',
      totalText: 'text-amber-300 font-bold',
    },
    green: {
      card: 'bg-emerald-500/10 border-emerald-500/60 hover:border-emerald-400 text-emerald-100',
      badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      badgeText: 'Đã phục vụ',
      header: 'text-emerald-300 font-bold',
      totalText: 'text-emerald-300 font-bold',
    },
    gray: {
      card: 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300',
      badge: 'bg-slate-800 text-slate-400 border border-slate-700',
      badgeText: 'Trống',
      header: 'text-slate-200',
      totalText: 'text-slate-400',
    },
  };

  const theme = colorThemes[color] || colorThemes.gray;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between min-h-[148px] cursor-pointer relative shadow-sm hover:shadow-md active:scale-[0.99] ${
        theme.card
      } ${
        isSelected
          ? 'ring-2 ring-blue-500 border-transparent shadow-lg'
          : ''
      }`}
    >
      {/* Top row: Table name & Status badge */}
      <div className="flex items-start justify-between gap-2 w-full">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-base font-bold tracking-tight ${theme.header}`}>
              {table.name}
            </h3>
            {table.longestWaitSeconds && table.longestWaitSeconds > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-0.5 animate-pulse">
                ⏱ {formatWait(table.longestWaitSeconds)}
              </span>
            ) : null}
          </div>
          {elapsed && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{elapsed}</span>
            </div>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
          {theme.badgeText}
        </span>
      </div>

      {/* Middle row: Assigned staff / Unserved items */}
      <div className="mt-2 mb-1 space-y-1 text-xs">
        {table.assignedStaffNames && table.assignedStaffNames.length > 0 ? (
          <div className="text-[11px] text-slate-400 truncate">
            Phụ trách: <span className="text-slate-200 font-medium">{table.assignedStaffNames.join(', ')}</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 italic">Chưa phân công khu</div>
        )}

        {table.colorStatus !== 'gray' ? (
          <div className="flex items-center gap-1.5 text-slate-300">
            <Utensils className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {table.unservedCount > 0 ? (
                <span className="font-semibold text-orange-400">
                  {table.unservedCount} món chưa phục vụ
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">Đã ra đủ món</span>
              )}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 italic">Sẵn sàng nhận khách</span>
        )}
      </div>

      {/* Bottom row: Total amount */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between w-full">
        <span className="text-[11px] text-slate-400">Tạm tính:</span>
        <span className={`text-sm ${theme.totalText}`}>
          {table.totalAmount > 0 ? formatVND(table.totalAmount) : '0đ'}
        </span>
      </div>
    </button>
  );
}
