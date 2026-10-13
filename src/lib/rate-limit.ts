interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const attemptsStore = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 phút
const LOCK_MS = 15 * 60 * 1000;   // Khóa 15 phút

export function checkLoginRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockRemainingSeconds?: number;
} {
  const now = Date.now();
  const record = attemptsStore.get(identifier);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
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
  if (now - record.firstAttemptAt > WINDOW_MS) {
    attemptsStore.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Kiểm tra số lần thử
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCK_MS;
    return {
      allowed: false,
      remainingAttempts: 0,
      lockRemainingSeconds: Math.ceil(LOCK_MS / 1000),
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - record.count,
  };
}

export function recordFailedLogin(identifier: string): {
  locked: boolean;
  remainingAttempts: number;
} {
  const now = Date.now();
  const record = attemptsStore.get(identifier);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    attemptsStore.set(identifier, {
      count: 1,
      firstAttemptAt: now,
    });
    return { locked: false, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCK_MS;
    return { locked: true, remainingAttempts: 0 };
  }

  return { locked: false, remainingAttempts: MAX_ATTEMPTS - record.count };
}

export function resetLoginAttempts(identifier: string) {
  attemptsStore.delete(identifier);
}
