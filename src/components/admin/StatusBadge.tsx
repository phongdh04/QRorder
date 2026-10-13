'use client';

import React from 'react';

export type TableStatusType = 'empty' | 'occupied' | 'pending' | 'preparing';
export type OrderStatusType = 'pending' | 'preparing' | 'served' | 'cancelled';

interface StatusBadgeProps {
  type: 'order' | 'table';
  status: TableStatusType | OrderStatusType | string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ type, status, size = 'sm', className = '' }: StatusBadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  if (type === 'order') {
    switch (status) {
      case 'pending':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/80 ${sizeClass} ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Chờ xác nhận
          </span>
        );
      case 'preparing':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 ${sizeClass} ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Đang làm
          </span>
        );
      case 'served':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 ${sizeClass} ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã phục vụ
          </span>
        );
      case 'cancelled':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 line-through ${sizeClass} ${className}`}
          >
            Đã hủy
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ${sizeClass} ${className}`}
          >
            {status}
          </span>
        );
    }
  }

  // Table status badges
  switch (status) {
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800 animate-pulse ${sizeClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          Có đơn mới
        </span>
      );
    case 'preparing':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 ${sizeClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Đang làm món
        </span>
      );
    case 'occupied':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 ${sizeClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Đang có khách
        </span>
      );
    case 'empty':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${sizeClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Bàn trống
        </span>
      );
  }
}
