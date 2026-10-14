import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assignTablesSchema = z.object({
  zoneId: z.string().nullable(),
  tableIds: z.array(z.string()).min(1, 'Cần chọn ít nhất một bàn'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Không có quyền phân bàn vào khu vực.' }, { status: 403 });
    }

    const body = await request.json();
    const validated = assignTablesSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' },
        { status: 400 }
      );
    }

    const { zoneId, tableIds } = validated.data;

    // Kiểm tra zone có thuộc quán không nếu zoneId khác null
    if (zoneId) {
      const zone = await prisma.zone.findFirst({
        where: { id: zoneId, restaurant_id: user.restaurantId },
      });
      if (!zone) {
        return NextResponse.json({ error: 'Khu vực không hợp lệ.' }, { status: 404 });
      }
    }

    // Cập nhật các bàn thuộc quán này
    await prisma.table.updateMany({
      where: {
        id: { in: tableIds },
        restaurant_id: user.restaurantId,
      },
      data: {
        zone_id: zoneId,
      },
    });

    return NextResponse.json({
      success: true,
      message: zoneId ? 'Đã gán bàn vào khu vực thành công.' : 'Đã gỡ bàn khỏi khu vực.',
    });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/zones/assign-tables:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi gán bàn.' }, { status: 400 });
  }
}
