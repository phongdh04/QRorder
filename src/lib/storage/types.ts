/**
 * LỚP LƯU TRỮ TRỪU TƯỢNG (STORAGE ADAPTER INTERFACE & UTILITIES)
 * Cho phép chuyển đổi linh hoạt giữa lưu trữ cục bộ (Local / Docker volume)
 * và lưu trữ đám mây tương thích S3 (Cloudflare R2, MinIO, AWS S3)
 * mà không cần thay đổi bất kỳ dòng code nghiệp vụ nào.
 */

export type ImageVariant = 'thumb' | 'medium' | 'large';

export interface StorageAdapter {
  /**
   * Lưu trữ tệp tin vào kho lưu trữ
   * @param key Khóa định danh tệp (đường dẫn tương đối)
   * @param buffer Dữ liệu nhị phân của tệp
   * @param contentType Loại MIME của tệp (vd: image/webp)
   */
  put(key: string, buffer: Buffer, contentType: string): Promise<void>;

  /**
   * Xóa tệp tin khỏi kho lưu trữ
   * @param key Khóa định danh tệp cần xóa
   */
  delete(key: string): Promise<void>;

  /**
   * Kiểm tra sự tồn tại của tệp tin trong kho lưu trữ
   * @param key Khóa định danh tệp
   */
  exists(key: string): Promise<boolean>;

  /**
   * Lấy URL công khai để client (trình duyệt) có thể tải tệp
   * @param key Khóa định danh tệp
   */
  getPublicUrl(key: string): string;

  /**
   * Đọc dữ liệu nhị phân của tệp tin (hỗ trợ migration / backup)
   * @param key Khóa định danh tệp
   */
  get?(key: string): Promise<Buffer | null>;
}

export interface StorageKeyComponents {
  restaurantId: string;
  imageId: string;
  variant: ImageVariant;
  hash: string;
}

/**
 * Tạo khóa lưu trữ chuẩn theo định dạng phân vùng an toàn cho từng nhà hàng:
 * restaurants/{restaurant_id}/menu/{image_id}/{variant}-{hash}.webp
 */
export function generateStorageKey(
  restaurantId: string,
  imageId: string,
  variant: ImageVariant,
  hash: string
): string {
  if (!restaurantId || !imageId || !variant || !hash) {
    throw new Error('Thiếu tham số bắt buộc để tạo khóa lưu trữ ảnh.');
  }

  // Khử các ký tự nguy hiểm hoặc path traversal
  const cleanRestaurantId = restaurantId.replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanImageId = imageId.replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanHash = hash.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);

  return `restaurants/${cleanRestaurantId}/menu/${cleanImageId}/${variant}-${cleanHash}.webp`;
}

/**
 * Phân tích khóa lưu trữ để lấy lại các thành phần ban đầu
 */
export function parseStorageKey(key: string): StorageKeyComponents | null {
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  const match = normalizedKey.match(
    /^restaurants\/([^/]+)\/menu\/([^/]+)\/(thumb|medium|large)-([a-zA-Z0-9]+)\.webp$/
  );

  if (!match) {
    return null;
  }

  return {
    restaurantId: match[1],
    imageId: match[2],
    variant: match[3] as ImageVariant,
    hash: match[4],
  };
}

/**
 * Kiểm tra tính sở hữu khóa lưu trữ theo nhà hàng (Tenant Isolation Guard)
 * Đảm bảo một quán TUYỆT ĐỐI không bao giờ đọc / ghi / xóa key của quán khác.
 */
export function validateRestaurantOwnership(restaurantId: string, key: string): boolean {
  if (!restaurantId || !key) return false;
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  const expectedPrefix = `restaurants/${restaurantId}/`;
  return normalizedKey.startsWith(expectedPrefix);
}
