import { prisma } from '@/lib/prisma';
import { getStorageAdapter, validateRestaurantOwnership } from '@/lib/storage';

/**
 * Xóa danh sách các khóa tệp khỏi kho lưu trữ (Storage Adapter)
 * Có cơ chế an toàn: Nếu xóa lỗi (vd mạng lag hoặc S3 timeout),
 * tự động lưu khóa vào bảng `storage_cleanup_queue` để retry sau,
 * TUYỆT ĐỐI không làm gián đoạn hay hỏng luồng thao tác chính của người dùng.
 */
export async function deleteImageKeysFromStorage(
  restaurantId: string,
  keys: string[]
): Promise<void> {
  if (!restaurantId || !keys || keys.length === 0) return;

  const storage = getStorageAdapter();

  await Promise.all(
    keys.map(async (key) => {
      if (!key) return;

      // Bảo vệ Tenant Isolation: Không cho phép can thiệp vào key của nhà hàng khác
      if (!validateRestaurantOwnership(restaurantId, key)) {
        console.warn(
          `[Tenant Guard] Từ chối xóa key không thuộc về nhà hàng (${restaurantId}): ${key}`
        );
        return;
      }

      try {
        await storage.delete(key);
      } catch (err: any) {
        console.error(`[Storage Delete Error] Không thể xóa key ${key}:`, err?.message || err);

        // Ghi vào hàng đợi dọn dẹp retry để xử lý lại sau
        try {
          await prisma.storageCleanupQueue.create({
            data: {
              restaurant_id: restaurantId,
              storage_key: key,
              last_error: err?.message ? String(err.message).slice(0, 500) : 'Lỗi xóa storage',
            },
          });
        } catch (queueErr) {
          console.error('[Storage Queue Error] Không thể ghi vào hàng đợi dọn dẹp:', queueErr);
        }
      }
    })
  );
}

/**
 * Xử lý các mục tồn đọng trong hàng đợi dọn dẹp (Background / Cron task)
 */
export async function processStorageCleanupQueue(batchSize: number = 50): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const items = await prisma.storageCleanupQueue.findMany({
    take: batchSize,
    orderBy: { created_at: 'asc' },
  });

  if (items.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const storage = getStorageAdapter();
  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await storage.delete(item.storage_key);
      await prisma.storageCleanupQueue.delete({ where: { id: item.id } });
      succeeded++;
    } catch (err: any) {
      failed++;
      await prisma.storageCleanupQueue.update({
        where: { id: item.id },
        data: {
          attempts: { increment: 1 },
          last_error: err?.message ? String(err.message).slice(0, 500) : 'Thử lại thất bại',
        },
      });
    }
  }

  return {
    processed: items.length,
    succeeded,
    failed,
  };
}
