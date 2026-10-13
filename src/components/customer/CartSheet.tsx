'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { formatVND } from '@/lib/utils';
import { CartItem } from '@/hooks/useCart';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tableToken: string;
  items: CartItem[];
  generalNote: string;
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onUpdateNote: (menuItemId: string, note: string) => void;
  onSetGeneralNote: (note: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (orderData: any) => void;
}

export function CartSheet({
  isOpen,
  onClose,
  tableToken,
  items,
  generalNote,
  onUpdateQuantity,
  onUpdateNote,
  onSetGeneralNote,
  onClearCart,
  onOrderSuccess,
}: CartSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Khóa cuộn trang khi mở
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 70 || info.velocity.y > 400) {
      onClose();
    }
  };

  const handleSendOrder = async () => {
    if (items.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tableToken,
          items: items.map((i) => ({
            menu_item_id: i.menu_item_id,
            quantity: i.quantity,
            note: i.note || null,
          })),
          note: generalNote || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo đơn gọi món.');
      }

      // Xóa giỏ hàng và kích hoạt modal thành công
      onClearCart();
      onClose();
      onOrderSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi mạng hoặc không thể kết nối tới quầy bar.');
    } finally {
      setIsSubmitting(false);
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
            aria-labelledby="cart-sheet-title"
            className="relative z-10 w-full max-w-[480px] bg-[var(--surface)] border-t border-[var(--border)] rounded-t-[28px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col safe-bottom"
          >
            {/* Drag Handle Bar */}
            <div className="w-full pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-[var(--muted)]/30" />
            </div>

            {/* Header */}
            <div className="px-5 pb-3 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2
                  id="cart-sheet-title"
                  className="font-serif text-xl font-medium text-[var(--text)] tracking-wide"
                >
                  Giỏ Gọi Món
                </h2>
                <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mt-0.5">
                  {items.length} loại món trong giỏ
                </p>
              </div>

              <button
                onClick={onClose}
                aria-label="Đóng giỏ hàng"
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

            {/* Error Banner */}
            {errorMsg && (
              <div className="mx-5 mt-3 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4 shrink-0 text-red-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Item list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3.5 divide-y divide-[var(--border)]">
              {items.length === 0 ? (
                <div className="py-12 text-center text-[var(--muted)] space-y-1">
                  <p className="font-serif text-base text-[var(--text)]">Giỏ hàng đang trống</p>
                  <p className="text-xs">Hãy chọn món đồ uống yêu thích từ thực đơn.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.menu_item_id} className="pt-3.5 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-sm font-medium text-[var(--text)] tracking-wide leading-snug truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs font-semibold text-[var(--accent)] font-sans mt-0.5">
                          {formatVND(item.price)}
                        </p>
                      </div>

                      {/* Quantity control */}
                      <div className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-full p-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.menu_item_id, -1)}
                          aria-label="Giảm số lượng"
                          className="w-7 h-7 rounded-full bg-[var(--surface)] text-[var(--text)] hover:text-[var(--accent)] flex items-center justify-center text-sm font-light select-none transition-colors"
                        >
                          {item.quantity === 1 ? (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="w-3.5 h-3.5 text-rose-400"
                            >
                              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          ) : (
                            '-'
                          )}
                        </button>

                        <span className="w-5 text-center text-xs font-bold font-sans text-[var(--text)]">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.menu_item_id, 1)}
                          disabled={item.quantity >= 20}
                          aria-label="Tăng số lượng"
                          className="w-7 h-7 rounded-full bg-[var(--surface)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[#0B0B0C] flex items-center justify-center text-sm font-light select-none transition-colors disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Item note */}
                    <input
                      type="text"
                      placeholder="Ghi chú món này (vd: ít đá, không đường...)"
                      value={item.note || ''}
                      onChange={(e) => onUpdateNote(item.menu_item_id, e.target.value)}
                      maxLength={150}
                      className="mt-2 w-full text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-[var(--text)] placeholder-[var(--muted)]/60 focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                    />
                  </div>
                ))
              )}
            </div>

            {/* General note & Checkout footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-[var(--border)] bg-[var(--surface-2)] space-y-3">
                {/* General note input */}
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-[var(--muted)] font-medium mb-1">
                    Ghi chú chung cho đơn
                  </label>
                  <input
                    type="text"
                    placeholder="Yêu cầu chung cho quầy bar..."
                    value={generalNote}
                    onChange={(e) => onSetGeneralNote(e.target.value)}
                    maxLength={300}
                    className="w-full text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] placeholder-[var(--muted)]/60 focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                {/* Subtotal */}
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-[var(--muted)] uppercase tracking-wider font-medium">
                    Tổng tiền đợt gọi:
                  </span>
                  <span className="text-lg font-bold text-[var(--accent)] font-sans">
                    {formatVND(totalAmount)}
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSendOrder}
                  className="w-full h-12 rounded-xl bg-[var(--accent)] text-[#0B0B0C] text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60 shadow-lg shadow-[var(--accent)]/15"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-[#0B0B0C] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Gửi Gọi Món Tới Quầy Bar</span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-4 h-4"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
