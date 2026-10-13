'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  QrCode,
  ExternalLink,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  Clock,
  Sparkles,
  CreditCard,
  Banknote,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/utils';
import { QRCodeModal } from '@/components/QRCodeModal';

export default function AdminTablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQRTable, setSelectedQRTable] = useState<{ name: string; token: string } | null>(null);

  // Modal đóng bàn / thanh toán
  const [checkoutTable, setCheckoutTable] = useState<any | null>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<'cash' | 'transfer'>('cash');
  const [isClosing, setIsClosing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/admin/tables');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.tables) {
          setTables(json.tables);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách bàn:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCloseSession = async () => {
    if (!checkoutTable) return;
    setIsClosing(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/tables/${checkoutTable.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: checkoutMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi đóng bàn thanh toán.');
      setCheckoutTable(null);
      await fetchTables();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể đóng bàn.');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            <span>Quản Lý Bàn & Mã QR Gọi Món</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi trạng thái phục vụ của 10 bàn, in mã QR và thực hiện chốt hóa đơn thu tiền.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTables}
          className="self-start sm:self-auto gap-2 text-xs border-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => {
          const hasActiveSession = !!table.activeSession;
          const sessionTotal = table.activeSession?.total || 0;

          return (
            <div
              key={table.id}
              className={`glass-panel rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                hasActiveSession
                  ? 'border-amber-500/40 bg-amber-500/[0.03] shadow-lg shadow-amber-500/5'
                  : 'border-slate-800/80'
              }`}
            >
              <div>
                {/* Table Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-white">{table.name}</span>
                  </div>

                  {hasActiveSession ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Có khách ({table.activeSession.ordersCount} đơn)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Bàn trống
                    </span>
                  )}
                </div>

                {/* Session Info */}
                <div className="py-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tiền tạm tính:</span>
                    <span className={`font-black text-sm ${hasActiveSession ? 'text-amber-400' : 'text-slate-500'}`}>
                      {formatVND(sessionTotal)}
                    </span>
                  </div>

                  {hasActiveSession && table.activeSession.opened_at && (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Mở lúc:</span>
                      <span>
                        {new Date(table.activeSession.opened_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedQRTable({ name: table.name, token: table.token })}
                    className="text-xs gap-1.5 border-slate-800 hover:border-amber-500/40"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mã QR</span>
                  </Button>

                  <a
                    href={`/t/${table.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full"
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs gap-1 text-slate-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Thử gọi</span>
                    </Button>
                  </a>
                </div>

                {/* Checkout button */}
                {hasActiveSession && (
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => setCheckoutTable(table)}
                    className="w-full text-xs font-bold gap-1.5 h-9"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Thanh Toán & Đóng Bàn</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal */}
      {selectedQRTable && (
        <QRCodeModal
          isOpen={!!selectedQRTable}
          onClose={() => setSelectedQRTable(null)}
          tableName={selectedQRTable.name}
          token={selectedQRTable.token}
        />
      )}

      {/* Checkout Modal */}
      {checkoutTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setCheckoutTable(null)}
          />

          <div className="relative z-10 w-full max-w-md bg-[#0c101a] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Thanh Toán & Đóng Bàn</h3>
                <p className="text-xs text-amber-400 font-semibold">{checkoutTable.name}</p>
              </div>
              <button
                onClick={() => setCheckoutTable(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Tổng tiền thanh toán:</span>
              <span className="text-xl font-black text-amber-400">
                {formatVND(checkoutTable.activeSession?.total || 0)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Phương thức khách thanh toán:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutMethod('cash')}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    checkoutMethod === 'cash'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span>Tiền mặt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutMethod('transfer')}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    checkoutMethod === 'transfer'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Chuyển khoản QR</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCheckoutTable(null)}
              >
                Hủy
              </Button>
              <Button
                variant="gold"
                className="flex-1 font-bold"
                disabled={isClosing}
                onClick={handleCloseSession}
              >
                {isClosing ? 'Đang xử lý...' : 'Xác Nhận & Đóng Bàn'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
