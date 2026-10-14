import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import { processImagePipeline } from '../src/lib/image/pipeline';
import { validateUploadedImage } from '../src/lib/image/validator';
import crypto from 'crypto';
import { getStorageAdapter, generateStorageKey } from '../src/lib/storage';
import { revalidateRestaurantMenuCache } from '../src/lib/dal/customer';

/**
 * Script di chuyển (migrate) ảnh món ăn cũ trong menu_items.image_url
 * sang hệ thống ảnh mới (bảng menu_images, 3 biến thể WebP, content hash).
 *
 * Tính chất:
 * - IDEMPOTENT (Chạy lặp lại an toàn): Bỏ qua các món đã có bản ghi menu_images.
 * - An toàn: Mặc định ở chế độ --dry-run (chỉ in danh sách), chỉ thực hiện khi có --confirm.
 *
 * Cách dùng:
 *   npx tsx scripts/migrate-legacy-images.ts [--dry-run]
 *   npx tsx scripts/migrate-legacy-images.ts --confirm
 *   npx tsx scripts/migrate-legacy-images.ts --confirm --restaurant-id <id>
 */

async function getImageBuffer(
  imageUrl: string,
  uploadDir: string
): Promise<{ buffer: Buffer; sourceDescription: string } | null> {
  // 1. Nếu là URL HTTP / HTTPS
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) return null;
      const arrayBuf = await res.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuf),
        sourceDescription: `HTTP URL: ${imageUrl}`,
      };
    } catch {
      return null;
    }
  }

  // 2. Nếu là đường dẫn cục bộ /uploads/...
  const cleanRelative = imageUrl.replace(/^\/uploads\//, '').replace(/^\/+/, '');
  const candidatePaths = [
    path.resolve(uploadDir, cleanRelative),
    path.resolve(process.cwd(), 'public', cleanRelative),
    path.resolve(process.cwd(), 'public', 'uploads', cleanRelative),
    path.resolve(process.cwd(), cleanRelative),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        const buf = await fs.promises.readFile(candidate);
        return {
          buffer: buf,
          sourceDescription: `Local file: ${candidate}`,
        };
      } catch {
        // Tiếp tục thử đường dẫn khác
      }
    }
  }

  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const isConfirm = args.includes('--confirm');
  const isDryRun = !isConfirm || args.includes('--dry-run');

  const resIndex = args.indexOf('--restaurant-id');
  const restaurantIdFilter = resIndex !== -1 && args[resIndex + 1] ? args[resIndex + 1] : undefined;

  console.log('🔄 ========================================================');
  console.log('🖼️  MIGRATE ẢNH MÓN ĂN CŨ SANG HỆ THỐNG 3 BIẾN THỂ WEBP');
  console.log('🔄 ========================================================');
  console.log(`Chế độ: ${isDryRun ? '🟡 DRY-RUN (Xem trước, không ghi dữ liệu)' : '🟢 CONFIRM (Thực hiện ghi thực tế)'}`);
  if (restaurantIdFilter) {
    console.log(`Lọc theo nhà hàng: ${restaurantIdFilter}`);
  }
  console.log('--------------------------------------------------------\n');

  const uploadDir = path.resolve(
    process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads')
  );
  const storage = getStorageAdapter();

  // Tìm tất cả các món có image_url mà chưa có MenuImage
  const legacyItems = await prisma.menuItem.findMany({
    where: {
      image_url: { not: null },
      NOT: { image_url: '' },
      image: null, // Idempotent: món đã migrate sẽ có quan hệ image và tự động bị bỏ qua
      ...(restaurantIdFilter ? { restaurant_id: restaurantIdFilter } : {}),
    },
    include: {
      restaurant: {
        select: { id: true, name: true },
      },
    },
    orderBy: { sort_order: 'asc' },
  });

  console.log(`Tìm thấy ${legacyItems.length} món ăn cũ chưa được migrate sang menu_images.\n`);

  if (legacyItems.length === 0) {
    console.log('🎉 Không có món nào cần migrate. Toàn bộ thực đơn đã ở định dạng chuẩn mới!');
    return;
  }

  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < legacyItems.length; i++) {
    const item = legacyItems[i];
    const prefix = `[${i + 1}/${legacyItems.length}] Món "${item.name}" (ID: ${item.id}) - Quán: ${item.restaurant.name}`;

    if (!item.image_url) {
      skippedCount++;
      continue;
    }

    const imageSource = await getImageBuffer(item.image_url, uploadDir);

    if (!imageSource) {
      console.warn(`⚠️  ${prefix}`);
      console.warn(`    Không tìm thấy file nguồn ảnh tại: ${item.image_url}`);
      failedCount++;
      continue;
    }

    // Validate ảnh
    const validation = await validateUploadedImage(imageSource.buffer);
    if (!validation.valid) {
      console.warn(`⚠️  ${prefix}`);
      console.warn(`    Ảnh không hợp lệ: ${validation.error}`);
      failedCount++;
      continue;
    }

    if (isDryRun) {
      console.log(`🔍 [DRY-RUN] ${prefix}`);
      console.log(`    Nguồn: ${imageSource.sourceDescription}`);
      console.log(`    Định dạng: ${validation.metadata?.format}, Gốc: ${validation.metadata?.width}x${validation.metadata?.height}, Dung lượng: ${Math.round(imageSource.buffer.length / 1024)}KB`);
      console.log('    Hành động dự kiến: Tạo thumb, medium, large WebP 4:3 + blurDataURL + tạo bản ghi menu_images.\n');
      successCount++;
      continue;
    }

    // CONFIRM: Thực hiện xử lý
    try {
      console.log(`⚡ [XỬ LÝ] ${prefix}...`);
      const processed = await processImagePipeline(imageSource.buffer);

      const imageId = crypto.randomUUID();
      const keyThumb = generateStorageKey(
        item.restaurant_id,
        imageId,
        'thumb',
        processed.contentHash
      );
      const keyMedium = generateStorageKey(
        item.restaurant_id,
        imageId,
        'medium',
        processed.contentHash
      );
      const keyLarge = generateStorageKey(
        item.restaurant_id,
        imageId,
        'large',
        processed.contentHash
      );

      // Lưu 3 biến thể vào Storage Adapter
      await storage.put(keyThumb, processed.thumb, 'image/webp');
      await storage.put(keyMedium, processed.medium, 'image/webp');
      await storage.put(keyLarge, processed.large, 'image/webp');

      // Lưu bản ghi MenuImage vào database
      await prisma.menuImage.create({
        data: {
          restaurant_id: item.restaurant_id,
          menu_item_id: item.id,
          key_thumb: keyThumb,
          key_medium: keyMedium,
          key_large: keyLarge,
          width: processed.width,
          height: processed.height,
          blur_data_url: processed.blurDataUrl,
          size_bytes_total: processed.sizeBytesTotal,
        },
      });

      // Cập nhật lại image_url của món trỏ tới medium URL mới
      const newMediumUrl = storage.getPublicUrl(keyMedium);
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { image_url: newMediumUrl },
      });

      // Làm mới cache thực đơn của quán
      revalidateRestaurantMenuCache(item.restaurant_id);

      console.log(`    ✅ Đã migrate thành công! Tổng dung lượng WebP: ${Math.round(processed.sizeBytesTotal / 1024)}KB`);
      console.log(`       - Thumb: ${Math.round(processed.thumb.length / 1024)}KB (${keyThumb})`);
      console.log(`       - Medium: ${Math.round(processed.medium.length / 1024)}KB (${keyMedium})`);
      console.log(`       - Large: ${Math.round(processed.large.length / 1024)}KB (${keyLarge})\n`);

      successCount++;
    } catch (err: any) {
      console.error(`    ❌ Lỗi khi xử lý:`, err?.message || err);
      failedCount++;
    }
  }

  console.log('========================================================');
  console.log('📊 KẾT QUẢ TỔNG HỢP:');
  console.log(` - Thành công / Sẵn sàng: ${successCount}`);
  console.log(` - Bỏ qua: ${skippedCount}`);
  console.log(` - Thất bại: ${failedCount}`);
  console.log('========================================================');

  if (isDryRun && successCount > 0) {
    console.log('\n💡 Để thực thi di chuyển dữ liệu thực tế, hãy chạy lại lệnh với cờ --confirm:');
    console.log('   docker compose exec app npx tsx scripts/migrate-legacy-images.ts --confirm\n');
  }
}

main()
  .catch((err) => {
    console.error('❌ Lỗi script migrate-legacy-images:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
