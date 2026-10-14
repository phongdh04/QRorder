// Service Worker dành riêng cho Hệ Thống Nhân Viên (QR Order Staff PWA)
const CACHE_NAME = 'qrorder-staff-v1.0.0';

// Chỉ cache tài nguyên tĩnh cơ bản (App Shell, Icons, Manifest)
// TUYỆT ĐỐI KHÔNG cache API, dữ liệu phiên hay dữ liệu nhạy cảm
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/badge-72.png',
];

// 1. Cài đặt Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Không chờ đợi, kích hoạt ngay khi cài đặt xong
  self.skipWaiting();
});

// 2. Kích hoạt và dọn dẹp các cache phiên bản cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name.startsWith('qrorder-staff-'))
          .map((name) => {
            console.log('[SW] Xóa cache phiên bản cũ:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Xử lý yêu cầu mạng (Fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // TUYỆT ĐỐI KHÔNG cache bất kỳ API endpoint hay phương thức POST/PUT/DELETE nào
  if (url.pathname.startsWith('/api/') || request.method !== 'GET') {
    return;
  }

  // Đối với icon và manifest: Ưu tiên cache trước, mạng sau
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
        );
      })
    );
    return;
  }

  // Các trang giao diện khác: Network-first để luôn có dữ liệu mới nhất
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// 4. Xử lý sự kiện Thông báo đẩy (Web Push)
self.addEventListener('push', (event) => {
  let data = {
    title: 'QR Order • Việc mới',
    body: 'Có yêu cầu mới cần xử lý',
    tag: 'staff-generic',
    url: '/staff',
    priority: 'normal',
    requireInteraction: false,
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const isUrgent = data.priority === 'urgent';

  const notificationOptions = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag, // Gộp hoặc thay thế thông báo cùng mã request
    renotify: true,
    requireInteraction: isUrgent, // Bắt buộc người dùng tương tác nếu là mức khẩn
    vibrate: isUrgent ? [200, 100, 200, 100, 400] : [100, 50, 100],
    data: {
      url: data.url || '/staff',
      tag: data.tag,
    },
    actions: [
      {
        action: 'view',
        title: 'Xem ngay',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// 5. Xử lý khi nhân viên bấm vào thông báo (Notification Click)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/staff';
  const fullTargetUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Tìm xem có cửa sổ /staff nào đang mở không
      for (const client of clientList) {
        if (client.url.includes('/staff') && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(fullTargetUrl);
          }
          return client.focus();
        }
      }
      // Nếu chưa có cửa sổ nào đang mở, mở cửa sổ mới
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullTargetUrl);
      }
    })
  );
});

// 6. Cơ chế cập nhật SW an toàn
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
