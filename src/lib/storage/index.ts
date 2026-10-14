import { StorageAdapter } from './types';
import { LocalStorageAdapter } from './local';
import { S3StorageAdapter } from './s3';

export * from './types';
export * from './local';
export * from './s3';

let storageInstance: StorageAdapter | null = null;

/**
 * Factory lấy thể hiện StorageAdapter (Singleton) dựa trên biến môi trường STORAGE_DRIVER
 * - 's3': Sử dụng S3StorageAdapter (Cloudflare R2, MinIO, AWS S3)
 * - Mặc định ('local'): Sử dụng LocalStorageAdapter (lưu trên ổ đĩa / Docker volume)
 */
export function getStorageAdapter(): StorageAdapter {
  if (!storageInstance) {
    const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase().trim();

    if (driver === 's3') {
      storageInstance = new S3StorageAdapter();
    } else {
      storageInstance = new LocalStorageAdapter();
    }
  }

  return storageInstance;
}

/**
 * Cho phép thiết lập hoặc reset instance (hữu ích cho Unit Test hoặc chuyển đổi runtime)
 */
export function setStorageAdapter(adapter: StorageAdapter | null): void {
  storageInstance = adapter;
}
