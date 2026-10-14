'use client';

import { useState, useEffect, useCallback } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useStaffPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // 1. Kiểm tra hỗ trợ và đăng ký Service Worker cho khu /staff
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission);

    // Đăng ký Service Worker
    navigator.serviceWorker
      .register('/sw.js', { scope: '/staff' })
      .then(async (reg) => {
        setSwRegistration(reg);

        // Kiểm tra xem đã có subscription nào chưa
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(Boolean(sub));
      })
      .catch((err) => {
        console.warn('[PWA] Lỗi đăng ký service worker:', err);
      });

    // Lấy VAPID public key từ server
    fetch('/api/staff/push/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.vapidPublicKey) {
          setVapidKey(data.vapidPublicKey);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Yêu cầu quyền và đăng ký nhận thông báo (chỉ gọi sau tương tác người dùng)
  const requestPermissionAndSubscribe = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!isSupported) {
      return { success: false, error: 'Thiết bị hoặc trình duyệt không hỗ trợ Web Push' };
    }

    setIsLoading(true);

    try {
      // Yêu cầu quyền thông báo
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setIsLoading(false);
        return {
          success: false,
          error:
            perm === 'denied'
              ? 'Quyền thông báo đã bị chặn trong cài đặt trình duyệt'
              : 'Chưa cấp quyền nhận thông báo',
        };
      }

      // Lấy registration
      let reg = swRegistration;
      if (!reg) {
        reg = await navigator.serviceWorker.ready;
        setSwRegistration(reg);
      }

      // Lấy VAPID Key nếu chưa có
      let key = vapidKey;
      if (!key) {
        const res = await fetch('/api/staff/push/status');
        const data = await res.json();
        if (data.vapidPublicKey) {
          key = data.vapidPublicKey;
          setVapidKey(key);
        }
      }

      if (!key) {
        setIsLoading(false);
        return { success: false, error: 'Chưa cấu hình khóa VAPID trên máy chủ' };
      }

      // Hủy subscription cũ nếu có
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      // Đăng ký subscription mới qua PushManager
      const applicationServerKey = urlBase64ToUint8Array(key);
      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subJson = newSub.toJSON();

      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        setIsLoading(false);
        return { success: false, error: 'Không thể tạo đầy đủ cặp khóa subscription' };
      }

      // Gửi subscription lên server để lưu vào database
      const saveRes = await fetch('/api/staff/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
          userAgent: navigator.userAgent,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        setIsLoading(false);
        return { success: false, error: saveData.error || 'Lỗi lưu subscription lên server' };
      }

      setIsSubscribed(true);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Lỗi khi kích hoạt push:', err);
      setIsLoading(false);
      return { success: false, error: err?.message || 'Lỗi không xác định khi đăng ký push' };
    }
  }, [isSupported, swRegistration, vapidKey]);

  // 3. Hủy nhận thông báo
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!swRegistration) return false;
    setIsLoading(true);

    try {
      const sub = await swRegistration.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch('/api/staff/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
      }
      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch {
      setIsLoading(false);
      return false;
    }
  }, [swRegistration]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    vapidKey,
    requestPermissionAndSubscribe,
    unsubscribe,
  };
}
