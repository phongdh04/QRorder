import { NotificationChannel, NotificationPayload, DeliveryResult } from './types';
import { InAppChannel } from './in-app-channel';
import { WebPushChannel } from './web-push-channel';
import { ZaloChannel } from './zalo-channel';

export class NotificationDispatcher {
  private channels: NotificationChannel[] = [];

  constructor() {
    this.channels = [
      new InAppChannel(),
      new WebPushChannel(),
      new ZaloChannel(),
    ];
  }

  public registerChannel(channel: NotificationChannel) {
    this.channels.push(channel);
  }

  /**
   * Phân phối thông báo tới tất cả các kênh được kích hoạt.
   * Gửi bất đồng bộ không chặn luồng chính.
   */
  async dispatch(
    recipients: string[],
    payload: NotificationPayload
  ): Promise<DeliveryResult[]> {
    if (recipients.length === 0) return [];

    const channelPromises = this.channels.map(async (channel) => {
      try {
        return await channel.send(recipients, payload);
      } catch (err: any) {
        console.error(`[NotificationDispatcher] Lỗi kênh ${channel.name}:`, err);
        return recipients.map((rId) => ({
          recipientId: rId,
          channel: channel.name,
          success: false,
          error: err?.message || 'Lỗi không xác định khi gửi kênh',
        }));
      }
    });

    const resultsByChannel = await Promise.allSettled(channelPromises);
    const flattenedResults: DeliveryResult[] = [];

    for (const res of resultsByChannel) {
      if (res.status === 'fulfilled') {
        flattenedResults.push(...res.value);
      }
    }

    return flattenedResults;
  }

  /**
   * Gửi thông báo bất đồng bộ hoàn toàn (Fire and forget - không chặn caller)
   */
  dispatchAsync(recipients: string[], payload: NotificationPayload) {
    setImmediate(async () => {
      try {
        await this.dispatch(recipients, payload);
      } catch (err) {
        console.error('[NotificationDispatcher] Lỗi gửi thông báo nền:', err);
      }
    });
  }
}

// Global singleton instance
const globalForNotifications = global as unknown as {
  notificationDispatcher?: NotificationDispatcher;
};

export const notificationDispatcher =
  globalForNotifications.notificationDispatcher || new NotificationDispatcher();

if (process.env.NODE_ENV !== 'production') {
  globalForNotifications.notificationDispatcher = notificationDispatcher;
}
