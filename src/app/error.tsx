'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Lỗi ứng dụng:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F3EFE6] flex items-center justify-center p-6 selection:bg-[#C9A96A] selection:text-[#0B0B0C]">
      <div className="w-full max-w-sm rounded-[24px] bg-[#151517] border border-[rgba(255,255,255,0.08)] p-8 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-xl font-medium tracking-wide text-[#F3EFE6]">
            Đã Xảy Ra Sự Cố
          </h2>
          <div className="h-[1px] w-12 bg-rose-500/40 mx-auto my-2" />
          <p className="text-xs text-[#A49F94] leading-relaxed font-light">
            Hệ thống đang gặp sự cố tạm thời khi tải trang. Vui lòng bấm thử lại hoặc tải lại trang.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A96A] text-[#0B0B0C] text-xs font-semibold hover:bg-[#d8be86] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại ngay</span>
          </button>
        </div>

        <p className="text-[10px] uppercase tracking-[0.2em] text-[#A49F94]/60 pt-2 font-light">
          The Velvet Lounge
        </p>
      </div>
    </div>
  );
}
