import sharp from 'sharp';
import crypto from 'crypto';

// Hằng số tỷ lệ khung hình chuẩn
export const ASPECT_RATIO_WIDTH = 4;
export const ASPECT_RATIO_HEIGHT = 3;

export interface VariantSpec {
  name: 'thumb' | 'medium' | 'large';
  width: number;
  height: number;
  initialQuality: number;
  minQuality: number;
  maxSizeBytes: number; // Ngưỡng dung lượng mục tiêu
}

export const VARIANT_SPECS: Record<'thumb' | 'medium' | 'large', VariantSpec> = {
  thumb: {
    name: 'thumb',
    width: 320,
    height: Math.round((320 * ASPECT_RATIO_HEIGHT) / ASPECT_RATIO_WIDTH), // 240
    initialQuality: 70,
    minQuality: 40,
    maxSizeBytes: 30 * 1024, // < 30KB
  },
  medium: {
    name: 'medium',
    width: 800,
    height: Math.round((800 * ASPECT_RATIO_HEIGHT) / ASPECT_RATIO_WIDTH), // 600
    initialQuality: 75,
    minQuality: 50,
    maxSizeBytes: 100 * 1024, // < 100KB
  },
  large: {
    name: 'large',
    width: 1200,
    height: Math.round((1200 * ASPECT_RATIO_HEIGHT) / ASPECT_RATIO_WIDTH), // 900
    initialQuality: 78,
    minQuality: 55,
    maxSizeBytes: 180 * 1024, // < 180KB
  },
};

export interface ProcessedVariants {
  thumb: Buffer;
  medium: Buffer;
  large: Buffer;
  blurDataUrl: string;
  contentHash: string;
  width: number;
  height: number;
  sizeBytesTotal: number;
}

/**
 * Nén ảnh thành WebP và tự động giảm chất lượng từng bước nếu vượt quá ngưỡng dung lượng mục tiêu
 */
async function encodeWithQualityTarget(
  baseSharp: sharp.Sharp,
  spec: VariantSpec
): Promise<Buffer> {
  let quality = spec.initialQuality;
  let buffer = await baseSharp
    .clone()
    .resize(spec.width, spec.height, { fit: 'cover', position: 'center' })
    .webp({ quality, effort: 4 })
    .toBuffer();

  // Nếu dung lượng vượt ngưỡng mục tiêu, giảm dần chất lượng (bước -5) đến mức sàn minQuality
  while (buffer.length > spec.maxSizeBytes && quality > spec.minQuality) {
    quality = Math.max(spec.minQuality, quality - 5);
    buffer = await baseSharp
      .clone()
      .resize(spec.width, spec.height, { fit: 'cover', position: 'center' })
      .webp({ quality, effort: 4 })
      .toBuffer();
  }

  return buffer;
}

/**
 * Pipeline xử lý ảnh món ăn chuyên nghiệp:
 * 1. Tự động xoay đúng chiều theo EXIF (.rotate())
 * 2. Cắt về tỷ lệ 4:3 với tâm cắt ở giữa
 * 3. Xóa TOÀN BỘ metadata (EXIF/GPS/thiết bị chụp) để bảo vệ quyền riêng tư và giảm dung lượng
 * 4. Tạo 3 biến thể WebP (thumb, medium, large) với dung lượng tối ưu
 * 5. Tạo blurDataURL siêu nhỏ (16x12) phục vụ hiệu ứng blur-up tức thì
 * 6. Tính Content Hash (SHA-256) phục vụ lưu trữ cache vĩnh viễn
 */
export async function processImagePipeline(rawBuffer: Buffer): Promise<ProcessedVariants> {
  // Chuẩn hóa và xoay theo EXIF, không kèm bất kỳ metadata nào
  const normalizedBase = sharp(rawBuffer, { failOn: 'none' })
    .rotate(); // Tự động xoay đúng chiều theo Orientation tag trong EXIF

  // Tạo đồng thời 3 biến thể WebP theo các thông số cấu hình
  const [thumb, medium, large, blurBuffer] = await Promise.all([
    encodeWithQualityTarget(normalizedBase, VARIANT_SPECS.thumb),
    encodeWithQualityTarget(normalizedBase, VARIANT_SPECS.medium),
    encodeWithQualityTarget(normalizedBase, VARIANT_SPECS.large),
    normalizedBase
      .clone()
      .resize(16, 12, { fit: 'cover', position: 'center' })
      .webp({ quality: 20 })
      .toBuffer(),
  ]);

  // Tạo blurDataURL base64
  const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

  // Tính content hash dựa trên dữ liệu ảnh đã xử lý (đảm bảo cache vĩnh viễn)
  const contentHash = crypto
    .createHash('sha256')
    .update(large)
    .digest('hex')
    .slice(0, 16);

  const sizeBytesTotal = thumb.length + medium.length + large.length;

  return {
    thumb,
    medium,
    large,
    blurDataUrl,
    contentHash,
    width: VARIANT_SPECS.large.width,
    height: VARIANT_SPECS.large.height,
    sizeBytesTotal,
  };
}
