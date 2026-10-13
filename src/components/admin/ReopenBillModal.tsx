'use client';

import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, X, Check } from 'lucide-react';

interface ReopenBillModalProps {
  billId: string | null;
  tableName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isProcessing?: boolean;
}

export function ReopenBillModal({
  billId,
  tableName,
  isOpen,
  onClose,
  onConfirm,
  isProcessing = false,
}: ReopenBillModalProps) {
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !billId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMsg('Vui lòng nhập lý do mở lại bill (tối thiểu 3 ký tự).');
      return;
    }
    setErrorMsg('');
    await onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 text-amber-600">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mở Lại Hóa Đơn • {tableName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dành riêng cho chủ quán (Role: Owner)
              </p>
            </div>
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

        {/* Warning info */}
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Thao tác nhạy cảm sẽ được ghi nhật ký kiểm toán</span>
          </div>
          <p className="leading-relaxed">
            Hóa đơn sẽ được chuyển lại thành phiên mở (status = &apos;open&apos;) để tiếp tục thêm món. Thao tác chỉ thành công nếu bàn chưa có lượt khách mới.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Lý do mở lại hóa đơn <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Ví dụ: Khách gọi thêm đồ uống sau khi đã thanh toán, tính nhầm chiết khấu..."
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
            />
            {errorMsg && <p className="text-[11px] text-rose-500 font-semibold mt-1">{errorMsg}</p>}
          </div>

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
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 active:scale-95"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Mở Lại</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
