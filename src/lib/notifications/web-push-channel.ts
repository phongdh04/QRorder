import webpush from 'web-push';
import { NotificationChannel, NotificationPayload, DeliveryResult } from './types';
import { prisma } from '../prisma';

export class WebPushChannel implements NotificationChannel {
  readonly name = 'web_push';
  private vapidConfigured = false;

  constructor() {
    this.configureVapid();
  }

  private configureVapid() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@demobar.vn';

    if (publicKey && privateKey) {
      try {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        this.vapidConfigured = true;
      } catch (err) {
        console.warn('[WebPush] Lỗi thiết lập cấu hình VAPID:', err);
      }
    }
  }

  async send(recipients: string[], payload: NotificationPayload): Promise<DeliveryResult[]> {
    if (recipients.length === 0) return [];

    if (!this.vapidConfigured) {
      this.configureVapid();
      if (!this.vapidConfigured) {
        return recipients.map((id) => ({
          recipientId: id,
          channel: this.name,
          success: false,
          error: 'Chưa cấu hình biến môi trường VAPID_PUBLIC_KEY hoặc VAPID_PRIVATE_KEY',
        }));
      }
    }

    // 1. Lấy tất cả subscription active của các người nhận thuộc đúng nhà hàng
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        user_id: { in: recipients },
        restaurant_id: payload.restaurantId,
        is_active: true,
      },
    });

    if (subscriptions.length === 0) {
      return recipients.map((id) => ({
        recipientId: id,
        channel: this.name,
        success: true,
        error: 'Người dùng chưa kích hoạt thông báo Web Push trên thiết bị',
      }));
    }

    // 2. Chuẩn bị payload push tối giản, KHÔNG chứa thông tin nhạy cảm
    const pushPayloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      tag: payload.tag,
      url: payload.url,
      priority: payload.priority,
      requireInteraction: payload.priority === 'urgent' || payload.requireInteraction === true,
      timestamp: Date.now(),
    });

    const deliveryResults: DeliveryResult[] = [];

    // 3. Gửi tới từng subscription với cơ chế retry và vô hiệu hóa khi 404/410
    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      let attempt = 0;
      const maxRetries = 2;
      let lastError: any = null;
      let success = false;

      while (attempt <= maxRetries && !success) {
        try {
          await webpush.sendNotification(pushSubscription, pushPayloadString, {
            urgency: payload.priority === 'urgent' ? 'high' : 'normal',
            TTL: 60, // Hết hạn sau 60 giây nếu thiết bị offline
          });

          success = true;
          // Cập nhật lần thấy cuối cùng
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { last_seen_at: new Date() },
          });

          deliveryResults.push({
            recipientId: sub.user_id,
            channel: this.name,
            success: true,
          });
        } catch (err: any) {
          lastError = err;
          const statusCode = err?.statusCode;

          // Nếu thiết bị đã hủy hoặc subscription hết hạn (404 Not Found hoặc 410 Gone)
          if (statusCode === 404 || statusCode === 410) {
            console.log(`[WebPush] Subscription ${sub.id} đã hết hạn (${statusCode}). Đánh dấu is_active = false.`);
            await prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { is_active: false },
            });
            deliveryResults.push({
              recipientId: sub.user_id,
              channel: this.name,
              success: false,
              statusCode,
              error: 'Subscription expired or unregistered',
            });
            break;
          }

          // Lỗi tạm thời: Thử lại tối đa 2 lần với backoff
          attempt++;
          if (attempt <= maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 300));
          }
        }
      }

      if (!success && lastError && lastError?.statusCode !== 404 && lastError?.statusCode !== 410) {
        deliveryResults.push({
          recipientId: sub.user_id,
          channel: this.name,
          success: false,
          statusCode: lastError?.statusCode,
          error: lastError?.message || 'Lỗi gửi Web Push sau 2 lần thử lại',
        });
      }
    });

    await Promise.allSettled(sendPromises);
    return deliveryResults;
  }
}
