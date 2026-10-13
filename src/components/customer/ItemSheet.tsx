'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { SkeletonImage } from './SkeletonImage';
import { formatVND } from '@/lib/utils';
import { CustomerPublicItem } from '@/lib/dal/customer';

interface ItemSheetProps {
  item: CustomerPublicItem | null;
  onClose: () => void;
}

export function ItemSheet({ item, onClose }: ItemSheetProps) {
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
    // Nếu kéo xuống quá 70px hoặc vận tốc kéo xuống nhanh -> đóng sheet
    if (info.offset.y > 70 || info.velocity.y > 400) {
      onClose();
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
              {/* Main Image */}
              <div className="rounded-2xl overflow-hidden border border-[var(--border)] mt-1">
                <SkeletonImage
                  src={item.imageUrl}
                  alt={item.name}
                  aspectRatio="4/3"
                  grayscale={!item.isAvailable}
                />
              </div>

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

              {/* Action Button (Disabled for Phase 1 as requested) */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled
                  className="w-full h-12 rounded-xl bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)] text-xs font-medium uppercase tracking-[0.15em] flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                >
                  <span>Chức năng gọi món sẽ mở ở bước tiếp theo</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
