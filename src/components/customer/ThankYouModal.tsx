'use client';

import React from 'react';
import { Wine, HeartHandshake, Sparkles, Check } from 'lucide-react';

interface ThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  tableName: string;
}

export function ThankYouModal({ isOpen, onClose, restaurantName, tableName }: ThankYouModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#151517] border border-[rgba(201,169,106,0.3)] p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-[#F3EFE6]">
        {/* Crest */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#252528] to-[#151517] border border-[#C9A96A]/40 flex items-center justify-center mx-auto text-[#C9A96A] shadow-lg shadow-[#C9A96A]/10">
          <HeartHandshake className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A96A]/10 border border-[#C9A96A]/20 text-[#C9A96A] text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thanh toán hoàn tất</span>
          </div>
          <h3 className="font-serif text-xl font-medium text-[#F3EFE6] tracking-wide pt-1">
            Cảm Ơn Quý Khách!
          </h3>
          <p className="text-xs text-[#A49F94] leading-relaxed pt-1">
            Hóa đơn tại <strong className="text-[#F3EFE6]">{tableName}</strong> đã được thanh toán thành công. Rất hân hạnh được phục vụ quý khách tại <strong className="text-[#C9A96A]">{restaurantName}</strong>.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-[#C9A96A] to-[#B39355] hover:from-[#D4B577] hover:to-[#BE9E60] text-[#0B0B0C] font-semibold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Tiếp Tục Đặt Món Mới</span>
          </button>
        </div>
      </div>
    </div>
  );
}
