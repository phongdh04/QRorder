'use client';

import React, { useState, useEffect } from 'react';
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

  // Modal phân lại (Reassign)
  const [reassignModalReqId, setReassignModalReqId] = useState<string | null>(null);
  const [onDutyStaffList, setOnDutyStaffList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  if (!isOpen || !table) return null;

  const orders: AdminOrderData[] = table.activeSession?.orders || [];
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const activeRequests = table.activeRequests || [];
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

  const handleCompleteRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/staff/requests/${requestId}/done`, {
        method: 'POST',
      });
      if (res.ok && onRefreshData) {
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
                      : table.colorStatus === 'green'
                      ? '🟢 Đã Phục Vụ'
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

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
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

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* PHẦN YÊU CẦU PHỤC VỤ (SERVICE REQUESTS) CỦA BÀN */}
              {activeRequests.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 tracking-wider uppercase">
                    <span className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      Yêu cầu & Tín hiệu ({activeRequests.length})
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {activeRequests.map((req: any) => {
                      const isClaimed = req.status === 'claimed';
                      const isEscalated = Boolean(req.escalatedAt);

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
                            <div className="font-bold text-sm text-white flex items-center gap-1.5">
                              <span>{typeIcon}</span>
                              <span>{typeLabel}</span>
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
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Phân lại</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCompleteRequest(req.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-all active:scale-95"
                            >
                              <Check className="w-3 h-3" />
                              <span>Đã phục vụ</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DANH SÁCH CÁC ĐƠN GỌI MÓN (ORDERS) */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                  Chi tiết các đợt gọi món ({orders.length})
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
