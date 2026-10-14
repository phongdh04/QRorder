import { Client } from 'pg';
import { EventEmitter } from 'events';
import { prisma } from './prisma';

export interface QrOrderEvent {
  type:
    | 'order_created'
    | 'order_status_changed'
    | 'session_updated'
    | 'session_closed'
    | 'request_created'
    | 'request_claimed'
    | 'request_released'
    | 'request_done'
    | 'request_reassigned'
    | 'request_escalated'
    | 'shift_changed'
    | 'presence_changed';
  restaurantId: string;
  tableId?: string;
  sessionId?: string;
  orderId?: string;
  requestId?: string;
  status?: string;
  total?: number;
  urgent?: boolean;
  data?: any;
  timestamp: number;
}

// Global EventEmitter trong Node.js process
class OrderEventBus extends EventEmitter {}

const globalForEvents = global as unknown as {
  orderEventBus?: OrderEventBus;
  pgListenerClient?: Client;
  isListening?: boolean;
};

export const orderEventBus = globalForEvents.orderEventBus || new OrderEventBus();
if (process.env.NODE_ENV !== 'production') {
  globalForEvents.orderEventBus = orderEventBus;
}

// Khởi tạo kết nối LISTEN tới PostgreSQL
export async function initPgListener(): Promise<void> {
  if (globalForEvents.isListening) {
    return;
  }

  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://qrorder:qrorder_secret@db:5432/qrorder_db?schema=public';

  const client = new Client({ connectionString });

  try {
    await client.connect();
    await client.query('LISTEN qrorder_events');
    globalForEvents.pgListenerClient = client;
    globalForEvents.isListening = true;

    console.log('✓ [SSE Realtime] Đã kết nối Postgres LISTEN channel "qrorder_events"');

    client.on('notification', (msg) => {
      if (msg.channel === 'qrorder_events' && msg.payload) {
        try {
          const event: QrOrderEvent = JSON.parse(msg.payload);
          // Phát sự kiện tới các SSE client
          orderEventBus.emit('event', event);
          orderEventBus.emit(`restaurant:${event.restaurantId}`, event);
          if (event.tableId) {
            orderEventBus.emit(`table:${event.tableId}`, event);
          }
        } catch (err) {
          console.error('Lỗi parse payload notification:', err);
        }
      }
    });

    client.on('error', async (err) => {
      console.error('Lỗi Postgres listener client:', err);
      globalForEvents.isListening = false;
      try {
        await client.end();
      } catch {}
      // Thử kết nối lại sau 5s
      setTimeout(initPgListener, 5000);
    });
  } catch (err) {
    console.error('Không thể kết nối LISTEN tới Postgres:', err);
    globalForEvents.isListening = false;
    setTimeout(initPgListener, 5000);
  }
}

// Hàm gửi sự kiện qua PostgreSQL NOTIFY
export async function broadcastQrEvent(
  event: Omit<QrOrderEvent, 'timestamp'>
): Promise<void> {
  const fullEvent: QrOrderEvent = {
    ...event,
    timestamp: Date.now(),
  };

  const payloadStr = JSON.stringify(fullEvent).replace(/'/g, "''");

  try {
    // Gửi NOTIFY trực tiếp qua Prisma
    await prisma.$executeRawUnsafe(`NOTIFY qrorder_events, '${payloadStr}'`);
  } catch (err) {
    console.error('Lỗi khi broadcast pg_notify:', err);
    // Fallback: emit trực tiếp trong process nếu DB notify lỗi
    orderEventBus.emit('event', fullEvent);
    orderEventBus.emit(`restaurant:${fullEvent.restaurantId}`, fullEvent);
    orderEventBus.emit(`table:${fullEvent.tableId}`, fullEvent);
  }
}
