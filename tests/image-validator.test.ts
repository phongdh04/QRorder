import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  validateUploadedImage,
  detectMimeTypeFromMagicBytes,
} from '../src/lib/image/validator';

describe('Image Validator (Phần 2 & 7)', () => {
  it('từ chối tệp giả đuôi .jpg nhưng nội dung là text/html/script', async () => {
    const fakeFileBuffer = Buffer.from('<?php echo "evil script"; ?> or plain text disguised as image');
    const result = await validateUploadedImage(fakeFileBuffer);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Tệp không phải là ảnh hợp lệ');
  });

  it('từ chối tệp quá dung lượng tối đa (> 10MB)', async () => {
    // Giả lập buffer 10.5 MB
    const hugeBuffer = Buffer.alloc(10.5 * 1024 * 1024);
    // Gắn fake JPEG magic bytes
    hugeBuffer[0] = 0xff;
    hugeBuffer[1] = 0xd8;
    hugeBuffer[2] = 0xff;

    const result = await validateUploadedImage(hugeBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Dung lượng tệp vượt quá giới hạn tối đa');
  });

  it('từ chối ảnh có kích thước điểm ảnh quá lớn (chống ảnh bom giải nén)', async () => {
    // Tạo ảnh hợp lệ nhưng kích thước vượt 8000px (8001x100)
    const bombImage = await sharp({
      create: {
        width: 8001,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await validateUploadedImage(bombImage);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Kích thước điểm ảnh quá lớn');
  });

  it('chấp nhận ảnh hợp lệ JPEG, PNG, WebP', async () => {
    const validPng = await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 0, g: 100, b: 200 } },
    })
      .png()
      .toBuffer();

    const result = await validateUploadedImage(validPng);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe('image/png');
    expect(result.metadata?.width).toBe(400);
    expect(result.metadata?.height).toBe(300);
  });
});
