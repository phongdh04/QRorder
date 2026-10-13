'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wine,
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  MenuSquare,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Đừng render navbar nếu đang ở trang login
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { href: '/admin', label: 'Tổng Quan', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Quầy Bar (KDS)', icon: UtensilsCrossed },
    { href: '/admin/tables', label: 'Quản Lý Bàn & QR', icon: Layers },
    { href: '/admin/menu', label: 'Thực Đơn Món', icon: MenuSquare },
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Wine className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-wide">The Velvet Lounge</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Admin Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 px-3 py-1.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            >
              <span>Xem trang khách</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs gap-1.5 border-slate-800 hover:border-rose-500/40 hover:text-rose-400"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng Xuất</span>
            </Button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 pt-3 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">{children}</main>
    </div>
  );
}
