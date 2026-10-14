import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { getRestaurantQuotaStats } from '../src/lib/image/quota';
import { validateRestaurantOwnership } from '../src/lib/storage';

describe('Quotas & Multi-tenant Isolation (Phần 3 & 7)', () => {
  let restaurantAId: string;
  let restaurantBId: string;
  let categoryAId: string;
  let categoryBId: string;
  let itemAId: string;
  let itemBId: string;

  beforeAll(async () => {
    // 1. Tạo 2 nhà hàng riêng biệt để test cách ly
    const resA = await prisma.restaurant.create({
      data: {
        name: 'Unit Test Lounge A',
        slug: `test-lounge-a-${Date.now()}`,
        plan: 'basic',
        image_quota_count: 2, // Giới hạn chỉ 2 ảnh
        image_quota_bytes: BigInt(100 * 1024), // 100KB
      },
    });
    restaurantAId = resA.id;

    const resB = await prisma.restaurant.create({
      data: {
        name: 'Unit Test Lounge B',
        slug: `test-lounge-b-${Date.now()}`,
        plan: 'pro',
        image_quota_count: 200,
        image_quota_bytes: BigInt(150 * 1024 * 1024),
      },
    });
    restaurantBId = resB.id;

    // 2. Tạo category và món cho từng quán
    const catA = await prisma.category.create({
      data: { name: 'Cocktails A', restaurant_id: restaurantAId },
    });
    categoryAId = catA.id;

    const catB = await prisma.category.create({
      data: { name: 'Cocktails B', restaurant_id: restaurantBId },
    });
    categoryBId = catB.id;

    const itemA = await prisma.menuItem.create({
      data: {
        name: 'Cocktail A1',
        price: 150000,
        category_id: categoryAId,
        restaurant_id: restaurantAId,
      },
    });
    itemAId = itemA.id;

    const itemB = await prisma.menuItem.create({
      data: {
        name: 'Cocktail B1',
        price: 200000,
        category_id: categoryBId,
        restaurant_id: restaurantBId,
      },
    });
    itemBId = itemB.id;
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu test
    if (restaurantAId) {
      await prisma.menuImage.deleteMany({ where: { restaurant_id: restaurantAId } });
      await prisma.menuItem.deleteMany({ where: { restaurant_id: restaurantAId } });
      await prisma.category.deleteMany({ where: { restaurant_id: restaurantAId } });
      await prisma.restaurant.delete({ where: { id: restaurantAId } });
    }
    if (restaurantBId) {
      await prisma.menuImage.deleteMany({ where: { restaurant_id: restaurantBId } });
      await prisma.menuItem.deleteMany({ where: { restaurant_id: restaurantBId } });
      await prisma.category.deleteMany({ where: { restaurant_id: restaurantBId } });
      await prisma.restaurant.delete({ where: { id: restaurantBId } });
    }
  });

  it('quán A không đếm hoặc chạm vào ảnh của quán B', async () => {
    // Thêm 1 ảnh cho quán B
    await prisma.menuImage.create({
      data: {
        restaurant_id: restaurantBId,
        menu_item_id: itemBId,
        key_thumb: `restaurants/${restaurantBId}/menu/img-b/thumb-1.webp`,
        key_medium: `restaurants/${restaurantBId}/menu/img-b/medium-1.webp`,
        key_large: `restaurants/${restaurantBId}/menu/img-b/large-1.webp`,
        width: 1200,
        height: 900,
        blur_data_url: 'data:image/webp;base64,...',
        size_bytes_total: 50 * 1024,
      },
    });

    // Lấy thống kê quán A: phải là 0 ảnh, 0 bytes
    const statsA = await getRestaurantQuotaStats(restaurantAId);
    expect(statsA.usedImages).toBe(0);
    expect(statsA.usedBytes).toBe(0);

    // Lấy thống kê quán B: phải là 1 ảnh, 50KB
    const statsB = await getRestaurantQuotaStats(restaurantBId);
    expect(statsB.usedImages).toBe(1);
    expect(statsB.usedBytes).toBe(50 * 1024);
  });

  it('từ chối khi quán vượt quá hạn mức số ảnh hoặc dung lượng', async () => {
    // Thêm ảnh 1 cho quán A
    await prisma.menuImage.create({
      data: {
        restaurant_id: restaurantAId,
        menu_item_id: itemAId,
        key_thumb: `restaurants/${restaurantAId}/menu/img-a1/thumb-1.webp`,
        key_medium: `restaurants/${restaurantAId}/menu/img-a1/medium-1.webp`,
        key_large: `restaurants/${restaurantAId}/menu/img-a1/large-1.webp`,
        width: 1200,
        height: 900,
        blur_data_url: 'data:image/webp;base64,...',
        size_bytes_total: 60 * 1024, // 60KB
      },
    });

    // Thêm món thứ 2 cho quán A
    const itemA2 = await prisma.menuItem.create({
      data: {
        name: 'Cocktail A2',
        price: 180000,
        category_id: categoryAId,
        restaurant_id: restaurantAId,
      },
    });

    // Thêm ảnh 2 cho quán A (đạt max 2 ảnh)
    await prisma.menuImage.create({
      data: {
        restaurant_id: restaurantAId,
        menu_item_id: itemA2.id,
        key_thumb: `restaurants/${restaurantAId}/menu/img-a2/thumb-2.webp`,
        key_medium: `restaurants/${restaurantAId}/menu/img-a2/medium-2.webp`,
        key_large: `restaurants/${restaurantAId}/menu/img-a2/large-2.webp`,
        width: 1200,
        height: 900,
        blur_data_url: 'data:image/webp;base64,...',
        size_bytes_total: 30 * 1024, // 30KB -> tổng 90KB / 100KB
      },
    });

    const statsA = await getRestaurantQuotaStats(restaurantAId);
    expect(statsA.usedImages).toBe(2);
    expect(statsA.maxImages).toBe(2);
    expect(statsA.percentImages).toBe(100);

    // Cố tải thêm ảnh nữa sẽ bị từ chối
    const canUploadMore = statsA.usedImages < statsA.maxImages;
    expect(canUploadMore).toBe(false);
  });

  it('ngăn chặn truy cập chéo: quán A không được thao tác trên key của quán B', () => {
    const keyOfB = `restaurants/${restaurantBId}/menu/img-123/thumb-abc.webp`;

    // Quán B truy cập key của chính mình -> Cho phép
    expect(validateRestaurantOwnership(restaurantBId, keyOfB)).toBe(true);

    // Quán A truy cập key của Quán B -> Bị từ chối
    expect(validateRestaurantOwnership(restaurantAId, keyOfB)).toBe(false);
  });
});
