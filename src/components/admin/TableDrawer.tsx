'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  CheckCheck,
  CreditCard,
  AlertCircle,
  Sparkles,
  Bell,
  UserCheck,
  RotateCcw,
  Check,
  AlertTriangle,
  UtensilsCrossed,
  ExternalLink,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { TableItemData } from './TableCard';
import { OrderCard, AdminOrderData } from './OrderCard';
import { OrderStatusType } from './StatusBadge';
import { PaymentConfirmModal } from './PaymentConfirmModal';
import { BillReceiptModal } from './BillReceiptModal';
import { BillReceiptData } from '@/lib/dal/payment';

interface TableDrawerProps {
  table: TableItemData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrderStatus: (
    orderId: string,
    targetStatus: OrderStatusType,
    cancelReason?: string
  ) => Promise<void>;
  onBatchConfirm: (tableId: string) => Promise<void>;
  onPaySession: (sessionId: string, paymentMethod: 'cash' | 'transfer') => Promise<BillReceiptData | null>;
  onRefreshData?: () => void;
}

interface ConsolidatedDishItem {
  name: string;
  totalQuantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string[];
  statusBreakdown: {
    pending: number;
    preparing: number;
    served: number;
  };
  orderBatchesCount: number;
}

function formatElapsed(openedAt: string | Date | null): string {
  if (!openedAt) return 'Chưa mở';
  const start = new Date(openedAt).getTime();
  const diffMinutes = Math.max(0, Math.floor((Date.now() - start) / 60000));
  if (diffMinutes < 1) return 'Vừa mở bàn';
  if (diffMinutes < 60) return `Đã mở ${diffMinutes} phút`;
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return `Đã mở ${hours}h ${mins > 0 ? `${mins}m` : ''}`;
}

