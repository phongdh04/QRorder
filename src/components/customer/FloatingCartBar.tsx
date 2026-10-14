'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatVND } from '@/lib/utils';

interface FloatingCartBarProps {
  totalCount: number;
  totalAmount: number;
  onOpenCart: () => void;
  // Dữ liệu các đơn đã đặt của bàn
  ordersCount?: number;
  orderedItemsCount?: number;
  sessionTotal?: number;
  hasActiveOrders?: boolean;
  onOpenOrders?: () => void;
}

export function FloatingCartBar({
  totalCount,
  totalAmount,
  onOpenCart,
  ordersCount = 0,
  orderedItemsCount = 0,
  sessionTotal = 0,
  hasActiveOrders = false,
  onOpenOrders,
}: FloatingCartBarProps) {
  const hasOrders = ordersCount > 0 || orderedItemsCount > 0;
  const hasCart = totalCount > 0;

  // Nếu cả giỏ hàng và danh sách đơn đã đặt đều trống -> không hiển thị thanh nổi
  if (!hasCart && !hasOrders) {
    return null;
  }

  return (
    <div className="fixed bottom-4 inset-x-0 z-30 max-w-[480px] mx-auto px-4 pointer-events-none safe-bottom space-y-2">
      {/* 1. Nếu khách VỪA CÓ món trong giỏ VỪA ĐÃ CÓ đơn đã đặt trước đó:
             Hiển thị pill nhỏ phía trên để chuyển nhanh sang xem món đã đặt */}
      <AnimatePresence>
        {hasCart && hasOrders && onOpenOrders && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="flex justify-end"
          >
            <button
              type="button"
              onClick={onOpenOrders}
              className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121215]/95 backdrop-blur-xl border border-[var(--accent)]/40 shadow-xl text-xs text-[var(--text)] hover:border-[var(--accent)] transition-all select-none group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-[var(--muted)] group-hover:text-[var(--text)]">
                Đã đặt: <strong className="text-[var(--accent)] font-semibold">{orderedItemsCount} món</strong> ({formatVND(sessionTotal)})
              </span>
              <span className="text-[11px] uppercase tracking-wider text-[var(--accent)] font-bold flex items-center gap-0.5">
                Xem lại
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Thanh nổi chính ở đáy màn hình */}
      <AnimatePresence mode="wait">
        {hasCart ? (
          /* TRƯỜNG HỢP A: Giỏ hàng đang có món -> Hiển thị thanh giỏ hàng để gửi đơn */
          <motion.div
            key="cart-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          >
            <div
              onClick={onOpenCart}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenCart();
                }
              }}
              className="pointer-events-auto cursor-pointer p-3.5 rounded-2xl bg-[#18181C]/95 backdrop-blur-xl border border-[var(--accent)]/40 shadow-2xl shadow-black/80 flex items-center justify-between gap-3 text-[var(--text)] hover:border-[var(--accent)] transition-all select-none"
            >
              {/* Left info */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)] text-[#0B0B0C] flex items-center justify-center text-xs font-bold font-sans shadow-md shadow-[var(--accent)]/20">
                  {totalCount}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] font-medium">
                    Tạm tính giỏ hàng
                  </p>
                  <p className="text-sm font-semibold text-[var(--accent)] font-sans">
                    {formatVND(totalAmount)}
                  </p>
                </div>
              </div>

              {/* Right button */}
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[var(--accent)] text-xs uppercase tracking-[0.15em] font-medium">
                <span>Xem giỏ</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-3.5 h-3.5"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            </div>
          </motion.div>
        ) : hasOrders && onOpenOrders ? (
          /* TRƯỜNG HỢP B: Sau khi đặt xong, giỏ hàng trống -> Hiển thị thanh "Xem các món đã đặt" nổi bật */
          <motion.div
            key="orders-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          >
            <div
              onClick={onOpenOrders}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenOrders();
                }
              }}
              className="pointer-events-auto cursor-pointer p-3.5 rounded-2xl bg-gradient-to-r from-[#18181C]/95 via-[#1A1816]/95 to-[#18181C]/95 backdrop-blur-xl border border-[var(--accent)]/50 shadow-2xl shadow-black/90 flex items-center justify-between gap-3 text-[var(--text)] hover:border-[var(--accent)] transition-all select-none"
            >
              {/* Left info */}
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/40 text-[var(--accent)] flex items-center justify-center text-sm shadow-md">
                  {/* Icon hóa đơn / ly cocktail */}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  {/* Chấm tròn báo trạng thái pha chế */}
                  {hasActiveOrders && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--accent)]" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] font-medium">
                      Bàn đã gọi: {orderedItemsCount} món
                    </p>
                    {hasActiveOrders && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                        Đang làm đồ
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[var(--accent)] font-sans">
                    Tạm tính: {formatVND(sessionTotal)}
                  </p>
                </div>
              </div>

              {/* Right button */}
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-[#0B0B0C] text-xs uppercase tracking-[0.15em] font-bold shadow-md shadow-[var(--accent)]/20 hover:brightness-105 transition-all">
                <span>Xem đơn</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-3.5 h-3.5"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
