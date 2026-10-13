'use client';

import React from 'react';
import { Bell, X, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'order' | 'success' | 'error' | 'info';
  title: string;
  message: string;
  tableId?: string;
}

interface AdminToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  onOpenTable?: (tableId: string) => void;
}

export function AdminToastContainer({ toasts, onDismiss, onOpenTable }: AdminToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3.5 flex items-start gap-3 transition-all animate-in slide-in-from-right duration-200"
        >
          {/* Icon */}
          <div className="p-2 rounded-xl shrink-0 mt-0.5 bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
            {toast.type === 'order' && <Bell className="w-4 h-4 animate-bounce" />}
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
            {toast.type === 'info' && <Bell className="w-4 h-4 text-blue-600" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {toast.title}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {toast.message}
            </p>

            {toast.tableId && onOpenTable && (
              <button
                type="button"
                onClick={() => {
                  onOpenTable(toast.tableId!);
                  onDismiss(toast.id);
                }}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Mở chi tiết bàn</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
