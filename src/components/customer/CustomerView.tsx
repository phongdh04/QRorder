'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CustomerPublicMenuData, CustomerPublicItem } from '@/lib/dal/customer';
import { useCart } from '@/hooks/useCart';
import { useTableRealtime } from '@/hooks/useTableRealtime';
import { Header } from './Header';
import { CategoryNav } from './CategoryNav';
import { MenuSection } from './MenuSection';
import { ItemSheet } from './ItemSheet';
import { FloatingCartBar } from './FloatingCartBar';
import { CartSheet } from './CartSheet';
import { TableOrdersSheet } from './TableOrdersSheet';
import { OrderSuccessModal } from './OrderSuccessModal';
import { ThankYouModal } from './ThankYouModal';
import { Footer } from './Footer';

interface CustomerViewProps {
  data: CustomerPublicMenuData;
}

export function CustomerView({ data }: CustomerViewProps) {
  const categories = data.categories;
  const tableToken = data.table.token;

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id || ''
  );
  const [selectedItem, setSelectedItem] = useState<CustomerPublicItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersSheetOpen, setIsOrdersSheetOpen] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState<any | null>(null);
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);

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

  // 3. Xử lý sự kiện Realtime qua SSE (Server-Sent Events)
  const handleRealtimeEvent = useCallback(
    (event: any) => {
      if (event.type === 'order_created') {
        // Đơn hàng mới được tạo -> cập nhật tổng tiền và tải lại danh sách đơn
        if (typeof event.total === 'number') {
          setSessionTotal(event.total);
        }
        fetchTableSessionData();
      } else if (event.type === 'order_status_changed') {
        // Trạng thái đơn thay đổi (đang pha chế / đã phục vụ / đã hủy)
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
        // Bàn vừa được thanh toán xong -> bắt đầu phiên mới
        setSessionOrders([]);
        setSessionTotal(0);
        setIsThankYouOpen(true);
        cart.clearCart();
      }
    },
    [fetchTableSessionData, cart]
  );

  // Kết nối SSE Realtime tự động kết nối lại khi mất mạng và đồng bộ dữ liệu
  const { isConnected, isReconnecting } = useTableRealtime(
    tableToken,
    handleRealtimeEvent,
    fetchTableSessionData
  );

  // 4. IntersectionObserver: Tự động cập nhật chip danh mục đang xem khi cuộn trang
  useEffect(() => {
    if (typeof window === 'undefined' || categories.length === 0) return;

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

  // Xử lý khi đặt đơn thành công
  const handleOrderSuccess = (orderResult: any) => {
    setOrderSuccessData(orderResult);
    if (typeof orderResult.sessionTotal === 'number') {
      setSessionTotal(orderResult.sessionTotal);
    }
    fetchTableSessionData();
  };

  // Hỗ trợ ghi đè màu từ theme quán nếu có
  const theme = data.restaurant.theme || {};
  const customStyles: React.CSSProperties = {
    ...(theme.bg ? { '--bg': theme.bg } : {}),
    ...(theme.surface ? { '--surface': theme.surface } : {}),
    ...(theme.accent ? { '--accent': theme.accent } : {}),
  } as React.CSSProperties;

  return (
    <div
      style={customStyles}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex justify-center selection:bg-[var(--accent)] selection:text-[#0B0B0C] pb-24"
    >
      {/* Mobile container: Tối ưu 360-430px, max 480px trên desktop */}
      <div className="w-full max-w-[480px] bg-[var(--bg)] min-h-screen relative flex flex-col shadow-2xl border-x border-[var(--border)]">
        {/* Header quán bar & phím tắt xem đơn của bàn */}
        <Header
          restaurantName={data.restaurant.name}
          tableName={data.table.name}
          logoUrl={data.restaurant.logoUrl}
          coverImageUrl={data.restaurant.coverImageUrl}
          ordersCount={orderedItemsCount > 0 ? orderedItemsCount : sessionOrders.length}
          onOpenOrders={() => setIsOrdersSheetOpen(true)}
        />

        {/* Sticky Category Navigation kèm nút xem đơn ghim cố định */}
        {categories.length > 0 && (
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
