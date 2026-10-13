'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Users,
  Clock,
  Flame,
  ArrowRight,
  Sparkles,
  UtensilsCrossed,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    revenueToday: 0,
    paidCountToday: 0,
    activeTablesCount: 0,
    totalTables: 10,
    pendingOrdersCount: 0,
    preparingOrdersCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.stats) {
          setStats(json.stats);
        }
      }
    } catch (err) {
      console.error('Lỗi tải stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hệ Thống Trực Tuyến Thời Gian Thực</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Tổng Quan Quầy Bar
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Theo dõi doanh thu, trạng thái bàn và các đơn gọi món trong ca làm việc.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          className="self-start sm:self-auto gap-2 text-xs border-slate-800 hover:border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu hôm nay */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Doanh Thu Ca Hôm Nay</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {formatVND(stats.revenueToday)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.paidCountToday} phiên bàn đã chốt thanh toán
          </p>
        </div>

        {/* Bàn đang có khách */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Bàn Đang Có Khách</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.activeTablesCount}{' '}
            <span className="text-sm font-semibold text-slate-500">/ {stats.totalTables} bàn</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.totalTables - stats.activeTablesCount} bàn hiện đang sẵn sàng
          </p>
        </div>

        {/* Đơn chờ nhận */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-yellow-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Đơn Chờ Tiếp Nhận</span>
            <div className="w-9 h-9 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-yellow-400">
            {stats.pendingOrdersCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cần bartender xác nhận nhận đơn</p>
        </div>

        {/* Đơn đang pha chế */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-sky-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Đang Pha Chế</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-400">
            {stats.preparingOrdersCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Đang thực hiện tại quầy pha chế</p>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/orders"
          className="glass-panel p-6 rounded-2xl border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900/60 transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Màn Hình Quầy Bar (KDS)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Xem và chuyển trạng thái đơn hàng theo thời gian thực
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/tables"
          className="glass-panel p-6 rounded-2xl border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/60 transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Quản Lý 10 Bàn & Mã QR</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Xem bàn đang mở, in/tải mã QR và thực hiện chốt hóa đơn
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
