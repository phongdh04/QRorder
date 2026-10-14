'use client';

import React, { useState } from 'react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

export function PwaInstallBanner() {
  const { isInstallable, isStandalone, isIos, promptInstall } = usePwaInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Nếu đã ở chế độ standalone hoặc người dùng đã tắt banner trong phiên này thì không hiện
  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Banner cài đặt cho Android / Chrome */}
      {isInstallable && (
        <div className="bg-[#1A1A1E] border-b border-[var(--border)] px-4 py-2.5 flex items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--text)]">Cài đặt ứng dụng Nhân Viên</p>
              <p className="text-[11px] text-[var(--muted)]">Nhận thông báo đơn ngay cả khi tắt màn hình</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={promptInstall}
              className="px-3 py-1.5 rounded-full bg-[var(--accent)] text-[#0B0B0C] font-semibold text-xs hover:brightness-110 active:scale-95 transition-all shadow-sm"
            >
              Cài đặt
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 text-[var(--muted)] hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Nút nhắc nhở thêm vào màn hình chính cho iPhone / Safari */}
      {isIos && !isInstallable && (
        <div className="bg-[#1A1A1E] border-b border-[var(--border)] px-4 py-2.5 flex items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C9A96A]/10 border border-[#C9A96A]/30 flex items-center justify-center text-[#C9A96A] shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                <path d="M12 18h.01" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--text)]">Thêm vào Màn hình chính (iOS)</p>
              <p className="text-[11px] text-[var(--muted)]">Bắt buộc để nhận thông báo đẩy trên iPhone</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowIosGuide(true)}
              className="px-3 py-1.5 rounded-full border border-[var(--accent)] text-[var(--accent)] font-medium text-xs hover:bg-[var(--accent)]/10 active:scale-95 transition-all"
            >
              Xem cách cài
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 text-[var(--muted)] hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal hướng dẫn chi tiết từng bước cho iOS */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-[#151518] border border-[var(--border)] p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium text-[var(--text)] flex items-center gap-2">
                <span className="text-[#C9A96A]">📱</span> Hướng dẫn cài đặt trên iOS
              </h3>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-[var(--muted)] hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Apple chỉ cho phép ứng dụng Web Push gửi thông báo khi trang đã được lưu vào Màn hình chính:
            </p>

            <div className="space-y-3 text-xs text-[var(--text)]">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#1C1C20] border border-[var(--border)]">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Nhấn nút Chia sẻ trên Safari</p>
                  <p className="text-[11px] text-[var(--muted)]">Biểu tượng hình vuông có mũi tên chỉ lên ở thanh công cụ dưới đáy màn hình.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#1C1C20] border border-[var(--border)]">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Chọn "Thêm vào MH chính"</p>
                  <p className="text-[11px] text-[var(--muted)]">(Add to Home Screen) rồi nhấn "Thêm" ở góc trên bên phải.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#1C1C20] border border-[var(--border)]">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Mở app từ biểu tượng mới</p>
                  <p className="text-[11px] text-[var(--muted)]">Mở ứng dụng từ Màn hình chính và nhấn "Bắt đầu ca" để kích hoạt thông báo.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-[#0B0B0C] font-semibold text-xs hover:brightness-110 transition-all"
            >
              Tôi đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
