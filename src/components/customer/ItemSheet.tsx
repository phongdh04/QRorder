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
    }, 400);
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
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
            className="relative z-10 w-full max-w-[480px] bg-[var(--surface)] border-t border-[var(--border)] rounded-t-[28px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col safe-bottom"
          >
            {/* Drag Handle Bar */}
            <div className="w-full pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-[var(--muted)]/30" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Đóng chi tiết món"
              className="absolute top-3 right-3 z-20 w-11 h-11 rounded-full bg-[#0B0B0C]/70 backdrop-blur-md border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] flex items-center justify-center transition-colors"
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

            {/* Sheet Content Scrollable Area */}
            <div className="overflow-y-auto px-5 pb-6 space-y-4">
              {/* Main Image (chỉ hiển thị khi quán ở chế độ 'photo' và món CÓ ảnh) */}
              {menuDisplayMode === 'photo' && (item.image?.largeUrl || item.imageUrl) && (
                <div className="rounded-2xl overflow-hidden border border-[var(--border)] mt-1 aspect-[4/3]">
                  <SkeletonImage
                    src={item.image?.largeUrl || item.imageUrl}
                    alt={item.name}
                    aspectRatio="4/3"
                    blurDataURL={item.image?.blurDataUrl}
                    sizes="(max-width: 480px) 100vw, 480px"
                    grayscale={!item.isAvailable}
                  />
                </div>
              )}

              {/* Title & Status */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2
                    id="item-sheet-title"
                    className="font-serif text-2xl font-medium tracking-wide text-[var(--text)] leading-snug"
                  >
                    {item.name}
                  </h2>
                  {!item.isAvailable && (
                    <span className="shrink-0 text-[10px] tracking-[0.2em] uppercase text-[var(--muted)] border border-[var(--border)] px-2.5 py-1 rounded-full">
                      Tạm hết
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-[var(--accent)] tracking-wide font-sans">
                    {formatVND(item.price)}
                  </span>
                </div>
              </div>

              {/* Subtle divider */}
              <div className="h-[1px] w-full bg-[var(--border)]" />

              {/* Full Description */}
              {item.description ? (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] uppercase tracking-[0.2em] font-medium text-[var(--muted)]">
                    Mô tả hương vị & thành phần
                  </h4>
                  <p className="text-sm text-[var(--text)]/90 leading-relaxed font-sans font-light">
                    {item.description}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)] italic">
                  Đồ uống được pha chế thủ công theo công thức độc quyền của quán.
                </p>
              )}

              {/* Quantity modifier and note input if item is available */}
              {item.isAvailable && (
                <div className="space-y-3 pt-2">
                  {/* Quantity selector */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                    <span className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium">
                      Số lượng phần:
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-full bg-[var(--surface)] text-[var(--text)] flex items-center justify-center font-bold text-sm disabled:opacity-30 transition-opacity"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold font-sans text-sm text-[var(--text)]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                        disabled={quantity >= 20}
                        className="w-8 h-8 rounded-full bg-[var(--surface)] text-[var(--accent)] flex items-center justify-center font-bold text-sm disabled:opacity-30 transition-opacity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Note input */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.15em] text-[var(--muted)] font-medium mb-1">
                      Ghi chú riêng cho món này (tùy chọn):
                    </label>
                    <input
                      type="text"
                      placeholder="vd: ít ngọt, nhiều đá, kèm chanh..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={150}
                      className="w-full text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)] placeholder-[var(--muted)]/60 focus:outline-none focus:border-[var(--accent)]"
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
                    className={`w-full h-12 rounded-xl text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99] ${
                      isAddedFeedback
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[var(--accent)] text-[#0B0B0C] hover:brightness-105 shadow-[var(--accent)]/15'
                    }`}
                  >
                    {isAddedFeedback ? (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="w-4 h-4"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Đã Thêm Vào Giỏ</span>
                      </>
                    ) : (
                      <>
                        <span>Thêm Vào Giỏ Hàng</span>
                        <span>•</span>
                        <span className="font-sans font-bold">{formatVND(item.price * quantity)}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full h-12 rounded-xl bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)] text-xs font-medium uppercase tracking-[0.15em] flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                  >
                    <span>Món hiện đang tạm hết</span>
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
