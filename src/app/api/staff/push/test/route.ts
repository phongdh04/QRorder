import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { notificationDispatcher } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(true);
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const results = await notificationDispatcher.dispatch([user.userId], {
      title: 'Thông báo thử nghiệm',
      body: 'Thiết bị của bạn đã kết nối Web Push thành công và sẵn sàng nhận thông báo đơn mới!',
      tag: 'test-notification-' + Date.now(),
      url: '/staff',
      priority: 'normal',
      restaurantId: user.restaurantId,
    });

    return NextResponse.json({
      success: true,
      message: 'Đã gửi thông báo thử nghiệm tới thiết bị của bạn',
      results,
    });
  } catch (error: any) {
    console.error('Lỗi gửi push thử nghiệm:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi gửi thông báo thử' },
      { status: 500 }
    );
  }
}
