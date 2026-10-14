import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  processAndSaveImage,
  deleteUploadedImage,
} from '@/lib/upload';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const oldImageUrl = formData.get('oldImageUrl') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Vui lòng chọn một tệp hình ảnh để tải lên.' }, { status: 400 });
    }

    // 1. Đọc dữ liệu ảnh thành Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Validate nghiêm ngặt bằng magic bytes & kích thước
    const { validateUploadedImage } = await import('@/lib/image/validator');
    const validation = await validateUploadedImage(buffer);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Tệp hình ảnh không hợp lệ.' },
        { status: 400 }
      );
    }

    // 3. Xử lý qua sharp tạo 3 kích thước WebP và lưu qua Storage Adapter
    const result = await processAndSaveImage(buffer, user.restaurantId);

    // 4. Nếu có ảnh cũ, tiến hành dọn dẹp xóa ảnh cũ
    if (oldImageUrl) {
      deleteUploadedImage(oldImageUrl);
    }

    return NextResponse.json({
      success: true,
      message: 'Tải ảnh lên và chuyển đổi WebP thành công.',
      ...result,
    });
  } catch (error: any) {
    console.error('Lỗi API /api/admin/upload:', error);
    return NextResponse.json(
      { error: error?.message || 'Đã xảy ra lỗi khi xử lý hình ảnh.' },
      { status: 500 }
    );
  }
}
