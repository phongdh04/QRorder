'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { formatVND } from '@/lib/utils';

interface TableOrdersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  sessionTotal: number;
  orders: any[];
  isLiveConnected: boolean;
  isReconnecting: boolean;
  onRefresh: () => Promise<void>;
}

export function TableOrdersSheet({
  isOpen,
  onClose,
  tableName,
  sessionTotal,
  orders,
  isLiveConnected,
  isReconnecting,
  onRefresh,
}: TableOrdersSheetProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 70 || info.velocity.y > 400) {
      onClose();
    }
  };

  // Helper hiển thị huy hiệu trạng thái đơn
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(201,169,106,0.12)] border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] uppercase tracking-wider font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Chờ xác nhận
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/40 border border-sky-500/30 text-sky-400 text-[10px] uppercase tracking-wider font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" />
            Đang pha chế
          </span>
        );
      case 'served':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase tracking-wider font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Đã phục vụ
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-400 text-[10px] uppercase tracking-wider font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Đã hủy
          </span>
        );
      default:
        return <span className="text-xs text-[var(--muted)]">{status}</span>;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-labelledby="orders-sheet-title"
            className="relative z-10 w-full max-w-[480px] bg-[var(--surface)] border-t border-[var(--border)] rounded-t-[28px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col safe-bottom"
          >
            {/* Drag Handle Bar */}
            <div className="w-full pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-[var(--muted)]/30" />
            </div>

            {/* Header */}
            <div className="px-5 pb-3 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    id="orders-sheet-title"
                    className="font-serif text-xl font-medium text-[var(--text)] tracking-wide"
                  >
                    Đơn Của Bàn Tôi
                  </h2>
                  {/* Realtime Connection Status Pill */}
                  {isLiveConnected ? (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Trực tiếp
                    </span>
                  ) : isReconnecting ? (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      Kết nối lại...
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mt-0.5">
                  {tableName} • Tiến độ pha chế theo thời gian thực
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  aria-label="Cập nhật danh sách đơn"
                  className="w-10 h-10 rounded-full bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] flex items-center justify-center transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[var(--accent)]' : ''}`}
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                </button>

                <button
                  onClick={onClose}
                  aria-label="Đóng danh sách đơn"
                  className="w-10 h-10 rounded-full bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] flex items-center justify-center transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="w-5 h-5"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Orders list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {orders.length === 0 ? (
                <div className="py-16 text-center text-[var(--muted)] space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--muted)]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-6 h-6"
                    >
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <p className="font-serif text-base text-[var(--text)]">Bàn chưa gửi đơn nào</p>
                  <p className="text-xs font-light">
                    Các món quý khách vừa gửi gọi sẽ hiển thị ngay tại đây.
                  </p>
                </div>
              ) : (
                orders.map((order, idx) => {
                  const orderTime = new Date(order.created_at).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3"
                    >
                      {/* Order Batch Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium">
                          Đợt gọi #{orders.length - idx} • {orderTime}
                        </span>
                        {renderStatusBadge(order.status)}
                      </div>

                      {/* Cancel reason if cancelled */}
                      {order.cancel_reason && (
                        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/40 text-rose-300 text-[11px]">
                          Lý do hủy: {order.cancel_reason}
                        </div>
                      )}

                      {/* Items in this order */}
                      <div className="space-y-2 pt-1 border-t border-[var(--border)]">
                        {(order.order_items || order.items || []).map((item: any) => {
                          const itemName = item.name_snapshot || item.name || 'Món';
                          const itemPrice = item.price_snapshot ?? item.price ?? 0;
                          return (
                            <div
                              key={item.id}
                              className="flex justify-between items-start text-xs font-sans"
                            >
                              <div className="flex-1 pr-2">
                                <span className="text-[var(--text)] font-medium">
                                  {itemName}{' '}
                                  <span className="text-[var(--accent)] font-bold">
                                    ×{item.quantity}
                                  </span>
                                </span>
                                {item.note && (
                                  <p className="text-[11px] text-[var(--muted)] italic mt-0.5">
                                    Ghi chú: {item.note}
                                  </p>
                                )}
                              </div>
                              <span className="text-[var(--muted)] font-medium shrink-0">
                                {formatVND(itemPrice * item.quantity)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* General order note */}
                      {order.note && (
                        <p className="text-[11px] text-[var(--muted)] pt-2 border-t border-[var(--border)]/60">
                          <span className="text-[var(--text)] font-medium">Ghi chú bàn:</span>{' '}
                          {order.note}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Total session footer */}
            <div className="p-4 px-5 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] font-medium">
                  Tổng tạm tính bàn hiện tại
                </p>
                <p className="text-lg font-bold text-[var(--accent)] font-sans">
                  {formatVND(sessionTotal)}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent)]/40 text-[var(--text)] text-xs uppercase tracking-[0.15em] font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
