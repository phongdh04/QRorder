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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(212,175,55,0.15)] border border-[#D4AF37]/40 text-[#F3C766] text-[10px] uppercase tracking-wider font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            Chờ Bếp Nhận
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[10px] uppercase tracking-wider font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
            Đang Chế Biến
          </span>
        );
      case 'served':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[10px] uppercase tracking-wider font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Đã Phục Vụ
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/40 text-rose-300 text-[10px] uppercase tracking-wider font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Đã Hủy
          </span>
        );
      default:
        return <span className="text-xs text-[#A8A295]">{status}</span>;
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
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
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
            className="relative z-10 w-full max-w-[500px] bg-[#111318] border-t border-[rgba(212,175,55,0.3)] rounded-t-[32px] overflow-hidden shadow-2xl max-h-[92vh] flex flex-col safe-bottom"
          >
            {/* Drag Handle Bar */}
            <div className="w-full pt-3.5 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-[#D4AF37]/30" />
            </div>

            {/* Header */}
            <div className="px-5 pb-3.5 border-b border-[rgba(212,175,55,0.18)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    id="orders-sheet-title"
                    className="font-serif text-xl font-bold text-[#F7F4EB] tracking-wide"
                  >
                    Đơn Của Bàn Tôi
                  </h2>
                  {/* Realtime Connection Status Pill */}
                  {isLiveConnected ? (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/25">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Trực tiếp
                    </span>
                  ) : isReconnecting ? (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-500/25">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      Kết nối lại...
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-[#A8A295] uppercase tracking-wider mt-0.5 font-medium">
                  {tableName} • Tiến độ bếp & quầy phục vụ
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  aria-label="Cập nhật danh sách đơn"
                  className="w-10 h-10 rounded-full bg-[#181B22] border border-[rgba(212,175,55,0.2)] text-[#A8A295] hover:text-[#F7F4EB] flex items-center justify-center transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#D4AF37]' : ''}`}
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
                  className="w-10 h-10 rounded-full bg-[#181B22] border border-[rgba(212,175,55,0.2)] text-[#A8A295] hover:text-[#F7F4EB] flex items-center justify-center transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Orders list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {orders.length === 0 ? (
                <div className="py-16 text-center text-[#A8A295] space-y-2">
                  <div className="w-14 h-14 rounded-full bg-[#181B22] border border-[rgba(212,175,55,0.2)] flex items-center justify-center mx-auto text-[#D4AF37]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <p className="font-serif text-base text-[#F7F4EB] font-bold">Bàn chưa gửi đợt món nào</p>
                  <p className="text-xs font-light">
                    Các món quý khách gửi gọi sẽ được cập nhật liên tục tại đây.
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
                      className="p-4 rounded-2xl bg-[#181B22] border border-[rgba(212,175,55,0.2)] space-y-3 shadow-md shadow-black/50"
                    >
                      {/* Order Batch Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider text-[#A8A295] font-semibold">
                          Đợt #{orders.length - idx} • {orderTime}
                        </span>
                        {renderStatusBadge(order.status)}
                      </div>

                      {/* Cancel reason if cancelled */}
                      {order.cancel_reason && (
                        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/40 text-rose-300 text-[11px]">
                          Lý do hủy: {order.cancel_reason}
                        </div>
                      )}

                      <div className="space-y-2 pt-2 border-t border-[rgba(212,175,55,0.12)]">
                        {(order.order_items || order.items || []).map((item: any) => {
                          const itemName = item.name_snapshot || item.name || 'Món';
                          const itemPrice = item.price_snapshot ?? item.price ?? 0;
                          return (
                            <div
                              key={item.id}
                              className="flex justify-between items-start text-xs font-sans"
                            >
                              <div className="flex-1 pr-2">
                                <span className="text-[#F7F4EB] font-medium">
                                  {itemName}{' '}
                                  <span className="text-[#F3C766] font-black">
                                    ×{item.quantity}
                                  </span>
                                </span>
                                {item.note && (
                                  <p className="text-[11px] text-[#A8A295] italic mt-0.5">
                                    Ghi chú: {item.note}
                                  </p>
                                )}
                              </div>
                              <span className="text-[#F3C766] font-bold shrink-0 font-sans">
                                {formatVND(itemPrice * item.quantity)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* General order note */}
                      {order.note && (
                        <p className="text-[11px] text-[#A8A295] pt-2 border-t border-[rgba(212,175,55,0.12)]">
                          <span className="text-[#D4AF37] font-semibold">Ghi chú bàn:</span>{' '}
                          {order.note}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Total session footer */}
            <div className="p-4 px-5 border-t border-[rgba(212,175,55,0.2)] bg-[#111318] flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#A8A295] font-semibold">
                  Tổng tiền tích lũy của bàn
                </p>
                <p className="text-xl font-black text-[#F3C766] font-sans">
                  {formatVND(sessionTotal)}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#181B22] border border-[rgba(212,175,55,0.3)] hover:border-[#D4AF37] text-[#F7F4EB] text-xs uppercase tracking-[0.15em] font-bold transition-colors"
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
