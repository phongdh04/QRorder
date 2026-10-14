import assert from 'assert';
import { prisma } from '../src/lib/prisma';
import { customerGetPublicMenuByToken } from '../src/lib/dal/customer';
import { adminUpdateStoreInfo } from '../src/lib/dal/management';
import { generateStorageKey, getStorageAdapter } from '../src/lib/storage';

async function runPart4Tests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ PHẦN 4: ẢNH TÙY CHỌN & CHẾ ĐỘ HIỂN THỊ THEO QUÁN ===');

  // 1. Chuẩn bị nhà hàng test với cả 2 loại món: có ảnh và không có ảnh
  console.log('\n[1/4] Chuẩn bị nhà hàng và dữ liệu món (Có ảnh & Không có ảnh):');
  const slug = `rest-part4-${Date.now()}`;
  const token = `table_part4_token_${Date.now()}`;

  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'The Golden Bar Part 4',
      slug,
      menu_display_mode: 'photo',
    },
  });

  const table = await prisma.table.create({
    data: {
      restaurant_id: restaurant.id,
      name: 'Bàn VIP 01',
      token,
      is_active: true,
    },
  });

  const category = await prisma.category.create({
    data: {
      restaurant_id: restaurant.id,
      name: 'Signature Drinks',
    },
  });

  // Món 1: CÓ ẢNH
  const itemWithImage = await prisma.menuItem.create({
    data: {
      restaurant_id: restaurant.id,
      category_id: category.id,
      name: 'Negroni Classico',
      price: 180000,
      description: 'Gin, Campari, Sweet Vermouth',
    },
  });

  const imageId = `img-part4-${Date.now()}`;
  const keyThumb = generateStorageKey(restaurant.id, imageId, 'thumb', 'a1b2c3d4e5f6g7h8');
  const keyMed = generateStorageKey(restaurant.id, imageId, 'medium', 'a1b2c3d4e5f6g7h8');
  const keyLarge = generateStorageKey(restaurant.id, imageId, 'large', 'a1b2c3d4e5f6g7h8');

  const menuImage = await prisma.menuImage.create({
    data: {
      id: imageId,
      restaurant_id: restaurant.id,
      menu_item_id: itemWithImage.id,
      key_thumb: keyThumb,
      key_medium: keyMed,
      key_large: keyLarge,
      width: 1200,
      height: 900,
      blur_data_url: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoQAAwAPpE8l0ek/iA=',
      size_bytes_total: 125000,
    },
  });

  const storage = getStorageAdapter();
  await prisma.menuItem.update({
    where: { id: itemWithImage.id },
    data: { image_url: storage.getPublicUrl(keyMed) },
  });

  // Món 2: KHÔNG CÓ ẢNH
  const itemWithoutImage = await prisma.menuItem.create({
    data: {
      restaurant_id: restaurant.id,
      category_id: category.id,
      name: 'Old Fashioned (Không Ảnh)',
      price: 160000,
      description: 'Bourbon, Bitters, Sugar Cube',
      image_url: null,
    },
  });

  console.log('  -> PASS: Đã khởi tạo nhà hàng mẫu và 2 món (1 có ảnh, 1 không ảnh).');

  // 2. Kiểm tra giao diện khách ở chế độ 'photo' (Mặc định)
  console.log('\n[2/4] Kiểm tra dữ liệu khách quét mã khi quán ở chế độ "photo":');
  const menuPhoto = await customerGetPublicMenuByToken(token);
  assert.ok(menuPhoto !== null, 'Menu không được null');
  assert.strictEqual(menuPhoto.restaurant.menuDisplayMode, 'photo', 'Chế độ quán phải là photo');

  const catPhoto = menuPhoto.categories[0];
  const item1 = catPhoto.items.find((i) => i.id === itemWithImage.id);
  const item2 = catPhoto.items.find((i) => i.id === itemWithoutImage.id);

  assert.ok(item1 !== undefined, 'Món 1 phải tồn tại');
  assert.ok(item1.image !== null && item1.image !== undefined, 'Món 1 phải có object image');
  assert.strictEqual(item1.image?.width, 1200);
  assert.strictEqual(item1.image?.height, 900);
  assert.ok(item1.image?.thumbUrl.includes('thumb-'), 'Phải có thumbUrl');
  assert.ok(item1.image?.mediumUrl.includes('medium-'), 'Phải có mediumUrl');
  assert.ok(item1.image?.largeUrl.includes('large-'), 'Phải có largeUrl');
  assert.ok(item1.image?.blurDataUrl.startsWith('data:image/webp;base64,'), 'Phải có blurDataUrl');

  console.log('  Món có ảnh: thumbUrl =', item1.image?.thumbUrl);
  console.log('  Món có ảnh: blurDataUrl =', item1.image?.blurDataUrl);

  assert.ok(item2 !== undefined, 'Món 2 phải tồn tại');
  assert.strictEqual(item2.image, null, 'Món 2 không có ảnh thì image phải là null');
  assert.strictEqual(item2.imageUrl, null, 'Món 2 không có ảnh thì imageUrl phải là null');
  console.log('  Món không ảnh: image = null (render thẻ chữ sang trọng, không có ô trống)');
  console.log('  -> PASS: Dữ liệu khách ở chế độ "photo" hoàn hảo: Món có ảnh đủ 3 biến thể, món không ảnh là null.');

  // 3. Kiểm tra thay đổi chế độ hiển thị sang 'minimal'
  console.log('\n[3/4] Cập nhật quán sang chế độ "minimal" (Tối giản):');
  await adminUpdateStoreInfo(restaurant.id, {
    menu_display_mode: 'minimal',
  });

  const menuMinimal = await customerGetPublicMenuByToken(token);
  assert.ok(menuMinimal !== null, 'Menu không được null');
  assert.strictEqual(menuMinimal.restaurant.menuDisplayMode, 'minimal', 'Chế độ quán phải là minimal');
  console.log('  -> PASS: Quán chuyển sang chế độ "minimal" thành công.');

  // 4. Dọn dẹp dữ liệu test
  console.log('\n[4/4] Dọn dẹp dữ liệu test:');
  await prisma.menuImage.delete({ where: { id: menuImage.id } });
  await prisma.menuItem.deleteMany({ where: { restaurant_id: restaurant.id } });
  await prisma.category.deleteMany({ where: { restaurant_id: restaurant.id } });
  await prisma.table.deleteMany({ where: { restaurant_id: restaurant.id } });
  await prisma.restaurant.delete({ where: { id: restaurant.id } });
  console.log('  -> PASS: Đã dọn dẹp sạch sẽ toàn bộ bản ghi test.');

  console.log('\n🎉 TOÀN BỘ KIỂM THỬ PHẦN 4 ĐÃ VƯỢT QUA 100%!');
}

runPart4Tests().catch((err) => {
  console.error('\n❌ LỖI KIỂM THỬ PHẦN 4:', err);
  process.exit(1);
});
