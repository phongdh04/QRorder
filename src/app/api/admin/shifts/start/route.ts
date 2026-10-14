import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { broadcastQrEvent } from '@/lib/events';
import { z } from 'zod';

const startShiftSchema = z.object({
  assignments: z
    .array(
      z.object({
        userId: z.string(),
        zoneId: z.string().nullable().optional(),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Chỉ Quản lý hoặc Chủ quán mới có quyền bắt đầu ca trực.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const validated = startShiftSchema.safeParse(body);

    const now = new Date();

    // Kết thúc ca trực cũ nếu còn đang mở (mỗi quán tối đa 1 ca mở)
    await prisma.shift.updateMany({
      where: {
        restaurant_id: user.restaurantId,
        ended_at: null,
      },
      data: {
        ended_at: now,
      },
    });

    // Tạo ca trực mới
    const newShift = await prisma.shift.create({
      data: {
        restaurant_id: user.restaurantId,
        started_by: user.userId,
        started_at: now,
      },
    });

    // Tạo phân công nhiệm vụ ban đầu nếu có
    if (validated.success && validated.data.assignments && validated.data.assignments.length > 0) {
      await prisma.dutyAssignment.createMany({
        data: validated.data.assignments.map((a) => ({
          shift_id: newShift.id,
          restaurant_id: user.restaurantId,
          user_id: a.userId,
          zone_id: a.zoneId || null,
          on_duty: true,
        })),
      });
    }

    await broadcastQrEvent({
      type: 'shift_changed',
      restaurantId: user.restaurantId,
      data: {
        shiftId: newShift.id,
        action: 'started',
        startedBy: user.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bắt đầu ca trực mới thành công.',
      shift: newShift,
    });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/shifts/start:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi bắt đầu ca trực.' }, { status: 400 });
  }
}
