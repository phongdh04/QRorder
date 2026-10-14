'use client';

import React, { useRef, useEffect } from 'react';

interface CategoryNavProps {
  categories: Array<{ id: string; name: string }>;
  activeId: string;
  onSelectCategory: (id: string) => void;
  orderedItemsCount?: number;
  hasActiveOrders?: boolean;
  onOpenOrders?: () => void;
}

export function CategoryNav({
  categories,
  activeId,
  onSelectCategory,
  orderedItemsCount = 0,
  hasActiveOrders = false,
  onOpenOrders,
}: CategoryNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  // Tự động cuộn chip đang active vào giữa thanh điều hướng
  useEffect(() => {
    if (activeBtnRef.current && containerRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeId]);

  return (
    <nav className="sticky top-0 z-30 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)] pt-[env(safe-area-inset-top,0px)]">
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        {/* Thanh cuộn danh mục ngang */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth"
          role="tablist"
          aria-label="Danh mục thực đơn"
        >
          {categories.map((cat) => {
            const isActive = activeId === cat.id;
            return (
              <button
                key={cat.id}
                ref={isActive ? activeBtnRef : null}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectCategory(cat.id)}
                className={`relative shrink-0 px-3.5 py-1.5 rounded-full text-xs uppercase tracking-[0.15em] transition-all duration-200 select-none ${
                  isActive
                    ? 'text-[var(--accent)] font-semibold bg-[var(--accent-soft)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] font-normal'
                }`}
              >
                {cat.name}
                {isActive && (
                  <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-[var(--accent)] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Nút xem nhanh đơn đã đặt ghim cố định ở đầu trang khi cuộn menu */}
        {orderedItemsCount > 0 && onOpenOrders && (
          <button
            type="button"
            onClick={onOpenOrders}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--accent)]/40 hover:border-[var(--accent)] text-[var(--accent)] text-[11px] font-bold tracking-wide transition-all shadow-sm select-none"
            title="Xem danh sách món đã gọi của bàn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Đã đặt ({orderedItemsCount})</span>
            {hasActiveOrders && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        )}
      </div>
    </nav>
  );
}
