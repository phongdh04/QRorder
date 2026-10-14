import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndEscalateRequests } from '@/lib/service-requests';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    // 1. Kích hoạt kiểm tra escalation tự động
    await checkAndEscalateRequests();

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: user.restaurantId },
      select: { offline_alert_seconds: true },
    });

    const offlineAlertSeconds = restaurant?.offline_alert_seconds ?? 120;
    const onlineThreshold = new Date(Date.now() - offlineAlertSeconds * 1000);

    // 2. Kiểm tra các request đã bị escalate và chưa ai nhận
    const escalatedRequests = await prisma.serviceRequest.findMany({
      where: {
        restaurant_id: user.restaurantId,
        status: 'pending',
        escalated_at: { not: null },
      },
      include: {
        table: { select: { id: true, name: true } },
      },
      orderBy: { escalated_at: 'asc' },
    });

    // 3. Kiểm tra nhân viên đang trong ca trực nhưng mất kết nối quá offline_alert_seconds
    const currentShift = await prisma.shift.findFirst({
      where: {
        restaurant_id: user.restaurantId,
        ended_at: null,
      },
      include: {
        duty_assignments: {
          where: { on_duty: true },
          include: {
            user: {
              select: { id: true, name: true, last_seen_at: true },
            },
          },
        },
      },
    });

    const onDutyAssignments = currentShift?.duty_assignments || [];
    const offlineOnDutyStaff = onDutyAssignments
      .filter((da) => !da.user.last_seen_at || new Date(da.user.last_seen_at) < onlineThreshold)
      .map((da) => ({
        id: da.user.id,
        name: da.user.name,
        lastSeenAt: da.user.last_seen_at,
        offlineSeconds: da.user.last_seen_at
          ? Math.floor((Date.now() - new Date(da.user.last_seen_at).getTime()) / 1000)
          : null,
      }));

    // 4. Kiểm tra có đơn chờ nhưng không có nhân viên nào online
    const onlineOnDutyCount = onDutyAssignments.length - offlineOnDutyStaff.length;
    const pendingRequestsCount = await prisma.serviceRequest.count({
      where: {
        restaurant_id: user.restaurantId,
        status: 'pending',
      },
    });

    const hasPendingWithNoStaff = pendingRequestsCount > 0 && onlineOnDutyCount === 0;

    return NextResponse.json({
      success: true,
      escalatedCount: escalatedRequests.length,
      escalatedRequests: escalatedRequests.map((r) => ({
        id: r.id,
        type: r.type,
        tableName: r.table.name,
        escalatedAt: r.escalated_at,
        waitMinutes: Math.floor((Date.now() - new Date(r.created_at).getTime()) / 60000),
      })),
      offlineOnDutyStaff,
      hasPendingWithNoStaff,
      pendingRequestsCount,
      onlineOnDutyCount,
    });
  } catch (error) {
    console.error('Lỗi GET /api/admin/alerts/check:', error);
    return NextResponse.json({ error: 'Lỗi kiểm tra cảnh báo.' }, { status: 500 });
  }
}
