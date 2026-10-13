'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatVND } from '@/lib/utils';

interface FloatingCartBarProps {
  totalCount: number;
  totalAmount: number;
  onOpenCart: () => void;
}

export function FloatingCartBar({
  totalCount,
  totalAmount,
  onOpenCart,
}: FloatingCartBarProps) {
  return (
    <AnimatePresence>
      {totalCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="fixed bottom-4 inset-x-0 z-30 max-w-[480px] mx-auto px-4 pointer-events-none safe-bottom"
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
      )}
    </AnimatePresence>
  );
}
