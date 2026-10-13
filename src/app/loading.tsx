import React from 'react';
import { Wine } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F3EFE6] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#1D1D20] border border-[#C9A96A]/30 flex items-center justify-center text-[#C9A96A] animate-pulse shadow-xl">
          <Wine className="w-6 h-6" />
        </div>
        <p className="text-xs text-[#A49F94] font-medium tracking-wider uppercase">
          Đang tải dữ liệu...
        </p>
      </div>
    </div>
  );
}
