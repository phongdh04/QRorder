import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { broadcastQrEvent } from '@/lib/events';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    if (user.role !== 'owner' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Chỉ Quản lý hoặc Chủ quán mới có quyền kết thúc ca trực.' }, { status: 403 });
    }

    const currentShift = await prisma.shift.findFirst({
      where: {
        restaurant_id: user.restaurantId,
        ended_at: null,
      },
    });

    if (!currentShift) {
      return NextResponse.json({ error: 'Hiện không có ca trực nào đang mở.' }, { status: 404 });
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.shift.update({
        where: { id: currentShift.id },
        data: { ended_at: now },
      }),
      prisma.dutyAssignment.updateMany({
        where: { shift_id: currentShift.id },
        data: { on_duty: false },
      }),
    ]);

    await broadcastQrEvent({
      type: 'shift_changed',
      restaurantId: user.restaurantId,
      data: {
        shiftId: currentShift.id,
        action: 'ended',
        endedBy: user.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã kết thúc ca trực thành công.',
    });
  } catch (error: any) {
    console.error('Lỗi POST /api/admin/shifts/end:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi kết thúc ca trực.' }, { status: 400 });
  }
}
