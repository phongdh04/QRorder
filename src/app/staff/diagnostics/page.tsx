'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DiagnosticsModal } from '@/components/staff/DiagnosticsModal';

export default function StaffDiagnosticsPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F3EFE6] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <h1 className="font-serif text-2xl font-medium text-[var(--accent)]">
          Chẩn Đoán Thiết Bị Nhân Viên
        </h1>
        <p className="text-xs text-[var(--muted)]">
          Kiểm tra PWA, Web Push, SSE Realtime và Wake Lock
        </p>

        <DiagnosticsModal
          isOpen={isOpen}
          onClose={() => {}}
          isRealtimeConnected={true}
          isWakeLockActive={false}
        />

        <div className="pt-4">
          <Link
            href="/staff"
            className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1"
          >
            ← Quay lại Cổng Nhân Viên
          </Link>
        </div>
      </div>
    </div>
  );
}
