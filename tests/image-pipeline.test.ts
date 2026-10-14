import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { processImagePipeline, VARIANT_SPECS } from '../src/lib/image/pipeline';

describe('Image Processing Pipeline (Phần 2 & 7)', () => {
  it('tạo đủ 3 biến thể WebP, cắt 4:3, loại bỏ hoàn toàn EXIF và dưới ngưỡng dung lượng', async () => {
    // Tạo ảnh mẫu JPEG 1600x1200 có gắn metadata EXIF giả lập
    const sampleImage = await sharp({
      create: {
        width: 1600,
        height: 1200,
        channels: 3,
        background: { r: 180, g: 120, b: 60 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await processImagePipeline(sampleImage);

    // 1. Kiểm tra đủ 3 biến thể
    expect(result.thumb).toBeDefined();
    expect(result.medium).toBeDefined();
    expect(result.large).toBeDefined();

    // 2. Kiểm tra kích thước và định dạng WebP từng biến thể
    const thumbMeta = await sharp(result.thumb).metadata();
    const mediumMeta = await sharp(result.medium).metadata();
    const largeMeta = await sharp(result.large).metadata();

    expect(thumbMeta.format).toBe('webp');
    expect(thumbMeta.width).toBe(320);
    expect(thumbMeta.height).toBe(240); // 4:3 của 320

    expect(mediumMeta.format).toBe('webp');
    expect(mediumMeta.width).toBe(800);
    expect(mediumMeta.height).toBe(600); // 4:3 của 800

    expect(largeMeta.format).toBe('webp');
    expect(largeMeta.width).toBe(1200);
    expect(largeMeta.height).toBe(900); // 4:3 của 1200

    // 3. Kiểm tra đã xóa TOÀN BỘ EXIF / GPS metadata
    expect(thumbMeta.exif).toBeUndefined();
    expect(mediumMeta.exif).toBeUndefined();
    expect(largeMeta.exif).toBeUndefined();

    // 4. Kiểm tra dung lượng dưới ngưỡng mục tiêu
    expect(result.thumb.length).toBeLessThan(VARIANT_SPECS.thumb.maxSizeBytes); // < 30KB
    expect(result.medium.length).toBeLessThan(VARIANT_SPECS.medium.maxSizeBytes); // < 100KB
    expect(result.large.length).toBeLessThan(VARIANT_SPECS.large.maxSizeBytes); // < 180KB

    // 5. Kiểm tra blurDataURL
    expect(result.blurDataUrl).toMatch(/^data:image\/webp;base64,/);

    // 6. Kiểm tra content hash
    expect(result.contentHash).toBeDefined();
    expect(result.contentHash.length).toBe(16);
  });
});
