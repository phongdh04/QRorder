#!/bin/sh
# ==============================================================================
# SCRIPT KHÔI PHỤC DỮ LIỆU TOÀN DIỆN (DATABASE & UPLOADS) CHO QR ORDER
# Sử dụng:
#   sh scripts/restore.sh [tên_file_db.sql.gz] [tên_file_uploads.tar.gz]
# Hoặc chạy không có tham số để tự động chọn bản sao lưu mới nhất.
# ==============================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
UPLOADS_TARGET="${UPLOADS_DIR:-/app/public/uploads}"
PGHOST="${PGHOST:-db}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-qrorder}"
PGDATABASE="${PGDATABASE:-qrorder_db}"

echo "================================================================="
echo "🔄  BẮT ĐẦU QUY TRÌNH KHÔI PHỤC DỮ LIỆU (RESTORE SCRIPT)"
echo "================================================================="

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Lỗi: Thư mục sao lưu $BACKUP_DIR không tồn tại!"
  exit 1
fi

# 1. Xác định file sao lưu Database cần khôi phục
DB_FILE="$1"
if [ -z "$DB_FILE" ]; then
  DB_FILE=$(ls -1t "$BACKUP_DIR"/qrorder_db_*.sql.gz 2>/dev/null | head -n 1)
  if [ -z "$DB_FILE" ]; then
    echo "❌ Lỗi: Không tìm thấy bất kỳ file sao lưu database nào trong $BACKUP_DIR"
    exit 1
  fi
  echo "ℹ️  Tự động chọn bản sao lưu Database mới nhất: $DB_FILE"
else
  if [ ! -f "$DB_FILE" ] && [ -f "$BACKUP_DIR/$DB_FILE" ]; then
    DB_FILE="$BACKUP_DIR/$DB_FILE"
  fi
fi

if [ ! -f "$DB_FILE" ]; then
  echo "❌ Lỗi: File sao lưu Database không tồn tại: $DB_FILE"
  exit 1
fi

# 2. Xác định file sao lưu Uploads cần khôi phục
UPLOADS_FILE="$2"
if [ -z "$UPLOADS_FILE" ]; then
  UPLOADS_FILE=$(ls -1t "$BACKUP_DIR"/qrorder_uploads_*.tar.gz 2>/dev/null | head -n 1)
  if [ -n "$UPLOADS_FILE" ]; then
    echo "ℹ️  Tự động chọn bản sao lưu Uploads mới nhất: $UPLOADS_FILE"
  fi
else
  if [ ! -f "$UPLOADS_FILE" ] && [ -f "$BACKUP_DIR/$UPLOADS_FILE" ]; then
    UPLOADS_FILE="$BACKUP_DIR/$UPLOADS_FILE"
  fi
fi

echo ""
echo ">> THÔNG TIN KHÔI PHỤC:"
echo "   - File Database: $DB_FILE"
echo "   - File Uploads : ${UPLOADS_FILE:-Không có / Bỏ qua}"
echo "   - PostgreSQL   : $PGUSER@$PGHOST:$PGPORT/$PGDATABASE"
echo "   - Thư mục ảnh  : $UPLOADS_TARGET"
echo ""

# 3. Tiến hành khôi phục Database PostgreSQL
echo "[1/2] Đang làm sạch và khôi phục dữ liệu vào database PostgreSQL..."
if [ -n "$PGPASSWORD" ]; then
  export PGPASSWORD="$PGPASSWORD"
fi

# Làm sạch schema public để tránh xung đột bảng đã tồn tại
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;" >/dev/null

# Giải nén và nạp trực tiếp qua psql
if gunzip -c "$DB_FILE" | psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" >/dev/null; then
  echo "✓ Khôi phục Database thành công!"
else
  echo "❌ Lỗi: Khôi phục database thất bại."
  exit 1
fi

# 4. Tiến hành khôi phục thư mục Uploads
if [ -n "$UPLOADS_FILE" ] && [ -f "$UPLOADS_FILE" ]; then
  echo "[2/2] Đang giải nén các tệp hình ảnh vào $UPLOADS_TARGET..."
  mkdir -p "$UPLOADS_TARGET"
  if tar -xzf "$UPLOADS_FILE" -C "$UPLOADS_TARGET"; then
    echo "✓ Khôi phục thư mục Uploads thành công!"
  else
    echo "⚠️ Cảnh báo: Lỗi khi giải nén thư mục uploads."
  fi
else
  echo "[2/2] Bỏ qua khôi phục uploads (không tìm thấy file)."
fi

echo ""
echo "================================================================="
echo "🎉 KHÔI PHỤC TOÀN BỘ HỆ THỐNG THÀNH CÔNG!"
echo "Database và hình ảnh uploads đã sẵn sàng hoạt động bình thường."
echo "================================================================="
