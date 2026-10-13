'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/context/AdminContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminNavbar } from '@/components/admin/AdminNavbar';

function AdminShell({ children }: { children: React.ReactNode }) {
  const {
    restaurantName,
    userName,
    userRole,
    isSoundEnabled,
    toggleSound,
    connectionStatus,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useAdmin();

  return (
    <div className="min-h-screen bg-[#F7F7F8] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-row antialiased">
      {/* Sidebar */}
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Navbar */}
        <AdminNavbar
          restaurantName={restaurantName}
          userName={userName}
          userRole={userRole}
          isSoundEnabled={isSoundEnabled}
          onToggleSound={toggleSound}
          connectionStatus={connectionStatus}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Đừng render navbar & sidebar nếu đang ở trang login
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
