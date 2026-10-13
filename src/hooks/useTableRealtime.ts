'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export function useTableRealtime(
  tableToken: string,
  onEvent: (event: any) => void,
  onReconnect: () => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hadPreviousConnection = useRef(false);

  const connect = useCallback(() => {
    if (!tableToken || typeof window === 'undefined') return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sseUrl = `/api/t/${encodeURIComponent(tableToken)}/stream`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setIsReconnecting(false);

      // Nếu đây là lần kết nối lại sau khi rớt mạng -> fetch lại dữ liệu mới nhất
      if (hadPreviousConnection.current) {
        onReconnect();
      }
      hadPreviousConnection.current = true;
    };

    // Lắng nghe các loại sự kiện từ server
    const eventTypes = [
      'connected',
      'order_created',
      'order_status_changed',
      'session_updated',
      'session_closed',
    ];

    eventTypes.forEach((type) => {
      es.addEventListener(type, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          onEvent({ type, ...data });
        } catch (err) {
          console.warn('Lỗi parse sự kiện SSE:', err);
        }
      });
    });

    es.onerror = () => {
      setIsConnected(false);
      setIsReconnecting(true);
      es.close();
      eventSourceRef.current = null;

      // Thử kết nối lại sau 3.5 giây
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3500);
    };
  }, [tableToken, onEvent, onReconnect]);

  useEffect(() => {
    connect();

    // Hỗ trợ online/offline event của trình duyệt điện thoại
    const handleOnline = () => {
      connect();
      onReconnect();
    };
    const handleOffline = () => {
      setIsConnected(false);
      setIsReconnecting(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connect, onReconnect]);

  return { isConnected, isReconnecting };
}
