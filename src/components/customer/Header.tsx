'use client';

import React from 'react';
import Image from 'next/image';

interface HeaderProps {
  restaurantName: string;
  tableName: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  ordersCount?: number;
  onOpenOrders?: () => void;
}

export function Header({
  restaurantName,
  tableName,
  logoUrl,
  coverImageUrl,
  ordersCount = 0,
  onOpenOrders,
}: HeaderProps) {
  return (
    <header className="relative w-full overflow-hidden bg-[var(--surface)] border-b border-[var(--border)]">
      {/* Ambient background banner */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={restaurantName}
            fill
            priority
            className="object-cover opacity-35 filter brightness-75"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#18181B] via-[#121214] to-[var(--surface)]" />
        )}

        {/* Champagne subtle ambient light */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-44 bg-[var(--accent)]/10 blur-3xl pointer-events-none" />

        {/* Dark vignette gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/60 to-transparent" />

        {/* Top bar right button for table orders */}
        {onOpenOrders && (
          <div className="absolute top-3 right-3 z-20">
            <button
              type="button"
              onClick={onOpenOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B0B0C]/75 backdrop-blur-md border border-[var(--border)] hover:border-[var(--accent)]/40 text-[var(--text)] text-[11px] uppercase tracking-wider font-medium transition-all shadow-md"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="w-3.5 h-3.5 text-[var(--accent)]"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Đơn của bàn</span>
              {ordersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[var(--accent)] text-[#0B0B0C] text-[10px] font-bold flex items-center justify-center font-sans">
                  {ordersCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content wrapper */}
      <div className="relative -mt-16 px-5 pb-6 text-center flex flex-col items-center">
        {/* Crest / Logo */}
        <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] border border-[var(--accent)]/30 p-1 shadow-lg shadow-black/60 flex items-center justify-center mb-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={restaurantName}
              className="w-full h-full object-contain rounded-full"
            />
          ) : (
            <div className="w-full h-full rounded-full border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-7 h-7"
              >
                <path d="M8 22h8" />
                <path d="M12 15v7" />
                <path d="m19 3-7 8-7-8Z" />
              </svg>
            </div>
          )}
        </div>

        {/* Restaurant Name */}
        <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-wide text-[var(--text)] leading-tight">
          {restaurantName}
        </h1>

        {/* Table & Welcome */}
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/25 text-[var(--accent)] text-[11px] font-medium tracking-[0.2em] uppercase">
            {tableName}
          </span>
          <span className="text-[11px] text-[var(--muted)] tracking-wider">
            • Chào mừng quý khách
          </span>
        </div>
      </div>
    </header>
  );
}
