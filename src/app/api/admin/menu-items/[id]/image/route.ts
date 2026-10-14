import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStorageAdapter, generateStorageKey } from '@/lib/storage';
import { validateUploadedImage } from '@/lib/image/validator';
import { processImagePipeline } from '@/lib/image/pipeline';
import { imageProcessingQueue } from '@/lib/image/queue';
import { deleteImageKeysFromStorage } from '@/lib/image/cleanup';
import { formatBytes } from '@/lib/image/quota';

/**
 * POST /api/admin/menu-items/[id]/image
 * Upload và xử lý ảnh cho một món ăn cụ thể:
 * - Kiểm tra xác thực & quyền sở hữu theo nhà hàng (Tenant Isolation)
 * - Kiểm tra hạn mức số lượng ảnh và dung lượng của quán
 * - Validate magic bytes, dung lượng, chống pixel bomb
 * - Xử lý Sharp trong hàng đợi concurrency = 2
 * - Lưu 3 biến thể WebP lên Storage Adapter
 * - Xóa ảnh cũ nếu có (với fallback ghi vào cleanup queue)
 * - Cập nhật bảng menu_images và menu_items
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json(
        { error: 'Yêu cầu đăng nhập quản trị nhà hàng.' },
        { status: 401 }
      );
    }

    const menuItemId = params.id;
    if (!menuItemId) {
      return NextResponse.json({ error: 'Mã món không hợp lệ.' }, { status: 400 });
    }

    // 1. Kiểm tra món thuộc đúng quán của người dùng
    const menuItem = await prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        restaurant_id: user.restaurantId,
      },
      include: {
        image: true,
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Món ăn không tồn tại hoặc bạn không có quyền thao tác trên món này.' },
        { status: 404 }
      );
    }

    // 2. Kiểm tra hạn mức gói dịch vụ của quán (Quota Check)
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: user.restaurantId },
      select: {
        image_quota_count: true,
        image_quota_bytes: true,
      },
    });

    const maxCount = restaurant?.image_quota_count ?? 30;
    const maxBytes = restaurant?.image_quota_bytes
      ? Number(restaurant.image_quota_bytes)
      : 20 * 1024 * 1024;

    // Tính toán lượng tài nguyên hiện tại nếu món này CHƯA có ảnh
    if (!menuItem.image) {
      const currentImageStats = await prisma.menuImage.aggregate({
        where: { restaurant_id: user.restaurantId },
        _count: { id: true },
        _sum: { size_bytes_total: true },
      });

      const currentCount = currentImageStats._count.id || 0;
      const currentBytes = currentImageStats._sum.size_bytes_total || 0;

      if (currentCount >= maxCount) {
        return NextResponse.json(
          {
            error: `Quán đã đạt giới hạn tối đa ${maxCount} ảnh của gói hiện tại. Vui lòng nâng cấp gói dịch vụ hoặc xóa bớt ảnh cũ để tiếp tục tải lên.`,
          },
          { status: 403 }
        );
      }

      if (currentBytes >= maxBytes) {
        return NextResponse.json(
          {
            error: `Quán đã sử dụng hết hạn mức dung lượng ảnh (${formatBytes(
              currentBytes
            )} / ${formatBytes(
              maxBytes
            )}). Vui lòng nâng cấp gói dịch vụ hoặc xóa ảnh không sử dụng.`,
          },
          { status: 403 }
        );
      }
    }

    // 3. Đọc tệp từ FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Vui lòng chọn một tệp hình ảnh để tải lên.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    // 4. Validate nghiêm ngặt (Magic bytes, kích thước, pixel bomb)
    const validation = await validateUploadedImage(rawBuffer);
    if (!validation.valid || !validation.metadata) {
      return NextResponse.json(
        { error: validation.error || 'Tệp hình ảnh không hợp lệ.' },
        { status: 400 }
      );
    }

    // 5. Đưa vào hàng đợi xử lý Sharp (giới hạn concurrency = 2)
    const processed = await imageProcessingQueue.run(() =>
      processImagePipeline(rawBuffer)
    );

    // 6. Tạo khóa lưu trữ chuẩn: restaurants/{restaurant_id}/menu/{image_id}/{variant}-{hash}.webp
    const imageId = crypto.randomUUID();
    const keyThumb = generateStorageKey(
      user.restaurantId,
      imageId,
      'thumb',
      processed.contentHash
    );
    const keyMedium = generateStorageKey(
      user.restaurantId,
      imageId,
      'medium',
      processed.contentHash
    );
    const keyLarge = generateStorageKey(
      user.restaurantId,
      imageId,
      'large',
      processed.contentHash
    );

    // 7. Lưu 3 biến thể qua Storage Adapter
    const storage = getStorageAdapter();
    await Promise.all([
      storage.put(keyThumb, processed.thumb, 'image/webp'),
      storage.put(keyMedium, processed.medium, 'image/webp'),
      storage.put(keyLarge, processed.large, 'image/webp'),
    ]);

    // 8. Nếu món đã có ảnh cũ -> Xóa ảnh cũ khỏi Storage
    if (menuItem.image) {
      const oldKeys = [
        menuItem.image.key_thumb,
        menuItem.image.key_medium,
        menuItem.image.key_large,
      ];
      // Luồng xóa an toàn: bắt lỗi và chuyển vào retry queue nếu xóa thất bại
      await deleteImageKeysFromStorage(user.restaurantId, oldKeys);
    }

    // 9. Cập nhật cơ sở dữ liệu: Upsert MenuImage và MenuItem
    const publicMediumUrl = storage.getPublicUrl(keyMedium);
    const publicThumbUrl = storage.getPublicUrl(keyThumb);
    const publicLargeUrl = storage.getPublicUrl(keyLarge);

    const menuImage = await prisma.menuImage.upsert({
      where: { menu_item_id: menuItemId },
      create: {
        id: imageId,
        restaurant_id: user.restaurantId,
        menu_item_id: menuItemId,
        key_thumb: keyThumb,
        key_medium: keyMedium,
        key_large: keyLarge,
        width: processed.width,
        height: processed.height,
        blur_data_url: processed.blurDataUrl,
        size_bytes_total: processed.sizeBytesTotal,
      },
      update: {
        id: imageId,
        key_thumb: keyThumb,
        key_medium: keyMedium,
        key_large: keyLarge,
        width: processed.width,
        height: processed.height,
        blur_data_url: processed.blurDataUrl,
        size_bytes_total: processed.sizeBytesTotal,
      },
    });

    // Cập nhật menu_items.image_url để tương thích ngược
    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        image_url: publicMediumUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tải và xử lý ảnh thành công.',
      image: {
        id: menuImage.id,
        menu_item_id: menuImage.menu_item_id,
        url: publicMediumUrl,
        thumbUrl: publicThumbUrl,
        largeUrl: publicLargeUrl,
        blurDataUrl: menuImage.blur_data_url,
        width: menuImage.width,
        height: menuImage.height,
        sizeBytesTotal: menuImage.size_bytes_total,
      },
    });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/menu-items/[id]/image:', error);
    return NextResponse.json(
      { error: error?.message || 'Đã xảy ra lỗi máy chủ khi xử lý ảnh.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/menu-items/[id]/image
 * Xóa ảnh của món ăn:
 * - Kiểm tra quyền sở hữu
 * - Xóa tệp từ Storage Adapter
 * - Xóa bản ghi menu_images và cập nhật menu_items.image_url = null
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json(
        { error: 'Yêu cầu đăng nhập quản trị.' },
        { status: 401 }
      );
    }

    const menuItemId = params.id;
    const menuItem = await prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        restaurant_id: user.restaurantId,
      },
      include: {
        image: true,
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Món ăn không tồn tại hoặc bạn không có quyền thao tác.' },
        { status: 404 }
      );
    }

    if (menuItem.image) {
      const keys = [
        menuItem.image.key_thumb,
        menuItem.image.key_medium,
        menuItem.image.key_large,
      ];
      await deleteImageKeysFromStorage(user.restaurantId, keys);

      await prisma.menuImage.delete({
        where: { id: menuItem.image.id },
      });
    }

    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        image_url: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa ảnh món thành công.',
    });
  } catch (error: any) {
    console.error('Lỗi DELETE /api/admin/menu-items/[id]/image:', error);
    return NextResponse.json(
      { error: error?.message || 'Đã xảy ra lỗi khi xóa ảnh món.' },
      { status: 500 }
    );
  }
}
