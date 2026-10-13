'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/utils';
import { CartItem } from '@/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onUpdateNote: (menuItemId: string, note: string) => void;
  onClearCart: () => void;
  onPlaceOrder: (orderNote: string) => Promise<void>;
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onUpdateNote,
  onClearCart,
  onPlaceOrder,
}: CartDrawerProps) {
  const [orderNote, setOrderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onPlaceOrder(orderNote);
      setOrderNote('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể gửi đơn gọi món.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="relative z-10 w-full max-w-lg mt-auto md:mt-0 bg-[#0c101a] border-t md:border-l border-slate-800 rounded-t-3xl md:rounded-none md:h-full flex flex-col max-h-[90vh] md:max-h-full shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Giỏ Gọi Món</h3>
                  <p className="text-xs text-slate-400">{cart.length} loại món đã chọn</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={onClearCart}
                    className="p-2 text-slate-400 hover:text-rose-400 transition-colors text-xs flex items-center gap-1"
                    title="Xóa tất cả"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Xóa hết</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Items list */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 divide-y divide-slate-800/50">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingBag className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm">Giỏ hàng của bạn đang trống.</p>
                  <p className="text-xs text-slate-500 mt-1">Hãy chọn đồ uống yêu thích trong thực đơn nhé!</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.menuItemId} className="pt-3 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-100 text-sm leading-snug">{item.name}</h4>
                        <p className="text-amber-400 text-xs font-semibold mt-0.5">
                          {formatVND(item.price)}
                        </p>
                      </div>

                      {/* Quantity control */}
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                        <button
                          onClick={() => onUpdateQuantity(item.menuItemId, -1)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.menuItemId, 1)}
                          className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note input per item */}
                    <input
                      type="text"
                      placeholder="Ghi chú món (vd: ít ngọt, nhiều đá...)"
                      value={item.note || ''}
                      onChange={(e) => onUpdateNote(item.menuItemId, e.target.value)}
                      className="mt-2 w-full text-xs bg-slate-900/60 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Footer with checkout */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
                {/* General order note */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Ghi chú cho quầy bar (tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Ghi chú chung cho toàn bộ đơn..."
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-slate-400 font-medium">Tạm tính đơn này:</span>
                  <span className="text-lg font-bold text-amber-400">{formatVND(totalAmount)}</span>
                </div>

                {/* Submit button */}
                <Button
                  variant="gold"
                  className="w-full py-3 h-12 text-sm font-bold gap-2"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi Gọi Món Tới Quầy Bar</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
