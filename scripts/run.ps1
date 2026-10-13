param (
    [Parameter(Position=0)]
    [string]$Action = "up"
)

switch ($Action.ToLower()) {
    "up" {
        Write-Host "🚀 Khởi động QR Order (Development mode)..." -ForegroundColor Cyan
        docker compose up --build
    }
    "down" {
        Write-Host "🛑 Đang tắt các container..." -ForegroundColor Yellow
        docker compose down
    }
    "restart" {
        Write-Host "🔄 Đang khởi động lại dịch vụ..." -ForegroundColor Cyan
        docker compose restart
    }
    "migrate" {
        Write-Host "🗄️ Chạy Prisma Database Push..." -ForegroundColor Green
        docker compose exec app npx prisma db push
    }
    "seed" {
        Write-Host "🌱 Chạy Seed dữ liệu mẫu quán bar..." -ForegroundColor Green
        docker compose exec app npx tsx scripts/seed.ts
    }
    "logs" {
        Write-Host "📜 Xem logs container..." -ForegroundColor Cyan
        docker compose logs -f
    }
    "prod-up" {
        Write-Host "🚀 Khởi động Production (Caddy + SSL + Backup)..." -ForegroundColor Magenta
        docker compose -f docker-compose.prod.yml up --build -d
    }
    "prod-down" {
        Write-Host "🛑 Dừng Production..." -ForegroundColor Yellow
        docker compose -f docker-compose.prod.yml down
    }
    "prod-logs" {
        docker compose -f docker-compose.prod.yml logs -f
    }
    default {
        Write-Host "Lệnh không hợp lệ. Sử dụng: up, down, restart, migrate, seed, logs, prod-up, prod-down" -ForegroundColor Red
    }
}
