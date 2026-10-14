'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Đăng nhập không thành công');
        return;
      }

      // Đăng nhập thành công -> chuyển về giao diện nhân viên
      router.push('/staff');
      router.refresh();
    } catch {
      setError('Lỗi kết nối máy chủ khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F3EFE6] flex items-center justify-center p-4 selection:bg-[#C9A96A] selection:text-[#0B0B0C]">
      <div className="w-full max-w-sm rounded-[24px] bg-[#151518] border border-[rgba(255,255,255,0.08)] p-8 shadow-2xl space-y-6 text-center">
        {/* Crest Logo */}
        <div className="w-16 h-16 rounded-full bg-[#1D1D20] border border-[#C9A96A]/30 flex items-center justify-center mx-auto text-[#C9A96A] shadow-lg shadow-black/40">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-8 h-8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>

        <div>
          <h1 className="font-serif text-2xl font-medium tracking-wide text-[#F3EFE6]">
            Cổng Nhân Viên
          </h1>
          <p className="text-xs text-[#A49F94] font-light mt-1">
            Đăng nhập để nhận và phục vụ đơn hàng
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A49F94] mb-1.5 font-medium">
              Email nhân viên
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff1@demobar.vn"
              className="w-full px-4 py-3 rounded-xl bg-[#1C1C20] border border-[rgba(255,255,255,0.1)] text-[#F3EFE6] text-sm focus:outline-none focus:border-[#C9A96A] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A49F94] mb-1.5 font-medium">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[#1C1C20] border border-[rgba(255,255,255,0.1)] text-[#F3EFE6] text-sm focus:outline-none focus:border-[#C9A96A] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#C9A96A] text-[#0B0B0C] font-semibold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-[#C9A96A]/20 mt-2 disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập Vào Ca'}
          </button>
        </form>

        <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs text-[#A49F94]">
          <span className="text-[11px]">QR Order Staff PWA</span>
          <a href="/admin/login" className="hover:text-[#C9A96A] transition-colors">
            Cổng Quản Trị →
          </a>
        </div>
      </div>
    </div>
  );
}
