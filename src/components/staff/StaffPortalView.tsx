'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffRealtime } from '@/hooks/useStaffRealtime';
import { useStaffPush } from '@/hooks/useStaffPush';
import { useWakeLock } from '@/hooks/useWakeLock';
import { soundManager } from '@/lib/sound-effects';
import { PwaInstallBanner } from './PwaInstallBanner';
import { DiagnosticsModal } from './DiagnosticsModal';

interface RequestItem {
  id: string;
  tableId: string;
  tableName: string;
  zoneId: string | null;
  zoneName: string;
  type: 'order' | 'call_staff' | 'request_bill';
  status: 'pending' | 'claimed' | 'done' | 'cancelled';
  orderId: string | null;
  itemsSummary: Array<{ name: string; quantity: number; note?: string | null }>;
  claimedBy: string | null;
  claimedByName: string | null;
  claimedAt: string | null;
  escalatedAt: string | null;
  isEscalated: boolean;
  createdAt: string;
  elapsedSeconds: number;
  escalationSeconds: number;
}

interface StaffPortalProps {
  user: {
    userId: string;
    email: string;
    name: string;
    role: string;
    restaurantId: string;
  };
}

export function StaffPortalView({ user }: StaffPortalProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'pending' | 'claimed' | 'other'>('pending');
  const [pendingRequests, setPendingRequests] = useState<RequestItem[]>([]);
  const [myClaimedRequests, setMyClaimedRequests] = useState<RequestItem[]>([]);
  const [otherZoneRequests, setOtherZoneRequests] = useState<RequestItem[]>([]);

  const [isOnDuty, setIsOnDuty] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'info' | 'error' } | null>(null);

  // Modal nhả việc
  const [releaseModalItem, setReleaseModalItem] = useState<RequestItem | null>(null);
  const [releaseReason, setReleaseReason] = useState('Bận phục vụ bàn khác');

  // Đếm giây cục bộ tăng dần mỗi giây để đồng hồ đếm thời gian nhảy mượt
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Hook quản lý PWA Push & Wake Lock
  const { isSubscribed, permission, requestPermissionAndSubscribe } = useStaffPush();
  const { isActive: isWakeLockActive, requestWakeLock } = useWakeLock(isOnDuty);

  // Lưu số lượng pending trước đó để phát hiện việc mới
  const prevPendingCountRef = useRef<number>(0);

  // 1. Tải danh sách yêu cầu từ API
  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/requests');
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        const newPending: RequestItem[] = json.data.pending || [];
        const newMyClaimed: RequestItem[] = json.data.myClaimed || [];
        const newOther: RequestItem[] = json.data.otherZones || [];

        // Kiểm tra xem có việc mới thêm vào không để kích hoạt chuông báo
        if (newPending.length > prevPendingCountRef.current && prevPendingCountRef.current >= 0) {
          const hasUrgent = newPending.some((r) => r.isEscalated);
          triggerNewRequestAlert(hasUrgent ? 'urgent' : 'normal');
        }
        prevPendingCountRef.current = newPending.length;

        setPendingRequests(newPending);
        setMyClaimedRequests(newMyClaimed);
        setOtherZoneRequests(newOther);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách yêu cầu:', err);
    }
  }, []);

  // 2. Kích hoạt cảnh báo chuông + rung + flash màn hình + đổi title tab
  const triggerNewRequestAlert = useCallback((level: 'normal' | 'urgent') => {
    // Phát âm thanh
    soundManager.startAlarm(level);
    setIsAlarmActive(true);

    // Rung điện thoại
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(level === 'urgent' ? [200, 100, 200, 100, 400] : [150, 80, 150]);
    }

    // Flash màn hình
    setScreenFlash(true);
    setTimeout(() => setScreenFlash(false), 800);
  }, []);

  // Tắt chuông cảnh báo
  const handleSilenceAlarm = () => {
    soundManager.stopAlarm();
    setIsAlarmActive(false);
  };

  // Cập nhật tiêu đề trang hiển thị số việc chờ
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const count = pendingRequests.length;
    if (count > 0) {
      document.title = `(${count}) Việc mới • QR Order Staff`;
    } else {
      document.title = 'QR Order • Nhân Viên';
    }
  }, [pendingRequests.length]);

  // 3. Xử lý sự kiện Realtime SSE
  const handleRealtimeEvent = useCallback(
    (event: any) => {
      fetchRequests();

      if (event.type === 'request_created') {
        triggerNewRequestAlert('normal');
      } else if (event.type === 'request_escalated') {
        triggerNewRequestAlert('urgent');
      } else if (event.type === 'request_claimed' || event.type === 'request_done') {
        // Nếu việc đã được nhận, tắt chuông lặp nếu không còn việc nào khác
        fetchRequests();
      }
    },
    [fetchRequests, triggerNewRequestAlert]
  );

  // Hook realtime kết nối SSE với tự động kết nối lại và polling dự phòng
  const { connectionStatus, isConnected } = useStaffRealtime(
    handleRealtimeEvent,
    fetchRequests
  );

  // 4. Bật / Tắt âm thanh
  const handleToggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  // 5. Thao tác "Bắt đầu ca" (Một lần chạm: mở khóa âm thanh, xin quyền push, xin wake lock)
  const handleStartShift = async () => {
    // a. Mở khóa AudioContext
    soundManager.unlockAudio();
    soundManager.playTone('normal');

    // b. Bật Wake Lock
    requestWakeLock();

    // c. Xin quyền thông báo và đăng ký Web Push
    if (permission !== 'granted') {
      await requestPermissionAndSubscribe();
    }

    setIsOnDuty(true);
    setActionNotice({ message: 'Đã sẵn sàng vào ca nhận đơn!', type: 'info' });
    setTimeout(() => setActionNotice(null), 3000);
    fetchRequests();
  };

  const handleEndShift = () => {
    soundManager.stopAlarm();
    setIsAlarmActive(false);
    setIsOnDuty(false);
    setActionNotice({ message: 'Đã kết thúc ca làm việc.', type: 'info' });
    setTimeout(() => setActionNotice(null), 3000);
  };

  // 6. NHẬN VIỆC (Optimistic UI - phản hồi tức thì)
  const handleClaim = async (item: RequestItem) => {
    handleSilenceAlarm();

    // Optimistic: Tạm thời chuyển request từ pending sang myClaimed
    setPendingRequests((prev) => prev.filter((r) => r.id !== item.id));
    setMyClaimedRequests((prev) => [
      { ...item, status: 'claimed', claimedBy: user.userId, claimedByName: user.name },
      ...prev,
    ]);
    setActiveTab('claimed');

    try {
      const res = await fetch(`/api/staff/requests/${item.id}/claim`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        // Rollback nếu bị từ chối
        fetchRequests();

        if (data.code === 'ALREADY_CLAIMED') {
          setActionNotice({
            message: `Yêu cầu này đã được ${data.claimedByName || 'đồng nghiệp'} tiếp nhận.`,
            type: 'info',
          });
        } else {
          setActionNotice({
            message: data.error || data.message || 'Không thể nhận yêu cầu này',
            type: 'error',
          });
        }
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch {
      fetchRequests();
      setActionNotice({ message: 'Lỗi kết nối khi nhận việc', type: 'error' });
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  // 7. HOÀN THÀNH ("ĐÃ PHỤC VỤ")
  const handleDone = async (item: RequestItem) => {
    // Optimistic: Xóa khỏi danh sách của tôi
    setMyClaimedRequests((prev) => prev.filter((r) => r.id !== item.id));

    try {
      const res = await fetch(`/api/staff/requests/${item.id}/done`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        fetchRequests();
        setActionNotice({ message: data.error || 'Lỗi khi báo hoàn thành', type: 'error' });
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch {
      fetchRequests();
    }
  };

  // 8. NHẢ VIỆC (Release)
  const handleConfirmRelease = async () => {
    if (!releaseModalItem) return;
    const item = releaseModalItem;
    setReleaseModalItem(null);

    // Optimistic: Xóa khỏi của tôi, trả về pending
    setMyClaimedRequests((prev) => prev.filter((r) => r.id !== item.id));

    try {
      const res = await fetch(`/api/staff/requests/${item.id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: releaseReason }),
      });
      const data = await res.json();
      fetchRequests();
      if (res.ok && data.success) {
        setActionNotice({ message: 'Đã nhả việc về hàng đợi chung', type: 'info' });
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch {
      fetchRequests();
    }
  };

  // Đăng xuất
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/staff/login');
    router.refresh();
  };

  // Định dạng loại request
  const getTypeBadge = (type: RequestItem['type']) => {
    switch (type) {
      case 'order':
        return { label: 'Đơn Gọi Món', color: 'bg-amber-500/15 text-[#C9A96A] border-amber-500/30' };
      case 'call_staff':
        return { label: 'Gọi Nhân Viên', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
      case 'request_bill':
        return { label: 'Yêu Cầu Thanh Toán', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
      default:
        return { label: 'Yêu Cầu', color: 'bg-neutral-800 text-neutral-300 border-neutral-700' };
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F3EFE6] flex justify-center selection:bg-[#C9A96A] selection:text-[#0B0B0C] pb-24">
      {/* Hiệu ứng Flash màn hình khi có việc khẩn */}
      {screenFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-[#C9A96A]/20 transition-opacity duration-500 animate-pulse" />
      )}

      {/* Mobile container tối đa 480px */}
      <div className="w-full max-w-[480px] min-h-screen bg-[#0E0E10] flex flex-col shadow-2xl border-x border-[rgba(255,255,255,0.06)] relative">
        {/* Banner cài đặt PWA (Android / iOS) */}
        <PwaInstallBanner />

        {/* Banner Cảnh báo mất kết nối */}
        {connectionStatus === 'disconnected' && (
          <div className="bg-red-950/90 border-b border-red-700/60 px-4 py-2.5 text-center text-xs font-semibold text-red-200 flex items-center justify-center gap-2 animate-pulse">
            <span>⚠️</span> Mất kết nối – có thể bỏ lỡ đơn. Đang tự động kết nối lại...
          </div>
        )}

        {/* Thanh trạng thái trên cùng */}
        <header className="sticky top-0 z-30 bg-[#141416]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Avatar chữ cái */}
            <div className="w-8 h-8 rounded-full bg-[#1D1D20] border border-[#C9A96A]/40 flex items-center justify-center text-[#C9A96A] text-xs font-serif font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-xs text-[#F3EFE6] leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#C9A96A]/15 text-[#C9A96A] font-semibold">
                  {user.role}
                </span>
              </div>
              <p className="text-[10px] text-[#A49F94] leading-tight mt-0.5">
                {isOnDuty ? '🟢 Đang trực ca' : '⚪ Chưa vào ca'}
              </p>
            </div>
          </div>

          {/* Nhóm nút tiện ích: Âm thanh, Chuông push, Chẩn đoán, Kết nối */}
          <div className="flex items-center gap-2">
            {/* Chỉ báo kết nối */}
            <div
              title={
                connectionStatus === 'connected'
                  ? 'Realtime đang kết nối'
                  : connectionStatus === 'reconnecting'
                  ? 'Đang kết nối lại'
                  : 'Mất kết nối'
              }
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#1B1B1F] border border-[rgba(255,255,255,0.06)] text-[10px]"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : connectionStatus === 'reconnecting'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-red-500'
                }`}
              />
              <span className="text-[10px] text-[#A49F94]">
                {connectionStatus === 'connected' ? 'Live' : 'Đang nối'}
              </span>
            </div>

            {/* Bật/Tắt âm thanh */}
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`p-2 rounded-full border transition-all ${
                isAudioMuted
                  ? 'bg-red-950/40 border-red-800/40 text-red-400'
                  : 'bg-[#1B1B1F] border-[rgba(255,255,255,0.08)] text-[#C9A96A]'
              }`}
              title={isAudioMuted ? 'Đang tắt âm' : 'Âm thanh bật'}
            >
              {isAudioMuted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>

            {/* Chẩn đoán thiết bị */}
            <button
              type="button"
              onClick={() => setIsDiagnosticsOpen(true)}
              className="p-2 rounded-full bg-[#1B1B1F] border border-[rgba(255,255,255,0.08)] text-[#A49F94] hover:text-white"
              title="Chẩn đoán thiết bị"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>

            {/* Đăng xuất */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-full bg-[#1B1B1F] border border-[rgba(255,255,255,0.08)] text-[#A49F94] hover:text-red-400"
              title="Đăng xuất"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Nút hành động CA LÀM VIỆC LỚN */}
        <div className="p-4 bg-gradient-to-b from-[#141416] to-transparent">
          {!isOnDuty ? (
            <button
              type="button"
              onClick={handleStartShift}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#C9A96A] via-[#EED7A1] to-[#C9A96A] text-[#0B0B0C] font-serif font-bold text-base tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-[#C9A96A]/25 hover:brightness-105 active:scale-[0.99] transition-all"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 animate-ping" />
              BẮT ĐẦU CA TRỰC
            </button>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#17171B] border border-[#C9A96A]/30 shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <p className="text-xs font-semibold text-[#F3EFE6]">Bạn đang trong ca trực</p>
                  <p className="text-[10px] text-[#A49F94]">
                    {isWakeLockActive ? 'Màn hình luôn sáng • Sẵn sàng nhận đơn' : 'Sẵn sàng nhận đơn'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEndShift}
                className="px-3 py-1.5 rounded-xl border border-red-800/50 bg-red-950/30 text-red-300 text-xs font-medium hover:bg-red-900/40 transition-all"
              >
                Kết thúc ca
              </button>
            </div>
          )}
        </div>

        {/* Nút Tắt chuông nổi bật khi đang kêu chuông */}
        {isAlarmActive && (
          <div className="mx-4 mb-3 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-between animate-bounce shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-xl animate-spin">🔔</span>
              <span className="text-xs font-bold text-amber-200">CÓ VIỆC MỚI CẦN NHẬN!</span>
            </div>
            <button
              type="button"
              onClick={handleSilenceAlarm}
              className="px-4 py-2 rounded-xl bg-amber-500 text-[#0B0B0C] font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95"
            >
              🔕 Tắt chuông
            </button>
          </div>
        )}

        {/* Thông báo thao tác ngắn */}
        {actionNotice && (
          <div
            className={`mx-4 mb-3 p-3 rounded-xl border text-xs text-center transition-all animate-in fade-in duration-300 ${
              actionNotice.type === 'error'
                ? 'bg-red-950/60 border-red-800/60 text-red-200'
                : 'bg-emerald-950/60 border-emerald-800/60 text-emerald-200'
            }`}
          >
            {actionNotice.message}
          </div>
        )}

        {/* Thanh 3 Tab điều hướng */}
        <div className="px-4 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'pending'
                ? 'border-[#C9A96A] text-[#C9A96A] font-bold'
                : 'border-transparent text-[#A49F94] hover:text-white'
            }`}
          >
            <span>Chờ nhận</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#C9A96A] text-[#0B0B0C] text-[10px] font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('claimed')}
            className={`flex-1 py-3 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'claimed'
                ? 'border-[#C9A96A] text-[#C9A96A] font-bold'
                : 'border-transparent text-[#A49F94] hover:text-white'
            }`}
          >
            <span>Của tôi</span>
            {myClaimedRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-[#0B0B0C] text-[10px] font-bold">
                {myClaimedRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('other')}
            className={`flex-1 py-3 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'other'
                ? 'border-[#C9A96A] text-[#C9A96A] font-bold'
                : 'border-transparent text-[#A49F94] hover:text-white'
            }`}
          >
            <span>Khu khác</span>
            {otherZoneRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-700 text-neutral-300 text-[10px] font-bold">
                {otherZoneRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Nội dung danh sách request theo tab */}
        <main className="p-4 flex-1 space-y-3.5">
          {activeTab === 'pending' && (
            <>
              {pendingRequests.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#18181C] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mx-auto text-[#A49F94]">
                    ✓
                  </div>
                  <p className="font-serif text-base text-[#F3EFE6]">Không Có Việc Chờ</p>
                  <p className="text-xs text-[#A49F94]">Tất cả bàn trong khu vực của bạn đã được phục vụ chu đáo.</p>
                </div>
              ) : (
                pendingRequests.map((item) => {
                  const badge = getTypeBadge(item.type);
                  const createdAtMs = new Date(item.createdAt).getTime();
                  const liveElapsed = Math.max(0, Math.floor((nowTimestamp - createdAtMs) / 1000));
                  const isOverdue = liveElapsed >= item.escalationSeconds;
                  const isWarning = liveElapsed >= item.escalationSeconds * 0.75;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl bg-[#141417] border p-4 space-y-3 shadow-lg transition-all ${
                        item.isEscalated || isOverdue
                          ? 'border-red-600/80 bg-red-950/20 shadow-red-900/20'
                          : isWarning
                          ? 'border-amber-500/60'
                          : 'border-[rgba(255,255,255,0.08)]'
                      }`}
                    >
                      {/* Header thẻ: Tên bàn lớn + Loại + Đồng hồ */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-serif text-xl font-bold tracking-wide text-[#F3EFE6]">
                              {item.tableName}
                            </h2>
                            <span className="text-[11px] text-[#A49F94] font-medium">
                              • {item.zoneName}
                            </span>
                          </div>
                          <span
                            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider uppercase ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Đồng hồ đếm thời gian */}
                        <div
                          className={`text-right px-2.5 py-1 rounded-xl border font-mono text-xs font-bold ${
                            item.isEscalated || isOverdue
                              ? 'bg-red-950/80 text-red-300 border-red-700 animate-pulse'
                              : isWarning
                              ? 'bg-amber-950/60 text-amber-300 border-amber-700'
                              : 'bg-[#1C1C20] text-[#A49F94] border-[rgba(255,255,255,0.06)]'
                          }`}
                        >
                          <div>{liveElapsed}s</div>
                          <div className="text-[9px] uppercase tracking-wider font-sans font-normal opacity-75">
                            {item.isEscalated || isOverdue ? 'Khẩn cấp' : 'Chờ'}
                          </div>
                        </div>
                      </div>

                      {/* Chi tiết tóm tắt món nếu có */}
                      {item.itemsSummary.length > 0 && (
                        <div className="p-3 rounded-xl bg-[#1A1A1E] border border-[rgba(255,255,255,0.04)] space-y-1.5 text-xs">
                          {item.itemsSummary.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-[#F3EFE6] font-medium">{m.name}</span>
                              <span className="px-1.5 py-0.2 rounded bg-[#C9A96A]/20 text-[#C9A96A] font-bold text-[11px]">
                                x{m.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Nút NHẬN LỚN */}
                      <button
                        type="button"
                        onClick={() => handleClaim(item)}
                        className="w-full py-3.5 rounded-xl bg-[#C9A96A] text-[#0B0B0C] font-serif font-bold text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all shadow-md shadow-[#C9A96A]/20"
                      >
                        TIẾP NHẬN YÊU CẦU
                      </button>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'claimed' && (
            <>
              {myClaimedRequests.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <p className="font-serif text-base text-[#F3EFE6]">Bạn Chưa Nhận Việc Nào</p>
                  <p className="text-xs text-[#A49F94]">Chuyển sang tab &quot;Chờ nhận&quot; để tiếp nhận bàn cần phục vụ.</p>
                </div>
              ) : (
                myClaimedRequests.map((item) => {
                  const badge = getTypeBadge(item.type);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-[#141417] border border-emerald-800/40 p-4 space-y-3.5 shadow-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-serif text-xl font-bold tracking-wide text-[#F3EFE6]">
                              {item.tableName}
                            </h2>
                            <span className="text-[11px] text-[#A49F94] font-medium">
                              • {item.zoneName}
                            </span>
                          </div>
                          <span
                            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider uppercase ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <span className="px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-[11px] font-medium">
                          Tôi đang xử lý
                        </span>
                      </div>

                      {/* Toàn bộ danh sách món */}
                      {item.itemsSummary.length > 0 && (
                        <div className="p-3 rounded-xl bg-[#1A1A1E] border border-[rgba(255,255,255,0.06)] space-y-2 text-xs">
                          <p className="text-[11px] text-[#A49F94] font-medium uppercase tracking-wider">
                            Danh sách món cần ra:
                          </p>
                          {item.itemsSummary.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between border-b border-[rgba(255,255,255,0.04)] pb-1 last:border-0 last:pb-0">
                              <span className="text-[#F3EFE6] font-medium">{m.name}</span>
                              <span className="px-2 py-0.5 rounded bg-[#C9A96A] text-[#0B0B0C] font-bold text-xs">
                                x{m.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Nhóm nút hành động: ĐÃ PHỤC VỤ (Lớn) & Nhả việc */}
                      <div className="flex items-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleDone(item)}
                          className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-serif font-bold text-sm uppercase tracking-wider active:scale-[0.99] transition-all shadow-md shadow-emerald-900/30"
                        >
                          ✓ ĐÃ PHỤC VỤ
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setReleaseModalItem(item);
                            setReleaseReason('Bận phục vụ bàn khác');
                          }}
                          className="px-4 py-3.5 rounded-xl bg-[#202024] border border-[rgba(255,255,255,0.08)] text-[#A49F94] text-xs font-medium hover:text-white hover:border-red-700/50 transition-all"
                        >
                          Nhả
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'other' && (
            <>
              {otherZoneRequests.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <p className="font-serif text-base text-[#F3EFE6]">Không Có Việc Khu Khác</p>
                  <p className="text-xs text-[#A49F94]">Tất cả các khu vực khác đều đang ổn định.</p>
                </div>
              ) : (
                otherZoneRequests.map((item) => {
                  const badge = getTypeBadge(item.type);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-[#141417] border border-[rgba(255,255,255,0.06)] p-4 space-y-2.5 opacity-80"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-serif text-lg font-bold text-[#F3EFE6]">
                              {item.tableName}
                            </h2>
                            <span className="text-[11px] text-[#A49F94]">
                              • {item.zoneName}
                            </span>
                          </div>
                          <span
                            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider uppercase ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <span className="text-xs text-[#C9A96A] bg-[#C9A96A]/10 border border-[#C9A96A]/20 px-2.5 py-1 rounded-full">
                          {item.claimedByName
                            ? `${item.claimedByName} đang xử lý`
                            : 'Chờ nhân viên khu khác'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </main>

        {/* Modal Nhả Việc */}
        {releaseModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-[#151518] border border-[var(--border)] p-6 space-y-4 shadow-2xl text-left">
              <h3 className="font-serif text-lg font-medium text-[#F3EFE6]">
                Nhả việc tại {releaseModalItem.tableName}
              </h3>
              <p className="text-xs text-[#A49F94]">
                Chọn lý do để đồng nghiệp trong ca kịp thời tiếp quản yêu cầu:
              </p>

              <div className="space-y-2">
                {[
                  'Bận phục vụ bàn khác',
                  'Khách đổi ý / Tạm hoãn',
                  'Hết ca trực',
                  'Cần hỗ trợ từ quản lý',
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReleaseReason(r)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                      releaseReason === r
                        ? 'bg-[#C9A96A]/15 border-[#C9A96A] text-[#C9A96A] font-semibold'
                        : 'bg-[#1C1C20] border-[rgba(255,255,255,0.06)] text-[#F3EFE6]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmRelease}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-500 transition-all shadow-md"
                >
                  Xác nhận nhả
                </button>
                <button
                  type="button"
                  onClick={() => setReleaseModalItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#232328] text-[#A49F94] text-xs hover:text-white"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Chẩn đoán thiết bị */}
        <DiagnosticsModal
          isOpen={isDiagnosticsOpen}
          onClose={() => setIsDiagnosticsOpen(false)}
          isRealtimeConnected={isConnected}
          isWakeLockActive={isWakeLockActive}
        />
      </div>
    </div>
  );
}
