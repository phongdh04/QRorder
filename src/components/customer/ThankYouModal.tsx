'use client';

import React from 'react';
import { HeartHandshake, Sparkles, Check } from 'lucide-react';

interface ThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  tableName: string;
}

export function ThankYouModal({ isOpen, onClose, restaurantName, tableName }: ThankYouModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-[32px] bg-[#111318] border border-[#D4AF37]/40 p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-[#F7F4EB]">
        {/* Crest */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E222B] to-[#111318] border-2 border-[#D4AF37]/50 flex items-center justify-center mx-auto text-[#F3C766] shadow-xl shadow-[#D4AF37]/15">
          <HeartHandshake className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3C766] text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thanh toán hoàn tất</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-gold-gradient tracking-wide pt-1">
            Cảm Ơn Quý Khách!
          </h3>
          <p className="text-xs text-[#A8A295] leading-relaxed pt-1 font-light">
            Hóa đơn tại <strong className="text-[#F7F4EB] font-bold">{tableName}</strong> đã được thanh toán thành công. Rất hân hạnh được phục vụ quý khách tại <strong className="text-[#F3C766] font-bold">{restaurantName}</strong>.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#F3C766] via-[#D4AF37] to-[#B8922A] text-[#08090C] font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Tiếp Tục Đặt Món Mới</span>
          </button>
        </div>
      </div>
    </div>
  );
}
