import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createZoneSchema = z.object({
  name: z.string().trim().min(1, 'Tên khu vực không được để trống').max(50),
  sort_order: z.number().int().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const zones = await prisma.zone.findMany({
      where: { restaurant_id: user.restaurantId },
      include: {
        tables: {
          select: { id: true, name: true, is_active: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { sort_order: 'asc' },
    });

    const unassignedTables = await prisma.table.findMany({
      where: {
        restaurant_id: user.restaurantId,
        zone_id: null,
      },
      select: { id: true, name: true, is_active: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      zones: zones.map((z) => ({
        id: z.id,
        name: z.name,
        sort_order: z.sort_order,
        tablesCount: z.tables.length,
        tables: z.tables,
      })),
      unassignedTables,
    });
  } catch (error) {
    console.error('Lỗi GET /api/admin/zones:', error);
    return NextResponse.json({ error: 'Lỗi tải danh sách khu vực.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Không có quyền tạo khu vực.' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createZoneSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' },
        { status: 400 }
      );
    }

    const maxSort = await prisma.zone.aggregate({
      where: { restaurant_id: user.restaurantId },
      _max: { sort_order: true },
    });

    const newZone = await prisma.zone.create({
      data: {
        restaurant_id: user.restaurantId,
        name: validated.data.name,
        sort_order: validated.data.sort_order ?? ((maxSort._max.sort_order ?? 0) + 1),
      },
    });

    return NextResponse.json(
      { success: true, message: 'Tạo khu vực thành công.', zone: newZone },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/zones:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi tạo khu vực mới.' }, { status: 400 });
  }
}
