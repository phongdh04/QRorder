'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SkeletonImage } from './SkeletonImage';
import { formatVND } from '@/lib/utils';
import { CustomerPublicItem } from '@/lib/dal/customer';

interface MenuCardProps {
  item: CustomerPublicItem;
  isFeatured?: boolean;
  priority?: boolean;
  onSelect: (item: CustomerPublicItem) => void;
  onQuickAdd?: (item: CustomerPublicItem) => void;
}

export function MenuCard({
  item,
  isFeatured = false,
  priority = false,
  onSelect,
  onQuickAdd,
}: MenuCardProps) {
  const isAvailable = item.isAvailable;
  const [justAdded, setJustAdded] = useState(false);

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

  // DẠNG 1: THẺ NỔI BẬT LỚN (FEATURED CARD) - Món đầu danh mục
  if (isFeatured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        onClick={() => onSelect(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item);
          }
        }}
        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all duration-300 shadow-md shadow-black/40 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      >
        {/* Large Image with gradient overlay */}
        <div className="relative w-full">
          <SkeletonImage
            src={item.imageUrl}
            alt={item.name}
            aspectRatio="4/3"
            priority={priority}
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
              <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
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
      </motion.div>
    );
  }

  // DẠNG 2: THẺ HÀNG NGANG (ROW CARD) - Các món tiếp theo
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className="group cursor-pointer p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/25 transition-all duration-300 flex items-center justify-between gap-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
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
          <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
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

      {/* Right square image */}
      <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden relative">
        <SkeletonImage
          src={item.imageUrl}
          alt={item.name}
          aspectRatio="1/1"
          priority={priority}
          grayscale={!isAvailable}
        />
      </div>
    </motion.div>
  );
}
