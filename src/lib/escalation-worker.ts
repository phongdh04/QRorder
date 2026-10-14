import { checkAndEscalateRequests } from './service-requests';

let intervalTimer: NodeJS.Timeout | null = null;
let isRunning = false;

export function startEscalationWorker(intervalMs: number = 5000) {
  if (intervalTimer || isRunning) {
    return;
  }

  isRunning = true;
  console.log(`[ESCALATION] Khởi động tiến trình nền kiểm tra leo thang yêu cầu (chu kỳ ${intervalMs}ms)`);

  intervalTimer = setInterval(async () => {
    try {
      const escalated = await checkAndEscalateRequests();
      if (escalated.length > 0) {
        console.log(`[ESCALATION] Đã leo thang mức khẩn cho ${escalated.length} yêu cầu quá hạn.`);
      }
    } catch (err) {
      console.error('[ESCALATION] Lỗi trong chu kỳ leo thang:', err);
    }
  }, intervalMs);

  // Không chặn process thoát khi shutdown
  if (intervalTimer.unref) {
    intervalTimer.unref();
  }
}

export function stopEscalationWorker() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
    isRunning = false;
    console.log('[ESCALATION] Đã dừng tiến trình kiểm tra leo thang');
  }
}

// Tự động khởi động khi file này được nạp trong runtime Node.js của server
if (process.env.NODE_ENV !== 'test') {
  startEscalationWorker(5000);
}
