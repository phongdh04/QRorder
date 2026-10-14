'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Plus,
  RefreshCw,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Eye,
  EyeOff,
  AlertTriangle,
  Layers,
  X,
  FileCode,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';

interface TableItem {
  id: string;
  name: string;
  token: string;
  is_active: boolean;
  restaurant_id: string;
  zone?: string | null;
  pos_x?: number | null;
  pos_y?: number | null;
  shape?: string | null;
  capacity?: number | null;
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [domain, setDomain] = useState('');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bộ lọc theo khu vực & Tìm kiếm
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Thêm / Sửa Bàn
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [tableNameInput, setTableNameInput] = useState('');
  const [tableZoneInput, setTableZoneInput] = useState<string>('outdoor');
  const [tableCapacityInput, setTableCapacityInput] = useState<number>(4);
  const [tableSubmitting, setTableSubmitting] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  // Modal Xác Nhận Đổi Token
  const [regenTable, setRegenTable] = useState<TableItem | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Modal Trang In A4 Mẫu Đẹp
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedForPrint, setSelectedForPrint] = useState<string[]>([]);
  const [restaurantName, setRestaurantName] = useState('The Velvet Lounge');
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);

  // Batch download state
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDomain(window.location.origin);
    }
  }, []);

  // Fetch Tables & Restaurant Info
  const fetchTables = async () => {
    try {
      const res = await fetch('/api/admin/tables');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.tables) {
          setTables(json.tables);
          setSelectedForPrint(json.tables.map((t: TableItem) => t.id));
        }
      }

      // Lấy thông tin quán để hiển thị trên bản in A4
      const resStore = await fetch('/api/admin/restaurant');
      if (resStore.ok) {
        const jsonStore = await resStore.json();
        if (jsonStore.success && jsonStore.restaurant) {
          setRestaurantName(jsonStore.restaurant.name);
          setRestaurantLogo(jsonStore.restaurant.logo_url);
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
  }, []);

  // Generate QR preview Data URLs for all tables
  useEffect(() => {
    if (!domain || tables.length === 0) return;

    const generateAllQrs = async () => {
      const newMap: Record<string, string> = {};
      for (const t of tables) {
        try {
          const url = `${domain}/t/${t.token}`;
          const dataUrl = await QRCode.toDataURL(url, {
            width: 320,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });
          newMap[t.id] = dataUrl;
        } catch (err) {
          console.error('Lỗi tạo QR cho bàn', t.name, err);
        }
      }
      setQrMap(newMap);
    };

    generateAllQrs();
  }, [tables, domain]);

  // Copy direct URL
  const handleCopyLink = (token: string, tableId: string) => {
    const url = `${domain}/t/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(tableId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download Single PNG
  const handleDownloadPNG = async (table: TableItem) => {
    try {
      const url = `${domain}/t/${table.token}`;
      const highResDataUrl = await QRCode.toDataURL(url, {
        width: 800,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      const a = document.createElement('a');
      a.href = highResDataUrl;
      a.download = `QR_${table.name.replace(/\s+/g, '_')}.png`;
      a.click();
    } catch (err) {
      console.error('Lỗi tải PNG:', err);
    }
  };

  // Download Single SVG
  const handleDownloadSVG = async (table: TableItem) => {
    try {
      const url = `${domain}/t/${table.token}`;
      const svgString = await QRCode.toString(url, {
        type: 'svg',
        margin: 2,
        width: 600,
        color: { dark: '#000000', light: '#ffffff' },
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `QR_${table.name.replace(/\s+/g, '_')}.svg`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Lỗi tải SVG:', err);
    }
  };

  // Download All PNGs
  const handleDownloadAllPNG = async () => {
    if (tables.length === 0) return;
    setIsDownloadingAll(true);
    try {
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        await handleDownloadPNG(table);
        // Nhẹ nhàng delay để trình duyệt không chặn popup tải nhiều file
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Toggle Hide / Show table (is_active)
  const handleToggleActive = async (table: TableItem) => {
    const newStatus = !table.is_active;
    // Optimistic
    setTables((prev) =>
      prev.map((t) => (t.id === table.id ? { ...t, is_active: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/admin/tables/${table.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });
      if (!res.ok) await fetchTables();
    } catch (err) {
      console.error('Lỗi ẩn/hiện bàn:', err);
      await fetchTables();
    }
  };

  // Save table (Create or Rename)
  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNameInput.trim()) {
      setTableError('Vui lòng nhập tên bàn.');
      return;
    }

    setTableSubmitting(true);
    setTableError(null);

    try {
      let res: Response;
      const payload = {
        name: tableNameInput.trim(),
        zone: tableZoneInput,
        capacity: Number(tableCapacityInput) || 4,
      };
      if (editingTable) {
        res = await fetch(`/api/admin/tables/${editingTable.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu thông tin bàn.');

      setTableModalOpen(false);
      await fetchTables();
    } catch (err: any) {
      setTableError(err?.message || 'Có lỗi xảy ra.');
    } finally {
      setTableSubmitting(false);
    }
  };

  // Regenerate Token
  const handleConfirmRegenerate = async () => {
    if (!regenTable) return;
    setIsRegenerating(true);

    try {
      const res = await fetch(`/api/admin/tables/${regenTable.id}/regenerate-token`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo lại token.');

      setRegenTable(null);
      await fetchTables();
    } catch (err: any) {
      alert(err?.message || 'Không thể tạo lại token.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Open A4 Print Dialog
  const handlePrintA4 = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500">
              <QrCode className="w-6 h-6" />
            </div>
            <span>Quản Lý Bàn & Mã QR Gọi Món</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thêm mới, đổi tên, ẩn bàn, tạo lại mã token bảo mật và xuất in ấn QR mẫu A4 tiêu chuẩn.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAllPNG}
            disabled={isDownloadingAll || tables.length === 0}
            className="text-xs gap-1.5 border-slate-700 hover:bg-slate-800"
          >
            {isDownloadingAll ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>Tải tất cả PNG</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPrintModalOpen(true)}
            disabled={tables.length === 0}
            className="text-xs gap-1.5 border-slate-700 hover:bg-slate-800"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Trang in A4 mẫu đẹp</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingTable(null);
              setTableNameInput(`Bàn ${tables.length + 1}`);
              setTableZoneInput('outdoor');
              setTableCapacityInput(4);
              setTableError(null);
              setTableModalOpen(true);
            }}
            className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm bàn mới</span>
          </Button>
        </div>
      </div>

      {/* Toolbar: Lọc theo Phân Khu & Tìm kiếm bàn */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoneFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              zoneFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🌟 Tất cả ({tables.length})
          </button>
          <button
            type="button"
            onClick={() => setZoneFilter('outdoor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              zoneFilter === 'outdoor'
                ? 'bg-emerald-600 text-white font-black shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🌿 Ngoài trời ({tables.filter((t) => (t.zone || 'outdoor') === 'outdoor').length})
          </button>
          <button
            type="button"
            onClick={() => setZoneFilter('indoor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              zoneFilter === 'indoor'
                ? 'bg-purple-600 text-white font-black shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            👑 Trong nhà / VIP ({tables.filter((t) => t.zone === 'indoor').length})
          </button>
          <button
            type="button"
            onClick={() => setZoneFilter('dj')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              zoneFilter === 'dj'
                ? 'bg-cyan-600 text-white font-black shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🎵 Khu DJ ({tables.filter((t) => t.zone === 'dj').length})
          </button>
          <button
            type="button"
            onClick={() => setZoneFilter('bar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              zoneFilter === 'bar'
                ? 'bg-amber-600 text-white font-black shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🍸 Quầy Bar ({tables.filter((t) => t.zone === 'bar').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bàn hoặc token..."
            className="w-full text-xs bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      {/* Tables Cards Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-7 h-7 animate-spin text-blue-500" />
          <span className="text-xs">Đang tải danh sách bàn...</span>
        </div>
      ) : tables.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Chưa có bàn nào</h3>
          <p className="text-xs text-slate-400 mb-4">
            Bấm nút &quot;Thêm bàn mới&quot; phía trên để bắt đầu tạo mã QR phục vụ khách.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {tables
            .filter((table) => {
              if (zoneFilter !== 'all' && (table.zone || 'outdoor') !== zoneFilter) return false;
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                return (
                  table.name.toLowerCase().includes(q) ||
                  table.token.toLowerCase().includes(q)
                );
              }
              return true;
            })
            .map((table) => {
            const tableUrl = `${domain}/t/${table.token}`;
            const qrPreview = qrMap[table.id];

            return (
              <div
                key={table.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-xs ${
                  table.is_active
                    ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    : 'border-slate-800/50 opacity-60 bg-slate-950/40'
                }`}
              >
                {/* Card Top: Name, Zone Badge & Quick Actions */}
                <div>
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {table.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTable(table);
                            setTableNameInput(table.name);
                            setTableZoneInput(table.zone || 'outdoor');
                            setTableCapacityInput(table.capacity || 4);
                            setTableError(null);
                            setTableModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
                          title="Đổi tên bàn & khu vực"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Huy hiệu khu vực & sức chứa */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            (table.zone || 'outdoor') === 'outdoor'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : table.zone === 'indoor'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : table.zone === 'dj'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {(table.zone || 'outdoor') === 'outdoor'
                            ? '🌿 Ngoài trời'
                            : table.zone === 'indoor'
                            ? '👑 VIP Lounge'
                            : table.zone === 'dj'
                            ? '🎵 Khu DJ'
                            : '🍸 Quầy Bar'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          🪑 {table.capacity || 4} chỗ
                        </span>
                      </div>
                    </div>

                    {/* Toggle Active Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(table)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors shrink-0 ${
                        table.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                      title={table.is_active ? 'Bấm để ẩn bàn này' : 'Bấm để kích hoạt lại bàn'}
                    >
                      {table.is_active ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Hiển thị</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Đang ẩn</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* QR Image Box */}
                  <div className="my-4 p-3 bg-white rounded-xl shadow-inner flex flex-col items-center justify-center">
                    {qrPreview ? (
                      <img
                        src={qrPreview}
                        alt={`QR ${table.name}`}
                        className="w-44 h-44 object-contain rounded-md"
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400 font-mono">
                        Đang tạo QR...
                      </div>
                    )}
                    <span className="text-[11px] font-black text-slate-900 mt-1 uppercase tracking-wider">
                      {table.name} • QUÉT ĐỂ GỌI MÓN
                    </span>
                  </div>

                  {/* Direct Link box */}
                  <div className="bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-mono text-[11px] text-slate-400">
                      /t/{table.token.substring(0, 10)}...
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(table.token, table.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
                        title="Sao chép liên kết"
                      >
                        {copiedId === table.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={tableUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
                        title="Mở giao diện khách"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPNG(table)}
                      className="text-[11px] h-8 gap-1 border-slate-700 hover:bg-slate-800 text-slate-300"
                    >
                      <Download className="w-3 h-3 text-blue-400" />
                      <span>Tải PNG</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadSVG(table)}
                      className="text-[11px] h-8 gap-1 border-slate-700 hover:bg-slate-800 text-slate-300"
                    >
                      <FileCode className="w-3 h-3 text-emerald-400" />
                      <span>Tải SVG</span>
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRegenTable(table)}
                    className="w-full py-1.5 px-2 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    title="Vô hiệu hóa QR cũ và tạo token mới"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Tạo lại token (Hủy QR cũ)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Thêm / Sửa Bàn */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>{editingTable ? 'Đổi Tên Bàn' : 'Thêm Bàn Mới'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setTableModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="p-5 space-y-4">
              {tableError && (
                <p className="text-xs text-rose-400 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  {tableError}
                </p>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tên bàn phục vụ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={tableNameInput}
                  onChange={(e) => setTableNameInput(e.target.value)}
                  placeholder="Ví dụ: Bàn 01, VIP 01, Bàn DJ 01..."
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Phân khu trên sơ đồ <span className="text-amber-400">*</span>
                </label>
                <select
                  value={tableZoneInput}
                  onChange={(e) => setTableZoneInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  <option value="outdoor">🌿 Khu Ngoài Trời (Vùng Lục Giác)</option>
                  <option value="indoor">👑 Khu Trong Nhà / VIP Lounge</option>
                  <option value="dj">🎵 Khu DJ & Sân Khấu</option>
                  <option value="bar">🍸 Quầy Bar & Pha Chế</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Sức chứa (số ghế)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={tableCapacityInput}
                  onChange={(e) => setTableCapacityInput(parseInt(e.target.value, 10) || 4)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTableModalOpen(false)}
                  disabled={tableSubmitting}
                  className="text-xs border-slate-700"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={tableSubmitting}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  {tableSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  <span>{editingTable ? 'Cập nhật' : 'Tạo bàn'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Xác nhận Tạo lại Token */}
      {regenTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 shrink-0 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Tạo lại Token cho &quot;{regenTable.name}&quot;?
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Hành động này sẽ <strong className="text-rose-400">vô hiệu hóa tức thì</strong> mã QR cũ đã in ra trước đó. Khách hàng quét mã cũ sẽ không thể gọi món nữa. Bạn sẽ cần in lại mã QR mới này.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRegenTable(null)}
                disabled={isRegenerating}
                className="text-xs border-slate-700"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmRegenerate}
                disabled={isRegenerating}
                className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold"
              >
                {isRegenerating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                )}
                <span>Xác nhận tạo lại QR mới</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / VIEW: Trang In A4 Mẫu Đẹp */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 sm:p-6 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="max-w-4xl mx-auto space-y-6 print:space-y-0 print:max-w-none">
            {/* Top Toolbar (Hidden on Print) */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl print:hidden">
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Mẫu Thẻ Đặt Bàn Khổ A4 Tiêu Chuẩn
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Bố cục 4 thẻ sang trọng trên mỗi trang A4, viền nét đứt tiện cắt dán.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  size="sm"
                  onClick={handlePrintA4}
                  className="text-xs gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In ngay (Print)</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPrintModalOpen(false)}
                  className="text-xs border-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* A4 Printable Paper Container */}
            <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl print:shadow-none print:p-4 print:m-0 print:rounded-none">
              <div className="grid grid-cols-2 gap-8 print:gap-6 print:grid-cols-2">
                {tables
                  .filter((t) => t.is_active)
                  .map((table) => {
                    const qrUrl = qrMap[table.id];

                    return (
                      <div
                        key={table.id}
                        className="border-2 border-dashed border-slate-300 p-6 rounded-3xl flex flex-col items-center justify-between text-center bg-white shadow-xs print:break-inside-avoid relative overflow-hidden"
                      >
                        {/* Top Restaurant Brand & Logo */}
                        <div className="flex flex-col items-center gap-1.5">
                          {restaurantLogo ? (
                            <img
                              src={restaurantLogo}
                              alt="Logo"
                              className="w-12 h-12 object-contain rounded-full border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm">
                              🍸
                            </div>
                          )}
                          <h4 className="text-base font-black tracking-wider uppercase text-slate-900">
                            {restaurantName}
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-500 tracking-widest uppercase">
                            Premium Bar Experience
                          </span>
                        </div>

                        {/* Large High Contrast QR Code */}
                        <div className="my-5 p-3 rounded-2xl border-2 border-slate-900 bg-white shadow-md">
                          {qrUrl ? (
                            <img
                              src={qrUrl}
                              alt={`QR ${table.name}`}
                              className="w-48 h-48 object-contain"
                            />
                          ) : (
                            <div className="w-48 h-48 bg-slate-100 flex items-center justify-center font-mono text-xs">
                              QR Code
                            </div>
                          )}
                        </div>

                        {/* Table Number & Action Call */}
                        <div className="w-full space-y-1.5">
                          <div className="bg-slate-900 text-white py-2 px-4 rounded-xl text-lg font-black tracking-wider uppercase shadow-sm">
                            {table.name}
                          </div>
                          <p className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                            Quét để xem menu & gọi món
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Không cần tải ứng dụng • Mở camera điện thoại để quét
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
