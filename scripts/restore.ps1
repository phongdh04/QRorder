# ==============================================================================
# SCRIPT KHÔI PHỤC DỮ LIỆU DÀNH CHO WINDOWS POWERSHELL
# ==============================================================================

param (
    [string]$DbFile = "",
    [string]$UploadsFile = ""
)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "🔄  KHÔI PHỤC DỮ LIỆU QR ORDER QUA DOCKER (POWERSHELL)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Kiểm tra container database
$dbContainer = "qrorder_prod_db"
$backupContainer = "qrorder_prod_backup"

$isRunning = docker ps --filter "name=$dbContainer" --format "{{.Names}}"
if (-not $isRunning) {
    # Thử dev container nếu prod chưa chạy
    $dbContainer = "qrorder_db"
    $isRunning = docker ps --filter "name=$dbContainer" --format "{{.Names}}"
    if (-not $isRunning) {
        Write-Error "Container database không đang chạy. Hãy chạy 'docker compose up -d' trước."
        exit 1
    }
}

Write-Host "✓ Sử dụng container database: $dbContainer" -ForegroundColor Green

# Chạy lệnh restore thông qua container backup hoặc db
docker compose exec backup sh /scripts/restore.sh $DbFile $UploadsFile
