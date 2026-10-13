'use client';

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  RefreshCw,
  FolderPlus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/utils';
import { ImageUploadField } from '@/components/admin/ImageUploadField';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  menu_items: MenuItem[];
}

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);

  // Modal Thêm / Sửa Món
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState<number | string>(0);
  const [itemDescription, setItemDescription] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState<string | null>(null);
  const [itemIsAvailable, setItemIsAvailable] = useState(true);
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  // Modal Quản Lý Danh Mục
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // Fetch Menu
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
      console.error('Lỗi nạp thực đơn:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Quick toggle Còn hàng / Hết hàng
  const handleToggleAvailable = async (item: MenuItem) => {
    setTogglingItemId(item.id);
    const newStatus = !item.is_available;
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        menu_items: cat.menu_items.map((m) =>
          m.id === item.id ? { ...m, is_available: newStatus } : m
        ),
      }))
    );

    try {
      const res = await fetch(`/api/admin/menu/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: newStatus }),
      });
      if (!res.ok) {
        // Rollback on error
        await fetchMenu();
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái món:', err);
      await fetchMenu();
    } finally {
      setTogglingItemId(null);
    }
  };

  // Open item modal for create
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    const defaultCat =
      selectedCatId !== 'all'
        ? selectedCatId
        : categories[0]?.id || '';
    setItemCategoryId(defaultCat);
    setItemName('');
    setItemPrice(0);
    setItemDescription('');
    setItemImageUrl(null);
    setItemIsAvailable(true);
    setItemError(null);
    setItemModalOpen(true);
  };

  // Open item modal for edit
  const handleOpenEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemCategoryId(item.category_id);
    setItemName(item.name);
    setItemPrice(item.price);
    setItemDescription(item.description || '');
    setItemImageUrl(item.image_url || null);
    setItemIsAvailable(item.is_available);
    setItemError(null);
    setItemModalOpen(true);
  };

  // Save item (Create or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setItemError('Vui lòng nhập tên món.');
      return;
    }
    if (!itemCategoryId) {
      setItemError('Vui lòng chọn danh mục cho món ăn.');
      return;
    }

    setItemSubmitting(true);
    setItemError(null);

    try {
      const payload = {
        category_id: itemCategoryId,
        name: itemName.trim(),
        price: Number(itemPrice) || 0,
        description: itemDescription.trim() || null,
        image_url: itemImageUrl || null,
        is_available: itemIsAvailable,
      };

      let res: Response;
      if (editingItem) {
        res = await fetch(`/api/admin/menu/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi lưu thông tin món.');
      }

      setItemModalOpen(false);
      await fetchMenu();
    } catch (err: any) {
      setItemError(err?.message || 'Có lỗi xảy ra khi lưu món.');
    } finally {
      setItemSubmitting(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa món "${item.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/menu/${item.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi xóa món.');
      await fetchMenu();
    } catch (err: any) {
      alert(err?.message || 'Không thể xóa món.');
    }
  };

  // Reorder items within category (up / down)
  const handleReorderItem = async (
    catId: string,
    itemIndex: number,
    direction: 'up' | 'down'
  ) => {
    const targetCat = categories.find((c) => c.id === catId);
    if (!targetCat) return;

    const items = [...targetCat.menu_items];
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    // Swap
    const temp = items[itemIndex];
    items[itemIndex] = items[targetIndex];
    items[targetIndex] = temp;

    // Optimistic
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, menu_items: items } : c))
    );

    try {
      await fetch('/api/admin/menu/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: catId,
          itemIds: items.map((i) => i.id),
        }),
      });
    } catch (err) {
      console.error('Lỗi đổi vị trí món:', err);
      await fetchMenu();
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setCatSubmitting(true);
    setCatError(null);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi thêm danh mục.');
      setNewCatName('');
      await fetchMenu();
    } catch (err: any) {
      setCatError(err?.message || 'Không thể thêm danh mục.');
    } finally {
      setCatSubmitting(false);
    }
  };

  // Rename Category
  const handleSaveCategoryName = async (catId: string) => {
    if (!editingCatName.trim()) return;
    setCatSubmitting(true);
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCatName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi đổi tên danh mục.');
      setEditingCatId(null);
      await fetchMenu();
    } catch (err: any) {
      alert(err?.message || 'Không thể cập nhật danh mục.');
    } finally {
      setCatSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat: Category) => {
    if (
      !confirm(
        `Xóa danh mục "${cat.name}" sẽ xóa TẤT CẢ ${cat.menu_items.length} món trong danh mục này. Bạn có chắc chắn?`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi xóa danh mục.');
      if (selectedCatId === cat.id) setSelectedCatId('all');
      await fetchMenu();
    } catch (err: any) {
      alert(err?.message || 'Không thể xóa danh mục.');
    }
  };

  // Reorder Category
  const handleReorderCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const list = [...categories];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    setCategories(list);
    try {
      await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: list.map((c) => c.id) }),
      });
    } catch (err) {
      console.error('Lỗi sắp xếp danh mục:', err);
      await fetchMenu();
    }
  };

  // Filter items
  const filteredCategories = categories
    .filter((cat) => selectedCatId === 'all' || cat.id === selectedCatId)
    .map((cat) => ({
      ...cat,
      menu_items: cat.menu_items.filter((item) =>
        search
          ? item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.description &&
              item.description.toLowerCase().includes(search.toLowerCase()))
          : true
      ),
    }))
    .filter((cat) => (search ? cat.menu_items.length > 0 : true));

  const totalItemsCount = categories.reduce(
    (acc, cat) => acc + cat.menu_items.length,
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <span>Quản Lý Thực Đơn Quán Bar</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Toàn quyền thêm, sửa, xóa, sắp xếp danh mục & món; bật tắt &quot;Còn hàng&quot; tức thì và tối ưu ảnh WebP.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCatModalOpen(true)}
            className="text-xs gap-1.5 border-slate-700 hover:bg-slate-800"
          >
            <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
            <span>Quản lý danh mục</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreateItem}
            className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm món mới</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCatId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCatId === 'all'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Tất cả ({totalItemsCount})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCatId === cat.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-70">
                ({cat.menu_items.length})
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên món hoặc mô tả..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Menu List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-7 h-7 animate-spin text-blue-500" />
          <span className="text-xs">Đang tải danh sách thực đơn...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <UtensilsCrossed className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            Không tìm thấy món ăn nào
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            {search
              ? 'Không có kết quả khớp với từ khóa tìm kiếm.'
              : 'Hãy bắt đầu thêm món mới hoặc danh mục cho quán của bạn.'}
          </p>
          <Button
            size="sm"
            onClick={handleOpenCreateItem}
            className="text-xs bg-blue-600 hover:bg-blue-500"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span>Thêm món ngay</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
            >
              {/* Category Header */}
              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                    {cat.menu_items.length} món
                  </span>
                </div>
              </div>

              {/* Items Table / Grid */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {cat.menu_items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Danh mục này chưa có món nào. Bấm &quot;Thêm món mới&quot; để bổ sung.
                  </div>
                ) : (
                  cat.menu_items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Left: Thumbnail + Name + Desc */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700/80 relative flex items-center justify-center">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-600" />
                          )}
                          {!item.is_available && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                              Hết
                            </div>
                          )}
                        </div>

                        {/* Text info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-sm font-bold truncate ${
                                item.is_available
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-400 line-through'
                              }`}
                            >
                              {item.name}
                            </h4>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                                item.is_available
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {item.is_available ? 'Còn hàng' : 'Hết hàng'}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          )}
                          <p className="text-xs font-black text-emerald-400 mt-1">
                            {formatVND(item.price)}
                          </p>
                        </div>
                      </div>

                      {/* Right: Quick Availability Switch & Action Buttons */}
                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => handleReorderItem(cat.id, idx, 'up')}
                            disabled={idx === 0}
                            title="Di chuyển lên trên"
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorderItem(cat.id, idx, 'down')}
                            disabled={idx === cat.menu_items.length - 1}
                            title="Di chuyển xuống dưới"
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Quick Availability Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleAvailable(item)}
                          disabled={togglingItemId === item.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            item.is_available
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                          }`}
                          title="Bấm để bật / tắt trạng thái Còn hàng"
                        >
                          {item.is_available ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Còn hàng</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                              <span>Đã hết</span>
                            </>
                          )}
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditItem(item)}
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Chỉnh sửa món"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                          title="Xóa món"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Thêm / Sửa Món */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-blue-400" />
                <span>{editingItem ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Mới'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveItem} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {itemError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{itemError}</span>
                </div>
              )}

              {/* Danh mục */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Danh mục món <span className="text-rose-400">*</span>
                </label>
                <select
                  value={itemCategoryId}
                  onChange={(e) => setItemCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500"
                  required
                >
                  <option value="" disabled>
                    -- Chọn danh mục --
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tên món */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tên món <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ví dụ: Cocktail Old Fashioned"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                  required
                />
              </div>

              {/* Giá tiền (VND) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Giá bán (VND) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="120000"
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                    {formatVND(Number(itemPrice) || 0)}
                  </span>
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mô tả món ăn
                </label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  rows={2}
                  placeholder="Hương vị, thành phần nguyên liệu chính..."
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Upload ảnh với Sharp WebP resize */}
              <div>
                <ImageUploadField
                  value={itemImageUrl}
                  onChange={(url) => setItemImageUrl(url)}
                  label="Hình ảnh minh họa"
                  sublabel="Tải lên ảnh JPG, PNG, WebP &le; 5MB. Hệ thống tự resize 3 kích thước và chuyển WebP."
                  aspect="square"
                />
              </div>

              {/* Trạng thái Còn hàng */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Trạng thái mở bán
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {itemIsAvailable
                      ? 'Món đang sẵn sàng phục vụ khách gọi.'
                      : 'Món tạm hết nguyên liệu, khách không thể gọi.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setItemIsAvailable(!itemIsAvailable)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    itemIsAvailable ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setItemModalOpen(false)}
                  disabled={itemSubmitting}
                  className="text-xs border-slate-700 hover:bg-slate-800"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={itemSubmitting}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  {itemSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>{editingItem ? 'Lưu thay đổi' : 'Tạo món mới'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Quản Lý Danh Mục */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-blue-400" />
                <span>Quản Lý Danh Mục Thực Đơn</span>
              </h3>
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Add category form */}
              <form onSubmit={handleAddCategory} className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Thêm danh mục mới
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ví dụ: Signature Cocktail, Rượu Vang..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                    required
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={catSubmitting || !newCatName.trim()}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Thêm</span>
                  </Button>
                </div>
                {catError && (
                  <p className="text-[11px] text-rose-400">{catError}</p>
                )}
              </form>

              {/* List of categories with reorder / edit / delete */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                  Danh sách danh mục ({categories.length})
                </label>
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                  {categories.map((c, idx) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-2"
                    >
                      {editingCatId === c.id ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            className="flex-1 px-2 py-1 text-xs bg-slate-900 border border-blue-500 rounded-lg text-white"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCategoryName(c.id)}
                            className="p-1 rounded text-emerald-400 hover:bg-slate-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCatId(null)}
                            className="p-1 rounded text-slate-400 hover:bg-slate-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs font-bold text-white truncate">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            ({c.menu_items.length} món)
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Sort Up / Down */}
                        <button
                          type="button"
                          onClick={() => handleReorderCategory(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                          title="Chuyển lên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorderCategory(idx, 'down')}
                          disabled={idx === categories.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                          title="Chuyển xuống"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Name */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatId(c.id);
                            setEditingCatName(c.name);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title="Đổi tên"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c)}
                          className="p-1 rounded text-rose-400 hover:text-rose-300"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCatModalOpen(false)}
                className="text-xs border-slate-700"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
