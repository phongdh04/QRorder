import assert from 'assert';
import sharp from 'sharp';
import crypto from 'crypto';
import { prisma } from '../src/lib/prisma';
import { getStorageAdapter, generateStorageKey, parseStorageKey } from '../src/lib/storage';
import {
  validateUploadedImage,
  detectMimeTypeFromMagicBytes,
  MAX_RAW_FILE_SIZE,
} from '../src/lib/image/validator';
import { processImagePipeline, VARIANT_SPECS } from '../src/lib/image/pipeline';
import { imageProcessingQueue, ConcurrencyQueue } from '../src/lib/image/queue';
import { deleteImageKeysFromStorage, processStorageCleanupQueue } from '../src/lib/image/cleanup';

async function runPart2Tests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ PHẦN 2: PIPELINE XỬ LÝ ẢNH & LƯU TRỮ METADATA ===');

  // 1. Tạo buffer ảnh mẫu để test
  console.log('\n[1/6] Tạo ảnh mẫu và kiểm tra nhận diện Magic Bytes:');
  const sampleJpeg = await sharp({
    create: {
      width: 1600,
      height: 1200,
      channels: 3,
      background: { r: 212, g: 175, b: 55 }, // Màu gold sang trọng
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  const detectedJpeg = detectMimeTypeFromMagicBytes(sampleJpeg);
  assert.strictEqual(detectedJpeg, 'image/jpeg', 'Phải nhận diện đúng định dạng JPEG');

  const samplePng = await sharp({
    create: {
      width: 400,
      height: 300,
      channels: 4,
      background: { r: 10, g: 15, b: 30, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const detectedPng = detectMimeTypeFromMagicBytes(samplePng);
  assert.strictEqual(detectedPng, 'image/png', 'Phải nhận diện đúng định dạng PNG');
  console.log('  -> PASS: Magic Bytes nhận diện chính xác JPEG & PNG.');

  // 2. Kiểm tra từ chối file lỗi và ảnh bom giải nén
  console.log('\n[2/6] Kiểm tra kiểm duyệt nghiêm ngặt (Validate):');

  // a. File giả đuôi ảnh (nội dung là text)
  const fakeFile = Buffer.from('FAKE_EXE_OR_SCRIPT_FILE_DISGUISED_AS_JPG');
  const fakeValidation = await validateUploadedImage(fakeFile);
  assert.strictEqual(fakeValidation.valid, false, 'File giả phải bị từ chối');
  assert.ok(
    fakeValidation.error?.includes('không phải là ảnh hợp lệ'),
    'Thông báo từ chối phải rõ ràng'
  );
  console.log('  -> PASS: Chặn file giả mạo thành công:', fakeValidation.error);

  // b. File quá dung lượng (> 10MB)
  const hugeBuffer = Buffer.alloc(MAX_RAW_FILE_SIZE + 1024, 0);
  const sizeValidation = await validateUploadedImage(hugeBuffer);
  assert.strictEqual(sizeValidation.valid, false, 'File quá 10MB phải bị từ chối');
  console.log('  -> PASS: Chặn file quá dung lượng thành công:', sizeValidation.error);

  // c. Ảnh bom giải nén (Pixel Flood / Decompression bomb)
  const bombBuffer = await sharp({
    create: {
      width: 8500, // Vượt quá 8000px
      height: 100,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .jpeg()
    .toBuffer();

  const bombValidation = await validateUploadedImage(bombBuffer);
  assert.strictEqual(bombValidation.valid, false, 'Ảnh vượt 8000px phải bị từ chối');
  assert.ok(
    bombValidation.error?.includes('quá lớn'),
    'Thông báo chống pixel bomb phải xuất hiện'
  );
  console.log('  -> PASS: Chặn ảnh bom giải nén thành công:', bombValidation.error);

  // 3. Kiểm tra Pipeline xử lý ảnh Sharp (3 biến thể WebP, 4:3, blurDataURL, content hash)
  console.log('\n[3/6] Kiểm tra Pipeline xử lý ảnh Sharp:');
  const processed = await processImagePipeline(sampleJpeg);

  assert.ok(processed.thumb.length > 0, 'Thumb buffer không được rỗng');
  assert.ok(processed.medium.length > 0, 'Medium buffer không được rỗng');
  assert.ok(processed.large.length > 0, 'Large buffer không được rỗng');

  // Kiểm tra kích thước điểm ảnh từng biến thể
  const thumbMeta = await sharp(processed.thumb).metadata();
  const medMeta = await sharp(processed.medium).metadata();
  const largeMeta = await sharp(processed.large).metadata();

  console.log(`  Thumb: ${thumbMeta.width}x${thumbMeta.height} (${(processed.thumb.length / 1024).toFixed(1)} KB)`);
  console.log(`  Medium: ${medMeta.width}x${medMeta.height} (${(processed.medium.length / 1024).toFixed(1)} KB)`);
  console.log(`  Large: ${largeMeta.width}x${largeMeta.height} (${(processed.large.length / 1024).toFixed(1)} KB)`);

  assert.strictEqual(thumbMeta.width, 320, 'Thumb width phải là 320px');
  assert.strictEqual(thumbMeta.height, 240, 'Thumb height phải là 240px (tỷ lệ 4:3)');
  assert.strictEqual(medMeta.width, 800, 'Medium width phải là 800px');
  assert.strictEqual(medMeta.height, 600, 'Medium height phải là 600px (tỷ lệ 4:3)');
  assert.strictEqual(largeMeta.width, 1200, 'Large width phải là 1200px');
  assert.strictEqual(largeMeta.height, 900, 'Large height phải là 900px (tỷ lệ 4:3)');

  // Kiểm tra định dạng WebP
  assert.strictEqual(thumbMeta.format, 'webp', 'Thumb phải là webp');
  assert.strictEqual(medMeta.format, 'webp', 'Medium phải là webp');
  assert.strictEqual(largeMeta.format, 'webp', 'Large phải là webp');

  // Kiểm tra dung lượng mục tiêu
  assert.ok(
    processed.thumb.length <= VARIANT_SPECS.thumb.maxSizeBytes,
    `Thumb phải <= ${VARIANT_SPECS.thumb.maxSizeBytes} bytes`
  );
  assert.ok(
    processed.medium.length <= VARIANT_SPECS.medium.maxSizeBytes,
    `Medium phải <= ${VARIANT_SPECS.medium.maxSizeBytes} bytes`
  );
  assert.ok(
    processed.large.length <= VARIANT_SPECS.large.maxSizeBytes,
    `Large phải <= ${VARIANT_SPECS.large.maxSizeBytes} bytes`
  );

  // Kiểm tra blurDataURL
  assert.ok(processed.blurDataUrl.startsWith('data:image/webp;base64,'), 'blurDataURL phải đúng định dạng');
  console.log('  blurDataURL length:', processed.blurDataUrl.length, 'chars (cực nhẹ!)');

  // Kiểm tra Content Hash
  assert.strictEqual(processed.contentHash.length, 16, 'Content hash phải là 16 ký tự');
  console.log('  Content Hash:', processed.contentHash);
  console.log('  -> PASS: Pipeline tạo hoàn hảo 3 biến thể WebP đạt chuẩn 4:3 và siêu nhẹ.');

  // 4. Kiểm tra Hàng đợi Concurrency Queue (giới hạn 2 tác vụ)
  console.log('\n[4/6] Kiểm tra Hàng đợi Concurrency (giới hạn 2 tiến trình):');
  const testQueue = new ConcurrencyQueue(2);
  let activeConcurrent = 0;
  let maxActiveConcurrent = 0;

  const runDummyTask = async () => {
    return testQueue.run(async () => {
      activeConcurrent++;
      if (activeConcurrent > maxActiveConcurrent) {
        maxActiveConcurrent = activeConcurrent;
      }
      await new Promise((r) => setTimeout(r, 50));
      activeConcurrent--;
    });
  };

  await Promise.all([runDummyTask(), runDummyTask(), runDummyTask(), runDummyTask()]);
  assert.strictEqual(maxActiveConcurrent, 2, 'Số tác vụ chạy đồng thời tối đa không được vượt quá 2');
  console.log('  -> PASS: ConcurrencyQueue giới hạn tối đa đúng 2 worker đồng thời.');

  // 5. Kiểm tra Vòng đời ảnh: Upload, Lưu DB, Thay ảnh, Xóa ảnh với Storage Adapter
  console.log('\n[5/6] Kiểm tra Vòng đời ảnh trên Database và Storage Adapter:');
  const storage = getStorageAdapter();

  // Tìm hoặc tạo nhà hàng & danh mục test
  let restaurant = await prisma.restaurant.findFirst({
    include: { categories: true },
  });

  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'The Velvet Lounge Test',
        slug: 'the-velvet-test',
      },
      include: { categories: true },
    });
  }

  let category = restaurant.categories[0];
  if (!category) {
    category = await prisma.category.create({
      data: {
        restaurant_id: restaurant.id,
        name: 'Cocktails Test',
      },
    });
  }

  // Tạo món ăn test
  const testItem = await prisma.menuItem.create({
    data: {
      restaurant_id: restaurant.id,
      category_id: category.id,
      name: 'Cocktail Thử Nghiệm Sharp',
      price: 150000,
    },
  });

  const imageId = crypto.randomUUID();
  const keyThumb = generateStorageKey(restaurant.id, imageId, 'thumb', processed.contentHash);
  const keyMedium = generateStorageKey(restaurant.id, imageId, 'medium', processed.contentHash);
  const keyLarge = generateStorageKey(restaurant.id, imageId, 'large', processed.contentHash);

  // Put file vào storage
  await Promise.all([
    storage.put(keyThumb, processed.thumb, 'image/webp'),
    storage.put(keyMedium, processed.medium, 'image/webp'),
    storage.put(keyLarge, processed.large, 'image/webp'),
  ]);

  // Kiểm tra tồn tại trên storage
  assert.strictEqual(await storage.exists(keyThumb), true, 'Key thumb phải tồn tại');
  assert.strictEqual(await storage.exists(keyMedium), true, 'Key medium phải tồn tại');
  assert.strictEqual(await storage.exists(keyLarge), true, 'Key large phải tồn tại');

  // Tạo bản ghi menu_images
  const menuImage = await prisma.menuImage.create({
    data: {
      id: imageId,
      restaurant_id: restaurant.id,
      menu_item_id: testItem.id,
      key_thumb: keyThumb,
      key_medium: keyMedium,
      key_large: keyLarge,
      width: processed.width,
      height: processed.height,
      blur_data_url: processed.blurDataUrl,
      size_bytes_total: processed.sizeBytesTotal,
    },
  });

  await prisma.menuItem.update({
    where: { id: testItem.id },
    data: { image_url: storage.getPublicUrl(keyMedium) },
  });

  // Verify DB record
  const checkItem = await prisma.menuItem.findUnique({
    where: { id: testItem.id },
    include: { image: true },
  });
  assert.ok(checkItem?.image, 'Món phải liên kết với menu_images');
  assert.strictEqual(checkItem.image?.key_medium, keyMedium);
  console.log('  Đã lưu metadata vào menu_images:', checkItem.image.id);

  // Xóa ảnh cũ khi thay ảnh mới
  const newHash = 'b9c8d7e6f5a43210';
  const newImageId = crypto.randomUUID();
  const newKeyThumb = generateStorageKey(restaurant.id, newImageId, 'thumb', newHash);
  const newKeyMed = generateStorageKey(restaurant.id, newImageId, 'medium', newHash);
  const newKeyLarge = generateStorageKey(restaurant.id, newImageId, 'large', newHash);

  await Promise.all([
    storage.put(newKeyThumb, processed.thumb, 'image/webp'),
    storage.put(newKeyMed, processed.medium, 'image/webp'),
    storage.put(newKeyLarge, processed.large, 'image/webp'),
  ]);

  // Xóa các file cũ
  await deleteImageKeysFromStorage(restaurant.id, [keyThumb, keyMedium, keyLarge]);
  assert.strictEqual(await storage.exists(keyThumb), false, 'Ảnh cũ thumb phải bị xóa khỏi storage');
  assert.strictEqual(await storage.exists(keyMedium), false, 'Ảnh cũ medium phải bị xóa khỏi storage');
  assert.strictEqual(await storage.exists(keyLarge), false, 'Ảnh cũ large phải bị xóa khỏi storage');
  console.log('  -> PASS: File ảnh cũ đã được dọn sạch khỏi Storage Adapter khi thay ảnh mới.');

  // Dọn dẹp món test
  await deleteImageKeysFromStorage(restaurant.id, [newKeyThumb, newKeyMed, newKeyLarge]);
  await prisma.menuItem.delete({ where: { id: testItem.id } });

  // 6. Kiểm tra Hàng đợi Dọn dẹp dự phòng (StorageCleanupQueue)
  console.log('\n[6/6] Kiểm tra Hàng đợi dọn dẹp StorageCleanupQueue:');
  const dummyCleanupKey = `restaurants/${restaurant.id}/menu/dummy/thumb-123.webp`;
  await prisma.storageCleanupQueue.create({
    data: {
      restaurant_id: restaurant.id,
      storage_key: dummyCleanupKey,
      last_error: 'Simulated network timeout',
    },
  });

  const queueResult = await processStorageCleanupQueue(10);
  console.log('  Kết quả xử lý queue dọn dẹp:', queueResult);
  assert.ok(queueResult.processed >= 1, 'Hàng đợi dọn dẹp phải xử lý được mục tồn');
  console.log('  -> PASS: StorageCleanupQueue hoạt động chính xác.');

  console.log('\n🎉 TOÀN BỘ KIỂM THỬ PHẦN 2 ĐÃ VƯỢT QUA 100%!');
}

runPart2Tests().catch((err) => {
  console.error('\n❌ LỖI KIỂM THỬ PHẦN 2:', err);
  process.exit(1);
});
