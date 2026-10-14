import assert from 'assert';
import { prisma } from '../src/lib/prisma';
import { getRestaurantQuotaStats, getPlanConfig, formatBytes } from '../src/lib/image/quota';

async function runPart3Tests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ PHẦN 3: HẠN MỨC THEO QUÁN VÀ THEO GÓI ===');

  // 1. Kiểm tra cấu hình gói mặc định
  console.log('\n[1/4] Kiểm tra cấu hình hạn mức gói (Plan Config):');
  const basicConfig = getPlanConfig('basic');
  const proConfig = getPlanConfig('pro');

  assert.strictEqual(basicConfig.maxImages, 30, 'Gói Basic mặc định có 30 ảnh');
  assert.strictEqual(basicConfig.maxBytes, 20 * 1024 * 1024, 'Gói Basic mặc định có 20MB');
  assert.strictEqual(proConfig.maxImages, 200, 'Gói Pro mặc định có 200 ảnh');
  assert.strictEqual(proConfig.maxBytes, 150 * 1024 * 1024, 'Gói Pro mặc định có 150MB');
  console.log('  -> PASS: Cấu hình mặc định của các gói (basic/pro) hoàn toàn chính xác.');

  // 2. Tạo 2 quán riêng biệt để kiểm tra tính độc lập (Tenant Isolation trên Quota)
  console.log('\n[2/4] Kiểm tra tính độc lập hạn mức giữa các quán (Tenant Isolation):');
  const slugA = `test-quota-a-${Date.now()}`;
  const slugB = `test-quota-b-${Date.now()}`;

  const restA = await prisma.restaurant.create({
    data: {
      name: 'Quán A (Hạn Mức Test)',
      slug: slugA,
      plan: 'basic',
      image_quota_count: 5,
      image_quota_bytes: 5 * 1024 * 1024,
    },
  });

  const restB = await prisma.restaurant.create({
    data: {
      name: 'Quán B (Hạn Mức Test)',
      slug: slugB,
      plan: 'pro',
      image_quota_count: 50,
      image_quota_bytes: 50 * 1024 * 1024,
    },
  });

  // Tạo món và ảnh cho Quán A
  const catA = await prisma.category.create({
    data: { restaurant_id: restA.id, name: 'Menu A' },
  });
  const itemA = await prisma.menuItem.create({
    data: { restaurant_id: restA.id, category_id: catA.id, name: 'Món A1', price: 50000 },
  });
  const imgA = await prisma.menuImage.create({
    data: {
      id: `img-test-a-${Date.now()}`,
      restaurant_id: restA.id,
      menu_item_id: itemA.id,
      key_thumb: `restaurants/${restA.id}/menu/img1/thumb-123.webp`,
      key_medium: `restaurants/${restA.id}/menu/img1/medium-123.webp`,
      key_large: `restaurants/${restA.id}/menu/img1/large-123.webp`,
      width: 1200,
      height: 900,
      blur_data_url: 'data:image/webp;base64,fake',
      size_bytes_total: 150 * 1024, // 150KB
    },
  });

  // Lấy thống kê quota của Quán A và Quán B
  const statsA = await getRestaurantQuotaStats(restA.id);
  const statsB = await getRestaurantQuotaStats(restB.id);

  console.log('  Stats Quán A:', {
    usedImages: statsA.usedImages,
    maxImages: statsA.maxImages,
    usedBytes: statsA.usedBytes,
  });
  console.log('  Stats Quán B:', {
    usedImages: statsB.usedImages,
    maxImages: statsB.maxImages,
    usedBytes: statsB.usedBytes,
  });

  assert.strictEqual(statsA.usedImages, 1, 'Quán A phải có đúng 1 ảnh');
  assert.strictEqual(statsA.usedBytes, 150 * 1024, 'Quán A phải có đúng 150KB');

  // Quán B TUYỆT ĐỐI không bị ảnh hưởng bởi dữ liệu của Quán A
  assert.strictEqual(statsB.usedImages, 0, 'Quán B không có ảnh nào, phải là 0');
  assert.strictEqual(statsB.usedBytes, 0, 'Quán B dung lượng dùng phải là 0');
  console.log('  -> PASS: Hạn mức và dung lượng của các quán hoàn toàn cách ly.');

  // 3. Kiểm tra kiểm duyệt vượt hạn mức (Quota Exceeded check)
  console.log('\n[3/4] Kiểm tra kịch bản vượt hạn mức số ảnh và dung lượng:');
  // Cập nhật hạn mức Quán A về 1 ảnh (đang dùng 1 / 1 ảnh)
  await prisma.restaurant.update({
    where: { id: restA.id },
    data: { image_quota_count: 1 },
  });

  const updatedStatsA = await getRestaurantQuotaStats(restA.id);
  assert.strictEqual(updatedStatsA.usedImages >= updatedStatsA.maxImages, true, 'Quán A đã chạm hạn mức');
  console.log('  -> PASS: Quán A đã chạm hạn mức tối đa:', `${updatedStatsA.usedImages} / ${updatedStatsA.maxImages}`);

  // 4. Dọn dẹp dữ liệu test
  console.log('\n[4/4] Dọn dẹp dữ liệu kiểm thử:');
  await prisma.menuImage.delete({ where: { id: imgA.id } });
  await prisma.menuItem.delete({ where: { id: itemA.id } });
  await prisma.category.delete({ where: { id: catA.id } });
  await prisma.restaurant.delete({ where: { id: restA.id } });
  await prisma.restaurant.delete({ where: { id: restB.id } });
  console.log('  -> PASS: Đã dọn dẹp sạch bản ghi test.');

  console.log('\n🎉 TOÀN BỘ KIỂM THỬ PHẦN 3 ĐÃ VƯỢT QUA 100%!');
}

runPart3Tests().catch((err) => {
  console.error('\n❌ LỖI KIỂM THỬ PHẦN 3:', err);
  process.exit(1);
});
