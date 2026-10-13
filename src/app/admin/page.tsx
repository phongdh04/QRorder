'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { TableGrid } from '@/components/admin/TableGrid';
import { TableDrawer } from '@/components/admin/TableDrawer';
import { KitchenQueue, KitchenQueueItem } from '@/components/admin/KitchenQueue';
import { TableItemData } from '@/components/admin/TableCard';
import { OrderStatusType } from '@/components/admin/StatusBadge';
import { AdminToastContainer, ToastMessage } from '@/components/admin/AdminToast';
import { playChimeSound } from '@/lib/sound';
import { formatVND } from '@/lib/utils';

export default function AdminTablesAndOrdersPage() {
  const { isSoundEnabled, setConnectionStatus } = useAdmin();

  const [tables, setTables] = useState<TableItemData[]>([]);
  const [kitchenQueue, setKitchenQueue] = useState<KitchenQueueItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Ref giữ trạng thái âm thanh để dùng trong SSE callback không bị stale closure
  const isSoundEnabledRef = useRef(isSoundEnabled);
  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  // Thêm toast thông báo
  const addToast = useCallback(
    (type: ToastMessage['type'], title: string, message: string, tableId?: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, message, tableId }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Tải danh sách bàn
  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tables');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.tables) {
          setTables(json.tables);
        }
      }
    } catch (err) {
      console.error('Lỗi fetch bàn:', err);
    }
  }, []);

  // 2. Tải hàng đợi món cần làm (Kitchen Queue)
  const fetchKitchenQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/kitchen-queue');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.queue) {
          setKitchenQueue(json.queue);
        }
      }
    } catch (err) {
      console.error('Lỗi fetch kitchen queue:', err);
    }
  }, []);

  // Tải dữ liệu ban đầu
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchTables(), fetchKitchenQueue()]);
    setIsLoading(false);
  }, [fetchTables, fetchKitchenQueue]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 3. Cập nhật tiêu đề tab trình duyệt theo số đơn chờ xác nhận
  useEffect(() => {
    const pendingOrdersCount = tables.reduce((acc, t) => {
      if (!t.activeSession?.orders) return acc;
      return acc + t.activeSession.orders.filter((o: any) => o.status === 'pending').length;
    }, 0);

    if (pendingOrdersCount > 0) {
      document.title = `(${pendingOrdersCount}) Đơn mới | The Velvet Lounge`;
    } else {
      document.title = 'Bàn & Đơn | The Velvet Lounge';
    }
  }, [tables]);

  // 4. Kết nối SSE Realtime tới /api/admin/stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      setConnectionStatus('connecting');
      eventSource = new EventSource('/api/admin/stream');

      eventSource.addEventListener('connected', () => {
        setConnectionStatus('connected');
        // Tải lại dữ liệu mới nhất sau khi nối lại để không bị sót đơn
        fetchTables();
        fetchKitchenQueue();
      });

      // Nhận sự kiện có đơn mới từ khách gọi
      eventSource.addEventListener('order_created', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          const tableName = payload.data?.tableName || 'Khách';

          // Phát âm thanh chuông "ting" nếu bật
          if (isSoundEnabledRef.current) {
            playChimeSound();
          }

          // Hiện popup toast
          addToast(
            'order',
            `Có đơn mới từ ${tableName}!`,
            `Khách vừa gửi đơn gọi món tới quầy bar.`,
            payload.tableId
          );

          // Cập nhật dữ liệu ngay lập tức
          fetchTables();
          fetchKitchenQueue();
        } catch (err) {
          console.error('Lỗi xử lý SSE order_created:', err);
        }
      });

      // Nhận sự kiện đơn đổi trạng thái
      eventSource.addEventListener('order_status_changed', () => {
        fetchTables();
        fetchKitchenQueue();
      });

      // Nhận sự kiện session bàn thay đổi / đóng thanh toán
      eventSource.addEventListener('session_closed', () => {
        fetchTables();
        fetchKitchenQueue();
      });

      eventSource.onerror = () => {
        setConnectionStatus('connecting');
        eventSource?.close();
        // Tự động kết nối lại sau 3 giây
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, [fetchTables, fetchKitchenQueue, addToast, setConnectionStatus]);

  // Bàn hiện tại đang được chọn để mở Drawer
  const selectedTable = tables.find((t) => t.id === selectedTableId) || null;

  // 5. Cập nhật lạc quan (Optimistic UI) khi đổi trạng thái đơn
  const handleUpdateOrderStatus = async (
    orderId: string,
    targetStatus: OrderStatusType,
    cancelReason?: string
  ) => {
    // Lưu lại snapshot hiện tại để rollback nếu thất bại
    const previousTables = [...tables];
    const previousQueue = [...kitchenQueue];

    // Cập nhật giao diện lạc quan ngay lập tức
    setTables((prevTables) =>
      prevTables.map((tbl) => {
        if (!tbl.activeSession?.orders) return tbl;
        const targetOrder = tbl.activeSession.orders.find((o: any) => o.id === orderId);
        if (!targetOrder) return tbl;

        const updatedOrders = tbl.activeSession.orders.map((o: any) => {
          if (o.id === orderId) {
            return {
              ...o,
              status: targetStatus,
              cancel_reason: targetStatus === 'cancelled' ? cancelReason : o.cancel_reason,
            };
          }
          return o;
        });

        // Tính lại số món chưa phục vụ
        let unservedCount = 0;
        updatedOrders.forEach((o: any) => {
          if (o.status === 'pending' || o.status === 'preparing') {
            o.order_items.forEach((item: any) => {
              unservedCount += item.quantity;
            });
          }
        });

        // Tính lại tổng tiền (loại trừ đơn hủy)
        const totalAmount = updatedOrders
          .filter((o: any) => o.status !== 'cancelled')
          .reduce((sum: number, o: any) => {
            return (
              sum +
              o.order_items.reduce(
                (iSum: number, item: any) => iSum + item.price_snapshot * item.quantity,
                0
              )
            );
          }, 0);

        // Xác định loại trạng thái bàn
        const hasPending = updatedOrders.some((o: any) => o.status === 'pending');
        const hasPreparing = updatedOrders.some((o: any) => o.status === 'preparing');
        let statusType: TableItemData['statusType'] = 'occupied';
        if (hasPending) statusType = 'pending';
        else if (hasPreparing) statusType = 'preparing';

        return {
          ...tbl,
          statusType,
          unservedCount,
          totalAmount,
          activeSession: {
            ...tbl.activeSession,
            total: totalAmount,
            orders: updatedOrders,
          },
        };
      })
    );

    // Cập nhật lạc quan trên Kitchen Queue
    if (targetStatus === 'served' || targetStatus === 'cancelled') {
      setKitchenQueue((prev) => prev.filter((item) => item.orderId !== orderId));
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, cancelReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật trạng thái đơn thất bại.');
      }

      // Thông báo thành công
      const statusLabels: Record<string, string> = {
        preparing: 'Đã xác nhận chuyển sang pha chế',
        served: 'Đã hoàn thành phục vụ món',
        cancelled: 'Đã hủy đơn hàng',
      };
      addToast('success', 'Thành công', statusLabels[targetStatus] || 'Đã cập nhật trạng thái');
    } catch (err: any) {
      // Rollback nếu máy chủ từ chối
      setTables(previousTables);
      setKitchenQueue(previousQueue);
      addToast('error', 'Lỗi thao tác', err?.message || 'Không thể đổi trạng thái đơn.');
    }
  };

  // 6. Xác nhận tất cả các đơn pending của một bàn
  const handleBatchConfirm = async (tableId: string) => {
    const previousTables = [...tables];
    const previousQueue = [...kitchenQueue];

    // Cập nhật lạc quan
    setTables((prevTables) =>
      prevTables.map((tbl) => {
        if (tbl.id !== tableId || !tbl.activeSession?.orders) return tbl;

        const updatedOrders = tbl.activeSession.orders.map((o: any) => {
          if (o.status === 'pending') {
            return { ...o, status: 'preparing' };
          }
          return o;
        });

        return {
          ...tbl,
          statusType: 'preparing',
          activeSession: {
            ...tbl.activeSession,
            orders: updatedOrders,
          },
        };
      })
    );

    try {
      const res = await fetch(`/api/admin/tables/${tableId}/confirm-all`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi xác nhận tất cả đơn.');
      }

      addToast('success', 'Thành công', `Đã xác nhận ${data.count} đơn sang pha chế.`);
      fetchKitchenQueue();
    } catch (err: any) {
      setTables(previousTables);
      setKitchenQueue(previousQueue);
      addToast('error', 'Lỗi', err?.message || 'Không thể xác nhận các đơn.');
    }
  };

  // 7. Thanh toán bàn (Checkout Session)
  const handlePaySession = async (
    sessionId: string,
    paymentMethod: 'cash' | 'transfer'
  ) => {
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Thanh toán thất bại.');
      }

      addToast(
        'success',
        'Thanh toán thành công',
        `Đã chốt bill ${formatVND(data.total)} (${paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}).`
      );

      await Promise.all([fetchTables(), fetchKitchenQueue()]);

      // Lấy hóa đơn để in receipt
      const receiptRes = await fetch(`/api/admin/sessions/${sessionId}/receipt`);
      if (receiptRes.ok) {
        const rJson = await receiptRes.json();
        return rJson.receipt || null;
      }
      return null;
    } catch (err: any) {
      addToast('error', 'Lỗi thanh toán', err?.message || 'Không thể thanh toán phiên bàn.');
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Quản Lý Bàn & Đơn Gọi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi trạng thái 10 bàn, tiếp nhận đơn mới và điều phối quầy bar thời gian thực.
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout on Desktop & Tablet Large */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Lưới Bàn (7 cols on lg, 8 cols on xl) */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-4">
          <TableGrid
            tables={tables}
            selectedTableId={selectedTableId}
            onSelectTable={(table) => setSelectedTableId(table.id)}
            isLoading={isLoading}
            onRefresh={loadInitialData}
          />
        </div>

        {/* Right Column: Bảng "Món cần làm" (Kitchen/Bar Queue) */}
        <div className="lg:col-span-4 xl:col-span-4 sticky top-20">
          <KitchenQueue
            items={kitchenQueue}
            onSelectTableById={(tableId) => setSelectedTableId(tableId)}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Drawer trượt ra bên phải hiển thị chi tiết bàn & các đơn */}
      <TableDrawer
        table={selectedTable}
        isOpen={Boolean(selectedTableId)}
        onClose={() => setSelectedTableId(null)}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onBatchConfirm={handleBatchConfirm}
        onPaySession={handlePaySession}
      />

      {/* Toast Notifications container */}
      <AdminToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onOpenTable={(tableId) => setSelectedTableId(tableId)}
      />
    </div>
  );
}
