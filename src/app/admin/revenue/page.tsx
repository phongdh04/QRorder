'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  CreditCard,
  Banknote,
  Download,
  Calendar,
  Search,
  RotateCcw,
  Printer,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAdmin } from '@/context/AdminContext';
import { formatVND } from '@/lib/utils';
import { formatVnDateTime } from '@/lib/tz';
import { RevenueRangeType } from '@/lib/tz';
import { RevenueAnalyticsData, PaidBillItem } from '@/lib/dal/revenue';
import { BillReceiptModal } from '@/components/admin/BillReceiptModal';
import { ReopenBillModal } from '@/components/admin/ReopenBillModal';
import { BillReceiptData } from '@/lib/dal/payment';

export default function RevenuePage() {
  const { userRole } = useAdmin();

  const [rangeType, setRangeType] = useState<RevenueRangeType>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [analytics, setAnalytics] = useState<RevenueAnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  // Danh sách hóa đơn & phân trang
  const [bills, setBills] = useState<PaidBillItem[]>([]);
  const [billsPage, setBillsPage] = useState(1);
  const [totalBillsCount, setTotalBillsCount] = useState(0);
  const [totalBillsPages, setTotalBillsPages] = useState(1);
  const [searchTable, setSearchTable] = useState('');
  const [isLoadingBills, setIsLoadingBills] = useState(true);

  // Top món sort: 'revenue' | 'quantity'
  const [topDishSort, setTopDishSort] = useState<'revenue' | 'quantity'>('revenue');

  // Modals
  const [viewingReceipt, setViewingReceipt] = useState<BillReceiptData | null>(null);
  const [reopenTarget, setReopenTarget] = useState<{ id: string; tableName: string } | null>(null);
  const [isReopening, setIsReopening] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Hiển thị thông báo nhỏ
  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 4000);
  };

  // 1. Tải dữ liệu phân tích doanh thu
  const fetchAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    try {
      const params = new URLSearchParams();
      params.set('range', rangeType);
      if (rangeType === 'custom' && customStart && customEnd) {
        params.set('startDate', customStart);
        params.set('endDate', customEnd);
      }

      const res = await fetch(`/api/admin/revenue/analytics?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.analytics) {
          setAnalytics(json.analytics);
        }
      }
    } catch (err) {
      console.error('Lỗi tải analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [rangeType, customStart, customEnd]);

  // 2. Tải danh sách hóa đơn
  const fetchBills = useCallback(async (page: number = 1) => {
    setIsLoadingBills(true);
    try {
      const params = new URLSearchParams();
      params.set('range', rangeType);
      params.set('page', String(page));
      params.set('limit', '10');
      if (rangeType === 'custom' && customStart && customEnd) {
        params.set('startDate', customStart);
        params.set('endDate', customEnd);
      }
      if (searchTable.trim()) {
        params.set('searchTable', searchTable.trim());
      }

      const res = await fetch(`/api/admin/revenue/bills?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setBills(json.bills || []);
          setTotalBillsCount(json.totalCount || 0);
          setTotalBillsPages(json.totalPages || 1);
          setBillsPage(json.currentPage || 1);
        }
      }
    } catch (err) {
      console.error('Lỗi tải bills:', err);
    } finally {
      setIsLoadingBills(false);
    }
  }, [rangeType, customStart, customEnd, searchTable]);

  useEffect(() => {
    fetchAnalytics();
    fetchBills(1);
  }, [fetchAnalytics, fetchBills]);

  // Xuất file CSV có UTF-8 BOM
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    params.set('range', rangeType);
    if (rangeType === 'custom' && customStart && customEnd) {
      params.set('startDate', customStart);
      params.set('endDate', customEnd);
    }
    window.location.href = `/api/admin/revenue/export?${params.toString()}`;
  };

  // Xem chi tiết bill receipt
  const handleViewReceipt = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/receipt`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.receipt) {
          setViewingReceipt(json.receipt);
        }
      }
    } catch (err) {
      showToast('Không thể tải chi tiết hóa đơn.');
    }
  };

  // Mở lại bill (Owner)
  const handleConfirmReopen = async (reason: string) => {
    if (!reopenTarget) return;
    setIsReopening(true);
    try {
      const res = await fetch(`/api/admin/sessions/${reopenTarget.id}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi mở lại bill.');
      }

      showToast(`Đã mở lại bill cho ${reopenTarget.tableName}.`);
      setReopenTarget(null);
      // Tải lại dữ liệu
      fetchAnalytics();
      fetchBills(billsPage);
    } catch (err: any) {
      showToast(err?.message || 'Không thể mở lại bill.');
    } finally {
      setIsReopening(false);
    }
  };

  // Sắp xếp top món
  const sortedTopItems = React.useMemo(() => {
    if (!analytics?.topItems) return [];
    const items = [...analytics.topItems];
    if (topDishSort === 'quantity') {
      return items.sort((a, b) => b.quantity - a.quantity);
    }
    return items.sort((a, b) => b.revenue - a.revenue);
  }, [analytics?.topItems, topDishSort]);

  const kpis = analytics?.kpis;

  // Custom Recharts Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-300">{data.label}</p>
          <p className="font-extrabold text-blue-400 text-sm">{formatVND(data.revenue)}</p>
          <p className="text-[11px] text-slate-400">{data.billCount} hóa đơn đã chốt</p>
        </div>
      );
    }
    return null;
  };

  const isStaff = userRole === 'staff';

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in">
          {toastNotice}
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Thống Kê Doanh Thu
            </h2>
            {isStaff && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200">
                Nhân viên (Xem ca hôm nay)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Doanh thu thực tế chỉ tính từ các phiên bàn đã thanh toán (paid) theo giờ Việt Nam.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel/CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchAnalytics();
              fetchBills(billsPage);
            }}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingAnalytics ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Quick Range Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { key: 'today', label: 'Hôm nay' },
              { key: 'yesterday', label: 'Hôm qua' },
              { key: 'last7days', label: '7 ngày qua' },
              { key: 'last30days', label: '30 ngày qua' },
              { key: 'thisMonth', label: 'Tháng này' },
              { key: 'custom', label: 'Tùy chọn' },
            ] as const
          ).map((tab) => {
            const isDisabled = isStaff && tab.key !== 'today';
            const isActive = rangeType === tab.key;

            return (
              <button
                key={tab.key}
                disabled={isDisabled}
                onClick={() => setRangeType(tab.key)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : isDisabled
                    ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Custom date range inputs */}
        {rangeType === 'custom' && (
          <div className="flex items-center gap-2 self-start md:self-auto text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            />
            <span className="text-slate-400">đến</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Tổng doanh thu */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tổng Doanh Thu
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoadingAnalytics ? '...' : formatVND(kpis?.totalRevenue || 0)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {kpis?.growthRevenuePercent !== null && kpis?.growthRevenuePercent !== undefined ? (
              <span
                className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-md text-[11px] ${
                  kpis.growthRevenuePercent >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                {kpis.growthRevenuePercent >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {Math.abs(kpis.growthRevenuePercent)}%
              </span>
            ) : null}
            <span className="text-[11px] text-slate-400">so với kỳ trước</span>
          </div>
        </div>

        {/* 2. Số hóa đơn */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Số Hóa Đơn (Bill)
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoadingAnalytics ? '...' : `${kpis?.billCount || 0} bill`}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {kpis?.growthBillsPercent !== null && kpis?.growthBillsPercent !== undefined ? (
              <span
                className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-md text-[11px] ${
                  kpis.growthBillsPercent >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                {kpis.growthBillsPercent >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {Math.abs(kpis.growthBillsPercent)}%
              </span>
            ) : null}
            <span className="text-[11px] text-slate-400">so với kỳ trước</span>
          </div>
        </div>

        {/* 3. Giá trị bill trung bình (AOV) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Giá Trị Bill Trung Bình
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoadingAnalytics ? '...' : formatVND(kpis?.averageOrderValue || 0)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {kpis?.growthAovPercent !== null && kpis?.growthAovPercent !== undefined ? (
              <span
                className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-md text-[11px] ${
                  kpis.growthAovPercent >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                {kpis.growthAovPercent >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {Math.abs(kpis.growthAovPercent)}%
              </span>
            ) : null}
            <span className="text-[11px] text-slate-400">AOV kỳ trước: {formatVND(kpis?.prevTotalRevenue ? Math.round(kpis.prevTotalRevenue / (kpis.prevBillCount || 1)) : 0)}</span>
          </div>
        </div>

        {/* 4. Tiền mặt vs Chuyển khoản */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tiền Mặt vs CK
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2 space-y-1 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5" /> Tiền mặt ({kpis?.cashPercent || 0}%)
              </span>
              <span>{formatVND(kpis?.cashRevenue || 0)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Chuyển khoản ({kpis?.transferPercent || 0}%)
              </span>
              <span>{formatVND(kpis?.transferRevenue || 0)}</span>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div
              style={{ width: `${kpis?.cashPercent || 0}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
            />
            <div
              style={{ width: `${kpis?.transferPercent || 0}%` }}
              className="bg-blue-500 h-full transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Biểu Đồ Doanh Thu (Recharts) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Biểu Đồ Doanh Thu {analytics?.isSingleDay ? 'Theo Giờ' : 'Theo Ngày'}
            </h3>
            <p className="text-xs text-slate-400">
              {analytics?.rangeLabel || 'Hôm nay'} • Di chuột để xem chi tiết từng mốc
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {isLoadingAnalytics ? (
            <div className="w-full h-full rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ) : !analytics?.chartData || analytics.chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Chưa có doanh thu trong khoảng thời gian này
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}Tr` : `${val / 1000}k`)}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two Column Grid: Top món bán chạy (Left 5 cols) & Danh sách hóa đơn (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Top món bán chạy */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Top Món Bán Chạy</span>
              </h3>
              <p className="text-xs text-slate-400">Chỉ tính món trong các bill đã thanh toán</p>
            </div>

            {/* Sort toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTopDishSort('revenue')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  topDishSort === 'revenue'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Doanh thu
              </button>
              <button
                type="button"
                onClick={() => setTopDishSort('quantity')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  topDishSort === 'quantity'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Số lượng
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {isLoadingAnalytics ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : sortedTopItems.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Chưa có dữ liệu món trong khoảng này</p>
            ) : (
              sortedTopItems.map((item, index) => (
                <div key={index} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      #{index + 1}. {item.name}
                    </span>
                    <span className="font-black text-slate-900 dark:text-white shrink-0">
                      {formatVND(item.revenue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Đã bán: <strong className="text-blue-600 dark:text-blue-400">{item.quantity}</strong> phần</span>
                    <span>Tỷ trọng: <strong>{item.percentOfTotal}%</strong></span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, item.percentOfTotal)}%` }}
                      className="bg-blue-600 h-full rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Danh sách hóa đơn đã thanh toán */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Danh Sách Hóa Đơn ({totalBillsCount})
              </h3>
              <p className="text-xs text-slate-400">Bấm xem chi tiết, in hóa đơn hoặc mở lại bill</p>
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Tìm theo bàn..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Bills Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2.5 font-semibold">Bàn</th>
                  <th className="pb-2.5 font-semibold">Giờ T.Toán</th>
                  <th className="pb-2.5 font-semibold">Phương Thức</th>
                  <th className="pb-2.5 font-semibold text-right">Tổng Tiền</th>
                  <th className="pb-2.5 font-semibold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isLoadingBills ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="h-12 animate-pulse">
                      <td colSpan={5} className="py-2.5 bg-slate-50 dark:bg-slate-850/40 rounded-lg" />
                    </tr>
                  ))
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                      Chưa có hóa đơn nào phù hợp với bộ lọc
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">
                        {bill.tableName}
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">
                          #{bill.id.slice(-6).toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatVnDateTime(bill.paidAt)}
                      </td>

                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bill.paymentMethod === 'transfer'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {bill.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
                        </span>
                      </td>

                      <td className="py-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {formatVND(bill.total)}
                      </td>

                      <td className="py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(bill.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Xem và in hóa đơn"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Reopen Bill Button (Chỉ dành riêng cho Owner) */}
                          {userRole === 'owner' && (
                            <button
                              type="button"
                              onClick={() => setReopenTarget({ id: bill.id, tableName: bill.tableName })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                              title="Mở lại hóa đơn này (Chủ quán)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalBillsPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400">
                Trang {billsPage} / {totalBillsPages} ({totalBillsCount} hóa đơn)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={billsPage <= 1}
                  onClick={() => fetchBills(billsPage - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={billsPage >= totalBillsPages}
                  onClick={() => fetchBills(billsPage + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bill Receipt Modal */}
      <BillReceiptModal
        receipt={viewingReceipt}
        isOpen={Boolean(viewingReceipt)}
        onClose={() => setViewingReceipt(null)}
      />

      {/* Reopen Bill Modal (Owner) */}
      <ReopenBillModal
        billId={reopenTarget?.id || null}
        tableName={reopenTarget?.tableName || ''}
        isOpen={Boolean(reopenTarget)}
        onClose={() => setReopenTarget(null)}
        onConfirm={handleConfirmReopen}
        isProcessing={isReopening}
      />
    </div>
  );
}
