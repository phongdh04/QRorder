import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { broadcastQrEvent } from '@/lib/events';
import { z } from 'zod';

const updateAssignmentSchema = z.object({
  userId: z.string().min(1, 'Thiếu thông tin nhân viên'),
  zoneId: z.string().nullable().optional(),
  onDuty: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Chỉ Quản lý hoặc Chủ quán mới có quyền phân công ca trực.' }, { status: 403 });
    }

    const currentShift = await prisma.shift.findFirst({
      where: {
        restaurant_id: user.restaurantId,
        ended_at: null,
      },
    });

    if (!currentShift) {
      return NextResponse.json(
        { error: 'Chưa có ca trực nào đang mở. Vui lòng bấm Bắt đầu ca trực trước.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = updateAssignmentSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' },
        { status: 400 }
      );
    }

    const { userId, zoneId, onDuty } = validated.data;

    // Kiểm tra user có thuộc quán không
    const targetUser = await prisma.user.findFirst({
      where: { id: userId, restaurant_id: user.restaurantId, is_active: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'Nhân viên không tồn tại hoặc đã bị khóa.' }, { status: 404 });
    }

    // Kiểm tra zone nếu có
    if (zoneId) {
      const targetZone = await prisma.zone.findFirst({
        where: { id: zoneId, restaurant_id: user.restaurantId },
      });
      if (!targetZone) {
        return NextResponse.json({ error: 'Khu vực không hợp lệ.' }, { status: 404 });
      }
    }

    // Tìm assignment đã có trong ca này chưa
    const existing = await prisma.dutyAssignment.findFirst({
      where: {
        shift_id: currentShift.id,
        user_id: userId,
      },
    });

    let assignment;
    if (existing) {
      assignment = await prisma.dutyAssignment.update({
        where: { id: existing.id },
        data: {
          zone_id: zoneId ?? null,
          on_duty: onDuty,
        },
      });
    } else {
      assignment = await prisma.dutyAssignment.create({
        data: {
          shift_id: currentShift.id,
          restaurant_id: user.restaurantId,
          user_id: userId,
          zone_id: zoneId ?? null,
          on_duty: onDuty,
        },
      });
    }

    await broadcastQrEvent({
      type: 'shift_changed',
      restaurantId: user.restaurantId,
      data: {
        shiftId: currentShift.id,
        action: 'assignment_updated',
        userId,
        zoneId: zoneId ?? null,
        onDuty,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật phân công thành công.',
      assignment,
    });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/shifts/assignments:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi cập nhật phân công.' }, { status: 400 });
  }
}
