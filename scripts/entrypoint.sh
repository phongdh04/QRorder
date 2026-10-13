#!/bin/sh
set -e

echo "============================================="
echo "🚀 ĐANG KHỞI ĐỘNG HỆ THỐNG QR ORDER (BAR DEV)"
echo "============================================="

# 1. Kiểm tra node_modules
if [ ! -d "node_modules/@prisma" ] || [ ! -d "node_modules/next" ]; then
  echo "📦 Cài đặt thư viện dependencies..."
  npm install
fi

# 2. Sinh Prisma Client
echo "⚙️  Sinh Prisma client..."
npx prisma generate

# 3. Đẩy schema vào cơ sở dữ liệu Postgres
echo "🗄️  Đồng bộ Database Schema (Prisma db push)..."
npx prisma db push --skip-generate

# 4. Áp dụng unique partial index
echo "🔒 Áp dụng ràng buộc partial index (1 session open / bàn)..."
npx tsx scripts/apply-index.ts

# 5. Tự động chạy seed dữ liệu mẫu
echo "🌱 Chạy seed dữ liệu mẫu cho quán bar..."
npx tsx scripts/seed.ts || true

# 6. Chạy Next.js Development Server
echo "🍸 Khởi động Next.js dev server tại http://0.0.0.0:3000..."
exec npm run dev
