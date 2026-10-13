import { prisma } from '@/lib/prisma';

export interface CustomerPublicItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface CustomerPublicCategory {
  id: string;
  name: string;
  items: CustomerPublicItem[];
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
  };
  categories: CustomerPublicCategory[];
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

  // 1. Tìm bàn theo token (chỉ lấy bàn is_active = true)
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
        },
      },
    },
  });

  if (!table || !table.restaurant) {
    return null;
  }

  const restaurantId = table.restaurant.id;

  // 2. Lấy các danh mục active theo sort_order asc
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
        orderBy: {
          sort_order: 'asc',
        },
      },
    },
  });

  // 3. Chuẩn hóa payload sạch sẽ cho Client, lọc bỏ hoàn toàn các trường nội bộ thừa
  const cleanCategories: CustomerPublicCategory[] = categories.map((cat, catIndex) => ({
    id: `cat-${catIndex}-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: cat.name,
    items: cat.menu_items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.image_url,
      isAvailable: item.is_available,
    })),
  }));

  const themeObj = (table.restaurant.theme as Record<string, any>) || {};

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
    },
    categories: cleanCategories,
  };
}

export const customerGetTableAndMenu = customerGetPublicMenuByToken;
