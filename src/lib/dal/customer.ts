import { prisma } from '@/lib/prisma';
import { getStorageAdapter } from '@/lib/storage';

export interface CustomerPublicImage {
  thumbUrl: string;
  mediumUrl: string;
  largeUrl: string;
  blurDataUrl: string;
  width: number;
  height: number;
}

export interface CustomerPublicItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  image?: CustomerPublicImage | null;
  isAvailable: boolean;
}

export interface CustomerPublicCategory {
  id: string;
  name: string;
  items: CustomerPublicItem[];
}

export interface CustomerOrderItemData {
  id: string;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  note?: string | null;
}

export interface CustomerOrderData {
  id: string;
  status: string;
  note?: string | null;
  cancel_reason?: string | null;
  created_at: string;
  order_items: CustomerOrderItemData[];
}

export interface CustomerActiveSessionData {
  id: string;
  status: string;
  total: number;
  orders: CustomerOrderData[];
}

export interface CustomerPublicMenuData {
  table: {
    name: string;
    token: string;
  };
  restaurant: {
    name: string;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
    theme?: Record<string, any> | null;
    menuDisplayMode: 'photo' | 'minimal';
  };
  activeSession?: CustomerActiveSessionData | null;
  categories: CustomerPublicCategory[];
}

import { unstable_cache, revalidateTag } from 'next/cache';

/**
 * Xóa cache thực đơn của một quán khi có cập nhật (món, giá, hết hàng, ảnh, danh mục...)
 */
export function revalidateRestaurantMenuCache(restaurantId: string): void {
  try {
    revalidateTag(`restaurant-menu-${restaurantId}`);
  } catch {
    // Cho phép chạy an toàn bên ngoài Next.js request context (vd: CLI / Test)
  }
}

/**
 * Cache danh mục & món ăn giao diện khách:
 * - Cache theo tag `restaurant-menu-{restaurantId}`
 * - Tối đa 30s revalidate tự động
 * - Lập tức làm mới khi quán sửa món
 */
export async function getCachedRestaurantCategories(
  restaurantId: string
): Promise<CustomerPublicCategory[]> {
  const fetchDirect = async () => {
    const categories = await prisma.category.findMany({
      where: {
        restaurant_id: restaurantId,
        is_active: true,
      },
      orderBy: {
        sort_order: 'asc',
      },
      include: {
        menu_items: {
          where: {
            restaurant_id: restaurantId,
          },
          include: {
            image: true,
          },
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
    });

    const storage = getStorageAdapter();

    return categories.map((cat, catIndex) => ({
      id: `cat-${catIndex}-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: cat.name,
      items: cat.menu_items.map((item) => {
        let imageObj: CustomerPublicImage | null = null;
        if (item.image) {
          imageObj = {
            thumbUrl: storage.getPublicUrl(item.image.key_thumb),
            mediumUrl: storage.getPublicUrl(item.image.key_medium),
            largeUrl: storage.getPublicUrl(item.image.key_large),
            blurDataUrl: item.image.blur_data_url,
            width: item.image.width,
            height: item.image.height,
          };
        }

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: imageObj ? imageObj.mediumUrl : item.image_url,
          image: imageObj,
          isAvailable: item.is_available,
        };
      }),
    }));
  };

  try {
    const fetcher = unstable_cache(
      fetchDirect,
      [`customer-menu-cache-${restaurantId}`],
      {
        revalidate: 30, // 30s
        tags: [`restaurant-menu-${restaurantId}`],
      }
    );
    return await fetcher();
  } catch (err: any) {
    if (err?.message?.includes('incrementalCache')) {
      return await fetchDirect();
    }
    throw err;
  }
}

/**
 * Lấy dữ liệu công khai cho khách hàng quét mã QR tại bàn.
 * Bảo mật: Chỉ lấy bàn is_active, không lộ ID nội bộ hoặc dữ liệu thừa.
 */
export async function customerGetPublicMenuByToken(
  token: string
): Promise<CustomerPublicMenuData | null> {
  if (!token || typeof token !== 'string' || token.trim().length < 8) {
    return null;
  }

  // 1. Tìm bàn theo token (chỉ lấy bàn is_active = true) cùng phiên mở hiện tại
  const table = await prisma.table.findFirst({
    where: {
      token: token.trim(),
      is_active: true,
    },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          logo_url: true,
          theme: true,
          menu_display_mode: true,
        },
      },
      table_sessions: {
        where: { status: 'open' },
        orderBy: { opened_at: 'desc' },
        take: 1,
        include: {
          orders: {
            orderBy: { created_at: 'desc' },
            include: {
              order_items: true,
            },
          },
        },
      },
    },
  });

  if (!table || !table.restaurant) {
    return null;
  }

  const restaurantId = table.restaurant.id;

  // 2. Lấy danh mục & món đã cache theo tag của quán
  const cleanCategories = await getCachedRestaurantCategories(restaurantId);

  const themeObj = (table.restaurant.theme as Record<string, any>) || {};
  const activeSession = table.table_sessions?.[0] || null;

  return {
    table: {
      name: table.name,
      token: table.token,
    },
    restaurant: {
      name: table.restaurant.name,
      logoUrl: table.restaurant.logo_url,
      coverImageUrl: themeObj.cover_image_url || null,
      theme: themeObj,
      menuDisplayMode:
        (table.restaurant.menu_display_mode as 'photo' | 'minimal') || 'photo',
    },
    activeSession: activeSession
      ? {
          id: activeSession.id,
          status: activeSession.status,
          total: activeSession.total,
          orders: activeSession.orders.map((o) => ({
            id: o.id,
            status: o.status,
            note: o.note,
            cancel_reason: o.cancel_reason,
            created_at: o.created_at.toISOString(),
            order_items: o.order_items.map((i) => ({
              id: i.id,
              name_snapshot: i.name_snapshot,
              price_snapshot: i.price_snapshot,
              quantity: i.quantity,
              note: i.note,
            })),
          })),
        }
      : null,
    categories: cleanCategories,
  };
}

export const customerGetTableAndMenu = customerGetPublicMenuByToken;
