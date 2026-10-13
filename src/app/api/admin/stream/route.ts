import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { initPgListener, orderEventBus, QrOrderEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

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
      const initMessage = `event: connected\ndata: ${JSON.stringify({
        status: 'connected',
        restaurantId,
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initMessage));

      const handleRestaurantEvent = (event: QrOrderEvent) => {
        try {
          const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error('Lỗi enqueue SSE Admin:', err);
        }
      };

      // Đăng ký nhận sự kiện cho toàn bộ quán của admin này
      const channelName = `restaurant:${restaurantId}`;
      orderEventBus.on(channelName, handleRestaurantEvent);

      // Heartbeat định kỳ 15 giây
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

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
