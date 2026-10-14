import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateZoneSchema = z.object({
  name: z.string().trim().min(1, 'Tên khu vực không được để trống').max(50).optional(),
  sort_order: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Không có quyền sửa khu vực.' }, { status: 403 });
    }

    const zone = await prisma.zone.findFirst({
      where: { id: params.id, restaurant_id: user.restaurantId },
    });

    if (!zone) {
      return NextResponse.json({ error: 'Khu vực không tồn tại.' }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateZoneSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' },
        { status: 400 }
      );
    }

    const updated = await prisma.zone.update({
      where: { id: params.id },
      data: {
        ...(validated.data.name ? { name: validated.data.name } : {}),
        ...(typeof validated.data.sort_order === 'number' ? { sort_order: validated.data.sort_order } : {}),
      },
    });

    return NextResponse.json({ success: true, message: 'Cập nhật khu vực thành công.', zone: updated });
  } catch (error: any) {
    console.error('Lỗi PATCH /api/admin/zones/[id]:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi cập nhật khu vực.' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Không có quyền xóa khu vực.' }, { status: 403 });
    }

    const zone = await prisma.zone.findFirst({
      where: { id: params.id, restaurant_id: user.restaurantId },
    });

    if (!zone) {
      return NextResponse.json({ error: 'Khu vực không tồn tại.' }, { status: 404 });
    }

    // Gỡ bàn khỏi khu vực này trước khi xóa
    await prisma.table.updateMany({
      where: { zone_id: params.id, restaurant_id: user.restaurantId },
      data: { zone_id: null },
    });

    await prisma.zone.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa khu vực thành công.' });
  } catch (error: any) {
    console.error('Lỗi DELETE /api/admin/zones/[id]:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi xóa khu vực.' }, { status: 400 });
  }
}
