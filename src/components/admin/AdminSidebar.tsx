'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  TrendingUp,
  UtensilsCrossed,
  QrCode,
  Store,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarClock,
  Wifi,
  Wine,
  X,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
  badge?: string;
}

export function AdminSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { userRole } = useAdmin();

  const isOwner = userRole === 'owner';

  const navItems: NavItem[] = [
    {
      href: '/admin',
      label: 'Bàn & Đơn',
      icon: LayoutGrid,
    },
    {
      href: '/admin/shifts',
      label: 'Ca & phân khu',
      icon: CalendarClock,
    },
    {
      href: '/admin/staff',
      label: 'Nhân viên',
      icon: Users,
    },
    {
      href: '/admin/staff/guide',
      label: 'Tờ in Wi-Fi',
      icon: Wifi,
    },
    ...(isOwner
      ? [
          {
            href: '/admin/revenue',
            label: 'Doanh thu',
            icon: TrendingUp,
          },
          {
            href: '/admin/menu',
            label: 'Thực đơn',
            icon: UtensilsCrossed,
          },
          {
            href: '/admin/tables',
            label: 'Bàn & QR',
            icon: QrCode,
          },
          {
            href: '/admin/store',
            label: 'Thông tin quán',
            icon: Store,
          },
        ]
      : []),
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Brand / Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 font-bold">
            <Wine className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                The Velvet Lounge
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Quản trị quầy bar
              </p>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.disabled) {
            return (
              <div
                key={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed select-none ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={`${item.label} (${item.badge})`}
              >
                <Icon className="w-4 h-4 shrink-0 opacity-60" />
                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 font-normal">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isCollapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Collapse Toggle Footer (Desktop/Tablet only) */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 hidden lg:block">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Thu gọn menu</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 sticky top-0 h-screen z-30 ${
          isCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-xs h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
