'use client';

import React, { useState, useEffect } from 'react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useStaffPush } from '@/hooks/useStaffPush';

interface DiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
  isRealtimeConnected: boolean;
  isWakeLockActive?: boolean;
}

export function DiagnosticsModal({
  isOpen,
  onClose,
  isRealtimeConnected,
  isWakeLockActive = false,
}: DiagnosticsProps) {
  const { isStandalone, isIos } = usePwaInstall();
  const { isSupported, permission, isSubscribed, isLoading, requestPermissionAndSubscribe } = useStaffPush();
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSendTestPush = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/staff/push/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult('Đã gửi lệnh thông báo thử! Vui lòng kiểm tra thanh thông báo của máy.');
      } else {
        setTestResult(`Lỗi: ${data.error || 'Không thể gửi thông báo thử'}`);
      }
    } catch (err: any) {
      setTestResult('Lỗi kết nối khi gửi thử');
    } finally {
      setTestSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-[#151518] border border-[var(--border)] p-6 space-y-5 shadow-2xl text-left">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-medium text-[var(--text)] flex items-center gap-2">
            <span>⚙️</span> Chẩn đoán thiết bị
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white p-1 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* 1. Trạng thái cài PWA */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1C1C20] border border-[var(--border)]">
            <span className="text-[var(--muted)]">Chế độ PWA (Standalone):</span>
            <span
              className={`font-medium px-2 py-0.5 rounded-full ${
                isStandalone
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
              }`}
            >
              {isStandalone ? 'Đã cài đặt' : isIos ? 'Trình duyệt Safari' : 'Trình duyệt Web'}
            </span>
          </div>

          {/* 2. Quyền thông báo */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1C1C20] border border-[var(--border)]">
            <span className="text-[var(--muted)]">Quyền thông báo:</span>
            <span
              className={`font-medium px-2 py-0.5 rounded-full ${
                permission === 'granted'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : permission === 'denied'
                  ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
              }`}
            >
              {permission === 'granted'
                ? 'Đã cấp quyền'
                : permission === 'denied'
                ? 'Bị chặn'
                : 'Chưa cấp'}
            </span>
          </div>

          {/* 3. Subscription Web Push */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1C1C20] border border-[var(--border)]">
            <span className="text-[var(--muted)]">Web Push Subscription:</span>
            <span
              className={`font-medium px-2 py-0.5 rounded-full ${
                isSubscribed
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {isSubscribed ? 'Đang hoạt động' : 'Chưa đăng ký'}
            </span>
          </div>

          {/* 4. Kết nối Realtime SSE */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1C1C20] border border-[var(--border)]">
            <span className="text-[var(--muted)]">Kết nối Realtime (SSE):</span>
            <span
              className={`font-medium px-2 py-0.5 rounded-full ${
                isRealtimeConnected
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : 'bg-red-950/60 text-red-400 border border-red-800/40'
              }`}
            >
              {isRealtimeConnected ? 'Đã kết nối' : 'Mất kết nối'}
            </span>
          </div>

          {/* 5. Giữ sáng màn hình (Screen Wake Lock) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1C1C20] border border-[var(--border)]">
            <span className="text-[var(--muted)]">Khóa sáng (Wake Lock):</span>
            <span
              className={`font-medium px-2 py-0.5 rounded-full ${
                isWakeLockActive
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {isWakeLockActive ? 'Đang giữ sáng' : 'Tắt'}
            </span>
          </div>
        </div>

        {/* Nút đăng ký nếu chưa cấp quyền */}
        {permission !== 'granted' && (
          <button
            type="button"
            onClick={requestPermissionAndSubscribe}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-[#0B0B0C] font-semibold text-xs hover:brightness-110 active:scale-95 transition-all shadow-sm"
          >
            {isLoading ? 'Đang xử lý...' : 'Cấp quyền thông báo ngay'}
          </button>
        )}

        {/* Nút Gửi thông báo thử */}
        <button
          type="button"
          onClick={handleSendTestPush}
          disabled={testSending || !isSubscribed}
          className="w-full py-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] font-medium text-xs hover:bg-[var(--accent)]/10 active:scale-95 transition-all disabled:opacity-50"
        >
          {testSending ? 'Đang gửi...' : '🔔 Gửi thông báo thử cho tôi'}
        </button>

        {testResult && (
          <p className="text-[11px] text-center p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30">
            {testResult}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-[#232328] text-[var(--text)] text-xs font-medium hover:bg-[#2A2A30] transition-all"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
