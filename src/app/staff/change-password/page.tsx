'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function StaffChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/staff/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Đổi mật khẩu thất bại');
        return;
      }

      setMessage('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F3EFE6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-[24px] bg-[#151518] border border-[rgba(255,255,255,0.08)] p-8 shadow-2xl space-y-6 text-center">
        <h1 className="font-serif text-2xl font-medium tracking-wide text-[#F3EFE6]">
          Đổi Mật Khẩu
        </h1>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs text-left">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs text-left">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A49F94] mb-1 font-medium">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1C1C20] border border-[rgba(255,255,255,0.1)] text-[#F3EFE6] text-sm focus:outline-none focus:border-[#C9A96A]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A49F94] mb-1 font-medium">
              Mật khẩu mới
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1C1C20] border border-[rgba(255,255,255,0.1)] text-[#F3EFE6] text-sm focus:outline-none focus:border-[#C9A96A]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A49F94] mb-1 font-medium">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1C1C20] border border-[rgba(255,255,255,0.1)] text-[#F3EFE6] text-sm focus:outline-none focus:border-[#C9A96A]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#C9A96A] text-[#0B0B0C] font-semibold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-lg mt-2 disabled:opacity-50"
          >
            {loading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
          </button>
        </form>

        <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
          <Link
            href="/staff"
            className="text-xs text-[#A49F94] hover:text-[#C9A96A] transition-colors inline-block"
          >
            ← Quay lại Cổng Nhân Viên
          </Link>
        </div>
      </div>
    </div>
  );
}
