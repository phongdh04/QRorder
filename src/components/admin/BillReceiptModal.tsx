'use client';

import React from 'react';
import { Printer, X, Wine, CheckCircle2 } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { formatVnDateTime } from '@/lib/tz';
import { BillReceiptData } from '@/lib/dal/payment';

interface BillReceiptModalProps {
  receipt: BillReceiptData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BillReceiptModal({ receipt, isOpen, onClose }: BillReceiptModalProps) {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const methodLabel = receipt.session.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
        {/* Top action buttons (hidden when printing) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Hóa Đơn Thanh Toán</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Hóa Đơn</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="receipt-print-area" className="p-6 md:p-8 bg-white text-slate-900 font-sans print:p-0">
          {/* Header */}
          <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center mx-auto mb-2 print:border">
              <Wine className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-slate-950 uppercase">
              {receipt.restaurant.name}
            </h2>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
              HÓA ĐƠN THANH TOÁN
            </p>
          </div>

          {/* Meta Info */}
          <div className="py-3 text-xs space-y-1.5 border-b border-dashed border-slate-300 text-slate-600">
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Bàn:</span>
              <span className="font-extrabold text-slate-900 text-sm">{receipt.session.tableName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mã hóa đơn:</span>
              <span className="font-mono text-[11px]">{receipt.session.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Giờ vào:</span>
              <span>{formatVnDateTime(receipt.session.openedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Giờ thanh toán:</span>
              <span className="font-semibold text-slate-900">
                {formatVnDateTime(receipt.session.paidAt || new Date())}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phương thức:</span>
              <span className="font-bold text-slate-900">{methodLabel}</span>
            </div>
          </div>

          {/* Item List Table */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 text-[11px] border-b border-slate-200">
                  <th className="text-left font-semibold pb-1.5">Món</th>
                  <th className="text-center font-semibold pb-1.5 w-10">SL</th>
                  <th className="text-right font-semibold pb-1.5 w-16">Đơn giá</th>
                  <th className="text-right font-semibold pb-1.5 w-20">T.Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipt.items.map((item, idx) => (
                  <tr key={idx} className="text-slate-800">
                    <td className="py-1.5 font-medium pr-1">{item.name}</td>
                    <td className="py-1.5 text-center font-bold">{item.quantity}</td>
                    <td className="py-1.5 text-right text-slate-500">{formatVND(item.price)}</td>
                    <td className="py-1.5 text-right font-bold text-slate-900">{formatVND(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="pt-3 pb-4 space-y-1.5">
            <div className="flex justify-between items-baseline text-sm font-bold text-slate-700">
              <span>Tổng cộng:</span>
              <span className="text-xl font-black text-slate-950">{formatVND(receipt.session.total)}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-3 border-t border-dashed border-slate-300 space-y-1">
            <p className="text-xs font-bold text-slate-800">Cảm ơn quý khách và hẹn gặp lại!</p>
            <p className="text-[10px] text-slate-400">Hệ thống QR Order tự động • The Velvet Lounge</p>
          </div>
        </div>

        {/* Modal footer (hidden when printing) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Global Print Styles for 80mm thermal receipt & A5 paper */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #receipt-print-area,
          #receipt-print-area * {
            visibility: visible !important;
          }
          #receipt-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 4mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
          }
          @page {
            size: auto;
            margin: 3mm;
          }
        }
      `}</style>
    </div>
  );
}
