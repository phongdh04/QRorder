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
  onCallStaff?: () => void;
}

export function Header({
  restaurantName,
  tableName,
  logoUrl,
  coverImageUrl,
  ordersCount = 0,
  onOpenOrders,
  onCallStaff,
}: HeaderProps) {
  return (
    <header className="relative w-full overflow-hidden bg-[#08090C] border-b border-[rgba(212,175,55,0.2)]">
      {/* Ambient background banner with Dong Son motif */}
      <div className="relative h-48 sm:h-56 w-full overflow-hidden">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={restaurantName}
            fill
            priority
            className="object-cover opacity-30 filter brightness-75 scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#18181B] via-[#121214] to-[#08090C]" />
        )}

        {/* Subtle Bronze Drum Watermark in background */}
        <div 
          className="absolute inset-0 bg-contain bg-center opacity-15 pointer-events-none"
          style={{ backgroundImage: `url('/trong-dong-watermark.svg')` }}
        />

        {/* Champagne subtle ambient light */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-44 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.22)_0%,_transparent_70%)] pointer-events-none" />

        {/* Dark vignette gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/60 to-transparent" />

        {/* Top actions bar */}
        <div className="absolute top-3 inset-x-3.5 z-20 flex items-center justify-between">
          {/* Quick Staff Calling or VIP Pill */}
          <button
            type="button"
            onClick={onCallStaff}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#08090C]/80 backdrop-blur-md border border-[rgba(212,175,55,0.25)] hover:border-[#D4AF37] text-[#E5C378] text-[10px] sm:text-[11px] uppercase tracking-wider font-medium transition-all shadow-lg active:scale-95"
            title="Gọi nhân viên phục vụ"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gọi phục vụ</span>
          </button>

          {/* Top bar right button for table orders */}
          {onOpenOrders && (
            <button
              type="button"
              onClick={onOpenOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#08090C]/85 backdrop-blur-md border border-[rgba(212,175,55,0.3)] hover:border-[#D4AF37] text-[#F7F4EB] text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold transition-all shadow-lg active:scale-95 group"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="w-3.5 h-3.5 text-[#D4AF37] group-hover:scale-110 transition-transform"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Đơn của bàn</span>
              {ordersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-gradient-to-r from-[#F3C766] to-[#D4AF37] text-[#08090C] text-[10px] font-black flex items-center justify-center font-sans shadow-md shadow-[#D4AF37]/30">
                  {ordersCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content wrapper */}
      <div className="relative -mt-16 px-4 pb-6 text-center flex flex-col items-center">
        {/* Crest / Logo */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1E222B] via-[#111318] to-[#08090C] border-2 border-[#D4AF37]/50 p-1.5 shadow-2xl shadow-black/90 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105">
            <img
              src={logoUrl || '/trong-dong-logo.svg'}
              alt={restaurantName}
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.35)]"
            />
          </div>
          <div className="absolute inset-0 rounded-full bg-[#D4AF37]/15 blur-lg -z-10 group-hover:bg-[#D4AF37]/25 transition-all" />
        </div>

        {/* Restaurant Name */}
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-[0.08em] text-gold-gradient uppercase leading-tight drop-shadow-sm">
          {restaurantName}
        </h1>

        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-[#C9A96A]/90 font-medium mt-1">
          Modern Vietnamese Cuisine & Gastro Lounge
        </p>

        {/* Table Badge & VIP Status */}
        <div className="mt-3 flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[rgba(212,175,55,0.18)] to-[rgba(212,175,55,0.08)] border border-[#D4AF37]/40 shadow-sm shadow-[#D4AF37]/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
            <span className="text-xs font-bold text-[#F3C766] tracking-[0.18em] uppercase font-sans">
              {tableName}
            </span>
          </div>
          <span className="text-[11px] text-[#A8A295] tracking-wider font-light">
            • Quý khách vui lòng chọn món
          </span>
        </div>
      </div>
    </header>
  );
}
