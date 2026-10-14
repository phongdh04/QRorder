import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { StorageAdapter } from '../src/lib/storage/types';
import { LocalStorageAdapter } from '../src/lib/storage/local';

/**
 * Adapter giả lập trong bộ nhớ (In-Memory Mock Storage Adapter) phục vụ kiểm thử đơn vị
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, { buffer: Buffer; contentType: string }>();

  async put(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    this.store.set(cleanKey, { buffer, contentType });
  }

  async delete(key: string): Promise<void> {
    const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    this.store.delete(cleanKey);
  }

  async exists(key: string): Promise<boolean> {
    const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    return this.store.has(cleanKey);
  }

  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    return `https://mock-cdn.local/${cleanKey}`;
  }

  async get(key: string): Promise<Buffer | null> {
    const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    const item = this.store.get(cleanKey);
    return item ? item.buffer : null;
  }

  async list(prefix = ''): Promise<string[]> {
    const cleanPrefix = prefix.replace(/\\/g, '/').replace(/^\/+/, '');
    const results: string[] = [];
    Array.from(this.store.keys()).forEach((key) => {
      if (!cleanPrefix || key.startsWith(cleanPrefix)) {
        results.push(key);
      }
    });
    return results;
  }
}

/**
 * HỢP ĐỒNG KIỂM THỬ CHUẨN (CONTRACT TEST SUITE)
 * Áp dụng thống nhất cho cả MemoryStorageAdapter và LocalStorageAdapter
 */
function runStorageAdapterContractTests(name: string, getAdapter: () => StorageAdapter) {
  describe(`Contract Test: ${name}`, () => {
    let adapter: StorageAdapter;

    beforeEach(() => {
      adapter = getAdapter();
    });

    it('hỗ trợ đầy đủ vòng đời put -> exists -> get -> delete -> exists', async () => {
      const key = 'restaurants/res-test/menu/img-1/thumb-contract.webp';
      const content = Buffer.from('RIFF contract test webp binary data');

      // 1. Chưa put -> exists = false
      expect(await adapter.exists(key)).toBe(false);

      // 2. Put
      await adapter.put(key, content, 'image/webp');
      expect(await adapter.exists(key)).toBe(true);

      // 3. Get
      if (adapter.get) {
        const fetched = await adapter.get(key);
        expect(fetched).not.toBeNull();
        expect(fetched?.toString()).toBe(content.toString());
      }

      // 4. Delete
      await adapter.delete(key);
      expect(await adapter.exists(key)).toBe(false);
    });

    it('phương thức list() lọc đúng theo prefix và trả về danh sách khóa tương đối', async () => {
      if (!adapter.list) return;

      const keyA1 = 'restaurants/res-contract-a/menu/img-1/thumb.webp';
      const keyA2 = 'restaurants/res-contract-a/menu/img-2/thumb.webp';
      const keyB1 = 'restaurants/res-contract-b/menu/img-3/thumb.webp';

      await adapter.put(keyA1, Buffer.from('data a1'), 'image/webp');
      await adapter.put(keyA2, Buffer.from('data a2'), 'image/webp');
      await adapter.put(keyB1, Buffer.from('data b1'), 'image/webp');

      const listA = await adapter.list('restaurants/res-contract-a/');
      expect(listA).toContain(keyA1);
      expect(listA).toContain(keyA2);
      expect(listA).not.toContain(keyB1);

      // Dọn dẹp
      await adapter.delete(keyA1);
      await adapter.delete(keyA2);
      await adapter.delete(keyB1);
    });

    it('thay ảnh/xóa món xóa đúng file cũ qua adapter mà không sót rác', async () => {
      const oldThumb = 'restaurants/res-clean/menu/img-old/thumb-hash1.webp';
      const oldMedium = 'restaurants/res-clean/menu/img-old/medium-hash1.webp';
      const oldLarge = 'restaurants/res-clean/menu/img-old/large-hash1.webp';

      // Giả lập lưu ảnh cũ
      await adapter.put(oldThumb, Buffer.from('old thumb'), 'image/webp');
      await adapter.put(oldMedium, Buffer.from('old medium'), 'image/webp');
      await adapter.put(oldLarge, Buffer.from('old large'), 'image/webp');

      expect(await adapter.exists(oldThumb)).toBe(true);
      expect(await adapter.exists(oldMedium)).toBe(true);
      expect(await adapter.exists(oldLarge)).toBe(true);

      // Giả lập thao tác thay ảnh: xóa 3 file cũ
      await Promise.all([
        adapter.delete(oldThumb),
        adapter.delete(oldMedium),
        adapter.delete(oldLarge),
      ]);

      expect(await adapter.exists(oldThumb)).toBe(false);
      expect(await adapter.exists(oldMedium)).toBe(false);
      expect(await adapter.exists(oldLarge)).toBe(false);
    });
  });
}

// Chạy test hợp đồng cho In-Memory Storage Adapter
runStorageAdapterContractTests('MemoryStorageAdapter', () => new MemoryStorageAdapter());

// Chạy test hợp đồng cho LocalStorageAdapter (thư mục tạm test-uploads)
const testUploadDir = path.join(process.cwd(), 'public', 'test-contract-uploads');
runStorageAdapterContractTests('LocalStorageAdapter', () => new LocalStorageAdapter(testUploadDir));

// Dọn dẹp thư mục test sau khi chạy
afterEach(async () => {
  if (fs.existsSync(testUploadDir)) {
    await fs.promises.rm(testUploadDir, { recursive: true, force: true });
  }
});
