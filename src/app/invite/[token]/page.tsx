'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InviteAcceptPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const token = params.token;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/invite/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawToken: token,
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Không thể kích hoạt lời mời');
        return;
      }

      // Đăng nhập thành công, chuyển hướng vào /staff
      router.push('/staff');
      router.refresh();
    } catch {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F3EFE6] flex items-center justify-center p-4 selection:bg-[#C9A96A] selection:text-[#0B0B0C]">
      <div className="w-full max-w-sm rounded-[24px] bg-[#151518] border border-[rgba(255,255,255,0.08)] p-8 shadow-2xl space-y-6 text-center">
        {/* Crest */}
        <div className="w-16 h-16 rounded-full bg-[#1D1D20] border border-[#C9A96A]/40 flex items-center justify-center mx-auto text-[#C9A96A] shadow-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>

        <div>
          <h1 className="font-serif text-2xl font-medium text-[#F3EFE6]">
            Tham Gia Đội Ngũ
          </h1>
          <p className="text-xs text-[#A49F94] font-light mt-1">
            Thiết lập thông tin tài khoản nhân viên của bạn
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left text-xs">
          <div>
            <label className="block text-[#A49F94] mb-1 font-medium">Họ và tên</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn An"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1C20] border border-[rgba(255,255,255,0.1)] text-[#F3EFE6] text-sm focus:outline-none focus:border-[#C9A96A]"
            />
          </div>

          <div>
            <label className="block text-[#A49F94] mb-1 font-medium">Email đăng nhập</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="an.nguyen@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1C20] border border-[rgba(255,255,255,0.1)] text-[#F3EFE6] text-sm focus:outline-none focus:border-[#C9A96A]"
            />
          </div>

          <div>
            <label className="block text-[#A49F94] mb-1 font-medium">Mật khẩu mới</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1C20] border border-[rgba(255,255,255,0.1)] text-[#F3EFE6] text-sm focus:outline-none focus:border-[#C9A96A]"
            />
          </div>

          <div>
            <label className="block text-[#A49F94] mb-1 font-medium">Xác nhận mật khẩu</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1C20] border border-[rgba(255,255,255,0.1)] text-[#F3EFE6] text-sm focus:outline-none focus:border-[#C9A96A]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#C9A96A] text-[#0B0B0C] font-semibold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-lg mt-2 disabled:opacity-50"
          >
            {loading ? 'Đang tạo tài khoản...' : 'Kích Hoạt & Vào Ca Ngay'}
          </button>
        </form>

        <p className="text-[11px] text-[#A49F94]/80">
          Link mời có giá trị 24h và chỉ sử dụng được 1 lần duy nhất.
        </p>
      </div>
    </div>
  );
}
