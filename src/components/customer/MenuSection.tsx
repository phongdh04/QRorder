'use client';

import React from 'react';
import { CustomerPublicCategory, CustomerPublicItem } from '@/lib/dal/customer';
import { MenuCard } from './MenuCard';

interface MenuSectionProps {
  category: CustomerPublicCategory;
  isFirstCategory: boolean;
  menuDisplayMode?: 'photo' | 'minimal';
  onSelectItem: (item: CustomerPublicItem) => void;
  onQuickAdd?: (item: CustomerPublicItem) => void;
}

export function MenuSection({
  category,
  isFirstCategory,
  menuDisplayMode = 'photo',
  onSelectItem,
  onQuickAdd,
}: MenuSectionProps) {
  return (
    <section
      id={category.id}
      data-category-id={category.id}
      className="scroll-mt-24 pt-6 first:pt-4"
    >
      {/* Category Header */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-wide text-[var(--text)]">
            {category.name}
          </h2>
          <span className="text-[11px] text-[var(--muted)] tracking-wider">
            {category.items.length} món
          </span>
        </div>
        {/* Subtle decorative champagne line */}
        <div className="mt-2 h-[1px] w-full bg-gradient-to-r from-[var(--accent)]/40 via-[var(--accent)]/15 to-transparent" />
      </div>

      {/* Items list */}
      {category.items.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <p className="text-xs text-[var(--muted)] tracking-wide">
            Danh mục này đang được cập nhật thực đơn.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {category.items.map((item, index) => {
            const isFeatured = index === 0;
            const priority = isFirstCategory && index === 0;

            return (
              <MenuCard
                key={item.id}
                item={item}
                isFeatured={isFeatured}
                priority={priority}
                menuDisplayMode={menuDisplayMode}
                onSelect={onSelectItem}
                onQuickAdd={onQuickAdd}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
