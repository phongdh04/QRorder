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
          className="relative z-10 w-full max-w-sm rounded-[32px] bg-[#111318] border border-[#D4AF37]/40 p-6 text-center space-y-5 shadow-2xl shadow-black/90 overflow-hidden"
        >
          {/* Subtle ambient light */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-28 bg-[#D4AF37]/20 blur-2xl pointer-events-none" />

          {/* Success Icon */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#1E222B] to-[#111318] border-2 border-[#D4AF37] flex items-center justify-center mx-auto text-[#F3C766] shadow-xl shadow-[#D4AF37]/20">
            <motion.svg
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', damping: 15 }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-bold tracking-wide text-gold-gradient">
              Đã Tiếp Nhận Đơn Gọi
            </h3>
            <div className="divider-champagne w-24 mx-auto my-2" />
            <p className="text-xs text-[#A8A295] leading-relaxed font-light">
              Yêu cầu của quý khách đã được chuyển tới Bếp & Quầy phục vụ Trống Đồng. Các món đang được khẩn trương chế biến.
            </p>
          </div>

          {/* Order Snapshot summary */}
          {orderData.order && (
            <div className="p-4 rounded-2xl bg-[#181B22] border border-[rgba(212,175,55,0.2)] text-xs space-y-2 text-left">
              <div className="flex justify-between items-center text-[#A8A295]">
                <span>Đợt gọi này:</span>
                <span className="font-bold text-[#F3C766] font-sans">
                  {formatVND(orderData.order.total)}
                </span>
              </div>
              {orderData.sessionTotal !== undefined && (
                <div className="flex justify-between items-center text-[#A8A295] pt-1.5 border-t border-[rgba(212,175,55,0.15)]">
                  <span>Tổng tạm tính bàn:</span>
                  <span className="font-black text-[#F7F4EB] font-sans text-sm">
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
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#F3C766] via-[#D4AF37] to-[#B8922A] text-[#08090C] text-xs uppercase tracking-[0.18em] font-black flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-[#D4AF37]/20"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Xem Các Món Đã Đặt</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-10 rounded-xl bg-transparent text-[#A8A295] hover:text-[#F7F4EB] text-xs uppercase tracking-[0.15em] font-medium transition-colors"
            >
              Tiếp tục gọi thêm món
            </button>
          </div>

          <p className="text-[11px] text-[var(--muted)]/80 font-light pt-1">
            💡 Bạn có thể xem lại chi tiết các món đã gọi bất kỳ lúc nào qua thanh trạng thái ở đáy màn hình.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
