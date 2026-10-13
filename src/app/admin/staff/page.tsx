'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  Mail,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(true);
  const [forbiddenMsg, setForbiddenMsg] = useState<string | null>(null);

  // Modal Tạo Tài Khoản Staff
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal Đổi Mật Khẩu Staff
  const [pwdTarget, setPwdTarget] = useState<StaffUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Toast / Notifications
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/admin/staff');
      if (res.status === 403) {
        setIsOwner(false);
        const json = await res.json();
        setForbiddenMsg(json.error || 'Chỉ Chủ quán (Owner) mới có quyền truy cập trang này.');
        return;
      }
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.staff) {
          setStaffList(json.staff);
          setIsOwner(true);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách nhân viên:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Toggle Lock / Unlock staff
  const handleToggleLock = async (staff: StaffUser) => {
    const actionName = staff.is_active ? 'khóa' : 'mở khóa';
    if (!confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản của "${staff.name}" (${staff.email})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !staff.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật tài khoản.');

      showToast(data.message || 'Cập nhật trạng thái thành công.');
      await fetchStaff();
    } catch (err: any) {
      alert(err?.message || 'Không thể cập nhật trạng thái nhân viên.');
    }
  };

  // Submit Create Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      setCreateError('Vui lòng nhập họ tên nhân viên.');
      return;
    }
    if (!createEmail.trim()) {
      setCreateError('Vui lòng nhập email đăng nhập.');
      return;
    }
    if (createPassword.length < 6) {
      setCreateError('Mật khẩu tối thiểu phải từ 6 ký tự trở lên.');
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          password: createPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo tài khoản.');

      setCreateModalOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      showToast('Đã tạo tài khoản nhân viên thành công.');
      await fetchStaff();
    } catch (err: any) {
      setCreateError(err?.message || 'Có lỗi xảy ra.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdTarget) return;
    if (newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }

    setPwdSubmitting(true);
    setPwdError(null);

    try {
      const res = await fetch(`/api/admin/staff/${pwdTarget.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi đổi mật khẩu.');

      setPwdTarget(null);
      setNewPassword('');
      showToast(`Đã đổi mật khẩu cho nhân viên ${pwdTarget.name} thành công.`);
    } catch (err: any) {
      setPwdError(err?.message || 'Không thể đổi mật khẩu.');
    } finally {
      setPwdSubmitting(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Quyền truy cập bị giới hạn
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {forbiddenMsg || 'Chỉ tài khoản Chủ quán (Owner) mới có quyền xem danh sách và quản lý tài khoản nhân viên.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500">
              <Users className="w-6 h-6" />
            </div>
            <span>Quản Lý Tài Khoản Nhân Viên</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chỉ Chủ quán (Owner) mới có quyền tạo tài khoản, khóa / mở khóa quyền truy cập hoặc cấp lại mật khẩu.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setCreateName('');
            setCreateEmail('');
            setCreatePassword('');
            setCreateError(null);
            setCreateModalOpen(true);
          }}
          className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/20 self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Thêm nhân viên mới</span>
        </Button>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Staff List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-7 h-7 animate-spin text-blue-500" />
          <span className="text-xs">Đang tải danh sách nhân viên...</span>
        </div>
      ) : staffList.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Chưa có tài khoản nhân viên nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Bấm &quot;Thêm nhân viên mới&quot; để tạo tài khoản đăng nhập cho nhân viên phục vụ quán bar của bạn.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                {/* Left: User Avatar & Info */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                      staff.is_active
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {staff.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {staff.name}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          staff.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {staff.is_active ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{staff.email}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                  {/* Reset Password Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPwdTarget(staff);
                      setNewPassword('');
                      setPwdError(null);
                    }}
                    className="text-xs h-8 gap-1.5 border-slate-700 hover:bg-slate-800 text-slate-300"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Đổi mật khẩu</span>
                  </Button>

                  {/* Lock / Unlock Toggle Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleLock(staff)}
                    className={`text-xs h-8 gap-1.5 border ${
                      staff.is_active
                        ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                        : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    {staff.is_active ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Khóa tài khoản</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Mở khóa</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Tạo Nhân Viên Mới */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span>Thêm Tài Khoản Nhân Viên</span>
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Họ và tên nhân viên <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email đăng nhập <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="an.nv@demobar.vn"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mật khẩu khởi tạo <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={createSubmitting}
                  className="text-xs border-slate-700"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createSubmitting}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  {createSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  <span>Tạo tài khoản</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Đổi Mật Khẩu Staff */}
      {pwdTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Đổi Mật Khẩu</span>
              </h3>
              <button
                type="button"
                onClick={() => setPwdTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              <p className="text-xs text-slate-300">
                Đặt lại mật khẩu đăng nhập cho nhân viên{' '}
                <strong className="text-white">{pwdTarget.name}</strong> ({pwdTarget.email}):
              </p>

              {pwdError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pwdError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mật khẩu mới <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập tối thiểu 6 ký tự..."
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
                  autoFocus
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPwdTarget(null)}
                  disabled={pwdSubmitting}
                  className="text-xs border-slate-700"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={pwdSubmitting}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  {pwdSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  <span>Cập nhật mật khẩu</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
