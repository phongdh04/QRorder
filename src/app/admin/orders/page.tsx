'use client';

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Clock,
  Flame,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Coffee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const url =
        filterStatus === 'all'
          ? '/api/admin/orders'
          : `/api/admin/orders?status=${filterStatus}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.orders) {
          setOrders(json.orders);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Kết nối SSE Realtime để cập nhật đơn tức thì khi khách gửi
    const es = new EventSource('/api/admin/stream');
    es.addEventListener('order_created', () => fetchOrders());
    es.addEventListener('order_status_changed', () => fetchOrders());
    es.addEventListener('session_closed', () => fetchOrders());

    // Dự phòng tải lại mỗi 10s
    const interval = setInterval(fetchOrders, 10000);
    return () => {
      es.close();
      clearInterval(interval);
    };
  }, [filterStatus]);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: string,
    cancelReason?: string
  ) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, cancelReason }),
      });
      if (res.ok) {
        await fetchOrders();
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đơn:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelPrompt = (orderId: string) => {
    const reason = window.prompt('Nhập lý do hủy đơn (vd: hết nguyên liệu, khách đổi ý):', 'Hết nguyên liệu pha chế');
    if (reason !== null) {
      handleUpdateStatus(orderId, 'cancelled', reason);
    }
  };

  const statusFilters = [
    { id: 'all', label: 'Tất Cả' },
    { id: 'pending', label: 'Chờ Tiếp Nhận' },
    { id: 'preparing', label: 'Đang Pha Chế' },
    { id: 'served', label: 'Đã Phục Vụ' },
    { id: 'cancelled', label: 'Đã Hủy' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-amber-400" />
            <span>Màn Hình Điều Phối Quầy Bar (KDS)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cập nhật trạng thái pha chế và phục vụ theo thời gian thực (tự động làm mới mỗi 3s).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          className="self-start sm:self-auto gap-2 text-xs border-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới ({orders.length} đơn)</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {statusFilters.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.length === 0 ? (
          <div className="col-span-full py-16 text-center glass-panel rounded-3xl border border-slate-800 text-slate-400">
            <Coffee className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-semibold">Hiện không có đơn nào trong mục này.</p>
            <p className="text-xs text-slate-500 mt-1">
              Đơn gọi từ khách quét mã QR tại các bàn sẽ tự động hiển thị ở đây.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const isUpdating = updatingId === order.id;
            const orderTotal = order.order_items.reduce(
              (sum: number, it: any) => sum + it.price_snapshot * it.quantity,
              0
            );

            return (
              <div
                key={order.id}
                className={`glass-panel rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                  order.status === 'pending'
                    ? 'border-amber-500/50 shadow-lg shadow-amber-500/5'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-base font-extrabold text-amber-400">
                        {order.table?.name || 'Bàn chưa rõ'}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {new Date(order.created_at).toLocaleTimeString('vi-VN')}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Cancel reason if cancelled */}
                  {order.cancel_reason && (
                    <div className="my-2.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{order.cancel_reason}</span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="py-3 space-y-2.5 divide-y divide-slate-800/40">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="pt-2 first:pt-0 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">
                            {item.name_snapshot}{' '}
                            <span className="text-amber-400 font-bold text-sm">
                              x{item.quantity}
                            </span>
                          </span>
                          <span className="text-slate-400">
                            {formatVND(item.price_snapshot * item.quantity)}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-[11px] text-amber-300/80 italic mt-0.5">
                            👉 {item.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* General order note */}
                  {order.note && (
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 my-2">
                      <span className="text-slate-500 font-semibold">Ghi chú bàn: </span>
                      {order.note}
                    </div>
                  )}
                </div>

                {/* Card Footer with actions */}
                <div className="pt-3 border-t border-slate-800 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Tổng tiền đợt gọi:</span>
                    <span className="text-amber-400 font-bold">{formatVND(orderTotal)}</span>
                  </div>

                  {/* Action transitions */}
                  {order.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        variant="gold"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="text-xs font-bold gap-1"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Nhận Pha Chế</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleCancelPrompt(order.id)}
                        className="text-xs font-bold gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Hủy Đơn</span>
                      </Button>
                    </div>
                  )}

                  {order.status === 'preparing' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        variant="default"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, 'served')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã Phục Vụ</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleCancelPrompt(order.id)}
                        className="text-xs font-bold gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Hủy Đơn</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