function formatTimeOnly(dateInput: string | Date | null): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function TableDrawer({
  table,
  isOpen,
  onClose,
  onUpdateOrderStatus,
  onBatchConfirm,
  onPaySession,
  onRefreshData,
}: TableDrawerProps) {
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [receiptData, setReceiptData] = useState<BillReceiptData | null>(null);

  // Chế độ xem: 'dishes' (Tổng hợp món - mặc định) | 'batches' (Theo đợt gọi) | 'requests' (Yêu cầu phục vụ)
  const [activeTab, setActiveTab] = useState<'dishes' | 'batches' | 'requests'>('dishes');
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal phân lại (Reassign)
  const [reassignModalReqId, setReassignModalReqId] = useState<string | null>(null);
  const [onDutyStaffList, setOnDutyStaffList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab('dishes');
    setCopiedLink(false);
  }, [table?.id]);

  useEffect(() => {
    if (reassignModalReqId) {
      // Tải danh sách nhân viên đang trong ca
      fetch('/api/admin/shifts/current')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.allStaff) {
            const onDuty = data.allStaff
              .filter((s: any) => s.onDuty)
              .map((s: any) => ({ id: s.id, name: s.name }));
            setOnDutyStaffList(onDuty);
            if (onDuty.length > 0) {
              setSelectedStaffId(onDuty[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [reassignModalReqId]);

  // Gom nhóm tất cả món ăn của bàn qua các đợt gọi
  const consolidatedDishes = useMemo(() => {
    if (!table?.activeSession?.orders) return [];

    const map = new Map<string, ConsolidatedDishItem>();

    for (const order of table.activeSession.orders) {
      if (order.status === 'cancelled') continue;
      for (const item of order.order_items || []) {
        const key = item.name_snapshot.trim();
        const existing = map.get(key);
        const itemStatus = order.status; // 'pending' | 'preparing' | 'served'

        if (!existing) {
          map.set(key, {
            name: item.name_snapshot,
            totalQuantity: item.quantity,
            unitPrice: item.price_snapshot,
            totalPrice: item.price_snapshot * item.quantity,
            notes: item.note && item.note.trim() ? [item.note.trim()] : [],
            statusBreakdown: {
              pending: itemStatus === 'pending' ? item.quantity : 0,
              preparing: itemStatus === 'preparing' ? item.quantity : 0,
              served: itemStatus === 'served' ? item.quantity : 0,
            },
            orderBatchesCount: 1,
          });
        } else {
          existing.totalQuantity += item.quantity;
          existing.totalPrice += item.price_snapshot * item.quantity;
          if (
            item.note &&
            item.note.trim() &&
            !existing.notes.includes(item.note.trim())
          ) {
            existing.notes.push(item.note.trim());
          }
          if (itemStatus === 'pending') existing.statusBreakdown.pending += item.quantity;
          else if (itemStatus === 'preparing') existing.statusBreakdown.preparing += item.quantity;
          else if (itemStatus === 'served') existing.statusBreakdown.served += item.quantity;
          existing.orderBatchesCount += 1;
        }
      }
    }

    return Array.from(map.values());
  }, [table?.activeSession?.orders]);

  // Thống kê tổng hợp số lượng món của bàn
  const dishSummary = useMemo(() => {
    const totalItems = consolidatedDishes.reduce((sum, d) => sum + d.totalQuantity, 0);
    const totalServed = consolidatedDishes.reduce((sum, d) => sum + d.statusBreakdown.served, 0);
    const totalPreparing = consolidatedDishes.reduce((sum, d) => sum + d.statusBreakdown.preparing, 0);
    const totalPending = consolidatedDishes.reduce((sum, d) => sum + d.statusBreakdown.pending, 0);

    return { totalItems, totalServed, totalPreparing, totalPending };
  }, [consolidatedDishes]);

  // Gom nhóm yêu cầu: order giữ theo từng đơn, call_staff và request_bill gom đúng 1 thẻ duy nhất cho bàn
  const groupedRequests = useMemo(() => {
    const rawList = table?.activeRequests || [];
    const result: any[] = [];
    const callStaffList: any[] = [];
    const requestBillList: any[] = [];

    for (const req of rawList) {
      if (req.type === 'call_staff') {
        callStaffList.push(req);
      } else if (req.type === 'request_bill') {
        requestBillList.push(req);
      } else {
        result.push(req);
      }
    }

    const now = Date.now();

    // Gom toàn bộ tín hiệu gọi nhân viên thành 1 thẻ duy nhất
    if (callStaffList.length > 0) {
      callStaffList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const primary = callStaffList[0];
      const claimedItem = callStaffList.find((r) => r.status === 'claimed');
      const firstCreatedAt = new Date(primary.createdAt).getTime();
      const waitMinutes = Math.max(0, Math.floor((now - firstCreatedAt) / 60000));

      result.push({
        ...primary,
        id: claimedItem ? claimedItem.id : primary.id,
        allIds: callStaffList.map((r) => r.id),
        status: claimedItem ? 'claimed' : 'pending',
        claimedBy: claimedItem ? claimedItem.claimedBy : primary.claimedBy,
        claimedByName: claimedItem ? claimedItem.claimedByName : primary.claimedByName,
        claimedAt: claimedItem ? claimedItem.claimedAt : primary.claimedAt,
        escalatedAt: callStaffList.find((r) => r.escalatedAt)?.escalatedAt || null,
        callCount: callStaffList.length,
        waitMinutes,
      });
    }

    // Gom toàn bộ tín hiệu xin bill thành 1 thẻ duy nhất
    if (requestBillList.length > 0) {
      requestBillList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const primary = requestBillList[0];
      const claimedItem = requestBillList.find((r) => r.status === 'claimed');
      const firstCreatedAt = new Date(primary.createdAt).getTime();
      const waitMinutes = Math.max(0, Math.floor((now - firstCreatedAt) / 60000));

      result.push({
        ...primary,
        id: claimedItem ? claimedItem.id : primary.id,
        allIds: requestBillList.map((r) => r.id),
        status: claimedItem ? 'claimed' : 'pending',
        claimedBy: claimedItem ? claimedItem.claimedBy : primary.claimedBy,
        claimedByName: claimedItem ? claimedItem.claimedByName : primary.claimedByName,
        claimedAt: claimedItem ? claimedItem.claimedAt : primary.claimedAt,
        escalatedAt: requestBillList.find((r) => r.escalatedAt)?.escalatedAt || null,
        callCount: requestBillList.length,
        waitMinutes,
      });
    }

    return result;
  }, [table?.activeRequests]);

  if (!isOpen || !table) return null;

  const orders: AdminOrderData[] = table.activeSession?.orders || [];
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const elapsed = formatElapsed(table.openedAt);

  const canPay = Boolean(
    table.activeSession &&
    table.activeSession.status === 'open' &&
    table.totalAmount > 0
  );

  const handleBatchConfirm = async () => {
    setIsBatchProcessing(true);
    try {
      await onBatchConfirm(table.id);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleConfirmPayment = async (paymentMethod: 'cash' | 'transfer') => {
    if (!table.activeSession?.id) return;
    setIsPaying(true);
    try {
      const receipt = await onPaySession(table.activeSession.id, paymentMethod);
      setShowPaymentConfirm(false);
      if (receipt) {
        setReceiptData(receipt);
      }
    } finally {
      setIsPaying(false);
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalReqId || !selectedStaffId) return;

    setIsReassigning(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/requests/${reassignModalReqId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: selectedStaffId,
          reason: reassignReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi phân công lại.');
      }

      setReassignModalReqId(null);
      setReassignReason('');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setActionError(err?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleCompleteRequest = async (reqOrId: any) => {
    try {
      const ids: string[] =
        typeof reqOrId === 'object' && reqOrId?.allIds
          ? reqOrId.allIds
          : [typeof reqOrId === 'string' ? reqOrId : reqOrId.id];

      await Promise.all(
        ids.map((id) =>
          fetch(`/api/staff/requests/${id}/done`, {
            method: 'POST',
          })
        )
      );
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err) {
      console.error('Lỗi hoàn thành yêu cầu:', err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Drawer Container */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md sm:max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full text-slate-100">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {table.name}
                  </h2>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      table.colorStatus === 'red'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                        : table.colorStatus === 'orange'
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 animate-pulse'
                        : table.colorStatus === 'yellow'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : table.colorStatus === 'blue'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        : table.colorStatus === 'green'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {table.colorStatus === 'red'
                      ? '🚨 Khẩn Cấp'
                      : table.colorStatus === 'orange'
                      ? '⏱ Chờ Nhận'
                      : table.colorStatus === 'yellow'
                      ? '🟡 Đang Xử Lý'
                      : table.colorStatus === 'blue'
                      ? '🔵 Đang Xem Menu'
                      : table.colorStatus === 'green'
                      ? '🟢 Đã Lên Đủ Món'
                      : 'Bàn Trống'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {elapsed}
                  </span>
                  <span>•</span>
                  <span>Khu: <span className="text-slate-200 font-medium">{table.zoneName || 'Ngoài trời'}</span></span>
                  {table.assignedStaffNames && table.assignedStaffNames.length > 0 && (
                    <>
                      <span>•</span>
                      <span>Phụ trách: <span className="text-amber-300 font-medium">{table.assignedStaffNames.join(', ')}</span></span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Nút mở nhanh trang gọi món của bàn */}
                <a
                  href={`/t/${table.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                  title="Mở menu gọi món của bàn này"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions Bar nếu có đơn mới */}
            {pendingOrders.length > 0 && (
              <div className="p-3 bg-orange-950/40 border-b border-orange-900/60 flex items-center justify-between gap-2">
                <div className="text-xs text-orange-300 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span>Có {pendingOrders.length} đơn chờ duyệt</span>
                </div>
                <button
                  type="button"
                  disabled={isBatchProcessing}
                  onClick={handleBatchConfirm}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all disabled:opacity-50 active:scale-95"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>{isBatchProcessing ? 'Đang duyệt...' : 'Xác nhận tất cả'}</span>
                </button>
              </div>
            )}

            {/* Navigation Tabs: Món Ăn (Mặc định) | Theo Đợt Gọi | Yêu Cầu Phục Vụ */}
            <div className="px-4 sm:px-5 pt-2 bg-slate-950/70 border-b border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('dishes')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'dishes'
                    ? 'border-amber-500 text-amber-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Món ăn ({consolidatedDishes.length})</span>
                {dishSummary.totalItems > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    {dishSummary.totalItems} phần
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('batches')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'batches'
                    ? 'border-amber-500 text-amber-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Theo đợt ({orders.length})</span>
              </button>

              {groupedRequests.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'requests'
                      ? 'border-amber-500 text-amber-400 font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Yêu cầu</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/30 text-red-300 font-black animate-pulse">
                    {groupedRequests.length}
                  </span>
                </button>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Banner cảnh báo nhanh nếu có yêu cầu khi đang ở tab Món ăn hoặc Theo đợt */}
              {groupedRequests.length > 0 && activeTab !== 'requests' && (
                <div
                  onClick={() => setActiveTab('requests')}
                  className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200 cursor-pointer hover:bg-amber-500/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
                    <span>Bàn có <strong>{groupedRequests.length} yêu cầu</strong> cần phục vụ!</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5 underline">
                    Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}

              {/* TAB 1: DANH SÁCH CỤ THỂ MÓN ĂN CỦA BÀN (MẶC ĐỊNH) */}
              {activeTab === 'dishes' && (
                <div className="space-y-3">
                  {consolidatedDishes.length === 0 ? (
                    <div className="p-6 text-center space-y-4 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-950/40">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
                        <UtensilsCrossed className="w-6 h-6 text-slate-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-bold text-white">Bàn này chưa gọi món nào</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                          Khách chưa quét mã QR hoặc chưa gửi đơn gọi món từ điện thoại. Bạn có thể mở menu để gọi món trực tiếp cho khách.
                        </p>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                        <a
                          href={`/t/${table.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
                        >
                          <UtensilsCrossed className="w-4 h-4" />
                          <span>Mở Menu Gọi Món Cho Bàn</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/t/${table.token}`;
                            navigator.clipboard.writeText(url);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition-all active:scale-95 cursor-pointer"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Đã chép link</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Chép link bàn</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center gap-4 text-xs text-slate-500">
                        <span>Khu vực: <strong className="text-slate-300">{table.zoneName || 'Ngoài trời'}</strong></span>
                        <span>•</span>
                        <span>Sức chứa: <strong className="text-slate-300">{table.capacity || 4} chỗ</strong></span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Thanh tóm tắt trạng thái các món của bàn */}
                      <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                          <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                          <span>
                            Tổng: <strong className="text-white">{consolidatedDishes.length}</strong> món ({dishSummary.totalItems} phần)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {dishSummary.totalServed > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                              ✓ {dishSummary.totalServed} đã ra
                            </span>
                          )}
                          {dishSummary.totalPreparing > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                              ⏱ {dishSummary.totalPreparing} đang làm
                            </span>
                          )}
                          {dishSummary.totalPending > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">
                              ⚡ {dishSummary.totalPending} chờ duyệt
                            </span>
                          )}
                          {(dishSummary.totalPreparing > 0 || dishSummary.totalPending > 0) && (
                            <button
                              type="button"
                              onClick={async () => {
                                const activeOrders = orders.filter(
                                  (o) => o.status === 'pending' || o.status === 'preparing'
                                );
                                await Promise.all(
                                  activeOrders.map((o) => onUpdateOrderStatus(o.id, 'served'))
                                );
                              }}
                              className="ml-auto px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>✓ Ra đủ tất cả món</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Danh sách từng món ăn cụ thể */}
                      <div className="space-y-2.5">
                        {consolidatedDishes.map((dish) => {
                          const isAllServed = dish.statusBreakdown.served === dish.totalQuantity;
                          const isAllPending = dish.statusBreakdown.pending === dish.totalQuantity;

                          return (
                            <div
                              key={dish.name}
                              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all space-y-2 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  {/* Badge số lượng món nổi bật */}
                                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-black text-sm border border-amber-500/30 shrink-0">
                                    x{dish.totalQuantity}
                                  </span>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                                      {dish.name}
                                    </h4>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                      {formatVND(dish.unitPrice)} / phần
                                      {dish.orderBatchesCount > 1 && (
                                        <span className="text-[10px] text-slate-500 ml-2">
                                          (gọi qua {dish.orderBatchesCount} đợt)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="text-sm font-black text-amber-400 font-mono">
                                    {formatVND(dish.totalPrice)}
                                  </div>
                                  <div className="mt-1 flex items-center justify-end gap-1">
                                    {isAllServed ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        ✓ Đã ra đủ
                                      </span>
                                    ) : isAllPending ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                        ⚡ Chờ duyệt
                                      </span>
                                    ) : (
                                      <div className="flex items-center gap-1 text-[10px]">
                                        {dish.statusBreakdown.served > 0 && (
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                                            ✓ {dish.statusBreakdown.served} ra
                                          </span>
                                        )}
                                        {dish.statusBreakdown.preparing > 0 && (
                                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                                            ⏱ {dish.statusBreakdown.preparing} làm
                                          </span>
                                        )}
                                        {dish.statusBreakdown.pending > 0 && (
                                          <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-medium">
                                            ⚡ {dish.statusBreakdown.pending} chờ
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Ghi chú món nếu có */}
                              {dish.notes.length > 0 && (
                                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-amber-300/90 flex items-start gap-1.5">
                                  <span className="shrink-0 text-amber-400">📝</span>
                                  <span className="italic leading-relaxed font-medium">
                                    Ghi chú: {dish.notes.join(' • ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Nút chuyển nhanh sang xem chi tiết theo đợt gọi */}
                      <button
                        type="button"
                        onClick={() => setActiveTab('batches')}
                        className="w-full py-2 px-3 text-xs text-slate-400 hover:text-amber-300 font-medium text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Xem chi tiết theo từng đợt gọi ({orders.length} đợt)</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: CHI TIẾT THEO TỪNG ĐỢT GỌI MÓN (BATCHES) */}
              {activeTab === 'batches' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center justify-between">
                    <span>Chi tiết các đợt gọi món ({orders.length})</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dishes')}
                      className="text-amber-400 hover:underline normal-case font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <UtensilsCrossed className="w-3 h-3" />
                      <span>Xem tổng hợp món</span>
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-center p-6 space-y-2 border-2 border-dashed border-slate-800 rounded-2xl">
                      <AlertCircle className="w-7 h-7 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-300">
                        Chưa có đơn nào
                      </p>
                      <p className="text-xs text-slate-500 max-w-xs">
                        Bàn hiện đang trống hoặc khách chưa bấm gửi đơn từ mã QR.
                      </p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={onUpdateOrderStatus}
                      />
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: DANH SÁCH CÁC YÊU CẦU PHỤC VỤ (REQUESTS) */}
              {activeTab === 'requests' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 tracking-wider uppercase">
                    <span className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      Yêu cầu & Tín hiệu ({groupedRequests.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dishes')}
                      className="text-amber-400 hover:underline normal-case font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <UtensilsCrossed className="w-3 h-3" />
                      <span>Xem món ăn của bàn</span>
                    </button>
                  </div>

                  {groupedRequests.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center p-6 space-y-2 border-2 border-dashed border-slate-800 rounded-2xl">
                      <Check className="w-7 h-7 text-emerald-400" />
                      <p className="text-sm font-semibold text-slate-300">
                        Không có yêu cầu nào đang chờ
                      </p>
                      <p className="text-xs text-slate-500">
                        Tất cả tín hiệu gọi nhân viên và yêu cầu thanh toán đã được xử lý xong.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {groupedRequests.map((req: any) => {
                        const isClaimed = req.status === 'claimed';
                        const isEscalated = Boolean(req.escalatedAt || req.isEscalated);

                        let typeLabel = 'Đơn mới';
                        let typeIcon = '🍽️';
                        if (req.type === 'call_staff') {
                          typeLabel = 'Khách gọi nhân viên';
                          typeIcon = '🛎️';
                        } else if (req.type === 'request_bill') {
                          typeLabel = 'Yêu cầu thanh toán';
                          typeIcon = '💳';
                        }

                        return (
                          <div
                            key={req.id}
                            className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                              isEscalated
                                ? 'bg-red-500/10 border-red-500/40 ring-1 ring-red-500/30'
                                : isClaimed
                                ? 'bg-amber-500/10 border-amber-500/30'
                                : 'bg-orange-500/10 border-orange-500/30'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-bold text-sm text-white flex items-center gap-2 flex-wrap">
                                <span>{typeIcon}</span>
                                <span>{typeLabel}</span>
                                {/* Count số phút khách đã gọi */}
                                {req.waitMinutes !== undefined && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    Đã gọi {req.waitMinutes} phút
                                  </span>
                                )}
                                {req.callCount > 1 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    Khách gọi {req.callCount} lần
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isEscalated && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white animate-pulse">
                                    Khẩn cấp
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isClaimed
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                  }`}
                                >
                                  {isClaimed ? 'Đang xử lý' : 'Chờ nhận'}
                                </span>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-300 flex items-center justify-between">
                              <span>Tạo lúc: {formatTimeOnly(req.createdAt)}</span>
                              {isClaimed && (
                                <span className="text-amber-300 font-medium">
                                  👤 {req.claimedByName || 'Nhân viên'} nhận ({formatTimeOnly(req.claimedAt)})
                                </span>
                              )}
                            </div>

                            {/* Nút hành động cho quản lý */}
                            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setReassignModalReqId(req.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Phân lại</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCompleteRequest(req)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Đã phục vụ</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer: Tổng tiền & Nút Đã thanh toán */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400">
                    Tổng tiền tạm tính:
                  </span>
                  <p className="text-[11px] text-slate-500">Không tính các đơn đã hủy</p>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  {formatVND(table.totalAmount)}
                </div>
              </div>

              {/* Nút Thanh toán bàn */}
              <button
                type="button"
                disabled={!canPay}
                onClick={() => setShowPaymentConfirm(true)}
                className={`w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] ${
                  canPay
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-80'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {canPay ? 'Thanh Toán & Chốt Bàn' : 'Đã Thanh Toán (Chưa có món)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Phân công lại (Reassign) */}
      {reassignModalReqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                Phân công lại nhân viên
              </h3>
              <button
                type="button"
                onClick={() => setReassignModalReqId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleReassignSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Chọn nhân viên đang trong ca:
                </label>
                {onDutyStaffList.length === 0 ? (
                  <p className="text-xs text-amber-400 italic">
                    Hiện chưa có nhân viên nào trong ca trực. Vui lòng mở ca hoặc bật ca trực.
                  </p>
                ) : (
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500"
                  >
                    {onDutyStaffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lý do phân lại (tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nhân viên bận phục vụ bàn khác..."
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReassignModalReqId(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isReassigning || onDutyStaffList.length === 0}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isReassigning ? 'Đang lưu...' : 'Xác nhận phân lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xác nhận thanh toán */}
      <PaymentConfirmModal
        table={table}
        isOpen={showPaymentConfirm}
        onClose={() => setShowPaymentConfirm(false)}
        onConfirm={handleConfirmPayment}
        isProcessing={isPaying}
      />

      {/* Modal hiển thị hóa đơn & In bill */}
      <BillReceiptModal
        receipt={receiptData}
        isOpen={Boolean(receiptData)}
        onClose={() => {
          setReceiptData(null);
          onClose();
        }}
      />
    </>
  );
}
