'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatVND } from '@/lib/utils';

interface OrderSuccessModalProps {
  orderData: {
    order?: {
      id: string;
      total: number;
      createdAt: string;
    };
    sessionTotal?: number;
  } | null;
  onClose: () => void;
  onViewOrders: () => void;
}

export function OrderSuccessModal({
  orderData,
  onClose,
  onViewOrders,
}: OrderSuccessModalProps) {
  if (!orderData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal card */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-sm rounded-[28px] bg-[var(--surface)] border border-[var(--accent)]/30 p-6 text-center space-y-5 shadow-2xl shadow-black/80 overflow-hidden"
        >
          {/* Subtle ambient light */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-44 h-24 bg-[var(--accent)]/15 blur-2xl pointer-events-none" />

          {/* Success Icon */}
          <div className="relative w-16 h-16 rounded-full bg-[var(--surface-2)] border border-[var(--accent)]/40 flex items-center justify-center mx-auto text-[var(--accent)] shadow-lg shadow-[var(--accent)]/10">
            <motion.svg
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', damping: 15 }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-medium tracking-wide text-[var(--text)]">
              Đã Tiếp Nhận Đơn
            </h3>
            <div className="h-[1px] w-12 bg-[var(--accent)]/40 mx-auto" />
            <p className="text-xs text-[var(--muted)] leading-relaxed font-light">
              Yêu cầu của quý khách đã được chuyển tới quầy bar. Nhân viên pha chế sẽ chuẩn bị món ngay.
            </p>
          </div>

          {/* Order Snapshot summary */}
          {orderData.order && (
            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-1.5 text-left">
              <div className="flex justify-between items-center text-[var(--muted)]">
                <span>Số tiền đợt gọi:</span>
                <span className="font-semibold text-[var(--accent)] font-sans">
                  {formatVND(orderData.order.total)}
                </span>
              </div>
              {orderData.sessionTotal !== undefined && (
                <div className="flex justify-between items-center text-[var(--muted)] pt-1 border-t border-[var(--border)]">
                  <span>Tổng tạm tính bàn:</span>
                  <span className="font-semibold text-[var(--text)] font-sans">
                    {formatVND(orderData.sessionTotal)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewOrders();
              }}
              className="w-full h-11 rounded-xl bg-[var(--accent)] text-[#0B0B0C] text-xs uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.99] transition-all shadow-md shadow-[var(--accent)]/15"
            >
              <span>Xem Đơn Của Bàn Tôi</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-10 rounded-xl bg-transparent text-[var(--muted)] hover:text-[var(--text)] text-xs uppercase tracking-[0.15em] font-medium transition-colors"
            >
              Tiếp tục xem thực đơn
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
