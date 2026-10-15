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

  // Tự động cuộn ngang thanh danh mục để chip active nằm giữa
  useEffect(() => {
    if (activeBtnRef.current && containerRef.current) {
      const container = containerRef.current;
      const btn = activeBtnRef.current;
      const targetLeft = btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2;
      container.scrollTo({
        left: targetLeft,
        behavior: 'smooth',
      });
    }
  }, [activeId]);

  return (
    <nav className="sticky top-0 z-30 bg-[#08090C]/90 backdrop-blur-xl border-b border-[rgba(212,175,55,0.2)] pt-[env(safe-area-inset-top,0px)] shadow-lg shadow-black/50">
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        {/* Horizontal Category Scroll */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth"
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
                className={`relative shrink-0 px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-[0.12em] transition-all duration-200 select-none font-medium flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#F3C766] font-semibold bg-gradient-to-r from-[rgba(212,175,55,0.25)] to-[rgba(243,199,102,0.12)] border border-[#D4AF37]/50 shadow-md shadow-[#D4AF37]/15'
                    : 'text-[#A8A295] hover:text-[#F7F4EB] bg-[#111318]/60 border border-transparent hover:border-[rgba(255,255,255,0.06)]'
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F3C766] animate-pulse" />
                )}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Nút xem nhanh đơn đã đặt ghim cố định ở đầu trang khi cuộn menu */}
        {orderedItemsCount > 0 && onOpenOrders && (
          <button
            type="button"
            onClick={onOpenOrders}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181B22] border border-[#D4AF37]/40 hover:border-[#D4AF37] text-[#F3C766] text-[11px] font-bold tracking-wide transition-all shadow-sm select-none"
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
