import crypto from 'crypto';
import sharp from 'sharp';
import { getStorageAdapter } from '@/lib/storage';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Xử lý file ảnh bằng sharp và lưu trữ qua Storage Adapter (Local hoặc S3/R2/MinIO)
 */
export async function processAndSaveImage(
  buffer: Buffer,
  restaurantId?: string
): Promise<{ url: string; thumbUrl: string; largeUrl: string; filename: string }> {
  const storage = getStorageAdapter();
  const randomId = crypto.randomUUID();
  const prefix = restaurantId
    ? `restaurants/${restaurantId}/general/${randomId}`
    : `general/${randomId}`;

  const standardKey = `${prefix}/standard.webp`;
  const thumbKey = `${prefix}/thumb.webp`;
  const largeKey = `${prefix}/large.webp`;

  // Xoay EXIF, xóa metadata và nén WebP 3 kích thước
  const [standardBuf, thumbBuf, largeBuf] = await Promise.all([
    sharp(buffer)
      .rotate()
      .resize(800, 600, { fit: 'cover', position: 'center' })
      .webp({ quality: 75 })
      .toBuffer(),
    sharp(buffer)
      .rotate()
      .resize(320, 240, { fit: 'cover', position: 'center' })
      .webp({ quality: 70 })
      .toBuffer(),
    sharp(buffer)
      .rotate()
      .resize(1200, 900, { fit: 'cover', position: 'center' })
      .webp({ quality: 78 })
      .toBuffer(),
  ]);

  await Promise.all([
    storage.put(standardKey, standardBuf, 'image/webp'),
    storage.put(thumbKey, thumbBuf, 'image/webp'),
    storage.put(largeKey, largeBuf, 'image/webp'),
  ]);

  return {
    url: storage.getPublicUrl(standardKey),
    thumbUrl: storage.getPublicUrl(thumbKey),
    largeUrl: storage.getPublicUrl(largeKey),
    filename: `${randomId}.webp`,
  };
}

/**
 * Xóa file ảnh cũ qua Storage Adapter
 */
export async function deleteUploadedImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return;

  try {
    const storage = getStorageAdapter();

    // Trường hợp URL dạng /uploads/restaurants/... hoặc /uploads/general/...
    if (imageUrl.startsWith('/uploads/')) {
      const key = imageUrl.replace(/^\/uploads\//, '');
      await storage.delete(key);

      // Thử xóa các biến thể phụ nếu là kiểu tên cũ
      const baseKey = key.replace(/(_thumb|_large)?\.webp$/i, '');
      if (baseKey !== key) {
        await storage.delete(`${baseKey}.webp`).catch(() => {});
        await storage.delete(`${baseKey}_thumb.webp`).catch(() => {});
        await storage.delete(`${baseKey}_large.webp`).catch(() => {});
      }
    } else {
      // URL CDN hoặc S3: trích xuất pathname
      try {
        const urlObj = new URL(imageUrl);
        const pathPart = urlObj.pathname.replace(/^\/+/, '');
        await storage.delete(pathPart);
      } catch {
        // Không phải URL tuyệt đối, bỏ qua
      }
    }
  } catch (err) {
    console.warn('Lỗi khi xóa ảnh qua Storage Adapter:', err);
  }
}
