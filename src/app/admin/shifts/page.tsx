'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  Clock,
  Play,
  Square,
  Users,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  sort_order: number;
  tablesCount: number;
  tables: Array<{ id: string; name: string; is_active: boolean }>;
}

interface TableItem {
  id: string;
  name: string;
  is_active: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  last_seen_at: string | null;
  isOnline: boolean;
  onDuty: boolean;
  assignedZoneId: string | null;
  assignedZoneName: string | null;
}

interface ShiftData {
  id: string;
  started_at: string;
  started_by: string;
  started_by_name: string | null;
  assignments: any[];
}

export default function AdminShiftsAndZonesPage() {
  const [activeTab, setActiveTab] = useState<'shift' | 'zones'>('shift');
  const [isLoading, setIsLoading] = useState(true);
  const [shiftData, setShiftData] = useState<ShiftData | null>(null);
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [unassignedTables, setUnassignedTables] = useState<TableItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal tạo/sửa khu
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneNameInput, setZoneNameInput] = useState('');
  const [isZoneSubmitting, setIsZoneSubmitting] = useState(false);

  // Modal gán bàn vào khu
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetZoneForAssign, setTargetZoneForAssign] = useState<Zone | null>(null);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [allTablesList, setAllTablesList] = useState<TableItem[]>([]);
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchShiftAndStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/shifts/current');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setShiftData(json.shift);
          setAllStaff(json.allStaff);
        }
      }
    } catch (err) {
      console.error('Lỗi fetch ca trực:', err);
    }
  }, []);

  const fetchZones = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/zones');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setZones(json.zones);
          setUnassignedTables(json.unassignedTables);
        }
      }
    } catch (err) {
      console.error('Lỗi fetch khu vực:', err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchShiftAndStaff(), fetchZones()]);
    setIsLoading(false);
  }, [fetchShiftAndStaff, fetchZones]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Bắt đầu ca
  const handleStartShift = async () => {
    try {
      const res = await fetch('/api/admin/shifts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi bắt đầu ca.');
      showToast('Đã bắt đầu ca trực mới thành công.');
      await fetchShiftAndStaff();
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra.');
    }
  };

  // Kết thúc ca
  const handleEndShift = async () => {
    if (!confirm('Bạn có chắc chắn muốn kết thúc ca trực hiện tại?')) return;
    try {
      const res = await fetch('/api/admin/shifts/end', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi kết thúc ca.');
      showToast('Đã kết thúc ca trực thành công.');
      await fetchShiftAndStaff();
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra.');
    }
  };

  // Cập nhật phân công nhân viên
  const handleUpdateAssignment = async (
    userId: string,
    onDuty: boolean,
    zoneId: string | null
  ) => {
    try {
      const res = await fetch('/api/admin/shifts/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, onDuty, zoneId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật phân công.');
      showToast('Cập nhật phân công thành công.');
      await fetchShiftAndStaff();
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra.');
    }
  };

  // Tạo / Sửa khu vực
  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneNameInput.trim()) return;

    setIsZoneSubmitting(true);
    try {
      if (editingZoneId) {
        const res = await fetch(`/api/admin/zones/${editingZoneId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: zoneNameInput.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi sửa khu vực.');
        showToast('Cập nhật khu vực thành công.');
      } else {
        const res = await fetch('/api/admin/zones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: zoneNameInput.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi tạo khu vực.');
        showToast('Tạo khu vực mới thành công.');
      }

      setZoneModalOpen(false);
      setEditingZoneId(null);
      setZoneNameInput('');
      await fetchZones();
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsZoneSubmitting(false);
    }
  };

  // Xóa khu
  const handleDeleteZone = async (zone: Zone) => {
    if (!confirm(`Xóa khu vực "${zone.name}"? Các bàn trong khu này sẽ chuyển về chưa phân khu.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/zones/${zone.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi xóa khu vực.');
      showToast('Đã xóa khu vực.');
      await fetchZones();
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra.');
    }
  };

  // Mở modal gán bàn
  const openAssignModal = async (zone: Zone) => {
    setTargetZoneForAssign(zone);
    // Tải danh sách tất cả các bàn
    try {
      const res = await fetch('/api/admin/tables');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.tables) {
          setAllTablesList(data.tables);
          // Pre-select tables currently in this zone
          setSelectedTableIds(zone.tables.map((t) => t.id));
        }
      }
    } catch (err) {
      console.error(err);
    }
    setAssignModalOpen(true);
  };

  // Lưu gán bàn vào khu
  const handleSaveTableAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetZoneForAssign) return;

    setIsAssignSubmitting(true);
    try {
      const res = await fetch('/api/admin/zones/assign-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: targetZoneForAssign.id,
          tableIds: selectedTableIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi gán bàn.');
      showToast('Đã cập nhật danh sách bàn trong khu.');
      setAssignModalOpen(false);
      await fetchZones();
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsAssignSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-400" />
            Ca Trực & Phân Khu Bàn
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý ca trực nhân viên, phân công bàn và theo dõi trạng thái hiện diện online/offline
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('shift')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'shift'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Ca trực ({shiftData ? 'Đang mở' : 'Chưa mở'})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'zones'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Phân khu & Gán bàn ({zones.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CA TRỰC & PHÂN CÔNG */}
      {activeTab === 'shift' && (
        <div className="space-y-6">
          {/* Shift status banner */}
          {shiftData ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Play className="w-5 h-5 fill-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      Ca trực đang hoạt động
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bắt đầu lúc: <span className="text-slate-200 font-medium">{new Date(shiftData.started_at).toLocaleTimeString('vi-VN')}</span> (bởi {shiftData.started_by_name || 'Quản lý'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchShiftAndStaff}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Tải lại"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleEndShift}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Kết thúc ca trực</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Chưa có ca trực nào đang mở</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Bắt đầu ca trực để phân công nhân viên phụ trách các khu vực bàn và nhận thông báo yêu cầu phục vụ.
              </p>
              <button
                type="button"
                onClick={handleStartShift}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Bắt đầu ca trực mới</span>
              </button>
            </div>
          )}

          {/* Danh sách phân công nhân viên trong ca */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Phân công nhiệm vụ & Trạng thái hiện diện
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tích chọn nhân viên vào ca và gán khu vực phụ trách (linh hoạt hoặc theo khu riêng)
                </p>
              </div>
              <span className="text-xs text-slate-400">
                Tổng: <strong className="text-white">{allStaff.length}</strong> nhân sự
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Nhân viên</th>
                    <th className="py-3.5 px-4 font-bold">Vai trò</th>
                    <th className="py-3.5 px-4 font-bold">Kết nối</th>
                    <th className="py-3.5 px-4 font-bold">Vào ca</th>
                    <th className="py-3.5 px-4 font-bold">Khu vực phụ trách</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {allStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                        Chưa có tài khoản nhân viên nào.
                      </td>
                    </tr>
                  ) : (
                    allStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{staff.name}</div>
                          <div className="text-[11px] text-slate-400">{staff.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              staff.role === 'manager'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {staff.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {staff.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Online</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-slate-500">
                              <span className="w-2 h-2 rounded-full bg-slate-600" />
                              <span>Offline</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={staff.onDuty}
                              disabled={!shiftData}
                              onChange={(e) =>
                                handleUpdateAssignment(
                                  staff.id,
                                  e.target.checked,
                                  staff.assignedZoneId
                                )
                              }
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={staff.assignedZoneId || ''}
                            disabled={!shiftData || !staff.onDuty}
                            onChange={(e) =>
                              handleUpdateAssignment(
                                staff.id,
                                staff.onDuty,
                                e.target.value ? e.target.value : null
                              )
                            }
                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus:border-blue-500"
                          >
                            <option value="">Linh hoạt (Mọi khu vực)</option>
                            {zones.map((z) => (
                              <option key={z.id} value={z.id}>
                                {z.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHÂN KHU & GÁN BÀN */}
      {activeTab === 'zones' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Danh sách phân khu của quán
            </h2>
            <button
              type="button"
              onClick={() => {
                setEditingZoneId(null);
                setZoneNameInput('');
                setZoneModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm khu vực mới</span>
            </button>
          </div>

          {/* Lưới các phân khu */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white">{zone.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {zone.tablesCount} bàn được gán
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingZoneId(zone.id);
                          setZoneNameInput(zone.name);
                          setZoneModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Đổi tên"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteZone(zone)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Xóa khu vực"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Danh sách các bàn trong khu */}
                  <div className="mt-3 flex flex-wrap gap-1.5 min-h-[48px]">
                    {zone.tables.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">Chưa có bàn nào</span>
                    ) : (
                      zone.tables.map((t) => (
                        <span
                          key={t.id}
                          className="px-2 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/60"
                        >
                          {t.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openAssignModal(zone)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/80 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gán bàn vào khu này</span>
                </button>
              </div>
            ))}
          </div>

          {/* Bàn chưa phân khu */}
          {unassignedTables.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Bàn chưa phân khu ({unassignedTables.length})
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Các bàn này chưa thuộc khu vực cụ thể nào và sẽ do nhân viên linh hoạt phụ trách:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {unassignedTables.map((t) => (
                  <span
                    key={t.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700/60"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Tạo / Sửa khu vực */}
      {zoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingZoneId ? 'Đổi tên khu vực' : 'Thêm khu vực mới'}
            </h3>

            <form onSubmit={handleSaveZone} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên khu vực:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khu Ngoài Trời, Khu VIP..."
                  value={zoneNameInput}
                  onChange={(e) => setZoneNameInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setZoneModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isZoneSubmitting || !zoneNameInput.trim()}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isZoneSubmitting ? 'Đang lưu...' : 'Lưu khu vực'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gán bàn vào khu */}
      {assignModalOpen && targetZoneForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                Gán bàn cho &quot;{targetZoneForAssign.name}&quot;
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tích chọn các bàn bạn muốn gán vào khu vực này:
              </p>
            </div>

            <form onSubmit={handleSaveTableAssignment} className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {allTablesList.map((t) => {
                  const isChecked = selectedTableIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-blue-600/15 border-blue-500/50 text-white'
                          : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-bold">{t.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTableIds((prev) => [...prev, t.id]);
                          } else {
                            setSelectedTableIds((prev) => prev.filter((id) => id !== t.id));
                          }
                        }}
                        className="rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0"
                      />
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isAssignSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isAssignSubmitting ? 'Đang lưu...' : `Gán ${selectedTableIds.length} bàn`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
