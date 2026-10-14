import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { initPgListener, orderEventBus, QrOrderEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

let globalEventCounter = Date.now();

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(true);
  if (!user?.restaurantId) {
    return new Response(JSON.stringify({ error: 'Chưa đăng nhập nhân viên.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const restaurantId = user.restaurantId;
  const userId = user.userId;
  const userRole = user.role;

  // Lấy phân công khu vực của nhân viên trong ca hiện tại
  const activeShift = await prisma.shift.findFirst({
    where: { restaurant_id: restaurantId, ended_at: null },
    include: {
      duty_assignments: {
        where: { user_id: userId, on_duty: true },
      },
    },
  });

  const isManagerOrOwner = userRole === 'manager' || userRole === 'owner';
  const isFlexible = activeShift?.duty_assignments.some((da) => da.zone_id === null);
  const assignedZoneIds = new Set(
    activeShift?.duty_assignments.map((da) => da.zone_id).filter(Boolean) as string[]
  );

  await initPgListener();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Tin nhắn kết nối ban đầu
      const initMessage = `id: ${++globalEventCounter}\nevent: connected\ndata: ${JSON.stringify({
        status: 'connected',
        restaurantId,
        userId,
        role: userRole,
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initMessage));

      const handleEvent = (event: QrOrderEvent) => {
        try {
          // Lọc theo quán
          if (event.restaurantId !== restaurantId) return;

          // Lọc theo vai trò và phân khu:
          // Manager/Owner nhận mọi sự kiện
          if (!isManagerOrOwner) {
            // Nếu sự kiện có chỉ định danh sách người nhận đích danh (từ InAppChannel)
            if (event.data?.recipients && Array.isArray(event.data.recipients)) {
              if (!event.data.recipients.includes(userId)) {
                return;
              }
            }

            // Sự kiện liên quan trực tiếp đến nhân viên này (được phân công, hoàn thành, v.v.)
            const isMyClaim = event.data?.claimedBy === userId || event.data?.targetUserId === userId;

            // Sự kiện toàn hệ thống (đổi ca làm việc, trạng thái hoạt động)
            const isSystemEvent =
              event.type === 'shift_changed' ||
              event.type === 'presence_changed';

            // Phân khu của bàn
            const eventZoneId = event.data?.zoneId;
            const isMyZone = isFlexible || (eventZoneId ? assignedZoneIds.has(eventZoneId) : assignedZoneIds.size === 0);

            if (!isMyClaim && !isSystemEvent && !isMyZone) {
              // Bỏ qua sự kiện thuộc khu khác
              return;
            }
          }

          const payload = `id: ${++globalEventCounter}\nevent: ${event.type}\ndata: ${JSON.stringify(
            event
          )}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error('[SSE Staff] Lỗi enqueue sự kiện:', err);
        }
      };

      const channelName = `restaurant:${restaurantId}`;
      orderEventBus.on(channelName, handleEvent);

      // Heartbeat định kỳ 15 giây
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: heartbeat\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        orderEventBus.off(channelName, handleEvent);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
