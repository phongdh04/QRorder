'use client';

import React, { useState, useEffect } from 'react';
import {
  MenuSquare,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Search,
  Check,
  Edit2,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/utils';

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Edit item modal
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/admin/menu');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.menu) {
          setCategories(json.menu);
        }
      }
    } catch (err) {
      console.error('Lỗi tải thực đơn:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleToggleAvailable = async (item: any) => {
    setTogglingId(item.id);
    try {
      const res = await fetch(`/api/admin/menu/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !item.is_available }),
      });
      if (res.ok) {
        await fetchMenu();
      }
    } catch (err) {
      console.error('Lỗi bật tắt trạng thái món:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenEdit = (item: any) => {
    setEditItem(item);
    setEditName(item.name);
    setEditPrice(item.price);
    setEditDesc(item.description || '');
    setErrorMsg('');
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setIsSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/menu/${editItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          price: Number(editPrice),
          description: editDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật món.');
      setEditItem(null);
      await fetchMenu();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể lưu món.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <MenuSquare className="w-6 h-6 text-amber-400" />
            <span>Quản Lý Thực Đơn & Trạng Thái Món</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Bật/tắt trạng thái hết hàng tạm thời hoặc điều chỉnh giá bán theo thời điểm.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchMenu}
          className="self-start sm:self-auto gap-2 text-xs border-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm món trong thực đơn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Categories & Items */}
      <div className="space-y-8">
        {categories.map((cat) => {
          const items = cat.menu_items.filter(
            (i: any) =>
              search === '' ||
              i.name.toLowerCase().includes(search.toLowerCase()) ||
              (i.description && i.description.toLowerCase().includes(search.toLowerCase()))
          );

          if (items.length === 0 && search !== '') return null;

          return (
            <div key={cat.id} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h3 className="font-extrabold text-white text-base tracking-wide">
                  {cat.name}
                </h3>
                <span className="text-xs text-slate-500 font-medium">({items.length} món)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item: any) => {
                  const isToggling = togglingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex gap-3.5 justify-between"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                        <img
                          src={item.image_url || '/placeholder-cocktail.svg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="text-slate-500 hover:text-amber-400 p-1"
                              title="Sửa món"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-amber-400 font-black text-xs mt-0.5">
                            {formatVND(item.price)}
                          </p>
                        </div>

                        {/* Availability toggle */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-2">
                          <span
                            className={`text-[11px] font-semibold ${
                              item.is_available ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.is_available ? 'Đang phục vụ' : 'Tạm hết món'}
                          </span>

                          <button
                            disabled={isToggling}
                            onClick={() => handleToggleAvailable(item)}
                            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
                          >
                            {item.is_available ? (
                              <ToggleRight className="w-6 h-6 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-slate-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Item Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setEditItem(null)}
          />

          <div className="relative z-10 w-full max-w-md bg-[#0c101a] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Chỉnh Sửa Món</h3>
              <button
                onClick={() => setEditItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tên món:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Giá bán (VND):</label>
                <input
                  type="number"
                  step="1000"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Mô tả / Hương vị:</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditItem(null)}>
                Hủy
              </Button>
              <Button
                variant="gold"
                className="flex-1 font-bold"
                disabled={isSaving}
                onClick={handleSaveEdit}
              >
                {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
