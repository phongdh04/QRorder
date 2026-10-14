/**
 * HÀNG ĐỢI XỬ LÝ ẢNH GIỚI HẠN TẢI (CONCURRENCY QUEUE)
 * Giới hạn số lượng tác vụ sharp chạy đồng thời (mặc định = 2)
 * giúp tránh quá tải CPU, không làm đầy RAM và không chặn Event Loop trên các VPS nhỏ.
 */

type Task<T> = () => Promise<T>;

export class ConcurrencyQueue {
  private concurrency: number;
  private running: number = 0;
  private queue: Array<() => void> = [];

  constructor(concurrency: number = 2) {
    this.concurrency = Math.max(1, concurrency);
  }

  async run<T>(task: Task<T>): Promise<T> {
    if (this.running >= this.concurrency) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await task();
    } finally {
      this.running--;
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }

  get queueLength(): number {
    return this.queue.length;
  }

  get activeWorkers(): number {
    return this.running;
  }
}

// Singleton hàng đợi xử lý ảnh với giới hạn đồng thời = 2
export const imageProcessingQueue = new ConcurrencyQueue(2);
