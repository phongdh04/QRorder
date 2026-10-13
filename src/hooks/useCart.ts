'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  note?: string;
}

export function useCart(tableToken: string) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [generalNote, setGeneralNote] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = `qrorder_cart_${tableToken}`;

  // Đọc từ localStorage khi client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.items)) setItems(parsed.items);
        if (typeof parsed.generalNote === 'string') setGeneralNote(parsed.generalNote);
      }
    } catch (err) {
      console.warn('Lỗi đọc giỏ hàng từ localStorage:', err);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Lưu vào localStorage khi giỏ thay đổi
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ items, generalNote })
      );
    } catch (err) {
      console.warn('Lỗi ghi giỏ hàng vào localStorage:', err);
    }
  }, [items, generalNote, isLoaded, storageKey]);

  const addItem = useCallback(
    (
      menuItem: { id: string; name: string; price: number; imageUrl?: string | null },
      note?: string
    ) => {
      setItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.menu_item_id === menuItem.id);
        if (existingIdx > -1) {
          const updated = [...prev];
          const current = updated[existingIdx];
          updated[existingIdx] = {
            ...current,
            quantity: Math.min(20, current.quantity + 1),
            note: note !== undefined ? note : current.note,
          };
          return updated;
        }

        return [
          ...prev,
          {
            menu_item_id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            imageUrl: menuItem.imageUrl,
            quantity: 1,
            note: note || '',
          },
        ];
      });
    },
    []
  );

  const updateQuantity = useCallback((menuItemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.menu_item_id === menuItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return { ...item, quantity: Math.min(20, newQty) };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const updateItemNote = useCallback((menuItemId: string, note: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.menu_item_id === menuItemId ? { ...item, note } : item
      )
    );
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menu_item_id !== menuItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setGeneralNote('');
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    }
  }, [storageKey]);

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  return {
    items,
    generalNote,
    setGeneralNote,
    addItem,
    updateQuantity,
    updateItemNote,
    removeItem,
    clearCart,
    totalCount,
    totalAmount,
    isLoaded,
  };
}
