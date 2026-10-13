import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initPgListener, orderEventBus, QrOrderEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token?.trim();
  if (!token) {
    return new Response('Token không hợp lệ', { status: 400 });
  }

  // 1. Kiểm tra bàn hợp lệ
  const table = await prisma.table.findFirst({
    where: { token, is_active: true },
    select: { id: true, name: true, restaurant_id: true },
  });

  if (!table) {
    return new Response('Bàn không tồn tại', { status: 404 });
  }

  // 2. Đảm bảo listener Postgres đã khởi động
  await initPgListener();

  const encoder = new TextEncoder();

  // 3. Tạo ReadableStream cho Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Gửi event khởi tạo ban đầu
      const initMessage = `event: connected\ndata: ${JSON.stringify({
        status: 'connected',
        tableName: table.name,
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initMessage));

      // Callback xử lý sự kiện của riêng bàn này
      const handleTableEvent = (event: QrOrderEvent) => {
        try {
          const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error('Lỗi enqueue SSE client bàn:', err);
        }
      };

      // Đăng ký nhận sự kiện cho table.id cụ thể
      const channelName = `table:${table.id}`;
      orderEventBus.on(channelName, handleTableEvent);

      // Heartbeat định kỳ 15 giây giữ kết nối xuyên suốt qua Proxy / NAT
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // Dọn dẹp khi client ngắt kết nối (đóng tab, rớt mạng...)
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        orderEventBus.off(channelName, handleTableEvent);
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
      'X-Accel-Buffering': 'no', // Tắt bộ đệm trên Caddy/Nginx reverse proxy
    },
  });
}
