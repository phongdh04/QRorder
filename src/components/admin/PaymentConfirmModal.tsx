'use client';

import React, { useState } from 'react';
import { CreditCard, Banknote, AlertTriangle, X, Check } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { TableItemData } from './TableCard';

interface PaymentConfirmModalProps {
  table: TableItemData;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: 'cash' | 'transfer') => Promise<void>;
  isProcessing?: boolean;
}

export function PaymentConfirmModal({
  table,
  isOpen,
  onClose,
  onConfirm,
  isProcessing = false,
}: PaymentConfirmModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [forceConfirmUnserved, setForceConfirmUnserved] = useState(false);

  if (!isOpen) return null;

  const orders = table.activeSession?.orders || [];
  const unservedOrders = orders.filter(
    (o: any) => o.status === 'pending' || o.status === 'preparing'
  );
  const hasUnserved = unservedOrders.length > 0;

  // Tổng hợp các món không bị hủy
  const validItemsMap = new Map<string, { name: string; quantity: number; subtotal: number }>();
  orders
    .filter((o: any) => o.status !== 'cancelled')
    .forEach((o: any) => {
      o.order_items.forEach((item: any) => {
        const exist = validItemsMap.get(item.name_snapshot);
        const sub = item.price_snapshot * item.quantity;
        if (exist) {
          exist.quantity += item.quantity;
          exist.subtotal += sub;
        } else {
          validItemsMap.set(item.name_snapshot, {
            name: item.name_snapshot,
            quantity: item.quantity,
            subtotal: sub,
          });
        }
      });
    });

  const validItems = Array.from(validItemsMap.values());

  const handlePay = async () => {
    if (hasUnserved && !forceConfirmUnserved) {
      return;
    }
    await onConfirm(paymentMethod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150 space-y-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Xác Nhận Thanh Toán • {table.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kiểm tra món và chọn phương thức thanh toán
            </p>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if unserved orders remain */}
        {hasUnserved && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs space-y-2">
            <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                Cảnh báo: Bàn còn {unservedOrders.length} đơn chưa hoàn thành phục vụ ({table.unservedCount} món đang làm/chờ).
              </span>
            </div>
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer pt-1 border-t border-amber-200/60 dark:border-amber-900/40 font-medium">
              <input
                type="checkbox"
                checked={forceConfirmUnserved}
                onChange={(e) => setForceConfirmUnserved(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px]">Tôi xác nhận khách đồng ý thanh toán ngay</span>
            </label>
          </div>
        )}

        {/* Item summary box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 max-h-48 overflow-y-auto space-y-2 text-xs">
          <div className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider pb-1 border-b border-slate-200 dark:border-slate-700">
            Danh sách món ({validItems.length} món)
          </div>
          {validItems.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="truncate pr-2">
                <strong className="text-slate-900 dark:text-white">{item.quantity}x</strong> {item.name}
              </span>
              <span className="font-semibold shrink-0">{formatVND(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Phương thức thanh toán:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-xs font-bold ${
                paymentMethod === 'cash'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Tiền mặt</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('transfer')}
              className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-xs font-bold ${
                paymentMethod === 'transfer'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Chuyển khoản</span>
            </button>
          </div>
        </div>

        {/* Total Display */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng thanh toán:</span>
            <p className="text-[10px] text-slate-400">Đã trừ các đơn bị hủy</p>
          </div>
          <div className="text-xl font-black text-blue-700 dark:text-blue-300">
            {formatVND(table.totalAmount)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isProcessing || (hasUnserved && !forceConfirmUnserved)}
            onClick={handlePay}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 active:scale-95"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Xác Nhận Thanh Toán</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
