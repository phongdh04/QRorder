import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function getUploadDirectory(): string {
  const dir = path.resolve(
    process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads')
  );
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Xử lý file ảnh bằng sharp, chuyển đổi sang định dạng WebP với 3 kích thước
 */
export async function processAndSaveImage(
  buffer: Buffer
): Promise<{ url: string; thumbUrl: string; largeUrl: string; filename: string }> {
  const uploadDir = getUploadDirectory();
  const randomId = crypto.randomBytes(16).toString('hex');
  const baseName = `img_${Date.now()}_${randomId}`;

  const standardFilename = `${baseName}.webp`;
  const thumbFilename = `${baseName}_thumb.webp`;
  const largeFilename = `${baseName}_large.webp`;

  const standardPath = path.join(uploadDir, standardFilename);
  const thumbPath = path.join(uploadDir, thumbFilename);
  const largePath = path.join(uploadDir, largeFilename);

  // 1. Ảnh tiêu chuẩn (medium / 800x800)
  await sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(standardPath);

  // 2. Thumbnail (300x300 cover vuông đẹp mắt)
  await sharp(buffer)
    .resize(300, 300, { fit: 'cover', position: 'center' })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  // 3. Ảnh lớn (large / 1200x1200)
  await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(largePath);

  return {
    url: `/uploads/${standardFilename}`,
    thumbUrl: `/uploads/${thumbFilename}`,
    largeUrl: `/uploads/${largeFilename}`,
    filename: standardFilename,
  };
}

/**
 * Xóa file ảnh cũ khi người dùng thay thế ảnh hoặc xóa món
 */
export function deleteUploadedImage(imageUrl: string | null | undefined): void {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;

  try {
    const uploadDir = getUploadDirectory();
    const filename = path.basename(imageUrl);
    const baseName = filename.replace(/(_thumb|_large)?\.webp$/i, '');

    const filesToDelete = [
      path.join(uploadDir, `${baseName}.webp`),
      path.join(uploadDir, `${baseName}_thumb.webp`),
      path.join(uploadDir, `${baseName}_large.webp`),
      path.join(uploadDir, filename),
    ];

    filesToDelete.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (err) {
    console.warn('Không thể xóa ảnh cũ:', err);
  }
}
