import React from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { StaffPortalView } from '@/components/staff/StaffPortalView';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'QR Order • Nhân Viên',
  description: 'Hệ thống tiếp nhận và phục vụ đơn hàng dành cho nhân viên',
};

export default async function StaffPage() {
  const user = await getCurrentUser(true);

  if (!user) {
    redirect('/staff/login');
  }

  return (
    <StaffPortalView
      user={{
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
      }}
    />
  );
}
