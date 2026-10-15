import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const revalidate = 0;

export default async function HomePage() {
  let tables: Array<{ id: string; name: string; token: string }> = [];
  let restaurantName = 'TRỐNG ĐỒNG STATION';

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: 'demo-bar' },
      include: {
        tables: {
          where: { is_active: true },
          orderBy: { name: 'asc' },
          take: 80,
        },
      },
    });
    if (restaurant) {
      restaurantName = restaurant.name;
      tables = restaurant.tables;
    }
  } catch (error) {
    console.warn('Database chưa kết nối hoặc đang khởi động:', error);
  }

  return (
    <main className="min-h-screen bg-[#08090C] text-[#F7F4EB] relative overflow-hidden flex flex-col justify-between selection:bg-[#D4AF37] selection:text-[#08090C]">
      {/* Background glow & watermark effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-[#D4AF37]/15 via-[#F3C766]/5 to-transparent blur-3xl pointer-events-none" />
      <div 
        className="absolute inset-0 bg-contain bg-center opacity-10 pointer-events-none -z-0"
        style={{ backgroundImage: `url('/trong-dong-watermark.svg')` }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-[rgba(212,175,55,0.2)] bg-[#08090C]/85 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1E222B] to-[#111318] border border-[#D4AF37]/50 flex items-center justify-center p-1 shadow-lg shadow-[#D4AF37]/15">
              <img
                src="/trong-dong-logo.svg"
                alt="Trống Đồng Station"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-widest text-gold-gradient uppercase">
                {restaurantName}
              </h1>
              <p className="text-[10px] text-[#C9A96A] font-medium tracking-[0.2em] uppercase">
                Gastro Station & Modern Culinary Art
              </p>
            </div>
          </div>

          <Link href="/admin/login">
            <Button variant="gold" size="sm" className="gap-2 bg-gradient-to-r from-[#F3C766] to-[#D4AF37] text-[#08090C] font-bold shadow-md shadow-[#D4AF37]/20">
              <ShieldCheck className="w-4 h-4" />
              <span>Quản Trị Bếp & Thu Ngân</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 text-center my-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[#F3C766] text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#F3C766]" />
          <span>Hệ Thống Thực Đơn QR & Gọi Món Trực Tiếp Chuẩn Luxury</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight font-serif">
          Trải Nghiệm Ẩm Thực <br className="hidden md:block" />
          <span className="text-gold-gradient">
            Trống Đồng Station
          </span>
        </h2>

        <p className="text-[#A8A295] max-w-2xl mx-auto text-sm md:text-base mb-10 leading-relaxed font-light">
          Thực khách chỉ cần quét mã QR tại bàn để khám phá hơn 130 món ăn đặc sản, hải sản tươi sống, bò thượng hạng, gà quay lu và đồ uống mát lạnh. Đơn gọi được chuyển tiếp tức thì tới Bếp & Quầy phục vụ theo thời gian thực.
        </p>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
          {/* Khách hàng - Danh sách bàn */}
          <div className="rounded-2xl bg-[#111318]/90 border border-[rgba(212,175,55,0.25)] hover:border-[#D4AF37]/60 transition-all duration-300 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center text-[#F3C766]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F7F4EB] font-serif">Khu Bàn VIP (Mô phỏng quét QR)</h3>
                <p className="text-xs text-[#A8A295]">Chọn bất kỳ bàn nào bên dưới để mở giao diện gọi món:</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4 max-h-56 overflow-y-auto pr-1">
              {tables.length > 0 ? (
                tables.map((tbl) => (
                  <Link
                    key={tbl.id}
                    href={`/t/${tbl.token}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#181B22] border border-[rgba(212,175,55,0.18)] hover:border-[#D4AF37] hover:bg-[#1E222B] text-xs font-semibold text-[#F7F4EB] transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                      <span>{tbl.name}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#A8A295] group-hover:text-[#F3C766] group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))
              ) : (
                <div className="col-span-3 text-center py-6 text-xs text-[#A8A295]">
                  Đang khởi tạo danh sách 10 bàn VIP...
                </div>
              )}
            </div>
          </div>

          {/* Admin / Quầy Bếp & Thu Ngân */}
          <div className="rounded-2xl bg-[#111318]/90 border border-[rgba(212,175,55,0.25)] hover:border-[#D4AF37]/60 transition-all duration-300 p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center text-[#F3C766]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#F7F4EB] font-serif">Quản Trị Bếp & Thu Ngân</h3>
                  <p className="text-xs text-[#A8A295]">Màn hình KDS nhận đơn, chốt bill & in hóa đơn</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#181B22] border border-[rgba(212,175,55,0.15)] text-xs space-y-1.5 text-[#F7F4EB] mb-6">
                <p className="font-bold text-[#F3C766]">Tài khoản quản lý mẫu (Demo):</p>
                <div className="flex items-center justify-between text-[#A8A295]">
                  <span>Email:</span>
                  <code className="text-[#F7F4EB] bg-[#08090C] px-2 py-0.5 rounded border border-[rgba(212,175,55,0.2)]">owner@demobar.vn</code>
                </div>
                <div className="flex items-center justify-between text-[#A8A295]">
                  <span>Mật khẩu:</span>
                  <code className="text-[#F7F4EB] bg-[#08090C] px-2 py-0.5 rounded border border-[rgba(212,175,55,0.2)]">Admin@123456</code>
                </div>
              </div>
            </div>

            <Link href="/admin/login" className="w-full">
              <Button variant="gold" className="w-full gap-2 bg-gradient-to-r from-[#F3C766] via-[#D4AF37] to-[#B8922A] text-[#08090C] font-bold shadow-lg shadow-[#D4AF37]/25 h-11">
                <span>Vào Màn Hình Quản Trị Bếp & Bar</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12 text-center">
          <div className="p-3.5 rounded-xl bg-[#111318]/70 border border-[rgba(212,175,55,0.2)] text-xs text-[#F7F4EB] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F3C766] shrink-0" />
            <span>Thực đơn 134 món chính thức</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#111318]/70 border border-[rgba(212,175,55,0.2)] text-xs text-[#F7F4EB] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F3C766] shrink-0" />
            <span>Thời gian thực KDS (SSE)</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#111318]/70 border border-[rgba(212,175,55,0.2)] text-xs text-[#F7F4EB] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F3C766] shrink-0" />
            <span>Hình ảnh ẩm thực Luxury</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#111318]/70 border border-[rgba(212,175,55,0.2)] text-xs text-[#F7F4EB] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F3C766] shrink-0" />
            <span>Giao diện Trống Đồng Đông Sơn</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(212,175,55,0.2)] py-4 text-center text-xs text-[#A8A295] bg-[#08090C]/90">
        TRỐNG ĐỒNG STATION • Gastro Station & Modern Culinary Art • Hệ Thống Gọi Món Bàn Cao Cấp
      </footer>
    </main>
  );
}
