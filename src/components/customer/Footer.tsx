'use client';

import React from 'react';

interface FooterProps {
  restaurantName: string;
}

export function Footer({ restaurantName }: FooterProps) {
  return (
    <footer className="mt-14 pt-8 pb-12 border-t border-[var(--border)] text-center space-y-2 text-[var(--muted)]">
      <div className="w-8 h-[1px] bg-[var(--accent)]/30 mx-auto mb-3" />
      <p className="font-serif text-sm tracking-wider text-[var(--text)]">
        {restaurantName}
      </p>
      <p className="text-[11px] tracking-widest uppercase font-light">
        Chân thành cảm ơn quý khách • Chúc quý khách một buổi tối trọn vẹn
      </p>
    </footer>
  );
}
