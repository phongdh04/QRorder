export type NotificationPriority = 'normal' | 'urgent';

export interface NotificationPayload {
  title: string;              // Tiêu đề ngắn gọn: "Bàn 05 – Đơn mới"
  body: string;               // Nội dung tóm tắt ngắn: "2x Old Fashioned, 1x Negroni"
  tag: string;                // Tag theo request ID để gộp/thay thế thông báo
  url: string;                // Deep link: "/staff?request=ID"
  priority: NotificationPriority;
  requireInteraction?: boolean; // true cho mức khẩn cấp
  restaurantId: string;
  data?: Record<string, any>;
}

export interface DeliveryResult {
  recipientId: string;
  channel: string;
  success: boolean;
  error?: string;
  statusCode?: number;
}

export interface NotificationChannel {
  readonly name: string;
  send(recipients: string[], payload: NotificationPayload): Promise<DeliveryResult[]>;
}
