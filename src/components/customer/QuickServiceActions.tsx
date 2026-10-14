'use client';

import React, { useState, useEffect } from 'react';

interface QuickServiceActionsProps {
  tableToken: string;
}

export function QuickServiceActions({ tableToken }: QuickServiceActionsProps) {
  const [loadingType, setLoadingType] = useState<'call_staff' | 'request_bill' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<Record<string, number>>({});

  // Countdown timer for cooldowns
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        const next: Record<string, number> = {};
        let changed = false;
        for (const [key, val] of Object.entries(prev)) {
          if (val > 1) {
            next[key] = val - 1;
            changed = true;
          } else if (val === 1) {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSendRequest = async (type: 'call_staff' | 'request_bill') => {
    if (cooldownSeconds[type] && cooldownSeconds[type] > 0) {
      setFeedbackMessage(`Vui lòng đợi ${cooldownSeconds[type]} giây trước khi gửi tiếp.`);
      setIsError(true);
      return;
    }

    setLoadingType(type);
    setFeedbackMessage(null);
    setIsError(false);

    try {
      const res = await fetch('/api/customer/service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tableToken, type }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedbackMessage(data.error || 'Không thể gửi yêu cầu lúc này');
        setIsError(true);
        return;
      }

      setFeedbackMessage(data.message || 'Nhân viên sẽ đến ngay!');
      setIsError(false);
      // Set 60-second cooldown
      setCooldownSeconds((prev) => ({ ...prev, [type]: 60 }));

      // Clear feedback after 5s
      setTimeout(() => {
        setFeedbackMessage(null);
      }, 5000);
    } catch (err: any) {
      setFeedbackMessage('Lỗi kết nối khi gửi yêu cầu');
      setIsError(true);
    } finally {
      setLoadingType(null);
    }
  };

  const callStaffCooldown = cooldownSeconds['call_staff'] || 0;
  const requestBillCooldown = cooldownSeconds['request_bill'] || 0;

  return (
    <div className="w-full px-4 pt-3 pb-2">
      <div className="flex items-center justify-center gap-3">
        {/* Nút Gọi nhân viên */}
        <button
          type="button"
          onClick={() => handleSendRequest('call_staff')}
          disabled={loadingType !== null || callStaffCooldown > 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-[#18181A] border border-[var(--border)] hover:border-[var(--accent)]/50 active:scale-[0.98] transition-all shadow-sm text-xs font-serif tracking-wider text-[var(--text)] disabled:opacity-60"
        >
          {loadingType === 'call_staff' ? (
            <span className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="w-4 h-4 text-[var(--accent)]"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          )}
          <span>
            {callStaffCooldown > 0 ? `Đã gọi (${callStaffCooldown}s)` : 'Gọi nhân viên'}
          </span>
        </button>

        {/* Nút Yêu cầu thanh toán */}
        <button
          type="button"
          onClick={() => handleSendRequest('request_bill')}
          disabled={loadingType !== null || requestBillCooldown > 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-[#18181A] border border-[var(--border)] hover:border-[var(--accent)]/50 active:scale-[0.98] transition-all shadow-sm text-xs font-serif tracking-wider text-[var(--text)] disabled:opacity-60"
        >
          {loadingType === 'request_bill' ? (
            <span className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="w-4 h-4 text-[var(--accent)]"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          )}
          <span>
            {requestBillCooldown > 0 ? `Đã yêu cầu (${requestBillCooldown}s)` : 'Thanh toán'}
          </span>
        </button>
      </div>

      {/* Thông báo phản hồi */}
      {feedbackMessage && (
        <div
          className={`mt-2 text-center text-xs py-1.5 px-3 rounded-lg border transition-all animate-in fade-in duration-300 ${
            isError
              ? 'bg-red-950/40 border-red-800/50 text-red-300'
              : 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]'
          }`}
        >
          {feedbackMessage}
        </div>
      )}
    </div>
  );
}
