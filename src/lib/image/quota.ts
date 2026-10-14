/**
 * CẤU HÌNH HẠN MỨC ẢNH THEO GÓI DỊCH VỤ (PLANS & QUOTAS)
 * Dễ dàng tùy chỉnh theo nhu cầu kinh doanh:
 * - basic: 30 ảnh, 20MB
 * - pro: 200 ảnh, 150MB
 */

export type RestaurantPlan = 'basic' | 'pro';

export interface PlanQuotaConfig {
  name: string;
  maxImages: number;
  maxBytes: number; // Bytes
}

export const PLAN_CONFIGS: Record<RestaurantPlan, PlanQuotaConfig> = {
  basic: {
    name: 'Gói Cơ Bản (Basic)',
    maxImages: 30,
    maxBytes: 20 * 1024 * 1024, // 20 MB
  },
  pro: {
    name: 'Gói Chuyên Nghiệp (Pro)',
    maxImages: 200,
    maxBytes: 150 * 1024 * 1024, // 150 MB
  },
};

export function getPlanConfig(plan: string): PlanQuotaConfig {
  const normalized = plan.toLowerCase() as RestaurantPlan;
  return PLAN_CONFIGS[normalized] || PLAN_CONFIGS.basic;
}

export function formatBytes(bytes: number | bigint): string {
  const b = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (b === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
