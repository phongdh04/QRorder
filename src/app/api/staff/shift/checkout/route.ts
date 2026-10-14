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

    const activeShift = await prisma.shift.findFirst({
      where: { restaurant_id: restaurantId, ended_at: null },
    });

    if (activeShift) {
      await prisma.dutyAssignment.updateMany({
        where: {
          shift_id: activeShift.id,
          user_id: user.userId,
        },
        data: {
          on_duty: false,
        },
      });

      await broadcastQrEvent({
        type: 'shift_changed',
        restaurantId,
        status: 'active',
        data: {
          shiftId: activeShift.id,
          userId: user.userId,
          onDuty: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã kết thúc ca làm việc',
    });
  } catch (error: any) {
    console.error('Lỗi POST /api/staff/shift/checkout:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi kết thúc ca' },
      { status: 500 }
    );
  }
}
