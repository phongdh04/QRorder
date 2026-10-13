'use client';

import React, { useState } from 'react';
import { X, Clock, CheckCheck, CreditCard, AlertCircle, Sparkles } from 'lucide-react';
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

export function TableDrawer({
  table,
  isOpen,
  onClose,
  onUpdateOrderStatus,
  onBatchConfirm,
  onPaySession,
}: TableDrawerProps) {
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [receiptData, setReceiptData] = useState<BillReceiptData | null>(null);

  if (!isOpen || !table) return null;

  const orders: AdminOrderData[] = table.activeSession?.orders || [];
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const elapsed = formatElapsed(table.openedAt);

  // Kiểm tra điều kiện bật nút thanh toán:
  // session đang 'open' và có ít nhất 1 món không bị hủy (totalAmount > 0)
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

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Drawer Container */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md sm:max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/70 dark:bg-slate-850">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {table.name}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {table.statusType === 'empty' ? 'Bàn Trống' : 'Đang Hoạt Động'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {elapsed}
                  </span>
                  <span>•</span>
                  <span>{orders.length} lần gọi món</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar (Xác nhận tất cả nếu có đơn chờ) */}
            {pendingOrders.length > 0 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/40 border-b border-orange-200 dark:border-orange-900/60 flex items-center justify-between gap-2">
                <div className="text-xs text-orange-800 dark:text-orange-300 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Có {pendingOrders.length} đơn đang chờ xác nhận</span>
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

            {/* Scrollable Order List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {orders.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Chưa có đơn nào
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
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

            {/* Footer: Tổng tiền & Nút Đã thanh toán */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Tổng tiền tạm tính:
                  </span>
                  <p className="text-[11px] text-slate-400">Không tính các đơn đã hủy</p>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
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
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-80'
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
          onClose(); // Đóng drawer sau khi xem/in xong hóa đơn
        }}
      />
    </>
  );
}
