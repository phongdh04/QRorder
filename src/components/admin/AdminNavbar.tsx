'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  LogOut,
  User,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { ConnectionIndicator } from './ConnectionIndicator';
import { playChimeSound } from '@/lib/sound';

interface AdminNavbarProps {
  restaurantName?: string;
  userName?: string;
  userRole?: string;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  onOpenMobileSidebar: () => void;
}

export function AdminNavbar({
  restaurantName = 'The Velvet Lounge',
  userName = 'Quản lý',
  userRole = 'owner',
  isSoundEnabled,
  onToggleSound,
  connectionStatus,
  onOpenMobileSidebar,
}: AdminNavbarProps) {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Khởi tạo dark mode từ localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('qrorder_admin_theme');
      if (stored === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else if (stored === 'light') {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      } else {
        // Mặc định light mode theo yêu cầu đề bài (tông sáng trung tính)
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const handleToggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('qrorder_admin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('qrorder_admin_theme', 'light');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Lỗi đăng xuất:', err);
    }
  };

  const handleSoundClick = () => {
    onToggleSound();
    // Thử phát thử 1 tiếng ting để kích hoạt AudioContext trên trình duyệt
    if (!isSoundEnabled) {
      playChimeSound();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 h-16 flex items-center justify-between shadow-xs">
      {/* Left side: Hamburger (mobile) + Bar Name */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          title="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {restaurantName}
          </span>
          <span className="hidden md:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Khu Vực Quản Lý
          </span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Connection status indicator */}
        <ConnectionIndicator status={connectionStatus} />

        {/* Nút Bật / Tắt âm báo chuông */}
        <button
          type="button"
          onClick={handleSoundClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isSoundEnabled
              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
          }`}
          title={
            isSoundEnabled
              ? 'Đang bật chuông báo khi có đơn mới'
              : 'Âm báo đang tắt (Bấm để bật ting khi có đơn)'
          }
        >
          {isSoundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="hidden sm:inline">Chuông báo: Bật</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 shrink-0 text-slate-400" />
              <span className="hidden sm:inline">Chuông: Tắt</span>
            </>
          )}
        </button>

        {/* Dark Mode toggle */}
        <button
          type="button"
          onClick={handleToggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          title={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User badge */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
            {userName ? userName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {userName}
            </p>
            <p className="text-[10px] text-slate-400 capitalize">
              {userRole === 'owner' ? 'Chủ quán' : 'Nhân viên'}
            </p>
          </div>
        </div>

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-all ml-1"
          title="Đăng xuất khỏi hệ thống"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
