'use client';

import React, { useState } from 'react';
import { SkeletonImage } from './SkeletonImage';
import { formatVND } from '@/lib/utils';
import { CustomerPublicItem } from '@/lib/dal/customer';

interface MenuCardProps {
  item: CustomerPublicItem;
  isFeatured?: boolean;
  priority?: boolean;
  menuDisplayMode?: 'photo' | 'minimal';
  onSelect: (item: CustomerPublicItem) => void;
  onQuickAdd?: (item: CustomerPublicItem) => void;
}

export function MenuCard({
  item,
  isFeatured = false,
  priority = false,
  menuDisplayMode = 'photo',
  onSelect,
  onQuickAdd,
}: MenuCardProps) {
  const isAvailable = item.isAvailable;
  const [justAdded, setJustAdded] = useState(false);

  const hasImage = Boolean(item.image?.mediumUrl || item.image?.thumbUrl || item.imageUrl);
  const isTextOnly = menuDisplayMode === 'minimal' || !hasImage;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;

    if (onQuickAdd) {
      onQuickAdd(item);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 800);
    } else {
      onSelect(item);
    }
  };

  // =========================================================================
  // DẠNG 1: THẺ CHỮ SANG TRỌNG (Dành cho quán 'minimal' hoặc món KHÔNG CÓ ẢNH)
  // Chiều cao gọn gàng, nền surface, viền vàng mảnh, tên món serif quý phái
  // Không để ô trống xấu, không phát sinh bất kỳ request ảnh nào!
  // =========================================================================
  if (isTextOnly) {
    return (
      <div
        onClick={() => onSelect(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item);
          }
        }}
        className="menu-card-optimized group relative cursor-pointer p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-black/20 focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)] overflow-hidden"
      >
        {/* Subtle decorative gold left border highlight */}
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-[var(--accent)]/60 via-[var(--accent)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-base sm:text-lg font-medium text-[var(--text)] tracking-wide group-hover:text-[var(--accent)] transition-colors leading-snug">
                {item.name}
              </h3>
              {!isAvailable && (
                <span className="shrink-0 text-[9px] tracking-[0.15em] uppercase text-[var(--muted)] border border-[var(--border)] px-1.5 py-0.5 rounded-full">
                  Hết
                </span>
              )}
            </div>

            {item.description && (
              <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2 leading-relaxed font-light">
                {item.description}
              </p>
            )}

            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--accent)] tracking-wide font-sans">
                {formatVND(item.price)}
              </span>
            </div>
          </div>

          {/* Action "+" button */}
          <button
            type="button"
            disabled={!isAvailable}
            aria-label={`Thêm ${item.name}`}
            onClick={handleAddClick}
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isAvailable
                ? justAdded
                  ? 'bg-emerald-600 text-white scale-110'
                  : 'bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--accent)]/30 group-hover:bg-[var(--accent)] group-hover:text-[#0B0B0C]'
                : 'bg-transparent text-[var(--muted)]/40 border border-[var(--border)] cursor-not-allowed'
            }`}
          >
            {justAdded ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="w-3.5 h-3.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="text-base leading-none font-light select-none">+</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DẠNG 2: THẺ NỔI BẬT LỚN (FEATURED CARD) - Món đầu danh mục ở chế độ 'photo'
  // Dùng biến thể medium (800px), tỷ lệ cố định 4:3 chống CLS, blurDataURL
  // =========================================================================
  if (isFeatured) {
    const featuredSrc = item.image?.mediumUrl || item.imageUrl;
    const blurDataUrl = item.image?.blurDataUrl;

    return (
      <div
        onClick={() => onSelect(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item);
          }
        }}
        className="menu-card-optimized group relative cursor-pointer overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all duration-200 shadow-md shadow-black/40 focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
      >
        {/* Large Image with gradient overlay and fixed 4:3 aspect ratio */}
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          <SkeletonImage
            src={featuredSrc}
            alt={item.name}
            aspectRatio="4/3"
            priority={priority}
            blurDataURL={blurDataUrl}
            sizes="(max-width: 640px) 100vw, 640px"
            grayscale={!isAvailable}
          />

          {/* Vignette Gradient from bottom to top */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/50 to-transparent pointer-events-none" />

          {/* Unavailable Badge */}
          {!isAvailable && (
            <div className="absolute top-3 left-3 bg-[#0B0B0C]/85 backdrop-blur-sm border border-[var(--border)] px-2.5 py-1 rounded-full text-[10px] tracking-[0.2em] uppercase text-[var(--muted)] font-medium">
              Tạm hết
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="p-4 pt-1 flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-medium text-[var(--text)] tracking-wide group-hover:text-[var(--accent)] transition-colors leading-snug">
              {item.name}
            </h3>

            {item.description && (
              <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2 leading-relaxed font-light">
                {item.description}
              </p>
            )}

            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--accent)] tracking-wide font-sans">
                {formatVND(item.price)}
              </span>
            </div>
          </div>

          {/* Action "+" button */}
          <button
            type="button"
            disabled={!isAvailable}
            aria-label={`Thêm ${item.name}`}
            onClick={handleAddClick}
            className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isAvailable
                ? justAdded
                  ? 'bg-emerald-600 text-white scale-110'
                  : 'bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--accent)]/30 group-hover:bg-[var(--accent)] group-hover:text-[#0B0B0C]'
                : 'bg-transparent text-[var(--muted)]/40 border border-[var(--border)] cursor-not-allowed'
            }`}
          >
            {justAdded ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="w-4 h-4"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="text-lg leading-none font-light select-none">+</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DẠNG 3: THẺ HÀNG NGANG (ROW CARD CÓ ẢNH) - Các món tiếp theo ở chế độ 'photo'
  // Dùng biến thể thumb (320px) siêu nhẹ (< 30KB), lazy load
  // =========================================================================
  const thumbSrc = item.image?.thumbUrl || item.imageUrl;
  const blurDataUrl = item.image?.blurDataUrl;

  return (
    <div
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className="menu-card-optimized group cursor-pointer p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/25 transition-all duration-200 flex items-center justify-between gap-3 shadow-xs focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
    >
      {/* Left text column */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-base font-medium text-[var(--text)] tracking-wide group-hover:text-[var(--accent)] transition-colors leading-snug truncate">
            {item.name}
          </h3>
          {!isAvailable && (
            <span className="shrink-0 text-[9px] tracking-[0.15em] uppercase text-[var(--muted)] border border-[var(--border)] px-1.5 py-0.5 rounded-full">
              Hết
            </span>
          )}
        </div>

        {item.description && (
          <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2 leading-relaxed font-light">
            {item.description}
          </p>
        )}

        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--accent)] tracking-wide font-sans">
            {formatVND(item.price)}
          </span>

          {/* Action "+" button */}
          <button
            type="button"
            disabled={!isAvailable}
            aria-label={`Thêm ${item.name}`}
            onClick={handleAddClick}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isAvailable
                ? justAdded
                  ? 'bg-emerald-600 text-white scale-110'
                  : 'bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--accent)]/25 group-hover:bg-[var(--accent)] group-hover:text-[#0B0B0C]'
                : 'bg-transparent text-[var(--muted)]/40 border border-[var(--border)] cursor-not-allowed'
            }`}
          >
            {justAdded ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="w-3.5 h-3.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="text-base leading-none font-light select-none">+</span>
            )}
          </button>
        </div>
      </div>

      {/* Right 4:3 / square image */}
      <div className="shrink-0 w-24 h-20 sm:w-28 sm:h-22 rounded-xl overflow-hidden relative border border-[var(--border)]/50 aspect-[4/3]">
        <SkeletonImage
          src={thumbSrc}
          alt={item.name}
          aspectRatio="4/3"
          priority={false}
          blurDataURL={blurDataUrl}
          sizes="120px"
          grayscale={!isAvailable}
        />
      </div>
    </div>
  );
}
