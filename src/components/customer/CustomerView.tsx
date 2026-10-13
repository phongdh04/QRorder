'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CustomerPublicMenuData, CustomerPublicItem } from '@/lib/dal/customer';
import { Header } from './Header';
import { CategoryNav } from './CategoryNav';
import { MenuSection } from './MenuSection';
import { ItemSheet } from './ItemSheet';
import { Footer } from './Footer';

interface CustomerViewProps {
  data: CustomerPublicMenuData;
}

export function CustomerView({ data }: CustomerViewProps) {
  const categories = data.categories;
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id || ''
  );
  const [selectedItem, setSelectedItem] = useState<CustomerPublicItem | null>(null);
  const isClickScrollingRef = useRef(false);

  // IntersectionObserver: Tự động cập nhật chip danh mục đang xem khi cuộn trang
  useEffect(() => {
    if (typeof window === 'undefined' || categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrollingRef.current) return;

        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Lấy section gần với cạnh trên màn hình nhất
          const topEntry = visibleEntries.reduce((prev, curr) => {
            return Math.abs(curr.boundingClientRect.top) <
              Math.abs(prev.boundingClientRect.top)
              ? curr
              : prev;
          });

          const catId = topEntry.target.getAttribute('data-category-id');
          if (catId) {
            setActiveCategoryId(catId);
          }
        }
      },
      {
        rootMargin: '-120px 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    categories.forEach((cat) => {
      const el = document.getElementById(cat.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  // Cuộn mượt tới nhóm khi bấm vào chip
  const handleSelectCategory = (id: string) => {
    setActiveCategoryId(id);
    isClickScrollingRef.current = true;

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Tắt cờ tạm ngưng observer sau khi hiệu ứng cuộn mượt kết thúc
    setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 600);
  };

  // Hỗ trợ ghi đè bảng màu từ restaurants.theme nếu có cấu hình
  const theme = data.restaurant.theme || {};
  const customStyles: React.CSSProperties = {
    ...(theme.bg ? { '--bg': theme.bg } : {}),
    ...(theme.surface ? { '--surface': theme.surface } : {}),
    ...(theme.accent ? { '--accent': theme.accent } : {}),
  } as React.CSSProperties;

  return (
    <div
      style={customStyles}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex justify-center selection:bg-[var(--accent)] selection:text-[#0B0B0C]"
    >
      {/* Mobile container: Tối ưu 360-430px, giới hạn max 480px trên desktop căn giữa */}
      <div className="w-full max-w-[480px] bg-[var(--bg)] min-h-screen relative flex flex-col shadow-2xl border-x border-[var(--border)]">
        {/* Header quán bar & tên bàn */}
        <Header
          restaurantName={data.restaurant.name}
          tableName={data.table.name}
          logoUrl={data.restaurant.logoUrl}
          coverImageUrl={data.restaurant.coverImageUrl}
        />

        {/* Sticky Category Navigation */}
        {categories.length > 0 && (
          <CategoryNav
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            activeId={activeCategoryId}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {/* Menu Sections List */}
        <main className="px-4 flex-1">
          {categories.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <p className="font-serif text-lg text-[var(--text)]">Thực Đơn Đang Chuẩn Bị</p>
              <p className="text-xs text-[var(--muted)]">
                Quầy bar đang hoàn thiện danh mục đồ uống.
              </p>
            </div>
          ) : (
            categories.map((cat, idx) => (
              <MenuSection
                key={cat.id}
                category={cat}
                isFirstCategory={idx === 0}
                onSelectItem={(item) => setSelectedItem(item)}
              />
            ))
          )}
        </main>

        {/* Footer */}
        <Footer restaurantName={data.restaurant.name} />

        {/* Bottom Sheet Modal Chi tiết món */}
        <ItemSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
      </div>
    </div>
  );
}
