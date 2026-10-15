'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CustomerPublicMenuData, CustomerPublicItem } from '@/lib/dal/customer';
import { useCart } from '@/hooks/useCart';
import { useTableRealtime } from '@/hooks/useTableRealtime';
import { Header } from './Header';
import { CategoryNav } from './CategoryNav';
import { MenuSection } from './MenuSection';
import { MenuCard } from './MenuCard';
import { ItemSheet } from './ItemSheet';
import { FloatingCartBar } from './FloatingCartBar';
import { CartSheet } from './CartSheet';
import { TableOrdersSheet } from './TableOrdersSheet';
import { OrderSuccessModal } from './OrderSuccessModal';
import { ThankYouModal } from './ThankYouModal';
import { Footer } from './Footer';
import { QuickServiceActions } from './QuickServiceActions';

interface CustomerViewProps {
  data: CustomerPublicMenuData;
}

export function CustomerView({ data }: CustomerViewProps) {
  const categories = data.categories;
  const tableToken = data.table.token;

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<CustomerPublicItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersSheetOpen, setIsOrdersSheetOpen] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState<any | null>(null);
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const [staffCalledNotice, setStaffCalledNotice] = useState(false);

  // Dữ liệu đơn hàng & tổng tiền của phiên hiện tại (khởi tạo ngay từ data.activeSession)
  const [sessionOrders, setSessionOrders] = useState<any[]>(data.activeSession?.orders || []);
  const [sessionTotal, setSessionTotal] = useState<number>(data.activeSession?.total || 0);

  // Tính tổng số lượng món đã đặt trong các đợt gọi
  const orderedItemsCount = useMemo(() => {
    return sessionOrders.reduce((sum, order) => {
      if (order.status === 'cancelled') return sum;
      const items = order.order_items || order.items || [];
      return sum + items.reduce((s: number, i: any) => s + (i.quantity || 1), 0);
    }, 0);
  }, [sessionOrders]);

  // Kiểm tra xem có đơn nào đang chờ duyệt hoặc đang pha chế không
  const hasActiveOrders = useMemo(() => {
    return sessionOrders.some(
      (o) => o.status === 'pending' || o.status === 'preparing'
    );
  }, [sessionOrders]);

  const isClickScrollingRef = useRef(false);

  // 1. Quản lý giỏ hàng lưu trong localStorage theo token bàn
  const cart = useCart(tableToken);

  // 2. Tải danh sách đơn hàng & tổng tiền của bàn từ database
  const fetchTableSessionData = useCallback(async () => {
    if (!tableToken) return;
    try {
      const res = await fetch(`/api/customer/table?token=${encodeURIComponent(tableToken)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSessionOrders(json.data.activeSession?.orders || []);
          setSessionTotal(json.data.activeSession?.total || 0);
        }
      }
    } catch (err) {
      console.warn('Lỗi tải dữ liệu phiên bàn:', err);
    }
  }, [tableToken]);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    fetchTableSessionData();
  }, [fetchTableSessionData]);

  // 3. Xử lý sự kiện Realtime qua SSE
  const handleRealtimeEvent = useCallback(
    (event: any) => {
      if (event.type === 'order_created') {
        if (typeof event.total === 'number') {
          setSessionTotal(event.total);
        }
        fetchTableSessionData();
      } else if (event.type === 'order_status_changed') {
        setSessionOrders((prev) =>
          prev.map((order) => {
            if (order.id === event.orderId) {
              return {
                ...order,
                status: event.status,
                cancel_reason: event.data?.cancelReason || order.cancel_reason,
              };
            }
            return order;
          })
        );
      } else if (event.type === 'session_closed') {
        setSessionOrders([]);
        setSessionTotal(0);
        setIsThankYouOpen(true);
        cart.clearCart();
      }
    },
    [fetchTableSessionData, cart]
  );

  const { isConnected, isReconnecting } = useTableRealtime(
    tableToken,
    handleRealtimeEvent,
    fetchTableSessionData
  );

  // 4. IntersectionObserver: Tự động cập nhật chip danh mục đang xem khi cuộn trang
  useEffect(() => {
    if (typeof window === 'undefined' || categories.length === 0 || searchQuery.trim() !== '') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrollingRef.current) return;

        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          const topEntry = visibleEntries.reduce((prev, curr) => {
            return Math.abs(curr.boundingClientRect.top) <
              Math.abs(prev.boundingClientRect.top)
              ? curr
              : prev;
          });

          const catId = topEntry.target.getAttribute('data-category-id');
          if (catId) {
            setActiveCategoryId((prev) => (prev !== catId ? catId : prev));
          }
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    );

    categories.forEach((cat) => {
      const el = document.getElementById(cat.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories, searchQuery]);

  // Cuộn mượt tới nhóm khi bấm vào chip
  const handleSelectCategory = (id: string) => {
    setActiveCategoryId(id);
    setSearchQuery('');
    isClickScrollingRef.current = true;

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 600);
  };

  // Thêm nhanh từ nút "+" trên thẻ món
  const handleQuickAdd = (item: CustomerPublicItem) => {
    cart.addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
    });
  };

  // Thêm từ chi tiết món kèm số lượng và ghi chú
  const handleDetailAdd = (
    item: CustomerPublicItem,
    quantity: number,
    note?: string
  ) => {
    for (let i = 0; i < quantity; i++) {
      cart.addItem(
        {
          id: item.id,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
        },
        note
      );
    }
  };

  // Gọi nhân viên phục vụ
  const handleCallStaff = () => {
    setStaffCalledNotice(true);
    setTimeout(() => {
      setStaffCalledNotice(false), 3500;
    }, 3500);
  };

  // Xử lý khi đặt đơn thành công
  const handleOrderSuccess = (orderResult: any) => {
    setOrderSuccessData(orderResult);
    if (typeof orderResult.sessionTotal === 'number') {
      setSessionTotal(orderResult.sessionTotal);
    }
    fetchTableSessionData();
  };

  // Tìm kiếm món ăn
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const results: CustomerPublicItem[] = [];
    categories.forEach((cat) => {
      cat.items.forEach((item) => {
        if (
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        ) {
          results.push(item);
        }
      });
    });
    return results;
  }, [categories, searchQuery]);

  // Theme styles
  const customStyles: React.CSSProperties = {
    '--bg': '#08090C',
    '--surface': '#111318',
    '--surface-2': '#181B22',
    '--accent': '#D4AF37',
    '--border': 'rgba(212, 175, 55, 0.18)',
    '--text': '#F7F4EB',
    '--muted': '#A8A295',
  } as React.CSSProperties;

  return (
    <div
      style={customStyles}
      className="min-h-screen bg-[#08090C] text-[#F7F4EB] flex justify-center selection:bg-[#D4AF37] selection:text-[#08090C] pb-28 relative"
    >
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-[#D4AF37]/10 via-[#F3C766]/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Toast thông báo gọi phục vụ */}
      {staffCalledNotice && (
        <div className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-[#181B22] border border-[#D4AF37] text-[#F7F4EB] p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#08090C] flex items-center justify-center font-bold shrink-0">
            ✓
          </div>
          <div className="text-xs">
            <p className="font-bold text-[#F3C766]">Đã Gửi Yêu Cầu!</p>
            <p className="text-[#A8A295]">Nhân viên phục vụ đang tới {data.table.name}.</p>
          </div>
        </div>
      )}

      {/* Mobile container: Tối ưu 360-480px */}
      <div className="w-full max-w-[500px] bg-[#08090C] min-h-screen relative flex flex-col shadow-2xl border-x border-[rgba(212,175,55,0.15)]">
        {/* Header quán bar & phím tắt xem đơn của bàn */}
        <Header
          restaurantName={data.restaurant.name}
          tableName={data.table.name}
          logoUrl={data.restaurant.logoUrl}
          coverImageUrl={data.restaurant.coverImageUrl}
          ordersCount={orderedItemsCount > 0 ? orderedItemsCount : sessionOrders.length}
          onOpenOrders={() => setIsOrdersSheetOpen(true)}
          onCallStaff={handleCallStaff}
        />

        {/* Nút hành động nhanh: Gọi nhân viên & Yêu cầu thanh toán */}
        <QuickServiceActions tableToken={tableToken} />

        {/* Search input bar */}
        <div className="px-4 py-3 bg-[#08090C] border-b border-[rgba(212,175,55,0.15)] sticky top-0 z-30 backdrop-blur-md">
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Tìm món ngon: Thăn bò, cánh gà, hàu nướng, bia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-[#111318] border border-[rgba(212,175,55,0.2)] rounded-xl pl-10 pr-9 py-2.5 text-[#F7F4EB] placeholder-[#A8A295]/60 focus:outline-none focus:border-[#D4AF37] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A8A295] hover:text-[#F7F4EB] p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sticky Category Navigation */}
        {!searchQuery && categories.length > 0 && (
          <CategoryNav
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            activeId={activeCategoryId}
            onSelectCategory={handleSelectCategory}
            orderedItemsCount={orderedItemsCount}
            hasActiveOrders={hasActiveOrders}
            onOpenOrders={() => setIsOrdersSheetOpen(true)}
          />
        )}

        {/* Menu Sections List */}
        <main className="px-4 flex-1">
          {searchQuery.trim() !== '' ? (
            <div className="pt-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(212,175,55,0.2)]">
                <span className="text-xs uppercase tracking-wider text-[#A8A295]">
                  Kết quả tìm kiếm cho &ldquo;{searchQuery}&rdquo;
                </span>
                <span className="text-xs font-bold text-[#F3C766]">
                  {searchResults.length} món
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-16 text-center space-y-2 rounded-2xl bg-[#111318] border border-[rgba(212,175,55,0.15)] p-6">
                  <p className="font-serif text-base text-[#F7F4EB]">Không tìm thấy món phù hợp</p>
                  <p className="text-xs text-[#A8A295]">
                    Quý khách vui lòng thử tìm bằng từ khóa khác hoặc xem toàn bộ danh mục thực đơn.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {searchResults.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      onSelect={(it) => setSelectedItem(it)}
                      onQuickAdd={handleQuickAdd}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <p className="font-serif text-lg text-[#F7F4EB]">Thực Đơn Đang Chuẩn Bị</p>
              <p className="text-xs text-[#A8A295]">
                Quán đang hoàn thiện danh mục món ăn và đồ uống.
              </p>
            </div>
          ) : (
            categories.map((cat, idx) => (
              <MenuSection
                key={cat.id}
                category={cat}
                isFirstCategory={idx === 0}
                menuDisplayMode={data.restaurant.menuDisplayMode}
                onSelectItem={(item) => setSelectedItem(item)}
                onQuickAdd={handleQuickAdd}
              />
            ))
          )}
        </main>

        {/* Footer */}
        <Footer restaurantName={data.restaurant.name} />

        {/* Thanh nổi ở đáy màn hình: Giỏ hàng chưa gửi & Nút xem các món đã đặt */}
        <FloatingCartBar
          totalCount={cart.totalCount}
          totalAmount={cart.totalAmount}
          onOpenCart={() => setIsCartOpen(true)}
          ordersCount={sessionOrders.length}
          orderedItemsCount={orderedItemsCount}
          sessionTotal={sessionTotal}
          hasActiveOrders={hasActiveOrders}
          onOpenOrders={() => setIsOrdersSheetOpen(true)}
        />

        {/* Bottom Sheet: Chi tiết món */}
        <ItemSheet
          item={selectedItem}
          menuDisplayMode={data.restaurant.menuDisplayMode}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleDetailAdd}
        />

        {/* Bottom Sheet: Giỏ hàng */}
        <CartSheet
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          tableToken={tableToken}
          items={cart.items}
          generalNote={cart.generalNote}
          onUpdateQuantity={cart.updateQuantity}
          onUpdateNote={cart.updateItemNote}
          onSetGeneralNote={cart.setGeneralNote}
          onClearCart={cart.clearCart}
          onOrderSuccess={handleOrderSuccess}
        />

        {/* Bottom Sheet: Đơn của bàn tôi (Realtime) */}
        <TableOrdersSheet
          isOpen={isOrdersSheetOpen}
          onClose={() => setIsOrdersSheetOpen(false)}
          tableName={data.table.name}
          sessionTotal={sessionTotal}
          orders={sessionOrders}
          isLiveConnected={isConnected}
          isReconnecting={isReconnecting}
          onRefresh={fetchTableSessionData}
        />

        {/* Modal: Xác nhận sau khi gửi đơn thành công */}
        <OrderSuccessModal
          orderData={orderSuccessData}
          onClose={() => setOrderSuccessData(null)}
          onViewOrders={() => {
            setOrderSuccessData(null);
            setIsOrdersSheetOpen(true);
          }}
        />

        {/* Modal: Cảm ơn khi bàn đã thanh toán */}
        <ThankYouModal
          isOpen={isThankYouOpen}
          onClose={() => setIsThankYouOpen(false)}
          restaurantName={data.restaurant.name}
          tableName={data.table.name}
        />
      </div>
    </div>
  );
}
