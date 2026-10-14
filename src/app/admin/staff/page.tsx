'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  QrCode,
  Copy,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
}

function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return 'Chưa online';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 1000));
  if (diffSec < 60) return 'Vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  const hours = Math.floor(diffSec / 3600);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'manager' | 'staff'>('staff');
  const [isLoading, setIsLoading] = useState(true);
  const [forbiddenMsg, setForbiddenMsg] = useState<string | null>(null);

  // Modal Tạo Tài Khoản Trực Tiếp
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'staff' | 'manager'>('staff');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal Tạo Link Mời (Invite Link)
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<'staff' | 'manager'>('staff');
  const [inviteName, setInviteName] = useState('');
  const [inviteResult, setInviteResult] = useState<{
    inviteUrl: string;
    token: string;
    qrDataUrl: string;
    expiresAt: string;
  } | null>(null);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modal Đổi Mật Khẩu Staff
  const [pwdTarget, setPwdTarget] = useState<StaffUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/staff');
      if (res.status === 403) {
        const json = await res.json();
        setForbiddenMsg(json.error || 'Bạn không có quyền truy cập trang quản lý nhân viên.');
        return;
      }
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.staff) {
          setStaffList(json.staff);
          if (json.currentUserRole) {
            setCurrentUserRole(json.currentUserRole);
          }
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách nhân viên:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

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

  // Đổi vai trò (Owner only)
  const handleChangeRole = async (staff: StaffUser, newRole: 'staff' | 'manager') => {
    try {
      const res = await fetch(`/api/admin/staff/${staff.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi đổi vai trò.');
      showToast(data.message || 'Cập nhật vai trò thành công.');
      await fetchStaff();
    } catch (err: any) {
      alert(err?.message || 'Không thể cập nhật vai trò.');
    }
  };

  // Tạo tài khoản trực tiếp
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
          role: createRole,
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

  // Tạo Link Mời một lần
  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSubmitting(true);
    try {
      const res = await fetch('/api/admin/staff/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: inviteRole,
          name: inviteName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo link mời.');

      setInviteResult({
        inviteUrl: data.inviteUrl,
        token: data.token,
        qrDataUrl: data.qrDataUrl,
        expiresAt: data.expiresAt,
      });
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const copyInviteLink = () => {
    if (!inviteResult) return;
    navigator.clipboard.writeText(inviteResult.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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

  if (forbiddenMsg) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Quyền truy cập bị giới hạn</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{forbiddenMsg}</p>
      </div>
    );
  }

  const isOwner = currentUserRole === 'owner';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Quản Lý Tài Khoản Nhân Viên</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isOwner
              ? 'Chủ quán (Owner): Tạo/khóa quản lý & nhân viên, đổi vai trò, cấp link mời.'
              : 'Quản lý (Manager): Tạo/khóa tài khoản nhân viên phục vụ (staff).'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Nút Tạo Link Mời */}
          <Button
            size="sm"
            onClick={() => {
              setInviteResult(null);
              setInviteName('');
              setInviteRole('staff');
              setInviteModalOpen(true);
            }}
            className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-500/20"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Tạo link mời (QR)</span>
          </Button>

          {/* Nút Thêm nhân viên trực tiếp */}
          <Button
            size="sm"
            onClick={() => {
              setCreateName('');
              setCreateEmail('');
              setCreatePassword('');
              setCreateRole('staff');
              setCreateError(null);
              setCreateModalOpen(true);
            }}
            className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/20"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm tài khoản</span>
          </Button>
        </div>
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
        <div className="py-16 text-center bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Chưa có tài khoản nhân viên nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Bấm &quot;Tạo link mời&quot; hoặc &quot;Thêm tài khoản&quot; để tạo người dùng phục vụ cho quán.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="divide-y divide-slate-800">
            {staffList.map((staff) => {
              const isSelf = staff.role === 'owner' && isOwner;
              const canEditThisUser =
                isOwner ? staff.role !== 'owner' : staff.role === 'staff';

              return (
                <div
                  key={staff.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                >
                  {/* Left: User Avatar & Info */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                        staff.role === 'owner'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : staff.role === 'manager'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : staff.is_active
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {staff.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{staff.name}</h4>

                        {/* Role Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            staff.role === 'owner'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : staff.role === 'manager'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}
                        >
                          {staff.role === 'owner'
                            ? '👑 Chủ quán'
                            : staff.role === 'manager'
                            ? 'Quản lý'
                            : 'Nhân viên'}
                        </span>

                        {/* Status Badge */}
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

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{staff.email}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Lần cuối: {formatLastSeen(staff.last_seen_at)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {/* Role selector (Owner only) */}
                    {isOwner && staff.role !== 'owner' && (
                      <select
                        value={staff.role}
                        onChange={(e) =>
                          handleChangeRole(staff, e.target.value as 'staff' | 'manager')
                        }
                        className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="staff">Nhân viên</option>
                        <option value="manager">Quản lý</option>
                      </select>
                    )}

                    {/* Reset Password Button */}
                    {canEditThisUser && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPwdTarget(staff);
                          setNewPassword('');
                          setPwdError(null);
                        }}
                        className="h-8 text-xs gap-1.5 border-slate-700 hover:bg-slate-800 text-slate-300"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Đổi mật khẩu</span>
                      </Button>
                    )}

                    {/* Lock / Unlock Toggle */}
                    {canEditThisUser && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleLock(staff)}
                        className={`h-8 text-xs gap-1.5 border-slate-700 ${
                          staff.is_active
                            ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/30'
                            : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                        }`}
                      >
                        {staff.is_active ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Khóa</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Mở</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Tạo Link Mời Một Lần */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400" />
                Tạo Link & Mã QR Mời Nhân Viên
              </h3>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!inviteResult ? (
              <form onSubmit={handleGenerateInvite} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Link mời một lần có hiệu lực trong 24 giờ. Nhân viên mở link hoặc quét QR để tự đặt mật khẩu cá nhân rồi vào cổng làm việc.
                </p>

                {isOwner && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Vai trò tài khoản:
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
                    >
                      <option value="staff">Nhân viên phục vụ (Staff)</option>
                      <option value="manager">Quản lý (Manager)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ghi chú tên nhân viên (tùy chọn):
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Bạn Nguyễn Văn A..."
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={inviteSubmitting}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {inviteSubmitting ? 'Đang tạo...' : 'Tạo mã mời ngay'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-white rounded-2xl w-52 h-52 mx-auto flex items-center justify-center shadow-lg">
                  <Image
                    src={inviteResult.qrDataUrl}
                    alt="Mã QR Mời"
                    width={192}
                    height={192}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                </div>

                <div className="text-left space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Đường dẫn kích hoạt tài khoản:
                  </label>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <input
                      type="text"
                      readOnly
                      value={inviteResult.inviteUrl}
                      className="bg-transparent text-xs text-slate-200 font-mono w-full focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={copyInviteLink}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white shrink-0 transition-colors"
                      title="Sao chép"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left text-xs text-amber-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Lưu ý bảo mật:
                  </p>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Link này chỉ dùng được <strong>1 lần duy nhất</strong> và hết hạn sau 24h. Hệ thống chỉ lưu bản băm (hash), bạn sẽ không thể xem lại mã này sau khi đóng bảng.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
                >
                  Xong
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Tạo Nhân Viên Trực Tiếp */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                Tạo Tài Khoản Nhân Viên
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Họ và tên nhân viên:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email đăng nhập:
                </label>
                <input
                  type="email"
                  placeholder="an.nguyen@bar.local"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {isOwner && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vai trò:
                  </label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="staff">Nhân viên phục vụ (Staff)</option>
                    <option value="manager">Quản lý (Manager)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mật khẩu khởi tạo:
                </label>
                <input
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {createSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đổi Mật Khẩu */}
      {pwdTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Cấp Lại Mật Khẩu
              </h3>
              <button
                type="button"
                onClick={() => setPwdTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Đặt mật khẩu mới cho nhân viên: <strong className="text-white">{pwdTarget.name}</strong>
            </p>

            {pwdError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mật khẩu mới:
                </label>
                <input
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPwdTarget(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={pwdSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {pwdSubmitting ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
