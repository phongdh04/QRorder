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

export interface QuotaStats {
  plan: string;
  planName: string;
  usedImages: number;
  maxImages: number;
  usedBytes: number;
  maxBytes: number;
  percentImages: number;
  percentBytes: number;
  displayMode: string;
}

export async function getRestaurantQuotaStats(restaurantId: string): Promise<QuotaStats> {
  const { prisma } = await import('@/lib/prisma');

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      plan: true,
      image_quota_count: true,
      image_quota_bytes: true,
      menu_display_mode: true,
    },
  });

  const stats = await prisma.menuImage.aggregate({
    where: { restaurant_id: restaurantId },
    _count: { id: true },
    _sum: { size_bytes_total: true },
  });

  const plan = (restaurant?.plan || 'basic') as RestaurantPlan;
  const planConfig = getPlanConfig(plan);

  const maxImages = restaurant?.image_quota_count ?? planConfig.maxImages;
  const maxBytes = restaurant?.image_quota_bytes
    ? Number(restaurant.image_quota_bytes)
    : planConfig.maxBytes;

  const usedImages = stats._count.id || 0;
  const usedBytes = stats._sum.size_bytes_total || 0;

  const percentImages = Math.min(100, Math.round((usedImages / Math.max(1, maxImages)) * 100));
  const percentBytes = Math.min(100, Math.round((usedBytes / Math.max(1, maxBytes)) * 100));

  return {
    plan,
    planName: planConfig.name,
    usedImages,
    maxImages,
    usedBytes,
    maxBytes,
    percentImages,
    percentBytes,
    displayMode: restaurant?.menu_display_mode || 'photo',
  };
}
