'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadFieldProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  sublabel?: string;
  aspect?: 'square' | 'landscape' | 'circle' | '4:3';
  menuItemId?: string | null;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_SIZE_MB = 10;

export function ImageUploadField({
  value,
  onChange,
  label = 'Hình ảnh',
  sublabel = 'Chấp nhận JPG, PNG, WebP (Tối đa 10MB). Hệ thống tự cắt 4:3 và tối ưu WebP 3 kích thước.',
  aspect = '4:3',
  menuItemId,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // 1. Kiểm tra dung lượng
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Dung lượng ảnh vượt quá giới hạn ${MAX_SIZE_MB}MB.`);
      return;
    }

    // 2. Upload lên server
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Nếu có menuItemId, gọi API riêng cho món ăn (lưu vào menu_images)
      const uploadUrl = menuItemId
        ? `/api/admin/menu-items/${menuItemId}/image`
        : '/api/admin/upload';

      if (!menuItemId && value && value.startsWith('/uploads/')) {
        formData.append('oldImageUrl', value);
      }

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi tải ảnh lên máy chủ.');
      }

      // Trả về URL tiêu chuẩn (chuẩn WebP)
      const newUrl = data.image?.url || data.url;
      onChange(newUrl);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải ảnh lên.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);

    if (menuItemId) {
      try {
        await fetch(`/api/admin/menu-items/${menuItemId}/image`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Lỗi khi xóa ảnh món:', err);
      }
    }

    onChange(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // reset input để cho phép chọn lại file cùng tên nếu muốn
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const aspectClass =
    aspect === 'circle'
      ? 'w-28 h-28 rounded-full'
      : aspect === 'landscape'
      ? 'w-full h-40 rounded-xl'
      : aspect === '4:3'
      ? 'w-full max-w-[280px] aspect-[4/3] rounded-xl'
      : 'w-36 h-36 rounded-xl';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300">{label}</label>
        {value && !isUploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium"
          >
            Xóa ảnh
          </button>
        )}
      </div>

      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative overflow-hidden cursor-pointer border-2 border-dashed transition-all flex flex-col items-center justify-center p-3 text-center ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : value
            ? 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
            : 'border-slate-700 hover:border-slate-500 bg-slate-900/40'
        } ${aspectClass}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-slate-300">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-[11px] font-medium">Đang xử lý WebP...</span>
          </div>
        ) : value ? (
          <div className="relative w-full h-full group">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 rounded-lg">
              <UploadCloud className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-semibold">Bấm để thay ảnh</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-slate-400 p-2">
            <div className="p-2 rounded-full bg-slate-800 text-slate-300">
              <ImageIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-300">Chọn hoặc kéo ảnh</p>
            <p className="text-[10px] text-slate-500">JPG, PNG, WebP &le; 5MB</p>
          </div>
        )}
      </div>

      {sublabel && <p className="text-[11px] text-slate-500">{sublabel}</p>}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
