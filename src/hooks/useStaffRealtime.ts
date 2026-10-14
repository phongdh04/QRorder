'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export function useStaffRealtime(
  onEvent: (event: any) => void,
  onSyncNeeded: () => void
) {
  const [status, setStatus] = useState<ConnectionStatus>('reconnecting');
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const lastHeartbeatRef = useRef<number>(Date.now());

  // 1. Kết nối SSE
  const connectSSE = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setStatus((prev) => (prev === 'connected' ? 'reconnecting' : prev));

    try {
      const es = new EventSource('/api/staff/stream');
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        setStatus('connected');
        reconnectAttemptRef.current = 0;
        lastHeartbeatRef.current = Date.now();
        onSyncNeeded(); // Tải lại dữ liệu ngay khi vừa kết nối thành công
      });

      es.addEventListener('heartbeat', () => {
        lastHeartbeatRef.current = Date.now();
        setStatus('connected');
      });

      // Lắng nghe các sự kiện nghiệp vụ
      const eventTypes = [
        'request_created',
        'request_claimed',
        'request_released',
        'request_done',
        'request_reassigned',
        'request_escalated',
        'shift_changed',
        'presence_changed',
      ];

      eventTypes.forEach((eventType) => {
        es.addEventListener(eventType, (e: MessageEvent) => {
          lastHeartbeatRef.current = Date.now();
          try {
            const data = JSON.parse(e.data);
            onEvent(data);
          } catch (err) {
            console.error('Lỗi parse sự kiện SSE:', err);
          }
        });
      });

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        setStatus('disconnected');

        // Backoff reconnect: 1s, 2s, 4s, tối đa 8s
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 8000);
        reconnectAttemptRef.current += 1;

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          setStatus('reconnecting');
          connectSSE();
        }, delay);
      };
    } catch {
      setStatus('disconnected');
    }
  }, [onEvent, onSyncNeeded]);

  // 2. Khởi tạo kết nối ban đầu
  useEffect(() => {
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectSSE]);

  // 3. Heartbeat định kỳ 20 giây gửi lên server (cập nhật users.last_seen_at)
  useEffect(() => {
    const heartbeatTimer = setInterval(() => {
      fetch('/api/staff/heartbeat', { method: 'POST' }).catch(() => {});
    }, 20000);

    return () => clearInterval(heartbeatTimer);
  }, []);

  // 4. Polling dự phòng mỗi 10 giây nếu mất kết nối hoặc SSE im lặng quá 35s
  useEffect(() => {
    const fallbackPollTimer = setInterval(() => {
      const isSilent = Date.now() - lastHeartbeatRef.current > 35000;
      if (status !== 'connected' || isSilent) {
        onSyncNeeded();
        if (isSilent && eventSourceRef.current) {
          // SSE bị treo: ngắt và kết nối lại
          console.warn('[SSE Staff] Phát hiện im lặng quá 35s, kết nối lại...');
          connectSSE();
        }
      }
    }, 10000);

    return () => clearInterval(fallbackPollTimer);
  }, [status, onSyncNeeded, connectSSE]);

  // 5. Khi trang quay lại foreground (tab visibility): Tải lại toàn bộ dữ liệu để không sót
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        onSyncNeeded();
        // Nếu kết nối đang đứt, kết nối lại ngay
        if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
          connectSSE();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [onSyncNeeded, connectSSE]);

  return {
    connectionStatus: status,
    isConnected: status === 'connected',
    isReconnecting: status === 'reconnecting',
    isDisconnected: status === 'disconnected',
    reconnect: connectSSE,
  };
}
