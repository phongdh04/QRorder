'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminContextType {
  restaurantName: string;
  userName: string;
  userRole: string;
  isSoundEnabled: boolean;
  setIsSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSound: () => void;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  setConnectionStatus: React.Dispatch<React.SetStateAction<'connected' | 'connecting' | 'disconnected'>>;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fetchAdminInfo: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [restaurantName, setRestaurantName] = useState('The Velvet Lounge');
  const [userName, setUserName] = useState('Quản lý');
  const [userRole, setUserRole] = useState('owner');
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fetchAdminInfo = async () => {
    try {
      const res = await fetch('/api/admin/restaurant');
      if (res.ok) {
        const data = await res.json();
        if (data.restaurant?.name) setRestaurantName(data.restaurant.name);
        if (data.user?.name) setUserName(data.user.name);
        if (data.user?.role) setUserRole(data.user.role);
      }
    } catch (err) {
      console.warn('Không thể tải thông tin quán:', err);
    }
  };

  useEffect(() => {
    fetchAdminInfo();
  }, []);

  const toggleSound = () => {
    setIsSoundEnabled((prev) => !prev);
  };

  return (
    <AdminContext.Provider
      value={{
        restaurantName,
        userName,
        userRole,
        isSoundEnabled,
        setIsSoundEnabled,
        toggleSound,
        connectionStatus,
        setConnectionStatus,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        fetchAdminInfo,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
