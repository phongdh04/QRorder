import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  LocalStorageAdapter,
  S3StorageAdapter,
  getStorageAdapter,
  setStorageAdapter,
  generateStorageKey,
  parseStorageKey,
  validateRestaurantOwnership,
} from '../src/lib/storage';

async function runPart1Tests() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PHẦN 1: STORAGE ADAPTER ---');

  // 1. Kiểm tra cấu trúc key và Tenant Isolation
  console.log('\n[1/4] Kiểm tra cấu trúc key và Tenant Isolation:');
  const restaurantId = 'rest_abc123';
  const otherRestaurantId = 'rest_hacker999';
  const imageId = 'img_xyz789';
  const hash = 'a1b2c3d4e5f6g7h8';

  const keyThumb = generateStorageKey(restaurantId, imageId, 'thumb', hash);
  const keyMed = generateStorageKey(restaurantId, imageId, 'medium', hash);
  const keyLarge = generateStorageKey(restaurantId, imageId, 'large', hash);

  console.log('  Key thumb:', keyThumb);
  assert.strictEqual(
    keyThumb,
    `restaurants/${restaurantId}/menu/${imageId}/thumb-a1b2c3d4e5f6g7h8.webp`
  );
  assert.strictEqual(
    keyMed,
    `restaurants/${restaurantId}/menu/${imageId}/medium-a1b2c3d4e5f6g7h8.webp`
  );
  assert.strictEqual(
    keyLarge,
    `restaurants/${restaurantId}/menu/${imageId}/large-a1b2c3d4e5f6g7h8.webp`
  );

  const parsed = parseStorageKey(keyThumb);
  assert.ok(parsed !== null, 'Phân tích key phải thành công');
  assert.strictEqual(parsed.restaurantId, restaurantId);
  assert.strictEqual(parsed.imageId, imageId);
  assert.strictEqual(parsed.variant, 'thumb');
  assert.strictEqual(parsed.hash, 'a1b2c3d4e5f6g7h8');

  // Tenant Isolation Guard
  assert.strictEqual(
    validateRestaurantOwnership(restaurantId, keyThumb),
    true,
    'Nhà hàng sở hữu key phải được xác thực đúng'
  );
  assert.strictEqual(
    validateRestaurantOwnership(otherRestaurantId, keyThumb),
    false,
    'Nhà hàng khác TUYỆT ĐỐI không được phép truy cập key'
  );
  console.log('  -> PASS: Cấu trúc key chuẩn 4 cấp và Tenant Isolation an toàn tuyệt đối.');

  // 2. Kiểm tra LocalStorageAdapter
  console.log('\n[2/4] Kiểm tra LocalStorageAdapter:');
  const testUploadDir = path.join(process.cwd(), '.test-uploads');
  const localAdapter = new LocalStorageAdapter(testUploadDir, '');

  const sampleBuffer = Buffer.from('FAKE_WEBP_IMAGE_DATA_1234567890');
  const sampleKey = keyThumb;

  // Kiểm tra ban đầu chưa tồn tại
  const initialExists = await localAdapter.exists(sampleKey);
  assert.strictEqual(initialExists, false, 'File chưa put thì exists phải là false');

  // Put file
  await localAdapter.put(sampleKey, sampleBuffer, 'image/webp');
  const existsAfterPut = await localAdapter.exists(sampleKey);
  assert.strictEqual(existsAfterPut, true, 'File sau khi put thì exists phải là true');

  // Get file
  const readBuffer = await localAdapter.get(sampleKey);
  assert.ok(readBuffer !== null, 'Read buffer không được null');
  assert.strictEqual(readBuffer.toString(), sampleBuffer.toString(), 'Dữ liệu đọc lại phải khớp 100%');

  // Public URL
  const publicUrl = localAdapter.getPublicUrl(sampleKey);
  assert.strictEqual(publicUrl, `/uploads/${sampleKey}`);
  console.log('  Public URL (mặc định):', publicUrl);

  // Public URL với CDN
  const cdnAdapter = new LocalStorageAdapter(testUploadDir, 'https://cdn.mybar.vn');
  assert.strictEqual(
    cdnAdapter.getPublicUrl(sampleKey),
    `https://cdn.mybar.vn/uploads/${sampleKey}`
  );
  console.log('  Public URL (CDN):', cdnAdapter.getPublicUrl(sampleKey));

  // Kiểm tra chống Path Traversal
  try {
    await localAdapter.put('../../../etc/evil.sh', Buffer.from('evil'), 'text/plain');
    assert.fail('Đáng lẽ phải ném lỗi khi phát hiện path traversal');
  } catch (err: any) {
    assert.ok(
      err.message.includes('Truy cập bị từ chối'),
      'Phải chặn tấn công Path Traversal'
    );
    console.log('  -> PASS: Đã chặn Path Traversal thành công:', err.message);
  }

  // Delete file
  await localAdapter.delete(sampleKey);
  const existsAfterDelete = await localAdapter.exists(sampleKey);
  assert.strictEqual(existsAfterDelete, false, 'File sau khi delete thì exists phải là false');
  console.log('  -> PASS: LocalStorageAdapter hoàn thành tất cả thao tác (put, exists, get, delete, url).');

  // Dọn dẹp thư mục test
  try {
    fs.rmSync(testUploadDir, { recursive: true, force: true });
  } catch {}

  // 3. Kiểm tra S3StorageAdapter cấu hình & URL
  console.log('\n[3/4] Kiểm tra S3StorageAdapter cấu hình & URL:');
  const s3Adapter = new S3StorageAdapter({
    endpoint: 'http://localhost:9000',
    region: 'auto',
    bucket: 'qrorder-media',
    accessKeyId: 'test_key',
    secretAccessKey: 'test_secret',
  });

  const s3Url = s3Adapter.getPublicUrl(sampleKey);
  assert.strictEqual(
    s3Url,
    `http://localhost:9000/qrorder-media/${sampleKey}`
  );
  console.log('  S3 MinIO URL:', s3Url);

  const s3CdnAdapter = new S3StorageAdapter({
    bucket: 'qrorder-media',
    accessKeyId: 'test_key',
    secretAccessKey: 'test_secret',
    publicAssetBaseUrl: 'https://media.mybar.vn',
  });
  assert.strictEqual(
    s3CdnAdapter.getPublicUrl(sampleKey),
    `https://media.mybar.vn/${sampleKey}`
  );
  console.log('  S3 Cloudflare R2 / Custom CDN URL:', s3CdnAdapter.getPublicUrl(sampleKey));
  console.log('  -> PASS: S3StorageAdapter sinh URL chính xác cho cả MinIO, AWS S3 và Cloudflare CDN.');

  // 4. Kiểm tra Factory Singleton & Đổi Driver
  console.log('\n[4/4] Kiểm tra Factory Storage Driver:');
  setStorageAdapter(null);
  process.env.STORAGE_DRIVER = 'local';
  const defaultAdapter = getStorageAdapter();
  assert.ok(defaultAdapter instanceof LocalStorageAdapter, 'Mặc định phải là LocalStorageAdapter');

  setStorageAdapter(null);
  process.env.STORAGE_DRIVER = 's3';
  process.env.S3_BUCKET = 'test-bucket';
  process.env.S3_ACCESS_KEY_ID = 'test-id';
  process.env.S3_SECRET_ACCESS_KEY = 'test-secret';
  const configuredS3Adapter = getStorageAdapter();
  assert.ok(configuredS3Adapter instanceof S3StorageAdapter, 'Khi driver=s3 phải trả về S3StorageAdapter');

  // Khôi phục lại trạng thái ban đầu
  setStorageAdapter(null);
  delete process.env.STORAGE_DRIVER;
  delete process.env.S3_BUCKET;
  delete process.env.S3_ACCESS_KEY_ID;
  delete process.env.S3_SECRET_ACCESS_KEY;

  console.log('  -> PASS: Factory tự động điều hướng đúng adapter theo STORAGE_DRIVER.');

  console.log('\n🎉 TOÀN BỘ KIỂM THỬ PHẦN 1 ĐÃ VƯỢT QUA 100%!');
}

runPart1Tests().catch((err) => {
  console.error('\n❌ LỖI KIỂM THỬ:', err);
  process.exit(1);
});
