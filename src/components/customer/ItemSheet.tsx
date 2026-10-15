'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { SkeletonImage } from './SkeletonImage';
import { formatVND } from '@/lib/utils';
import { CustomerPublicItem } from '@/lib/dal/customer';

interface ItemSheetProps {
  item: CustomerPublicItem | null;
  menuDisplayMode?: 'photo' | 'minimal';
  onClose: () => void;
  onAddToCart?: (item: CustomerPublicItem, quantity: number, note?: string) => void;
}

const QUICK_NOTES = ['Ít cay', 'Không cay', 'Không hành', 'Nhiều đá', 'Ít đá', 'Mang đồ nhanh'];

export function ItemSheet({
  item,
  menuDisplayMode = 'photo',
  onClose,
  onAddToCart,
}: ItemSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  // Reset state mỗi khi mở món mới
  useEffect(() => {
    if (item) {
      setQuantity(1);
      setNote('');
      setIsAddedFeedback(false);
    }
  }, [item]);

  // Khóa cuộn trang khi bottom sheet mở & hỗ trợ phím Escape
  useEffect(() => {
    if (item) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [item, onClose]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 70 || info.velocity.y > 400) {
      onClose();
    }
  };

  const handleAdd = () => {
    if (!item || !item.isAvailable || !onAddToCart) return;
    onAddToCart(item, quantity, note);
    setIsAddedFeedback(true);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  const handleToggleQuickNote = (tag: string) => {
    if (note.includes(tag)) {
      setNote(note.replace(tag, '').replace(/,\s*,/g, ',').trim());
    } else {
      setNote(note ? `${note}, ${tag}` : tag);
    }
  };

  return (
    <AnimatePresence>
      {item && (
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

          {/* Bottom Sheet Modal */}
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
            aria-labelledby="item-sheet-title"
            className="relative z-10 w-full max-w-[500px] bg-[#111318] border-t border-[rgba(212,175,55,0.3)] rounded-t-[32px] overflow-hidden shadow-2xl max-h-[92vh] flex flex-col safe-bottom"
          >
            {/* Drag Handle Bar */}
            <div className="w-full pt-3.5 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-[#D4AF37]/30" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Đóng chi tiết món"
              className="absolute top-3.5 right-3.5 z-20 w-10 h-10 rounded-full bg-[#08090C]/80 backdrop-blur-md border border-[rgba(212,175,55,0.3)] text-[#A8A295] hover:text-[#F7F4EB] flex items-center justify-center transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Sheet Content Scrollable Area */}
            <div className="overflow-y-auto px-5 pb-6 space-y-4">
              {/* Main Image */}
              {menuDisplayMode === 'photo' && (item.image?.largeUrl || item.imageUrl) && (
                <div className="rounded-2xl overflow-hidden border border-[rgba(212,175,55,0.25)] mt-1 shadow-lg shadow-black/60 relative">
                  <SkeletonImage
                    src={item.image?.largeUrl || item.imageUrl}
                    alt={item.name}
                    aspectRatio="16/9"
                    grayscale={!item.isAvailable}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-transparent to-transparent pointer-events-none" />
                </div>
              )}

              {/* Title & Status */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2
                    id="item-sheet-title"
                    className="font-serif text-2xl font-bold tracking-wide text-[#F7F4EB] leading-snug"
                  >
                    {item.name}
                  </h2>
                  {!item.isAvailable && (
                    <span className="shrink-0 text-[10px] tracking-[0.2em] uppercase text-rose-400 border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 rounded-full font-bold">
                      Tạm hết
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#F3C766] tracking-wide font-sans">
                    {formatVND(item.price)}
                  </span>
                  <span className="text-xs text-[#A8A295]">• Đã bao gồm phục vụ</span>
                </div>
              </div>

              {/* Subtle gold divider */}
              <div className="divider-champagne" />

              {/* Full Description */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37]">
                  Mô tả hương vị & nguyên liệu
                </h4>
                <p className="text-xs sm:text-sm text-[#F7F4EB]/90 leading-relaxed font-sans font-light">
                  {item.description || 'Món ăn đặc sắc được các đầu bếp Trống Đồng Station chế biến theo công thức độc quyền.'}
                </p>
              </div>

              {/* Quantity modifier and note input if item is available */}
              {item.isAvailable && (
                <div className="space-y-3.5 pt-2">
                  {/* Quantity selector */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#181B22] border border-[rgba(212,175,55,0.2)]">
                    <span className="text-xs uppercase tracking-wider text-[#A8A295] font-semibold">
                      Số lượng phần ăn:
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-9 h-9 rounded-xl bg-[#111318] border border-[rgba(212,175,55,0.3)] text-[#F7F4EB] flex items-center justify-center font-bold text-base disabled:opacity-30 active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-black font-sans text-base text-[#F3C766]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(30, q + 1))}
                        disabled={quantity >= 30}
                        className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8922A] text-[#08090C] flex items-center justify-center font-black text-base disabled:opacity-30 active:scale-95 transition-all shadow-md"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Quick Note Presets */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.16em] text-[#A8A295] font-semibold mb-1.5">
                      Yêu cầu chế biến (chọn nhanh):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_NOTES.map((tag) => {
                        const isSelected = note.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleQuickNote(tag)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-[#D4AF37] text-[#08090C] font-semibold shadow-sm'
                                : 'bg-[#181B22] text-[#A8A295] hover:text-[#F7F4EB] border border-[rgba(212,175,55,0.15)]'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Note input */}
                  <div>
                    <input
                      type="text"
                      placeholder="Ghi chú thêm cho Bếp & Bar (vd: chín kỹ, không tương ớt...)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={150}
                      className="w-full text-xs bg-[#181B22] border border-[rgba(212,175,55,0.2)] rounded-xl px-3.5 py-2.5 text-[#F7F4EB] placeholder-[#A8A295]/50 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                {item.isAvailable ? (
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={isAddedFeedback}
                    className={`w-full h-13 py-3 rounded-2xl text-xs uppercase tracking-[0.2em] font-extrabold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.99] ${
                      isAddedFeedback
                        ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                        : 'bg-gradient-to-r from-[#F3C766] via-[#D4AF37] to-[#B8922A] text-[#08090C] hover:brightness-110 shadow-[#D4AF37]/25'
                    }`}
                  >
                    {isAddedFeedback ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Đã Thêm Vào Giỏ Hàng</span>
                      </>
                    ) : (
                      <>
                        <span>Thêm Vào Giỏ Hàng</span>
                        <span>•</span>
                        <span className="font-sans font-black text-sm">{formatVND(item.price * quantity)}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full h-12 rounded-2xl bg-[#181B22] text-[#A8A295] border border-[rgba(212,175,55,0.15)] text-xs font-semibold uppercase tracking-[0.15em] flex items-center justify-center cursor-not-allowed opacity-80"
                  >
                    <span>Món Hiện Đang Tạm Hết</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
