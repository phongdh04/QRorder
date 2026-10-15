import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebPushChannel } from '../src/lib/notifications/web-push-channel';
import { InAppChannel } from '../src/lib/notifications/in-app-channel';
import { ZaloChannel } from '../src/lib/notifications/zalo-channel';
import { NotificationDispatcher } from '../src/lib/notifications/dispatcher';
import { prisma } from '../src/lib/prisma';
import webpush from 'web-push';

describe('Part 4 - Notification Channels & Web Push System', () => {
  let restaurantId: string;
  let testUserId: string;

  beforeEach(async () => {
    let restaurant = await prisma.restaurant.findUnique({ where: { slug: 'demo-bar' } });
    if (!restaurant) {
      restaurant = await prisma.restaurant.create({
        data: { name: 'Demo Bar', slug: 'demo-bar' },
      });
    }
    restaurantId = restaurant.id;

    const user = await prisma.user.findFirst({ where: { restaurant_id: restaurantId } });
    testUserId = user!.id;
  });

  it('InAppChannel gửi thông báo qua SSE thành công', async () => {
    const channel = new InAppChannel();
    const results = await channel.send([testUserId], {
      title: 'Bàn 01 – Đơn mới',
      body: '1x Cocktail',
      tag: 'req-123',
      url: '/staff?request=req-123',
      priority: 'normal',
      restaurantId,
    });

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].channel).toBe('in_app');
  });

  it('ZaloChannel stub ghi nhận trạng thái chưa triển khai', async () => {
    const channel = new ZaloChannel();
    const results = await channel.send([testUserId], {
      title: 'Test',
      body: 'Test body',
      tag: 'tag-1',
      url: '/staff',
      priority: 'normal',
      restaurantId,
    });

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain('stub');
  });

  it('WebPushChannel: Khi Push Service trả về 410 Gone thì subscription bị vô hiệu hóa (is_active = false)', async () => {
    const testEndpoint = `https://fcm.googleapis.com/fcm/send/test-sub-410-${Date.now()}`;

    // Tạo subscription active trong DB
    const sub = await prisma.pushSubscription.create({
      data: {
        user_id: testUserId,
        restaurant_id: restaurantId,
        endpoint: testEndpoint,
        p256dh: 'BNcRdreALRF8FsE-GUn...dummy',
        auth: 'dummyAuthKey==',
        is_active: true,
      },
    });

    // Giả lập webpush.sendNotification ném lỗi 410 Gone
    const sendNotificationSpy = vi
      .spyOn(webpush, 'sendNotification')
      .mockRejectedValue({
        statusCode: 410,
        message: 'Endpoint is no longer valid',
      });

    const channel = new WebPushChannel();
    const results = await channel.send([testUserId], {
      title: 'Bàn 02 – Đơn mới',
      body: 'Test 410',
      tag: 'req-410',
      url: '/staff',
      priority: 'normal',
      restaurantId,
    });

    const failedResult = results.find((r) => r.statusCode === 410);
    expect(failedResult).toBeDefined();

    // Kiểm tra DB: subscription đã được chuyển sang is_active = false
    const updatedSub = await prisma.pushSubscription.findUnique({
      where: { id: sub.id },
    });
    expect(updatedSub?.is_active).toBe(false);

    sendNotificationSpy.mockRestore();

    // Dọn dẹp
    await prisma.pushSubscription.delete({ where: { id: sub.id } });
  });

  it('NotificationDispatcher gửi đồng thời qua các kênh', async () => {
    const dispatcher = new NotificationDispatcher();
    const results = await dispatcher.dispatch([testUserId], {
      title: 'Bàn 03 – Khẩn cấp',
      body: 'Quá hạn tiếp nhận',
      tag: 'req-urgent',
      url: '/staff?request=req-urgent',
      priority: 'urgent',
      requireInteraction: true,
      restaurantId,
    });

    expect(results.length).toBeGreaterThan(0);
    const channels = results.map((r) => r.channel);
    expect(channels).toContain('in_app');
  });
});
