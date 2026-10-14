import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { broadcastQrEvent } from '@/lib/events';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(true);
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const restaurantId = user.restaurantId;
    const now = new Date();

    // 1. Tìm hoặc mở ca trực cho quán
    let activeShift = await prisma.shift.findFirst({
      where: { restaurant_id: restaurantId, ended_at: null },
    });

    if (!activeShift) {
      activeShift = await prisma.shift.create({
        data: {
          restaurant_id: restaurantId,
          started_by: user.userId,
          started_at: now,
        },
      });
    }

    // 2. Cập nhật hoặc tạo phân công nhiệm vụ vào ca (on_duty = true)
    const existingAssignment = await prisma.dutyAssignment.findFirst({
      where: {
        shift_id: activeShift.id,
        user_id: user.userId,
      },
      include: { zone: true },
    });

    let assignedZoneId = existingAssignment?.zone_id || null;

    if (existingAssignment) {
      await prisma.dutyAssignment.update({
        where: { id: existingAssignment.id },
        data: { on_duty: true },
      });
    } else {
      // Tìm xem nhân viên có phân khu mặc định nào không
      const created = await prisma.dutyAssignment.create({
        data: {
          shift_id: activeShift.id,
          restaurant_id: restaurantId,
          user_id: user.userId,
          zone_id: null,
          on_duty: true,
        },
      });
      assignedZoneId = created.zone_id;
    }

    // 3. Cập nhật thời gian hoạt động gần nhất
    await prisma.user.update({
      where: { id: user.userId },
      data: { last_seen_at: now },
    });

    // 4. Phát tín hiệu realtime cập nhật ca trực
    await broadcastQrEvent({
      type: 'shift_changed',
      restaurantId,
      status: 'active',
      data: {
        shiftId: activeShift.id,
        userId: user.userId,
        onDuty: true,
        zoneId: assignedZoneId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã sẵn sàng vào ca nhận đơn!',
      shiftId: activeShift.id,
      onDuty: true,
      zoneId: assignedZoneId,
    });
  } catch (error: any) {
    console.error('Lỗi POST /api/staff/shift/checkin:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi vào ca trực' },
      { status: 500 }
    );
  }
}
