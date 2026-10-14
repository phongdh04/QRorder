import { NotificationChannel, NotificationPayload, DeliveryResult } from './types';

/**
 * ZaloChannel (STUB):
 * Kênh gửi thông báo qua Zalo Official Account (ZNS - Zalo Notification Service / Zalo OA).
 *
 * Hướng dẫn triển khai trong tương lai:
 * 1. Đăng ký Zalo Official Account và kích hoạt ứng dụng trên Zalo for Developers (https://developers.zalo.me).
 * 2. Cấu hình biến môi trường:
 *    - ZALO_OA_APP_ID: ID ứng dụng Zalo
 *    - ZALO_OA_SECRET_KEY: Khóa bí mật ứng dụng
 *    - ZALO_OA_ACCESS_TOKEN: Token truy cập API Zalo OA (hoặc refresh token tự động gia hạn)
 *    - ZALO_TEMPLATE_ID_NEW_REQUEST: Template ID tin nhắn thông báo đơn mới đã được Zalo duyệt
 *    - ZALO_TEMPLATE_ID_URGENT: Template ID tin nhắn khẩn cấp leo thang
 * 3. Ánh xạ User: Cần thêm trường `phone_number` hoặc `zalo_user_id` vào bảng `User`.
 * 4. Gọi HTTP POST tới:
 *    - API ZNS: https://business.openapi.zalo.me/message/template
 *    - Hoặc Zalo OA Chat: https://openapi.zalo.me/v3.0/oa/message/cs
 * 5. Xử lý phản hồi mã lỗi Zalo (ví dụ: -124 Access token hết hạn, -119 quota hết, v.v.).
 */
export class ZaloChannel implements NotificationChannel {
  readonly name = 'zalo';

  async send(recipients: string[], payload: NotificationPayload): Promise<DeliveryResult[]> {
    // TODO: Triển khai gọi Zalo Open API khi doanh nghiệp đăng ký OA
    console.log(
      `[ZaloChannel (STUB)] Bỏ qua gửi thông báo cho ${recipients.length} người nhận: "${payload.title}". Kênh Zalo chưa kích hoạt.`
    );

    return recipients.map((id) => ({
      recipientId: id,
      channel: this.name,
      success: false,
      error: 'ZaloChannel is a stub and not yet configured with Zalo OA credentials.',
    }));
  }
}
