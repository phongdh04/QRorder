import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F3EFE6] flex items-center justify-center p-6 selection:bg-[#C9A96A] selection:text-[#0B0B0C]">
      <div className="w-full max-w-sm rounded-[24px] bg-[#151517] border border-[rgba(255,255,255,0.08)] p-8 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-[#1D1D20] border border-[#C9A96A]/30 flex items-center justify-center mx-auto text-[#C9A96A] font-serif font-bold text-xl">
          404
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-xl font-medium tracking-wide text-[#F3EFE6]">
            Trang Không Tồn Tại
          </h2>
          <div className="h-[1px] w-12 bg-[#C9A96A]/40 mx-auto my-2" />
          <p className="text-xs text-[#A49F94] leading-relaxed font-light">
            Đường dẫn bạn yêu cầu không tồn tại hoặc đã được thay đổi.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#C9A96A] text-[#0B0B0C] text-xs font-semibold hover:bg-[#d8be86] transition-colors"
          >
            Quay lại trang chủ
          </Link>
        </div>

        <p className="text-[10px] uppercase tracking-[0.2em] text-[#A49F94]/60 pt-2 font-light">
          The Velvet Lounge
        </p>
      </div>
    </div>
  );
}
