import { prisma } from '../src/lib/prisma';
import { getStorageAdapter } from '../src/lib/storage';

/**
 * Script dọn dẹp ảnh mồ côi (Orphan Images Cleaner)
 * Liệt kê và xóa các tệp trong Storage (Local hoặc S3) không còn được tham chiếu trong database (bảng menu_images).
 *
 * Tính chất:
 * - Mặc định ở chế độ --dry-run (chỉ in danh sách, không xóa).
 * - Chỉ xóa thực tế khi truyền cờ --confirm.
 *
 * Cách dùng:
 *   npx tsx scripts/cleanup-orphan-images.ts [--dry-run]
 *   npx tsx scripts/cleanup-orphan-images.ts --confirm
 *   npx tsx scripts/cleanup-orphan-images.ts --confirm --restaurant-id <id>
 */

async function main() {
  const args = process.argv.slice(2);
  const isConfirm = args.includes('--confirm');
  const isDryRun = !isConfirm || args.includes('--dry-run');

  const resIndex = args.indexOf('--restaurant-id');
  const restaurantIdFilter =
    resIndex !== -1 && args[resIndex + 1] ? args[resIndex + 1] : undefined;

  console.log('🧹 ========================================================');
  console.log('🗑️  DỌN DẸP ẢNH MỒ CÔI KHÔNG CÒN THAM CHIẾU TRONG DATABASE');
  console.log('🧹 ========================================================');
  console.log(
    `Chế độ: ${
      isDryRun
        ? '🟡 DRY-RUN (Xem trước danh sách tệp mồ côi, không xóa)'
        : '🔴 CONFIRM (Xóa thực tế khỏi Storage)'
    }`
  );
  if (restaurantIdFilter) {
    console.log(`Lọc theo nhà hàng: ${restaurantIdFilter}`);
  }
  console.log('--------------------------------------------------------\n');

  const storage = getStorageAdapter();
  if (typeof storage.list !== 'function') {
    throw new Error('Storage adapter hiện tại chưa hỗ trợ phương thức list()');
  }

  // 1. Thu thập tất cả các khóa ảnh đang được tham chiếu trong Database
  console.log('1. Đang truy vấn danh sách khóa ảnh đang hoạt động trong database...');
  const activeImages = await prisma.menuImage.findMany({
    where: restaurantIdFilter ? { restaurant_id: restaurantIdFilter } : {},
    select: {
      key_thumb: true,
      key_medium: true,
      key_large: true,
    },
  });

  const activeKeySet = new Set<string>();
  for (const img of activeImages) {
    if (img.key_thumb) activeKeySet.add(img.key_thumb.replace(/\\/g, '/').replace(/^\/+/, ''));
    if (img.key_medium) activeKeySet.add(img.key_medium.replace(/\\/g, '/').replace(/^\/+/, ''));
    if (img.key_large) activeKeySet.add(img.key_large.replace(/\\/g, '/').replace(/^\/+/, ''));
  }

  console.log(`   -> Tìm thấy ${activeKeySet.size} biến thể ảnh hợp lệ đang được dùng.\n`);

  // 2. Quét toàn bộ tệp trong Storage
  console.log('2. Đang quét danh sách tệp thực tế trong kho lưu trữ (Storage)...');
  const prefix = restaurantIdFilter ? `restaurants/${restaurantIdFilter}/` : '';
  const allStorageKeys = await storage.list(prefix);
  console.log(`   -> Tìm thấy ${allStorageKeys.length} tệp trong storage.\n`);

  // 3. Lọc ra các tệp mồ côi (tồn tại trong storage nhưng không có trong activeKeySet)
  const orphanKeys = allStorageKeys.filter((key) => {
    const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    // Bỏ qua các tệp ẩn hoặc đặc biệt (.gitkeep, ...)
    if (cleanKey.endsWith('.gitkeep') || cleanKey.startsWith('.')) return false;
    return !activeKeySet.has(cleanKey);
  });

  console.log(`3. Kết quả phân tích: Tìm thấy ${orphanKeys.length} tệp mồ côi.\n`);

  if (orphanKeys.length === 0) {
    console.log('🎉 Kho lưu trữ hoàn toàn sạch sẽ! Không có tệp mồ côi nào.');
    return;
  }

  if (isDryRun) {
    console.log('📋 Danh sách tệp mồ côi được phát hiện:');
    orphanKeys.forEach((key, index) => {
      console.log(`   [${index + 1}] ${key}`);
    });

    console.log('\n========================================================');
    console.log(`⚠️  Tổng cộng: ${orphanKeys.length} tệp mồ côi có thể giải phóng.`);
    console.log('💡 Để thực hiện xóa vĩnh viễn các tệp này, chạy lại lệnh kèm cờ --confirm:');
    console.log('   docker compose exec app npx tsx scripts/cleanup-orphan-images.ts --confirm');
    console.log('========================================================\n');
    return;
  }

  // Chế độ CONFIRM: Xóa tệp khỏi storage
  console.log(`🗑️ Đang tiến hành xóa ${orphanKeys.length} tệp mồ côi khỏi Storage...`);
  let deletedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < orphanKeys.length; i++) {
    const key = orphanKeys[i];
    try {
      await storage.delete(key);
      deletedCount++;
      console.log(`   ✅ [${i + 1}/${orphanKeys.length}] Đã xóa: ${key}`);
    } catch (err: any) {
      failedCount++;
      console.error(`   ❌ Lỗi khi xóa tệp ${key}:`, err?.message || err);
    }
  }

  console.log('\n========================================================');
  console.log('📊 KẾT QUẢ DỌN DẸP TỆP MỒ CÔI:');
  console.log(` - Đã xóa thành công: ${deletedCount}`);
  console.log(` - Lỗi xóa: ${failedCount}`);
  console.log('========================================================\n');
}

main()
  .catch((err) => {
    console.error('❌ Lỗi script cleanup-orphan-images:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
