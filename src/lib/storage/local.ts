import fs from 'fs';
import path from 'path';
import { StorageAdapter } from './types';

/**
 * Bản triển khai lưu trữ cục bộ (Local Disk / Docker Volume)
 * Tương thích hoàn toàn với thư mục UPLOAD_DIR và route phục vụ /uploads/[...path]
 */
export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;
  private publicAssetBaseUrl: string;

  constructor(uploadDir?: string, publicAssetBaseUrl?: string) {
    this.uploadDir = path.resolve(
      uploadDir || process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads')
    );
    this.publicAssetBaseUrl = (
      publicAssetBaseUrl !== undefined ? publicAssetBaseUrl : (process.env.PUBLIC_ASSET_BASE_URL || '')
    ).trim();

    // Đảm bảo thư mục gốc tồn tại
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Giải quyết đường dẫn tuyệt đối an toàn, ngăn chặn tấn công Path Traversal
   */
  private resolveSafePath(key: string): string {
    const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    const fullPath = path.resolve(this.uploadDir, normalizedKey);

    // Kiểm tra an toàn: đường dẫn giải quyết bắt buộc phải nằm bên trong uploadDir
    if (!fullPath.startsWith(this.uploadDir)) {
      throw new Error(`Truy cập bị từ chối: Đường dẫn tệp không hợp lệ (${key})`);
    }

    return fullPath;
  }

  /**
   * Lưu tệp tin vào ổ đĩa cục bộ
   */
  async put(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const fullPath = this.resolveSafePath(key);
    const dir = path.dirname(fullPath);

    // Tự động tạo thư mục phân cấp cha nếu chưa có
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);
  }

  /**
   * Xóa tệp tin khỏi ổ đĩa cục bộ
   */
  async delete(key: string): Promise<void> {
    try {
      const fullPath = this.resolveSafePath(key);
      await fs.promises.unlink(fullPath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      // Nếu file không tồn tại (ENOENT), coi như đã xóa thành công
    }
  }

  /**
   * Kiểm tra tệp tin có tồn tại hay không
   */
  async exists(key: string): Promise<boolean> {
    try {
      const fullPath = this.resolveSafePath(key);
      await fs.promises.access(fullPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Đọc dữ liệu nhị phân của tệp (phục vụ di chuyển dữ liệu)
   */
  async get(key: string): Promise<Buffer | null> {
    try {
      const fullPath = this.resolveSafePath(key);
      return await fs.promises.readFile(fullPath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  /**
   * Lấy URL công khai của tệp
   */
  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    if (this.publicAssetBaseUrl) {
      const baseUrl = this.publicAssetBaseUrl.replace(/\/$/, '');
      return `${baseUrl}/uploads/${cleanKey}`;
    }
    return `/uploads/${cleanKey}`;
  }
}
