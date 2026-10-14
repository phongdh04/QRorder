import path from 'path';
import { LocalStorageAdapter } from '../src/lib/storage/local';
import { S3StorageAdapter } from '../src/lib/storage/s3';

/**
 * Script di chuyển toàn bộ tệp từ Local Storage sang S3 / Cloudflare R2 / MinIO
 *
 * Tính chất:
 * - Sao chép an toàn từng khóa (key), kiểm tra sự tồn tại (idempotent, resume an toàn).
 * - Mặc định ở chế độ --dry-run (chỉ kiểm tra & báo cáo số lượng).
 * - KHÔNG BAO GIỜ xóa bản local trừ khi có chỉ định rõ ràng.
 *
 * Cách dùng:
 *   npx tsx scripts/migrate-local-to-s3.ts [--dry-run]
 *   npx tsx scripts/migrate-local-to-s3.ts --confirm
 */

const MIME_MAP: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

async function main() {
  const args = process.argv.slice(2);
  const isConfirm = args.includes('--confirm');
  const isDryRun = !isConfirm || args.includes('--dry-run');

  console.log('☁️  ========================================================');
  console.log('📦 DI CHUYỂN DỮ LIỆU TỪ LOCAL STORAGE SANG S3 / CLOUDFLARE R2');
  console.log('☁️  ========================================================');
  console.log(
    `Chế độ: ${
      isDryRun
        ? '🟡 DRY-RUN (Kiểm tra và xem trước danh sách, không tải lên)'
        : '🟢 CONFIRM (Tiến hành sao chép thực tế sang S3)'
    }`
  );
  console.log('--------------------------------------------------------\n');

  const localAdapter = new LocalStorageAdapter();
  const s3Adapter = new S3StorageAdapter();

  console.log('1. Đang quét danh sách tệp trên Local Storage...');
  const localKeys = await localAdapter.list();
  console.log(`   -> Tìm thấy ${localKeys.length} tệp trên ổ đĩa cục bộ.\n`);

  if (localKeys.length === 0) {
    console.log('ℹ️ Không có tệp nào trên Local Storage để di chuyển.');
    return;
  }

  console.log('2. Kiểm tra trạng thái đồng bộ với S3...');
  let alreadyOnS3Count = 0;
  let needCopyCount = 0;
  let copiedCount = 0;
  let failedCount = 0;
  let totalTransferredBytes = 0;

  for (let i = 0; i < localKeys.length; i++) {
    const key = localKeys[i];
    const prefix = `[${i + 1}/${localKeys.length}] ${key}`;

    const ext = path.extname(key).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    let existsOnS3 = false;
    try {
      existsOnS3 = await s3Adapter.exists(key);
    } catch (err: any) {
      console.warn(`⚠️ Không thể kết nối hoặc kiểm tra S3 cho key ${key}:`, err?.message || err);
      failedCount++;
      continue;
    }

    if (existsOnS3) {
      alreadyOnS3Count++;
      if (isDryRun) {
        console.log(`   ⏩ [ĐÃ CÓ TRÊN S3] ${prefix}`);
      }
      continue;
    }

    needCopyCount++;

    if (isDryRun) {
      console.log(`   📤 [CẦN SAO CHÉP]  ${prefix}`);
      continue;
    }

    // CONFIRM: Sao chép tệp lên S3
    try {
      const buffer = await localAdapter.get(key);
      if (!buffer) {
        console.warn(`   ⚠️ File local không tồn tại hoặc không thể đọc: ${key}`);
        failedCount++;
        continue;
      }

      await s3Adapter.put(key, buffer, contentType);

      // Xác minh lại sau khi tải lên
      const verified = await s3Adapter.exists(key);
      if (!verified) {
        throw new Error('Xác minh tệp trên S3 sau tải lên thất bại.');
      }

      copiedCount++;
      totalTransferredBytes += buffer.length;
      console.log(
        `   ✅ [THÀNH CÔNG] ${prefix} (${Math.round(buffer.length / 1024)}KB)`
      );
    } catch (err: any) {
      failedCount++;
      console.error(`   ❌ [LỖI] ${prefix}:`, err?.message || err);
    }
  }

  console.log('\n========================================================');
  console.log('📊 BÁO CÁO TỔNG HỢP DI CHUYỂN LOCAL -> S3:');
  console.log(` - Tổng số tệp trên Local: ${localKeys.length}`);
  console.log(` - Đã tồn tại sẵn trên S3: ${alreadyOnS3Count}`);
  if (isDryRun) {
    console.log(` - Cần sao chép mới: ${needCopyCount}`);
  } else {
    console.log(` - Đã sao chép mới thành công: ${copiedCount}`);
    console.log(` - Thất bại: ${failedCount}`);
    console.log(
      ` - Tổng dung lượng đã chuyển: ${(totalTransferredBytes / (1024 * 1024)).toFixed(2)} MB`
    );
  }
  console.log('========================================================');

  console.log('\n🔒 BẢO TOÀN DỮ LIỆU CỤC BỘ:');
  console.log('Toàn bộ tệp local trong volume uploads_data VẪN ĐƯỢC GIỮ NGUYÊN 100%.');
  console.log('Sau khi bạn đã xác nhận dữ liệu trên S3 hoạt động ổn định, bạn có thể chuyển ứng dụng sang dùng S3 bằng cách đặt trong .env:');
  console.log('   STORAGE_DRIVER=s3');
  console.log('và khởi động lại hệ thống:');
  console.log('   docker compose -f docker-compose.prod.yml restart app\n');
}

main()
  .catch((err) => {
    console.error('❌ Lỗi script migrate-local-to-s3:', err);
    process.exit(1);
  });
