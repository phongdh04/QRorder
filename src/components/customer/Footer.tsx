'use client';

import React from 'react';

interface FooterProps {
  restaurantName: string;
}

export function Footer({ restaurantName }: FooterProps) {
  return (
    <footer className="mt-14 pt-8 pb-14 border-t border-[rgba(212,175,55,0.2)] text-center space-y-2.5 text-[#A8A295]">
      <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-3" />
      <p className="font-serif text-base tracking-widest text-gold-gradient font-bold uppercase">
        {restaurantName}
      </p>
      <p className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-[#A8A295] font-medium">
        Gastro Station & Modern Culinary Art
      </p>
      <p className="text-[10px] text-[#A8A295]/60 pt-1">
        Chân thành cảm ơn quý khách • Chúc quý khách một buổi tối trọn vẹn
      </p>
    </footer>
  );
}
