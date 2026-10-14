import sharp from 'sharp';

export const MAX_RAW_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_PIXEL_DIMENSION = 8000; // 8000px
export const MAX_TOTAL_PIXELS = 25_000_000; // 25 Megapixels (chống ảnh bom giải nén)

export type DetectedMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | null;

/**
 * Kiểm tra định dạng tệp tin dựa trên Magic Bytes (nội dung thực của tệp, không tin đuôi file)
 */
export function detectMimeTypeFromMagicBytes(buffer: Buffer): DetectedMimeType {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // 3. WebP: RIFF .... WEBP
  // Offset 0-3: 'RIFF' (0x52 0x49 0x46 0x46), Offset 8-11: 'WEBP' (0x57 0x45 0x42 0x50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // 4. HEIC / HEIF / AVIF: Offset 4-7: 'ftyp'
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const brand = buffer.toString('ascii', 8, 12);
    if (['heic', 'heix', 'hevc', 'mif1', 'msf1'].includes(brand)) {
      return 'image/heic';
    }
  }

  return null;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: DetectedMimeType;
  metadata?: sharp.Metadata;
}

/**
 * Xác thực nghiêm ngặt tệp ảnh đầu vào:
 * 1. Kiểm tra dung lượng thô (tối đa 10MB)
 * 2. Kiểm tra định dạng Magic Bytes
 * 3. Kiểm tra tính toàn vẹn cấu trúc ảnh bằng Sharp
 * 4. Chống ảnh bom giải nén (Pixel Flood / Decompression Bomb)
 */
export async function validateUploadedImage(buffer: Buffer): Promise<ValidationResult> {
  // 1. Kiểm tra dung lượng
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      error: 'Tệp hình ảnh rỗng hoặc không có dữ liệu.',
    };
  }

  if (buffer.length > MAX_RAW_FILE_SIZE) {
    return {
      valid: false,
      error: `Dung lượng tệp vượt quá giới hạn tối đa cho phép (${Math.round(
        MAX_RAW_FILE_SIZE / (1024 * 1024)
      )}MB).`,
    };
  }

  // 2. Kiểm tra magic bytes
  const mimeType = detectMimeTypeFromMagicBytes(buffer);
  if (!mimeType) {
    return {
      valid: false,
      error:
        'Tệp không phải là ảnh hợp lệ hoặc định dạng không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WebP hoặc HEIC.',
    };
  }

  // 3. Đọc metadata qua Sharp & kiểm tra chống Decompression Bomb
  try {
    const metadata = await sharp(buffer, { failOn: 'error' }).metadata();

    if (!metadata.width || !metadata.height) {
      return {
        valid: false,
        error: 'Không thể xác định kích thước hình ảnh. Tệp có thể đã bị hỏng.',
      };
    }

    // Chống ảnh bom giải nén: từ chối kích thước quá lớn
    if (
      metadata.width > MAX_PIXEL_DIMENSION ||
      metadata.height > MAX_PIXEL_DIMENSION ||
      metadata.width * metadata.height > MAX_TOTAL_PIXELS
    ) {
      return {
        valid: false,
        error: `Kích thước điểm ảnh quá lớn (${metadata.width}x${metadata.height}px, vượt ngưỡng an toàn). Vui lòng thu nhỏ ảnh trước khi tải lên.`,
      };
    }

    return {
      valid: true,
      mimeType,
      metadata,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Tệp ảnh bị lỗi cấu trúc hoặc không thể giải mã: ${err.message || 'Lỗi không xác định'}`,
    };
  }
}
