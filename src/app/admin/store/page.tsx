'use client';

import React, { useState, useEffect } from 'react';
import {
  Store,
  Check,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Wine,
  Palette,
  UploadCloud,
  Image as ImageIcon,
  AlignLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploadField } from '@/components/admin/ImageUploadField';

const ACCENT_PRESETS = [
  { name: 'Vàng Đồng Sang Trọng', hex: '#f59e0b', ring: 'ring-amber-500' },
  { name: 'Xanh Ngọc Emerald', hex: '#10b981', ring: 'ring-emerald-500' },
  { name: 'Xanh Đêm Sapphire', hex: '#2563eb', ring: 'ring-blue-600' },
  { name: 'Đỏ Rượu Ruby', hex: '#e11d48', ring: 'ring-rose-500' },
  { name: 'Tím Huyền Ảo Neon', hex: '#8b5cf6', ring: 'ring-purple-500' },
  { name: 'Hổ Phách Warm Amber', hex: '#d97706', ring: 'ring-amber-600' },
];

export default function AdminStorePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [menuDisplayMode, setMenuDisplayMode] = useState<'photo' | 'minimal'>('photo');

  // Fetch current store info
  const fetchStoreInfo = async () => {
    try {
      const res = await fetch('/api/admin/restaurant');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.restaurant) {
          const rest = json.restaurant;
          setName(rest.name || '');
          setLogoUrl(rest.logo_url || null);
          if (rest.theme && rest.theme.accent) {
            setAccentColor(rest.theme.accent);
          }
          if (rest.menu_display_mode) {
            setMenuDisplayMode(rest.menu_display_mode);
          }
        }
      }
    } catch (err) {
      console.error('Lỗi nạp thông tin quán:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên quán.');
      return;
    }

    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/restaurant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          logo_url: logoUrl || null,
          accentColor: accentColor,
          menu_display_mode: menuDisplayMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật quán.');

      setSuccessMsg('Thông tin quán và giao diện thương hiệu đã được cập nhật thành công!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi lưu thông tin.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-7 h-7 animate-spin text-blue-500" />
        <span className="text-xs">Đang tải thông tin quán...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500">
            <Store className="w-6 h-6" />
          </div>
          <span>Thông Tin Quán & Nhận Diện Thương Hiệu</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Cập nhật tên quán bar, tải lên logo chính thức và tinh chỉnh màu sắc chủ đạo (theme) hiển thị với khách hàng.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Form Fields */}
          <div className="md:col-span-2 space-y-6">
            {/* Tên Quán */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                Tên quán bar <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: The Velvet Lounge & Cocktail Bar"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 font-semibold"
                required
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tên quán sẽ xuất hiện ở đầu trang menu của khách hàng, hóa đơn tạm tính và bản in mã QR.
              </p>
            </div>

            {/* Logo Quán (WebP Upload) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                Logo thương hiệu
              </label>
              <ImageUploadField
                value={logoUrl}
                onChange={(url) => setLogoUrl(url)}
                label="Tải ảnh Logo"
                sublabel="Chấp nhận ảnh vuông hoặc tròn JPG, PNG, WebP &le; 5MB. Hệ thống tối ưu WebP tự động."
                aspect="circle"
              />
            </div>

            {/* Màu Chủ Đạo (Theme Accent) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Màu sắc chủ đạo (Theme Accent)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {accentColor.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Preset Palette */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ACCENT_PRESETS.map((p) => {
                  const isSelected =
                    accentColor.toLowerCase() === p.hex.toLowerCase();
                  return (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setAccentColor(p.hex)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: p.hex }}
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Input */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="text-xs text-slate-400">Mã màu tùy chỉnh:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#f59e0b"
                    className="w-28 px-2.5 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Chế Độ Hiển Thị Thực Đơn (Menu Display Mode) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Chế độ hiển thị thực đơn khách</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Chọn phong cách trình bày thực đơn khi khách quét mã QR tại bàn.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Có ảnh */}
                <button
                  type="button"
                  onClick={() => setMenuDisplayMode('photo')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                    menuDisplayMode === 'photo'
                      ? 'border-blue-500 bg-blue-500/10 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    {menuDisplayMode === 'photo' && (
                      <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Chế độ Có ảnh (Photo)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Hiển thị ảnh món WebP 4:3 sắc nét, hiệu ứng blur-up và Bottom Sheet chi tiết.
                    </p>
                  </div>
                </button>

                {/* Option 2: Tối giản */}
                <button
                  type="button"
                  onClick={() => setMenuDisplayMode('minimal')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                    menuDisplayMode === 'minimal'
                      ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                      <AlignLeft className="w-5 h-5" />
                    </div>
                    {menuDisplayMode === 'minimal' && (
                      <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Chế độ Tối giản (Minimal)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Thực đơn thẻ chữ thanh lịch phong cách bar cổ điển, không tải ảnh, tốc độ tức thì.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Mobile Preview Card */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Xem trước giao diện khách
            </label>
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[380px]">
              {/* Dynamic Header Glow */}
              <div
                className="absolute top-0 inset-x-0 h-24 opacity-20 blur-2xl pointer-events-none"
                style={{ backgroundColor: accentColor }}
              />

              {/* Brand Top */}
              <div className="relative z-10 flex flex-col items-center text-center space-y-2 pt-2">
                <div
                  className="w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center shadow-lg bg-slate-900"
                  style={{ borderColor: accentColor }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Wine className="w-8 h-8" style={{ color: accentColor }} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white truncate max-w-[200px]">
                    {name || 'Tên Quán Bar'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Bàn 01 • Chào mừng quý khách
                  </p>
                </div>
              </div>

              {/* Sample Item Card */}
              <div className="relative z-10 bg-slate-900/90 border border-slate-800/80 p-3 rounded-2xl space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Negroni Classic
                  </span>
                  <span
                    className="text-xs font-extrabold"
                    style={{ color: accentColor }}
                  >
                    145.000đ
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1">
                  Gin, Campari, Sweet Vermouth kết hợp vỏ cam nướng.
                </p>
                <div
                  className="w-full py-1.5 rounded-xl text-center text-xs font-bold text-white shadow-md"
                  style={{ backgroundColor: accentColor }}
                >
                  + Thêm vào giỏ hàng
                </div>
              </div>

              {/* Footer Indicator */}
              <div className="text-center pt-3">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  Live Preview • Theme Mode
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            type="submit"
            disabled={isSaving}
            className="text-xs gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 shadow-lg shadow-blue-500/20"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Lưu tất cả thay đổi</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
