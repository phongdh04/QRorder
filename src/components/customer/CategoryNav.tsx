'use client';

import React, { useRef, useEffect } from 'react';

interface CategoryNavProps {
  categories: Array<{ id: string; name: string }>;
  activeId: string;
  onSelectCategory: (id: string) => void;
}

export function CategoryNav({
  categories,
  activeId,
  onSelectCategory,
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
      <div
        ref={containerRef}
        className="flex items-center gap-1 px-4 py-2.5 overflow-x-auto no-scrollbar scroll-smooth"
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
              className={`relative shrink-0 px-4 py-2 rounded-full text-xs uppercase tracking-[0.15em] transition-all duration-200 select-none ${
                isActive
                  ? 'text-[var(--accent)] font-semibold bg-[var(--accent-soft)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)] font-normal'
              }`}
            >
              {cat.name}
              {isActive && (
                <span className="absolute bottom-1 left-4 right-4 h-[2px] bg-[var(--accent)] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
