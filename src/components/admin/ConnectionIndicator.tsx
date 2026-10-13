'use client';

import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionIndicatorProps {
  status: 'connected' | 'connecting' | 'disconnected';
  className?: string;
}

export function ConnectionIndicator({ status, className = '' }: ConnectionIndicatorProps) {
  const configs = {
    connected: {
      label: 'Đã kết nối',
      dotClass: 'bg-emerald-500 animate-pulse',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      icon: Wifi,
    },
    connecting: {
      label: 'Đang kết nối lại...',
      dotClass: 'bg-amber-500 animate-ping',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      icon: Wifi,
    },
    disconnected: {
      label: 'Mất kết nối',
      dotClass: 'bg-rose-500',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      icon: WifiOff,
    },
  };

  const current = configs[status] || configs.connecting;
  const Icon = current.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${current.badgeClass} ${className}`}
      title={`Trạng thái realtime: ${current.label}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${current.dotClass}`} />
      <span className="hidden sm:inline">{current.label}</span>
      <Icon className="w-3 h-3 sm:hidden" />
    </div>
  );
}
