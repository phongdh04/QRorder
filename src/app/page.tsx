import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Wine, QrCode, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const revalidate = 0;

export default async function HomePage() {
  let tables: Array<{ id: string; name: string; token: string }> = [];
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: 'demo-bar' },
      include: {
        tables: {
          where: { is_active: true },
          orderBy: { name: 'asc' },
          take: 10,
        },
      },
    });
    if (restaurant) {
      tables = restaurant.tables;
    }
  } catch (error) {
    console.warn('Database chưa khởi tạo hoặc đang chờ migrate:', error);
  }

  return (
    <main className="min-h-screen bg-[#07090E] relative overflow-hidden flex flex-col justify-between">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-amber-500/15 via-yellow-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 glass-panel px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Wine className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 tracking-wide">The Velvet Lounge</h1>
              <p className="text-xs text-amber-400/90 font-medium tracking-wider uppercase">QR Order MVP for Cocktail Bar</p>
            </div>
          </div>

          <Link href="/admin/login">
            <Button variant="gold" size="sm" className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Vào Quản Lý Bar</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 text-center my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hệ Thống Gọi Món & Quản Lý Bar Không Cần Cài App</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          Trải Nghiệm Gọi Đồ Uống <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
            Đẳng Cấp & Nhanh Chóng
          </span>
        </h2>

        <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base mb-10 leading-relaxed">
          Khách chỉ cần quét mã QR tại bàn để xem thực đơn cocktail, tùy chỉnh ghi chú và đặt món tức thì. Quầy bar tiếp nhận đơn theo thời gian thực (KDS), tự động chốt hóa đơn và thanh toán.
        </p>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
          {/* Khách hàng - Danh sách bàn */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 hover:border-amber-500/40 transition-all duration-300 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Khách Hàng (Mô phỏng quét QR)</h3>
                <p className="text-xs text-slate-400">Chọn bất kỳ bàn nào bên dưới để mở giao diện gọi món:</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4 max-h-56 overflow-y-auto pr-1">
              {tables.length > 0 ? (
                tables.map((tbl) => (
                  <Link
                    key={tbl.id}
                    href={`/t/${tbl.token}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-850 text-xs font-medium text-slate-200 transition-all group"
                  >
                    <span>{tbl.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </Link>
                ))
              ) : (
                <div className="col-span-3 text-center py-6 text-xs text-slate-500">
                  Đang khởi tạo danh sách 10 bàn...
                </div>
              )}
            </div>
          </div>

          {/* Admin / Quầy Bar */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 hover:border-yellow-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Quản Trị Quầy Bar & Thu Ngân</h3>
                  <p className="text-xs text-slate-400">Bảng điều khiển nhận đơn, quản lý bàn & thanh toán</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-1.5 text-slate-300 mb-6">
                <p className="font-semibold text-amber-400">Tài khoản quản lý mẫu (Demo):</p>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Email:</span>
                  <code className="text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded">owner@demobar.vn</code>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Mật khẩu:</span>
                  <code className="text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded">Admin@123456</code>
                </div>
              </div>
            </div>

            <Link href="/admin/login" className="w-full">
              <Button variant="gold" className="w-full gap-2">
                <span>Đăng Nhập Trang Quản Trị</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12 text-center">
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 text-xs text-slate-300 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Chống gọi trùng (1 Session/Bàn)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 text-xs text-slate-300 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tiền tệ chuẩn VND (120.000đ)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 text-xs text-slate-300 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Chạy 100% Docker cục bộ</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 text-xs text-slate-300 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tự động Backup 14 bản</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
        QR Order System MVP • Bar Edition • Built with Next.js, Prisma & PostgreSQL
      </footer>
    </main>
  );
}
