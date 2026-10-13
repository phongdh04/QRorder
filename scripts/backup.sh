#!/bin/sh
set -e

BACKUP_DIR="/backups"
KEEP_COUNT="${BACKUP_KEEP_COUNT:-14}"

mkdir -p "$BACKUP_DIR"

echo "============================================="
echo "🛡️  DỊCH VỤ SAO LƯU DỰ PHÒNG DATABASE (BACKUP)"
echo "Giữ lại $KEEP_COUNT bản sao lưu gần nhất."
echo "============================================="

while true; do
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_FILE="$BACKUP_DIR/qrorder_db_$TIMESTAMP.sql.gz"

  echo "[$(date)] Bắt đầu sao lưu database..."
  
  if PGPASSWORD="$PGPASSWORD" pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$PGDATABASE" | gzip > "$BACKUP_FILE"; then
    echo "[$(date)] ✓ Sao lưu thành công: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
  else
    echo "[$(date)] ⚠️ Thất bại khi tạo bản sao lưu database!"
  fi

  # Dọn dẹp chỉ giữ lại 14 bản mới nhất
  CURRENT_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
  if [ "$CURRENT_COUNT" -gt "$KEEP_COUNT" ]; then
    echo "[$(date)] Dọn dẹp bản sao lưu cũ, giữ $KEEP_COUNT bản mới nhất..."
    ls -1t "$BACKUP_DIR"/*.sql.gz | tail -n +$(($KEEP_COUNT + 1)) | xargs -r rm -f
  fi

  echo "[$(date)] Hẹn giờ sao lưu tiếp theo sau 24 giờ..."
  sleep 86400
done
