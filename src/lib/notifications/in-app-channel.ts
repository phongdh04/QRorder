import { NotificationChannel, NotificationPayload, DeliveryResult } from './types';
import { broadcastQrEvent } from '../events';

export class InAppChannel implements NotificationChannel {
  readonly name = 'in_app';

  async send(recipients: string[], payload: NotificationPayload): Promise<DeliveryResult[]> {
    if (recipients.length === 0) return [];

    try {
      await broadcastQrEvent({
        type: 'request_created',
        restaurantId: payload.restaurantId,
        tableId: payload.data?.tableId,
        requestId: payload.tag,
        urgent: payload.priority === 'urgent',
        data: {
          title: payload.title,
          body: payload.body,
          url: payload.url,
          recipients,
          priority: payload.priority,
          zoneId: payload.data?.zoneId,
          ...payload.data,
        },
      });

      return recipients.map((id) => ({
        recipientId: id,
        channel: this.name,
        success: true,
      }));
    } catch (err: any) {
      return recipients.map((id) => ({
        recipientId: id,
        channel: this.name,
        success: false,
        error: err?.message || 'Lỗi phát sự kiện SSE In-App',
      }));
    }
  }
}
