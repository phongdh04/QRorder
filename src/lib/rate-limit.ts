interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const loginAttemptsStore = new Map<string, AttemptRecord>();
const orderAttemptsStore = new Map<string, { count: number; windowStart: number }>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 phút
const LOGIN_LOCK_MS = 15 * 60 * 1000;   // Khóa 15 phút

// Giới hạn đặt món: tối đa 3 lần gửi đơn trong 60 giây cho mỗi bàn/IP
const MAX_ORDERS_PER_WINDOW = 3;
const ORDER_WINDOW_MS = 60 * 1000;

export function checkLoginRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockRemainingSeconds?: number;
} {
  const now = Date.now();
  const record = loginAttemptsStore.get(identifier);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  // Kiểm tra nếu đang bị khóa
  if (record.lockedUntil && record.lockedUntil > now) {
    const lockRemainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockRemainingSeconds,
    };
  }

  // Đã hết thời gian cửa sổ -> reset
  if (now - record.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttemptsStore.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOGIN_LOCK_MS;
    return {
      allowed: false,
      remainingAttempts: 0,
      lockRemainingSeconds: Math.ceil(LOGIN_LOCK_MS / 1000),
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - record.count,
  };
}

export function recordFailedLogin(identifier: string): {
  locked: boolean;
  remainingAttempts: number;
} {
  const now = Date.now();
  const record = loginAttemptsStore.get(identifier);

  if (!record || now - record.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttemptsStore.set(identifier, {
      count: 1,
      firstAttemptAt: now,
    });
    return { locked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS - 1 };
  }

  record.count += 1;
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOGIN_LOCK_MS;
    return { locked: true, remainingAttempts: 0 };
  }

  return { locked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS - record.count };
}

export function resetLoginAttempts(identifier: string) {
  loginAttemptsStore.delete(identifier);
}

/**
 * Kiểm tra và ghi nhận lượt đặt đơn chống spam theo token bàn và IP
 */
export function checkAndRecordOrderRateLimit(identifier: string): {
  allowed: boolean;
  waitSeconds?: number;
} {
  const now = Date.now();
  const record = orderAttemptsStore.get(identifier);

  if (!record || now - record.windowStart > ORDER_WINDOW_MS) {
    orderAttemptsStore.set(identifier, {
      count: 1,
      windowStart: now,
    });
    return { allowed: true };
  }

  if (record.count >= MAX_ORDERS_PER_WINDOW) {
    const waitSeconds = Math.ceil((record.windowStart + ORDER_WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      waitSeconds: Math.max(1, waitSeconds),
    };
  }

  record.count += 1;
  return { allowed: true };
}

// Giới hạn gọi nhân viên / thanh toán: 1 lần / 60 giây / bàn
const serviceRequestAttemptsStore = new Map<string, number>();
const SERVICE_REQUEST_COOLDOWN_MS = 60 * 1000;

export function checkAndRecordServiceRequestRateLimit(
  tableId: string,
  type: string
): { allowed: boolean; waitSeconds?: number } {
  const key = `${tableId}:${type}`;
  const now = Date.now();
  const lastRequestedAt = serviceRequestAttemptsStore.get(key);

  if (lastRequestedAt && now - lastRequestedAt < SERVICE_REQUEST_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((lastRequestedAt + SERVICE_REQUEST_COOLDOWN_MS - now) / 1000);
    return {
      allowed: false,
      waitSeconds: Math.max(1, waitSeconds),
    };
  }

  serviceRequestAttemptsStore.set(key, now);
  return { allowed: true };
}

