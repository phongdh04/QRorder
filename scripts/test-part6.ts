import { getStorageAdapter } from '../src/lib/storage';
import { prisma } from '../src/lib/prisma';

async function testPart6() {
  console.log('🧪 === BẮT ĐẦU KIỂM THỬ PHẦN 6: DI CHUYỂN ẢNH & DỌN DẸP ===\n');

  const storage = getStorageAdapter();

  // 1. Kiểm tra StorageAdapter.list()
  console.log('1. Kiểm tra phương thức storage.list()...');
  if (typeof storage.list !== 'function') {
    throw new Error('Storage adapter không có phương thức list()');
  }
  const allFiles = await storage.list();
  console.log(`✅ 1. storage.list() hoạt động thành công! Tổng số tệp trong storage: ${allFiles.length}`);

  // 2. Tạo một tệp mồ côi giả lập để kiểm tra cơ chế phát hiện và dọn dẹp
  const orphanKey = 'restaurants/test-orphan/menu/temp-img/thumb-orphan123.webp';
  await storage.put(orphanKey, Buffer.from('RIFF....WEBPfake orphan image data'), 'image/webp');
  console.log('✅ 2. Đã tạo tệp mồ côi giả lập:', orphanKey);

  // Quét lại danh sách và xác nhận tệp mồ côi xuất hiện
  const filesWithOrphan = await storage.list();
  if (!filesWithOrphan.includes(orphanKey)) {
    throw new Error('Tệp mồ côi vừa tạo không xuất hiện trong storage.list()');
  }

  // 3. Kiểm tra logic phát hiện tệp mồ côi
  const activeImages = await prisma.menuImage.findMany({
    select: { key_thumb: true, key_medium: true, key_large: true },
  });
  const activeSet = new Set<string>();
  for (const img of activeImages) {
    activeSet.add(img.key_thumb);
    activeSet.add(img.key_medium);
    activeSet.add(img.key_large);
  }

  const isOrphan = !activeSet.has(orphanKey);
  console.log(`✅ 3. Tệp ${orphanKey} được nhận diện là mồ côi: ${isOrphan}`);
  if (!isOrphan) {
    throw new Error('Tệp giả lập bị nhận diện sai là active image');
  }

  // 4. Xóa tệp mồ côi và xác nhận đã biến mất
  await storage.delete(orphanKey);
  const existsAfterDelete = await storage.exists(orphanKey);
  if (existsAfterDelete) {
    throw new Error('Tệp mồ côi vẫn tồn tại sau khi gọi delete()');
  }
  console.log('✅ 4. Đã dọn dẹp và xác minh tệp mồ côi bị xóa thành công khỏi storage!');

  // 5. Kiểm tra tính toàn vẹn của các bản ghi menu_images hiện có
  console.log('\n5. Kiểm tra tính toàn vẹn của menu_images...');
  const count = await prisma.menuImage.count();
  console.log(`Tổng số ảnh món ăn trong menu_images: ${count}`);
  if (count === 0) {
    throw new Error('Kỳ vọng menu_images có dữ liệu sau khi migrate');
  }

  const sampleImage = await prisma.menuImage.findFirst({
    include: { menu_item: true },
  });
  if (sampleImage) {
    console.log(`Mẫu ảnh: Món "${sampleImage.menu_item.name}"`);
    console.log(` - Thumb: ${sampleImage.key_thumb}`);
    console.log(` - Medium: ${sampleImage.key_medium}`);
    console.log(` - Large: ${sampleImage.key_large}`);
    console.log(` - Dimensions: ${sampleImage.width}x${sampleImage.height}`);
    console.log(` - Total WebP size: ${sampleImage.size_bytes_total} bytes`);
    console.log(` - BlurDataURL: ${sampleImage.blur_data_url.slice(0, 40)}...`);

    // Kiểm tra các tệp thật sự tồn tại trên đĩa
    const thumbExists = await storage.exists(sampleImage.key_thumb);
    const medExists = await storage.exists(sampleImage.key_medium);
    const lrgExists = await storage.exists(sampleImage.key_large);

    if (!thumbExists || !medExists || !lrgExists) {
      throw new Error('Một trong các biến thể của ảnh món mẫu không tồn tại trong storage');
    }
    console.log('✅ 5. Cả 3 biến thể ảnh trên storage đều tồn tại và hợp lệ 100%!');
  }

  console.log('\n🎉 === TẤT CẢ KIỂM THỬ PHẦN 6 ĐÃ VƯỢT QUA 100% ===\n');
}

testPart6()
  .catch((err) => {
    console.error('❌ LỖI KIỂM THỬ PHẦN 6:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
