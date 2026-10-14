import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { customerGetPublicMenuByToken } from '../src/lib/dal/customer';

describe('Menu Display Mode & Optional Images (Phần 4 & 7)', () => {
  let restaurantId: string;
  let categoryId: string;
  let tableToken: string;
  let itemWithPhotoId: string;
  let itemNoPhotoId: string;

  beforeAll(async () => {
    // 1. Tạo nhà hàng với 1 bàn
    const res = await prisma.restaurant.create({
      data: {
        name: 'The Minimalist Bar',
        slug: `minimal-bar-${Date.now()}`,
        menu_display_mode: 'photo', // Bắt đầu ở chế độ photo
      },
    });
    restaurantId = res.id;

    const table = await prisma.table.create({
      data: {
        name: 'Bàn Test 01',
        token: `token-mode-${Date.now()}`,
        restaurant_id: restaurantId,
        is_active: true,
      },
    });
    tableToken = table.token;

    const cat = await prisma.category.create({
      data: {
        name: 'Signature Drinks',
        restaurant_id: restaurantId,
        is_active: true,
      },
    });
    categoryId = cat.id;

    // Món 1: CÓ ẢNH
    const item1 = await prisma.menuItem.create({
      data: {
        name: 'Smoked Negroni',
        price: 220000,
        category_id: categoryId,
        restaurant_id: restaurantId,
      },
    });
    itemWithPhotoId = item1.id;

    await prisma.menuImage.create({
      data: {
        restaurant_id: restaurantId,
        menu_item_id: itemWithPhotoId,
        key_thumb: `restaurants/${restaurantId}/menu/img-1/thumb-abc.webp`,
        key_medium: `restaurants/${restaurantId}/menu/img-1/medium-abc.webp`,
        key_large: `restaurants/${restaurantId}/menu/img-1/large-abc.webp`,
        width: 1200,
        height: 900,
        blur_data_url: 'data:image/webp;base64,...',
        size_bytes_total: 95000,
      },
    });

    // Món 2: KHÔNG CÓ ẢNH (tùy chọn theo món)
    const item2 = await prisma.menuItem.create({
      data: {
        name: 'House Draft Beer',
        description: 'Bia thủ công ủ men truyền thống',
        price: 85000,
        category_id: categoryId,
        restaurant_id: restaurantId,
      },
    });
    itemNoPhotoId = item2.id;
  });

  afterAll(async () => {
    if (restaurantId) {
      await prisma.menuImage.deleteMany({ where: { restaurant_id: restaurantId } });
      await prisma.menuItem.deleteMany({ where: { restaurant_id: restaurantId } });
      await prisma.category.deleteMany({ where: { restaurant_id: restaurantId } });
      await prisma.table.deleteMany({ where: { restaurant_id: restaurantId } });
      await prisma.restaurant.delete({ where: { id: restaurantId } });
    }
  });

  it('ở chế độ photo: món có ảnh nhận đủ các biến thể, món không ảnh trả image=null (hiển thị thẻ chữ)', async () => {
    const data = await customerGetPublicMenuByToken(tableToken);
    expect(data).not.toBeNull();
    expect(data?.restaurant.menuDisplayMode).toBe('photo');

    const cat = data?.categories[0];
    expect(cat).toBeDefined();

    const photoItem = cat?.items.find((i) => i.id === itemWithPhotoId);
    expect(photoItem).toBeDefined();
    expect(photoItem?.image).not.toBeNull();
    expect(photoItem?.image?.thumbUrl).toContain('thumb-abc.webp');
    expect(photoItem?.image?.mediumUrl).toContain('medium-abc.webp');
    expect(photoItem?.image?.largeUrl).toContain('large-abc.webp');

    const noPhotoItem = cat?.items.find((i) => i.id === itemNoPhotoId);
    expect(noPhotoItem).toBeDefined();
    expect(noPhotoItem?.image).toBeNull(); // Không có ảnh -> client hiển thị Thẻ Chữ
  });

  it('khi quán chuyển sang chế độ minimal: menu_display_mode là minimal, phục vụ thẻ chữ siêu nhẹ', async () => {
    // Quán đổi sang chế độ minimal
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { menu_display_mode: 'minimal' },
    });

    const data = await customerGetPublicMenuByToken(tableToken);
    expect(data?.restaurant.menuDisplayMode).toBe('minimal');
    // Ở chế độ minimal, giao diện khách MenuCard nhận biết menuDisplayMode === 'minimal'
    // và lập tức hiển thị toàn bộ món theo Thẻ chữ sang trọng mà không tải bất kỳ ảnh nào
  });
});
