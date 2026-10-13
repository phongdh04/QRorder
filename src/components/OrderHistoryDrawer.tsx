'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Receipt, RefreshCw } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';

interface OrderHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function OrderHistoryDrawer({
  isOpen,
  onClose,
  orders,
  onRefresh,
  isRefreshing,
}: OrderHistoryDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="relative z-10 w-full max-w-lg mt-auto md:mt-0 bg-[#0c101a] border-t md:border-l border-slate-800 rounded-t-3xl md:rounded-none md:h-full flex flex-col max-h-[85vh] md:max-h-full shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Đơn Đã Gọi Của Bàn</h3>
                  <p className="text-xs text-slate-400">Theo dõi tiến độ pha chế & phục vụ</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-2 text-slate-400 hover:text-amber-400 rounded-xl hover:bg-slate-800 transition-colors"
                  title="Cập nhật trạng thái"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm font-medium">Bàn này chưa gửi đơn nào.</p>
                  <p className="text-xs text-slate-500 mt-1">Đơn hàng bạn vừa gọi sẽ xuất hiện ở đây.</p>
                </div>
              ) : (
                orders.map((order, idx) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">
                        Đợt gọi #{orders.length - idx} • {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    {order.cancel_reason && (
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                        Lý do hủy: {order.cancel_reason}
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-2 pt-1 border-t border-slate-800/60">
                      {order.order_items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-start text-xs">
                          <div>
                            <span className="font-medium text-slate-200">
                              {item.name_snapshot} <span className="text-amber-400 font-bold">x{item.quantity}</span>
                            </span>
                            {item.note && (
                              <p className="text-[11px] text-slate-400 italic">Ghi chú: {item.note}</p>
                            )}
                          </div>
                          <span className="text-slate-300 font-medium shrink-0 ml-2">
                            {formatVND(item.price_snapshot * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.note && (
                      <p className="text-xs text-slate-400 pt-2 border-t border-slate-800/40">
                        <span className="text-slate-500">Ghi chú chung:</span> {order.note}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
