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
      className="scroll-mt-28 pt-8 first:pt-4"
    >
      {/* Category Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-[#F7F4EB]">
              {category.name}
            </h2>
          </div>
          <span className="text-[11px] text-[#A8A295] tracking-wider px-2.5 py-0.5 rounded-full bg-[#181B22] border border-[rgba(212,175,55,0.2)]">
            {category.items.length} món
          </span>
        </div>

        {/* Decorative champagne line */}
        <div className="mt-2.5 h-[1px] w-full bg-gradient-to-r from-[#D4AF37]/50 via-[#D4AF37]/20 to-transparent" />
      </div>

      {/* Items list */}
      {category.items.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#111318] border border-[rgba(212,175,55,0.15)]">
          <p className="text-xs text-[#A8A295] tracking-wide">
            Danh mục này đang được bếp cập nhật thêm món.
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
