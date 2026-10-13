'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Banknote, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/utils';

interface BillPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  tableToken: string;
  totalAmount: number;
  orders: any[];
}

export function BillPaymentModal({
  isOpen,
  onClose,
  tableName,
  tableToken,
  totalAmount,
  orders,
}: BillPaymentModalProps) {
  const [method, setMethod] = useState<'cash' | 'transfer'>('transfer');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Lọc các món hợp lệ từ các đơn không bị hủy
  const validItems: Array<{ name: string; quantity: number; price: number }> = [];
  orders.forEach((order) => {
    if (order.status !== 'cancelled') {
      order.order_items?.forEach((item: any) => {
        validItems.push({
          name: item.name_snapshot,
          quantity: item.quantity,
          price: item.price_snapshot,
        });
      });
    }
  });

  const handleRequestPayment = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/customer/payment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tableToken,
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi gửi yêu cầu.');
      setIsSent(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể gửi yêu cầu thanh toán.');
    } finally {
      setIsLoading(false);
    }
  };

  // VietQR link mô phỏng cho Demo Bar (MBBank - STK: 9999DEMOBAR)
  const transferContent = encodeURIComponent(`${tableName.replace(/\s+/g, '')} THANHTOAN`);
  const qrTransferUrl = `https://api.vietqr.io/image/970422-9999998888-compact.png?amount=${totalAmount}&addInfo=${transferContent}&accountName=THE%20VELVET%20LOUNGE`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-10 w-full max-w-md bg-[#0c101a] border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-lg">Hóa Đơn & Thanh Toán</h3>
                <p className="text-xs text-amber-400 font-medium">{tableName} • The Velvet Lounge</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSent ? (
              <div className="py-8 text-center space-y-4 my-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">Đã Gửi Yêu Cầu Thanh Toán!</h4>
                <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                  Nhân viên quầy bar đã nhận được thông báo thanh toán ({method === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}) của bạn và sẽ qua hỗ trợ ngay.
                </p>
                <Button variant="gold" onClick={onClose} className="w-full mt-4">
                  Đã hiểu
                </Button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto py-4 space-y-5">
                {/* Items summary */}
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-2.5 max-h-48 overflow-y-auto">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Các món trong phiên ({validItems.length})
                  </h4>
                  {validItems.length === 0 ? (
                    <p className="text-xs text-slate-500">Chưa có món nào được gọi.</p>
                  ) : (
                    validItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">
                          {item.name} <span className="text-amber-400 font-bold">x{item.quantity}</span>
                        </span>
                        <span className="font-medium text-slate-200">
                          {formatVND(item.price * item.quantity)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-sm font-semibold text-slate-200">Tổng thanh toán:</span>
                  <span className="text-xl font-extrabold text-amber-400">
                    {formatVND(totalAmount)}
                  </span>
                </div>

                {/* Payment method selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Hình thức thanh toán mong muốn:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMethod('transfer')}
                      className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all ${
                        method === 'transfer'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-amber-400" />
                      <span>Chuyển Khoản QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod('cash')}
                      className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all ${
                        method === 'cash'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Banknote className="w-5 h-5 text-emerald-400" />
                      <span>Tiền Mặt Tại Quầy</span>
                    </button>
                  </div>
                </div>

                {/* QR Code preview when transfer is selected */}
                {method === 'transfer' && totalAmount > 0 && (
                  <div className="p-4 rounded-2xl bg-white text-slate-950 text-center space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Mã VietQR Thanh Toán
                    </p>
                    <img
                      src={qrTransferUrl}
                      alt="VietQR Transfer"
                      className="w-48 h-48 mx-auto object-contain rounded-lg border border-slate-200"
                    />
                    <p className="text-[11px] text-slate-600">
                      Quét mã bằng bất kỳ ứng dụng ngân hàng nào
                    </p>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button
                  variant="gold"
                  className="w-full h-12 text-sm font-bold gap-2"
                  disabled={isLoading || totalAmount === 0}
                  onClick={handleRequestPayment}
                >
                  {isLoading ? 'Đang gửi...' : 'Gửi Yêu Cầu Thanh Toán'}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
