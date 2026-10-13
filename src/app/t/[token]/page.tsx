import React from 'react';
import type { Metadata } from 'next';
import { customerGetPublicMenuByToken } from '@/lib/dal/customer';
import { CustomerView } from '@/components/customer/CustomerView';

interface PageProps {
  params: {
    token: string;
  };
}

export const revalidate = 0;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await customerGetPublicMenuByToken(params.token);
  if (!data) {
    return {
      title: 'Thông Báo • The Velvet Lounge',
      description: 'Mã QR không còn hiệu lực',
    };
  }

  return {
    title: `${data.table.name} • ${data.restaurant.name}`,
    description: `Thực đơn đồ uống và món ăn cao cấp tại ${data.restaurant.name}`,
  };
}

export default async function TablePublicMenuPage({ params }: PageProps) {
  const data = await customerGetPublicMenuByToken(params.token);

  // Trường hợp mã token không hợp lệ hoặc bàn đã bị tắt (is_active = false)
  if (!data) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] text-[#F3EFE6] flex items-center justify-center p-6 selection:bg-[#C9A96A] selection:text-[#0B0B0C]">
        <div className="w-full max-w-sm rounded-[24px] bg-[#151517] border border-[rgba(255,255,255,0.08)] p-8 text-center space-y-5 shadow-2xl">
          {/* Subtle crest icon */}
          <div className="w-14 h-14 rounded-full bg-[#1D1D20] border border-[#C9A96A]/30 flex items-center justify-center mx-auto text-[#C9A96A]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-6 h-6"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-xl font-medium tracking-wide text-[#F3EFE6]">
              Thông Báo
            </h2>
            <div className="h-[1px] w-12 bg-[#C9A96A]/40 mx-auto my-2" />
            <p className="text-xs text-[#A49F94] leading-relaxed font-light">
              Mã QR này không còn hiệu lực. <br />
              Vui lòng liên hệ nhân viên để được hỗ trợ.
            </p>
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] text-[#A49F94]/60 pt-2 font-light">
            The Velvet Lounge
          </p>
        </div>
      </div>
    );
  }

  return <CustomerView data={data} />;
}
