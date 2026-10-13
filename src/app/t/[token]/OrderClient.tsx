'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wine,
  ShoppingBag,
  Receipt,
  CreditCard,
  Plus,
  Search,
  Sparkles,
  Flame,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/utils';
import { CartItem, MenuItemData, CategoryData } from '@/types';
import { CartDrawer } from '@/components/CartDrawer';
import { OrderHistoryDrawer } from '@/components/OrderHistoryDrawer';
import { BillPaymentModal } from '@/components/BillPaymentModal';

interface OrderClientProps {
  initialData: {
    restaurant: {
      id: string;
      name: string;
      slug: string;
      logo_url?: string | null;
    };
    table: {
      id: string;
      name: string;
      token: string;
    };
    activeSession: {
      id: string;
      status: string;
      total: number;
      orders: any[];
    };
    categories: CategoryData[];
  };
}

export function OrderClient({ initialData }: OrderClientProps) {
  const [data, setData] = useState(initialData);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addedItemEffect, setAddedItemEffect] = useState<string | null>(null);

  // Poll dữ liệu định kỳ mỗi 5s để cập nhật trạng thái đơn hàng khi quầy bar thao tác
  const fetchLatestData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/customer/table?token=${data.table.token}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      }
    } catch (err) {
      console.warn('Lỗi cập nhật dữ liệu tự động:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [data.table.token]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchLatestData();
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchLatestData]);

  // Giỏ hàng
  const handleAddToCart = (item: MenuItemData) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          imageUrl: item.image_url,
          quantity: 1,
        },
      ];
    });

    // Hiệu ứng thêm thành công
    setAddedItemEffect(item.id);
    setTimeout(() => setAddedItemEffect(null), 1000);
  };

  const handleUpdateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.menuItemId === menuItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleUpdateNote = (menuItemId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.menuItemId === menuItemId ? { ...item, note } : item))
    );
  };

  const handleClearCart = () => setCart([]);

  const handlePlaceOrder = async (orderNote: string) => {
    const res = await fetch('/api/customer/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: data.table.token,
        items: cart.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          note: i.note,
        })),
        note: orderNote,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Đặt món không thành công.');
    }

    // Xóa giỏ và tải lại trạng thái bàn
    setCart([]);
    await fetchLatestData();
    setIsHistoryOpen(true);
  };

  // Tính toán số lượng trong giỏ
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Lọc món theo danh mục và tìm kiếm
  const allItems: MenuItemData[] = [];
  data.categories.forEach((cat) => {
    if (cat.menu_items) {
      cat.menu_items.forEach((item) => {
        allItems.push({ ...item, category: { id: cat.id, name: cat.name } });
      });
    }
  });

  const filteredItems = allItems.filter((item) => {
    const matchesCat = selectedCatId === 'all' || item.category_id === selectedCatId;
    const matchesQuery =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const ordersCount = data.activeSession.orders?.length || 0;

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 pb-28">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Wine className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide leading-tight">
                {data.restaurant.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-amber-400">{data.table.name}</span>
                <span className="text-[10px] text-slate-500">• Đang phục vụ</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 transition-colors"
              title="Đơn đã gọi"
            >
              <Receipt className="w-4 h-4" />
              {ordersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                  {ordersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsPaymentOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 transition-colors flex items-center gap-1 text-xs font-semibold px-2.5"
              title="Xem hóa đơn"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{formatVND(data.activeSession.total)}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm món cocktail, whisky, bia hoặc đồ nhắm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-900/90 border border-slate-800/90 rounded-2xl pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCatId('all')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCatId === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất Cả Món
          </button>
          {data.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCatId === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Active category title */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {selectedCatId === 'all'
                ? 'Thực đơn đồ uống & món nhắm'
                : data.categories.find((c) => c.id === selectedCatId)?.name}
            </span>
          </h2>
          <span className="text-xs text-slate-500">{filteredItems.length} món</span>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 glass-panel rounded-2xl">
              <p className="text-sm">Không tìm thấy món phù hợp.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isAdded = addedItemEffect === item.id;
              const cartItem = cart.find((i) => i.menuItemId === item.id);

              return (
                <div
                  key={item.id}
                  className="glass-panel p-3 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex gap-3.5 relative overflow-hidden"
                >
                  {/* Image */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative">
                    <img
                      src={item.image_url || '/placeholder-cocktail.svg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[10px] font-bold text-rose-400">
                        Tạm hết
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm leading-snug truncate">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-extrabold text-amber-400">
                        {formatVND(item.price)}
                      </span>

                      {item.is_available ? (
                        <Button
                          size="sm"
                          variant={isAdded ? 'default' : 'gold'}
                          onClick={() => handleAddToCart(item)}
                          className={`h-8 px-3 rounded-xl text-xs gap-1 transition-all ${
                            isAdded ? 'bg-emerald-500 text-white' : ''
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Đã thêm</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>{cartItem ? `Thêm (${cartItem.quantity})` : 'Thêm'}</span>
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">Hết món</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      <AnimatePresence>
        {totalCartCount > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-40"
          >
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-3 shadow-xl shadow-amber-500/25 flex items-center justify-between text-slate-950 font-bold">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center text-xs font-black shadow-inner">
                  {totalCartCount}
                </div>
                <div>
                  <p className="text-xs text-slate-900/80 font-semibold leading-tight">Đã chọn</p>
                  <p className="text-sm text-slate-950 font-black">{formatVND(totalCartPrice)}</p>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="bg-slate-950 text-amber-400 hover:bg-slate-900 rounded-xl px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Xem Giỏ Hàng</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawers and Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onUpdateNote={handleUpdateNote}
        onClearCart={handleClearCart}
        onPlaceOrder={handlePlaceOrder}
      />

      <OrderHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orders={data.activeSession.orders || []}
        onRefresh={fetchLatestData}
        isRefreshing={isRefreshing}
      />

      <BillPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        tableName={data.table.name}
        tableToken={data.table.token}
        totalAmount={data.activeSession.total}
        orders={data.activeSession.orders || []}
      />
    </div>
  );
}
