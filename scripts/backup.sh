#!/bin/sh
set -e

BACKUP_DIR="/backups"
KEEP_COUNT="${BACKUP_KEEP_COUNT:-14}"
UPLOADS_DIR="${UPLOADS_SOURCE:-/uploads}"

mkdir -p "$BACKUP_DIR"

echo "=========================================================="
echo "🛡️  DỊCH VỤ SAO LƯU DỰ PHÒNG TỰ ĐỘNG (DATABASE & UPLOADS)"
echo "Tần suất: 24h một lần | Giữ lại $KEEP_COUNT bản gần nhất"
echo "=========================================================="

while true; do
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  DB_BACKUP_FILE="$BACKUP_DIR/qrorder_db_$TIMESTAMP.sql.gz"
  UPLOADS_BACKUP_FILE="$BACKUP_DIR/qrorder_uploads_$TIMESTAMP.tar.gz"

  echo "[$(date)] >>> Bắt đầu tiến trình sao lưu định kỳ ($TIMESTAMP) <<<"

  # 1. Sao lưu Database PostgreSQL
  echo "[$(date)] Đang sao lưu cơ sở dữ liệu PostgreSQL..."
  if PGPASSWORD="$PGPASSWORD" pg_dump --clean --if-exists -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$PGDATABASE" | gzip > "$DB_BACKUP_FILE"; then
    echo "[$(date)] ✓ Database backup thành công: $DB_BACKUP_FILE ($(du -h "$DB_BACKUP_FILE" | cut -f1))"
  else
    echo "[$(date)] ⚠️ Thất bại khi sao lưu database!"
  fi

  # 2. Sao lưu Thư mục Uploads (hình ảnh món ăn, logo quán)
  if [ -d "$UPLOADS_DIR" ]; then
    echo "[$(date)] Đang sao lưu thư mục hình ảnh uploads ($UPLOADS_DIR)..."
    if tar -czf "$UPLOADS_BACKUP_FILE" -C "$UPLOADS_DIR" . 2>/dev/null; then
      echo "[$(date)] ✓ Uploads backup thành công: $UPLOADS_BACKUP_FILE ($(du -h "$UPLOADS_BACKUP_FILE" | cut -f1))"
    else
      echo "[$(date)] ⚠️ Thất bại khi đóng gói thư mục uploads!"
    fi
  else
    echo "[$(date)] Bỏ qua sao lưu uploads (thư mục $UPLOADS_DIR chưa tồn tại)."
  fi

  # 3. Dọn dẹp các bản sao lưu cũ quá giới hạn KEEP_COUNT
  echo "[$(date)] Kiểm tra dọn dẹp các bản sao lưu cũ (giữ tối đa $KEEP_COUNT bản)..."
  
  # Dọn database backups cũ
  DB_COUNT=$(ls -1 "$BACKUP_DIR"/qrorder_db_*.sql.gz 2>/dev/null | wc -l)
  if [ "$DB_COUNT" -gt "$KEEP_COUNT" ]; then
    ls -1t "$BACKUP_DIR"/qrorder_db_*.sql.gz | tail -n +$(($KEEP_COUNT + 1)) | xargs -r rm -f
    echo "[$(date)] Đã dọn bớt bản sao lưu DB cũ."
  fi

  # Dọn uploads backups cũ
  UPLOADS_COUNT=$(ls -1 "$BACKUP_DIR"/qrorder_uploads_*.tar.gz 2>/dev/null | wc -l)
  if [ "$UPLOADS_COUNT" -gt "$KEEP_COUNT" ]; then
    ls -1t "$BACKUP_DIR"/qrorder_uploads_*.tar.gz | tail -n +$(($KEEP_COUNT + 1)) | xargs -r rm -f
    echo "[$(date)] Đã dọn bớt bản sao lưu Uploads cũ."
  fi

  echo "[$(date)] Hoàn tất chu kỳ sao lưu. Hẹn giờ tiếp theo sau 24 giờ..."
  sleep 86400
done
