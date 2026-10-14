import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: user.restaurantId },
      select: { offline_alert_seconds: true, escalation_seconds: true },
    });

    const offlineAlertSeconds = restaurant?.offline_alert_seconds ?? 120;
    const onlineThreshold = new Date(Date.now() - offlineAlertSeconds * 1000);

    // Ca trực hiện tại đang mở
    const currentShift = await prisma.shift.findFirst({
      where: {
        restaurant_id: user.restaurantId,
        ended_at: null,
      },
      include: {
        duty_assignments: {
          include: {
            user: {
              select: { id: true, name: true, role: true, is_active: true, last_seen_at: true },
            },
            zone: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Lấy thông tin người bắt đầu ca nếu có
    let startedByName = null;
    if (currentShift?.started_by) {
      const startedByUser = await prisma.user.findUnique({
        where: { id: currentShift.started_by },
        select: { name: true },
      });
      startedByName = startedByUser?.name || null;
    }

    // Danh sách toàn bộ nhân viên hoạt động của quán
    const allStaff = await prisma.user.findMany({
      where: {
        restaurant_id: user.restaurantId,
        is_active: true,
        role: { in: ['staff', 'manager'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        last_seen_at: true,
      },
      orderBy: { name: 'asc' },
    });

    // Danh sách các khu vực
    const zones = await prisma.zone.findMany({
      where: { restaurant_id: user.restaurantId },
      select: { id: true, name: true, sort_order: true },
      orderBy: { sort_order: 'asc' },
    });

    const staffWithOnlineStatus = allStaff.map((s) => {
      const isOnline = Boolean(s.last_seen_at && new Date(s.last_seen_at) >= onlineThreshold);
      const assignment = currentShift?.duty_assignments.find((da) => da.user_id === s.id);
      return {
        ...s,
        isOnline,
        onDuty: assignment ? assignment.on_duty : false,
        assignedZoneId: assignment ? assignment.zone_id : null,
        assignedZoneName: assignment?.zone?.name || null,
      };
    });

    return NextResponse.json({
      success: true,
      offlineAlertSeconds,
      shift: currentShift
        ? {
            id: currentShift.id,
            started_at: currentShift.started_at,
            started_by: currentShift.started_by,
            started_by_name: startedByName,
            assignments: currentShift.duty_assignments.map((da) => ({
              id: da.id,
              userId: da.user_id,
              userName: da.user.name,
              userRole: da.user.role,
              zoneId: da.zone_id,
              zoneName: da.zone?.name || 'Mọi khu vực (Linh hoạt)',
              onDuty: da.on_duty,
              isOnline: Boolean(da.user.last_seen_at && new Date(da.user.last_seen_at) >= onlineThreshold),
              lastSeenAt: da.user.last_seen_at,
            })),
          }
        : null,
      allStaff: staffWithOnlineStatus,
      zones,
    });
  } catch (error) {
    console.error('Lỗi GET /api/admin/shifts/current:', error);
    return NextResponse.json({ error: 'Lỗi tải ca trực hiện tại.' }, { status: 500 });
  }
}
