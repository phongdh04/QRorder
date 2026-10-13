'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle2, Check, XCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { StatusBadge, OrderStatusType } from './StatusBadge';

export interface OrderItemData {
  id: string;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  note: string | null;
}

export interface AdminOrderData {
  id: string;
  status: OrderStatusType;
  note: string | null;
  cancel_reason: string | null;
  created_at: string | Date;
  order_items: OrderItemData[];
}

interface OrderCardProps {
  order: AdminOrderData;
  onUpdateStatus: (
    orderId: string,
    targetStatus: OrderStatusType,
    cancelReason?: string
  ) => Promise<void>;
  isProcessing?: boolean;
}

function formatTime(isoString: string | Date): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function OrderCard({ order, onUpdateStatus, isProcessing = false }: OrderCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const orderTotal = order.order_items.reduce(
    (sum, item) => sum + item.price_snapshot * item.quantity,
    0
  );

  const handleConfirmOrder = () => {
    onUpdateStatus(order.id, 'preparing');
  };

  const handleServeOrder = () => {
    onUpdateStatus(order.id, 'served');
  };

  const handleOpenCancel = () => {
    setCancelReason('');
    setCancelError('');
    setShowCancelModal(true);
  };

  const handleSubmitCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do hủy đơn (ví dụ: Hết nguyên liệu, Khách đổi ý...).');
      return;
    }
    await onUpdateStatus(order.id, 'cancelled', cancelReason.trim());
    setShowCancelModal(false);
  };

  const isCancelled = order.status === 'cancelled';
  const isServed = order.status === 'served';

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isCancelled
          ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
          : order.status === 'pending'
          ? 'bg-orange-50/40 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/80 shadow-sm'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
      }`}
    >
      {/* Header đơn: Giờ gửi, ID rút gọn, Badge trạng thái */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(order.created_at)}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            #{order.id.slice(-5).toUpperCase()}
          </span>
        </div>
        <StatusBadge type="order" status={order.status} size="sm" />
      </div>

      {/* Danh sách các món trong đơn */}
      <div className="py-2.5 space-y-2 text-xs">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {item.quantity}x
                </span>
                <span
                  className={`font-medium ${
                    isCancelled
                      ? 'line-through text-slate-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {item.name_snapshot}
                </span>
              </div>
              {item.note && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 pl-5 italic flex items-center gap-1 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                  <span>Ghi chú: {item.note}</span>
                </div>
              )}
            </div>
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
              {formatVND(item.price_snapshot * item.quantity)}
            </span>
          </div>
        ))}

        {/* Ghi chú chung của đơn (nếu có) */}
        {order.note && (
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong className="font-semibold text-slate-700 dark:text-slate-200">
                Ghi chú đơn:
              </strong>{' '}
              {order.note}
            </span>
          </div>
        )}

        {/* Lý do hủy đơn (nếu đã hủy) */}
        {isCancelled && order.cancel_reason && (
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <span>
              <strong>Lý do hủy:</strong> {order.cancel_reason}
            </span>
          </div>
        )}
      </div>

      {/* Footer đơn: Tổng tiền đơn & Các nút hành động */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div className="text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Tiền đơn:</span>
          <span
            className={`font-bold ${
              isCancelled
                ? 'line-through text-slate-400'
                : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {formatVND(orderTotal)}
          </span>
          {isCancelled && (
            <span className="text-[10px] text-rose-500 ml-1.5 font-medium">(Đã loại trừ)</span>
          )}
        </div>

        {/* Action buttons */}
        {!isCancelled && !isServed && (
          <div className="flex items-center gap-1.5">
            {order.status === 'pending' && (
              <>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmOrder}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all disabled:opacity-50 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Xác nhận</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleOpenCancel}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-400 hover:text-rose-600 text-slate-500 dark:text-slate-400 text-xs font-medium transition-all disabled:opacity-50"
                  title="Hủy đơn này"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {order.status === 'preparing' && (
              <>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleServeOrder}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all disabled:opacity-50 active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã phục vụ</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleOpenCancel}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-400 hover:text-rose-600 text-slate-500 dark:text-slate-400 text-xs font-medium transition-all disabled:opacity-50"
                  title="Hủy đơn này"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal / Dialog Hủy Đơn */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Xác nhận hủy đơn hàng
              </h4>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Đơn hàng sau khi hủy sẽ không tính vào tổng tiền của bàn. Bắt buộc nhập lý do hủy để
              lưu vào nhật ký quản lý.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lý do hủy đơn <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (cancelError) setCancelError('');
                }}
                placeholder="Ví dụ: Khách báo đổi món, quầy bar hết nguyên liệu..."
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
              />
              {cancelError && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{cancelError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSubmitCancel}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
              >
                Hủy đơn này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
