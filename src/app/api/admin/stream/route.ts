import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { initPgListener, orderEventBus, QrOrderEvent } from '@/lib/events';
import { checkAndEscalateRequests } from '@/lib/service-requests';

export const dynamic = 'force-dynamic';

let globalAdminEventCounter = Date.now();

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.restaurantId) {
    return new Response(JSON.stringify({ error: 'Chưa đăng nhập quản trị.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const restaurantId = user.restaurantId;

  // 2. Khởi tạo listener Postgres
  await initPgListener();

  const encoder = new TextEncoder();

  // 3. ReadableStream cho Admin SSE
  const stream = new ReadableStream({
    start(controller) {
      const initMessage = `id: ${++globalAdminEventCounter}\nevent: connected\ndata: ${JSON.stringify({
        status: 'connected',
        restaurantId,
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initMessage));

      const handleRestaurantEvent = (event: QrOrderEvent) => {
        try {
          const payload = `id: ${++globalAdminEventCounter}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error('Lỗi enqueue SSE Admin:', err);
        }
      };

      // Đăng ký nhận sự kiện cho toàn bộ quán của admin này
      const channelName = `restaurant:${restaurantId}`;
      orderEventBus.on(channelName, handleRestaurantEvent);

      // Heartbeat định kỳ 10 giây kèm kích hoạt kiểm tra escalation
      const heartbeatInterval = setInterval(async () => {
        try {
          controller.enqueue(
            encoder.encode(
              `id: ${++globalAdminEventCounter}\nevent: heartbeat\ndata: ${JSON.stringify({
                time: Date.now(),
              })}\n\n`
            )
          );
          // Chạy kiểm tra escalation tự động ngầm
          await checkAndEscalateRequests();
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 10000);

      // Dọn dẹp
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        orderEventBus.off(channelName, handleRestaurantEvent);
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
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
