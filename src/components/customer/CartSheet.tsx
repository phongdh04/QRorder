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
      setErrorMsg(err.message || 'Lỗi mạng hoặc không thể kết nối tới quầy phục vụ.');
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
            aria-labelledby="cart-sheet-title"
            className="relative z-10 w-full max-w-[500px] bg-[#111318] border-t border-[rgba(212,175,55,0.3)] rounded-t-[32px] overflow-hidden shadow-2xl max-h-[92vh] flex flex-col safe-bottom"
          >
            {/* Drag Handle Bar */}
            <div className="w-full pt-3.5 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-[#D4AF37]/30" />
            </div>

            {/* Header */}
            <div className="px-5 pb-3.5 border-b border-[rgba(212,175,55,0.18)] flex items-center justify-between">
              <div>
                <h2
                  id="cart-sheet-title"
                  className="font-serif text-xl font-bold text-[#F7F4EB] tracking-wide"
                >
                  Giỏ Món Đã Chọn
                </h2>
                <p className="text-[11px] text-[#A8A295] uppercase tracking-wider mt-0.5">
                  {items.length} món sẵn sàng gọi tới Bếp & Bar
                </p>
              </div>

              <button
                onClick={onClose}
                aria-label="Đóng giỏ hàng"
                className="w-10 h-10 rounded-full bg-[#181B22] border border-[rgba(212,175,55,0.2)] text-[#A8A295] hover:text-[#F7F4EB] flex items-center justify-center transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mx-5 mt-3 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0 text-red-400">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Item list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3.5 divide-y divide-[rgba(212,175,55,0.12)]">
              {items.length === 0 ? (
                <div className="py-14 text-center text-[#A8A295] space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#181B22] border border-[rgba(212,175,55,0.2)] mx-auto flex items-center justify-center text-[#D4AF37]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <p className="font-serif text-base text-[#F7F4EB] font-bold">Giỏ hàng đang trống</p>
                  <p className="text-xs">Quý khách hãy chọn những món ngon từ thực đơn Trống Đồng.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.menu_item_id} className="pt-3.5 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-sm font-bold text-[#F7F4EB] tracking-wide leading-snug truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs font-black text-[#F3C766] font-sans mt-0.5">
                          {formatVND(item.price)}
                        </p>
                      </div>

                      {/* Quantity control */}
                      <div className="flex items-center gap-1.5 bg-[#181B22] border border-[rgba(212,175,55,0.2)] rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.menu_item_id, -1)}
                          aria-label="Giảm số lượng"
                          className="w-7 h-7 rounded-lg bg-[#111318] text-[#F7F4EB] hover:text-[#D4AF37] flex items-center justify-center text-sm font-bold select-none transition-colors"
                        >
                          {item.quantity === 1 ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-rose-400">
                              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          ) : (
                            '-'
                          )}
                        </button>

                        <span className="w-6 text-center text-xs font-black font-sans text-[#F7F4EB]">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.menu_item_id, 1)}
                          disabled={item.quantity >= 30}
                          aria-label="Tăng số lượng"
                          className="w-7 h-7 rounded-lg bg-[#111318] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#08090C] flex items-center justify-center text-sm font-bold select-none transition-colors disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Item note */}
                    <input
                      type="text"
                      placeholder="Ghi chú món này (vd: ít cay, chia 2 đĩa...)"
                      value={item.note || ''}
                      onChange={(e) => onUpdateNote(item.menu_item_id, e.target.value)}
                      maxLength={150}
                      className="mt-2 w-full text-xs bg-[#181B22] border border-[rgba(212,175,55,0.18)] rounded-xl px-3 py-1.5 text-[#F7F4EB] placeholder-[#A8A295]/50 focus:outline-none focus:border-[#D4AF37] transition-colors"
                    />
                  </div>
                ))
              )}
            </div>

            {/* General note & Checkout footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-[rgba(212,175,55,0.2)] bg-[#181B22] space-y-3.5">
                {/* General note input */}
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.16em] text-[#D4AF37] font-semibold mb-1">
                    Ghi chú chung cho đơn:
                  </label>
                  <input
                    type="text"
                    placeholder="Yêu cầu chung cho bếp & phục vụ..."
                    value={generalNote}
                    onChange={(e) => onSetGeneralNote(e.target.value)}
                    maxLength={300}
                    className="w-full text-xs bg-[#111318] border border-[rgba(212,175,55,0.2)] rounded-xl px-3.5 py-2 text-[#F7F4EB] placeholder-[#A8A295]/50 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Subtotal */}
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-[#A8A295] uppercase tracking-wider font-semibold">
                    Tổng tiền đợt gọi này:
                  </span>
                  <span className="text-xl font-black text-[#F3C766] font-sans">
                    {formatVND(totalAmount)}
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSendOrder}
                  className="w-full h-13 py-3 rounded-2xl bg-gradient-to-r from-[#F3C766] via-[#D4AF37] to-[#B8922A] text-[#08090C] text-xs uppercase tracking-[0.2em] font-black flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-60 shadow-xl shadow-[#D4AF37]/25"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-[#08090C] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Xác Nhận Gọi Món Ngay</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
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
