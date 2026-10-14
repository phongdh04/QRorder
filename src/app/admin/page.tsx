'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { TableGrid } from '@/components/admin/TableGrid';
import { FloorPlanMap } from '@/components/admin/FloorPlanMap';
import { TableDrawer } from '@/components/admin/TableDrawer';
import { KitchenQueue, KitchenQueueItem } from '@/components/admin/KitchenQueue';
import { TableItemData } from '@/components/admin/TableCard';
import { OrderStatusType } from '@/components/admin/StatusBadge';
import { AdminToastContainer, ToastMessage } from '@/components/admin/AdminToast';
import { playChimeSound } from '@/lib/sound';
import { soundEffects } from '@/lib/sound-effects';
import { formatVND } from '@/lib/utils';
import { AlertTriangle, WifiOff, Bell, UserX } from 'lucide-react';

export default function AdminTablesAndOrdersPage() {
  const { isSoundEnabled, setConnectionStatus } = useAdmin();

  const [tables, setTables] = useState<TableItemData[]>([]);
  const [kitchenQueue, setKitchenQueue] = useState<KitchenQueueItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Cảnh báo quản lý
  const [alerts, setAlerts] = useState<{
    escalatedCount: number;
    escalatedRequests: any[];
    offlineOnDutyStaff: any[];
    hasPendingWithNoStaff: boolean;
    pendingRequestsCount: number;
  }>({
    escalatedCount: 0,
    escalatedRequests: [],
    offlineOnDutyStaff: [],
    hasPendingWithNoStaff: false,
    pendingRequestsCount: 0,
  });

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

  const checkAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/alerts/check');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAlerts(json);
        }
      }
    } catch (err) {
      console.warn('Lỗi kiểm tra alerts:', err);
    }
  }, []);

  useEffect(() => {
    checkAlerts();
    const interval = setInterval(checkAlerts, 15000);
    return () => clearInterval(interval);
  }, [checkAlerts]);

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
        checkAlerts();
      });

      // Nhận sự kiện có đơn mới từ khách gọi
      eventSource.addEventListener('order_created', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          const tableName = payload.data?.tableName || 'Khách';

          if (isSoundEnabledRef.current) {
            playChimeSound();
          }

          addToast(
            'order',
            `Có đơn mới từ ${tableName}!`,
            `Khách vừa gửi đơn gọi món tới quầy bar.`,
            payload.tableId
          );

          fetchTables();
          fetchKitchenQueue();
          checkAlerts();
        } catch (err) {
          console.error('Lỗi xử lý SSE order_created:', err);
        }
      });

      // Nhận sự kiện yêu cầu phục vụ mới (gọi nhân viên / thanh toán / đơn mới)
      eventSource.addEventListener('request_created', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          const tableName = payload.data?.tableName || 'Bàn';
          const type = payload.data?.type;

          if (isSoundEnabledRef.current) {
            playChimeSound();
          }

          let title = `Tín hiệu từ ${tableName}`;
          if (type === 'call_staff') title = `🛎️ ${tableName} gọi nhân viên!`;
          else if (type === 'request_bill') title = `💳 ${tableName} yêu cầu thanh toán!`;

          addToast('order', title, 'Khách hàng đang cần phục vụ tại bàn.', payload.tableId);
          fetchTables();
          checkAlerts();
        } catch (err) {
          console.error(err);
        }
      });

      // Nhận sự kiện yêu cầu bị escalate (chờ quá lâu chưa ai nhận)
      eventSource.addEventListener('request_escalated', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          const tableName = payload.data?.tableName || 'Bàn';

          if (isSoundEnabledRef.current) {
            soundEffects.playTone('urgent');
          }

          addToast(
            'error',
            `🚨 KHẨN CẤP: ${tableName} chờ quá lâu!`,
            `Yêu cầu đã quá thời gian quy định mà chưa có nhân viên nào nhận xử lý.`,
            payload.tableId
          );

          fetchTables();
          checkAlerts();
        } catch (err) {
          console.error(err);
        }
      });

      // Nhận sự kiện trạng thái request thay đổi
      eventSource.addEventListener('request_claimed', () => {
        fetchTables();
        checkAlerts();
      });
      eventSource.addEventListener('request_released', () => {
        fetchTables();
        checkAlerts();
      });
      eventSource.addEventListener('request_reassigned', () => {
        fetchTables();
        checkAlerts();
      });
      eventSource.addEventListener('request_done', () => {
        fetchTables();
        checkAlerts();
      });
      eventSource.addEventListener('shift_changed', () => {
        fetchTables();
        checkAlerts();
      });

      // Nhận sự kiện đơn đổi trạng thái
      eventSource.addEventListener('order_status_changed', () => {
        fetchTables();
        fetchKitchenQueue();
        checkAlerts();
      });

      // Nhận sự kiện session bàn thay đổi / đóng thanh toán
      eventSource.addEventListener('session_closed', () => {
        fetchTables();
        fetchKitchenQueue();
        checkAlerts();
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Quản Lý Bàn & Đơn Gọi</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
              Realtime
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi sơ đồ mặt bằng trực quan các khu vực, tiếp nhận đơn mới và điều phối phục vụ.
          </p>
        </div>

        {/* Nút chuyển đổi: Sơ đồ 2D & Lưới thẻ bàn */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🗺️</span>
            <span>Sơ đồ mặt bằng 2D</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📋</span>
            <span>Lưới thẻ bàn</span>
          </button>
        </div>
      </div>

      {/* Alert Banners for Manager */}
      {alerts.escalatedCount > 0 && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/50 flex items-center justify-between gap-3 text-red-200 animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="text-xs font-semibold">
              <strong className="text-white text-sm">CẢNH BÁO KHẨN CẤP:</strong> Có{' '}
              <span className="font-bold text-white underline">{alerts.escalatedCount} yêu cầu</span> đã quá thời gian quy định tại{' '}
              <span className="text-white font-bold">{alerts.escalatedRequests.map((r: any) => r.tableName).join(', ')}</span> chưa có nhân viên nhận!
            </div>
          </div>
          <button
            type="button"
            onClick={fetchTables}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shrink-0 transition-colors"
          >
            Kiểm tra ngay
          </button>
        </div>
      )}

      {alerts.hasPendingWithNoStaff && (
        <div className="p-4 rounded-2xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-between gap-3 text-orange-200">
          <div className="flex items-center gap-2.5">
            <UserX className="w-5 h-5 text-orange-400 shrink-0" />
            <div className="text-xs font-semibold">
              <strong className="text-white">CẢNH BÁO CA TRỰC:</strong> Đang có{' '}
              <span className="font-bold text-white">{alerts.pendingRequestsCount} đơn/yêu cầu</span> chờ nhưng hiện{' '}
              <span className="text-red-300 font-bold">không có nhân viên nào trong ca trực đang online</span>!
            </div>
          </div>
        </div>
      )}

      {alerts.offlineOnDutyStaff.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Nhân viên trong ca mất kết nối quá thời gian cảnh báo:{' '}
              <strong className="text-white">{alerts.offlineOnDutyStaff.map((s: any) => s.name).join(', ')}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout on Desktop & Tablet Large */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sơ đồ mặt bằng 2D hoặc Lưới Bàn */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-4">
          {viewMode === 'map' ? (
            <FloorPlanMap
              tables={tables}
              selectedTableId={selectedTableId}
              onSelectTable={(table) => setSelectedTableId(table.id)}
              isLoading={isLoading}
            />
          ) : (
            <TableGrid
              tables={tables}
              selectedTableId={selectedTableId}
              onSelectTable={(table) => setSelectedTableId(table.id)}
              isLoading={isLoading}
              onRefresh={loadInitialData}
            />
          )}
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
        onRefreshData={loadInitialData}
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
