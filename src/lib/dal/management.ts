import { prisma } from '@/lib/prisma';
import { generateTableToken } from '@/lib/utils';
import { deleteUploadedImage } from '@/lib/upload';
import { hashPassword } from '@/lib/auth';

/**
 * 1. QUẢN LÝ DANH MỤC (CATEGORIES)
 */
export async function adminCreateCategory(
  restaurantId: string,
  data: { name: string; sort_order?: number; is_active?: boolean }
) {
  const maxSort = await prisma.category.aggregate({
    where: { restaurant_id: restaurantId },
    _max: { sort_order: true },
  });

  return prisma.category.create({
    data: {
      restaurant_id: restaurantId,
      name: data.name.trim(),
      sort_order: data.sort_order ?? ((maxSort._max.sort_order ?? 0) + 1),
      is_active: data.is_active ?? true,
    },
  });
}

export async function adminUpdateCategory(
  restaurantId: string,
  categoryId: string,
  data: { name?: string; sort_order?: number; is_active?: boolean }
) {
  const cat = await prisma.category.findFirst({
    where: { id: categoryId, restaurant_id: restaurantId },
  });
  if (!cat) throw new Error('Danh mục không tồn tại.');

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(typeof data.sort_order === 'number' ? { sort_order: data.sort_order } : {}),
      ...(typeof data.is_active === 'boolean' ? { is_active: data.is_active } : {}),
    },
  });
}

export async function adminDeleteCategory(restaurantId: string, categoryId: string) {
  const cat = await prisma.category.findFirst({
    where: { id: categoryId, restaurant_id: restaurantId },
    include: { menu_items: true },
  });
  if (!cat) throw new Error('Danh mục không tồn tại.');

  // Dọn dẹp ảnh các món thuộc danh mục này
  for (const item of cat.menu_items) {
    if (item.image_url) {
      deleteUploadedImage(item.image_url);
    }
  }

  // Xóa các món và xóa danh mục
  return prisma.$transaction([
    prisma.menuItem.deleteMany({ where: { category_id: categoryId } }),
    prisma.category.delete({ where: { id: categoryId } }),
  ]);
}

export async function adminReorderCategories(restaurantId: string, categoryIds: string[]) {
  const updates = categoryIds.map((id, index) =>
    prisma.category.updateMany({
      where: { id, restaurant_id: restaurantId },
      data: { sort_order: index },
    })
  );
  return prisma.$transaction(updates);
}

/**
 * 2. QUẢN LÝ MÓN (MENU ITEMS)
 */
export async function adminCreateMenuItem(
  restaurantId: string,
  data: {
    category_id: string;
    name: string;
    price: number;
    description?: string | null;
    image_url?: string | null;
    is_available?: boolean;
    sort_order?: number;
  }
) {
  const cat = await prisma.category.findFirst({
    where: { id: data.category_id, restaurant_id: restaurantId },
  });
  if (!cat) throw new Error('Danh mục được chọn không hợp lệ.');

  const maxSort = await prisma.menuItem.aggregate({
    where: { category_id: data.category_id },
    _max: { sort_order: true },
  });

  return prisma.menuItem.create({
    data: {
      restaurant_id: restaurantId,
      category_id: data.category_id,
      name: data.name.trim(),
      price: Math.max(0, Math.round(data.price)),
      description: data.description?.trim() || null,
      image_url: data.image_url || null,
      is_available: data.is_available ?? true,
      sort_order: data.sort_order ?? ((maxSort._max.sort_order ?? 0) + 1),
    },
  });
}

export async function adminUpdateMenuItem(
  restaurantId: string,
  menuItemId: string,
  data: {
    category_id?: string;
    name?: string;
    price?: number;
    description?: string | null;
    image_url?: string | null;
    is_available?: boolean;
    sort_order?: number;
  }
) {
  const item = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurant_id: restaurantId },
  });
  if (!item) throw new Error('Món không tồn tại.');

  if (data.category_id && data.category_id !== item.category_id) {
    const cat = await prisma.category.findFirst({
      where: { id: data.category_id, restaurant_id: restaurantId },
    });
    if (!cat) throw new Error('Danh mục được chọn không hợp lệ.');
  }

  // Xóa ảnh cũ nếu đổi ảnh hoặc gỡ ảnh
  if (data.image_url !== undefined && data.image_url !== item.image_url && item.image_url) {
    deleteUploadedImage(item.image_url);
  }

  return prisma.menuItem.update({
    where: { id: menuItemId },
    data: {
      ...(data.category_id ? { category_id: data.category_id } : {}),
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(typeof data.price === 'number' ? { price: Math.max(0, Math.round(data.price)) } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.image_url !== undefined ? { image_url: data.image_url || null } : {}),
      ...(typeof data.is_available === 'boolean' ? { is_available: data.is_available } : {}),
      ...(typeof data.sort_order === 'number' ? { sort_order: data.sort_order } : {}),
    },
  });
}

export async function adminDeleteMenuItem(restaurantId: string, menuItemId: string) {
  const item = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurant_id: restaurantId },
  });
  if (!item) throw new Error('Món không tồn tại.');

  if (item.image_url) {
    deleteUploadedImage(item.image_url);
  }

  return prisma.menuItem.delete({
    where: { id: menuItemId },
  });
}

export async function adminReorderMenuItems(
  restaurantId: string,
  categoryId: string,
  itemIds: string[]
) {
  const updates = itemIds.map((id, index) =>
    prisma.menuItem.updateMany({
      where: { id, restaurant_id: restaurantId, category_id: categoryId },
      data: { sort_order: index },
    })
  );
  return prisma.$transaction(updates);
}

/**
 * 3. QUẢN LÝ BÀN & QR
 */
export async function adminCreateTable(
  restaurantId: string,
  name: string,
  extra?: {
    zone?: string;
    pos_x?: number;
    pos_y?: number;
    shape?: string;
    capacity?: number;
  }
) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('Vui lòng nhập tên bàn.');

  const existing = await prisma.table.findFirst({
    where: { restaurant_id: restaurantId, name: cleanName },
  });
  if (existing) {
    throw new Error('Tên bàn này đã tồn tại, vui lòng đặt tên khác.');
  }

  const token = generateTableToken();

  return prisma.table.create({
    data: {
      restaurant_id: restaurantId,
      name: cleanName,
      token,
      is_active: true,
      zone: extra?.zone || 'outdoor',
      pos_x: extra?.pos_x,
      pos_y: extra?.pos_y,
      shape: extra?.shape || 'square',
      capacity: extra?.capacity || 4,
    },
  });
}

export async function adminUpdateTable(
  restaurantId: string,
  tableId: string,
  data: {
    name?: string;
    is_active?: boolean;
    zone?: string;
    pos_x?: number;
    pos_y?: number;
    shape?: string;
    capacity?: number;
  }
) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurant_id: restaurantId },
  });
  if (!table) throw new Error('Bàn không tồn tại.');

  if (data.name && data.name.trim() !== table.name) {
    const existing = await prisma.table.findFirst({
      where: {
        restaurant_id: restaurantId,
        name: data.name.trim(),
        id: { not: tableId },
      },
    });
    if (existing) throw new Error('Tên bàn này đã được sử dụng.');
  }

  return prisma.table.update({
    where: { id: tableId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(typeof data.is_active === 'boolean' ? { is_active: data.is_active } : {}),
      ...(data.zone !== undefined ? { zone: data.zone } : {}),
      ...(typeof data.pos_x === 'number' ? { pos_x: data.pos_x } : {}),
      ...(typeof data.pos_y === 'number' ? { pos_y: data.pos_y } : {}),
      ...(data.shape !== undefined ? { shape: data.shape } : {}),
      ...(typeof data.capacity === 'number' ? { capacity: data.capacity } : {}),
    },
  });
}

export async function adminRegenerateTableToken(restaurantId: string, tableId: string) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurant_id: restaurantId },
  });
  if (!table) throw new Error('Bàn không tồn tại.');

  const newToken = generateTableToken();

  return prisma.table.update({
    where: { id: tableId },
    data: { token: newToken },
  });
}

/**
 * 4. QUẢN LÝ THÔNG TIN QUÁN & THEME
 */
export async function adminUpdateStoreInfo(
  restaurantId: string,
  data: {
    name?: string;
    logo_url?: string | null;
    accentColor?: string;
    theme?: Record<string, any>;
  }
) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });
  if (!restaurant) throw new Error('Quán không tồn tại.');

  const currentTheme = (restaurant.theme as Record<string, any>) || {};
  const updatedTheme = {
    ...currentTheme,
    ...(data.accentColor ? { accent: data.accentColor } : {}),
    ...(data.theme ? data.theme : {}),
  };

  return prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.logo_url !== undefined ? { logo_url: data.logo_url } : {}),
      theme: updatedTheme,
    },
  });
}

/**
 * 5. QUẢN LÝ NHÂN VIÊN (STAFF)
 */
export async function adminGetStaffList(restaurantId: string) {
  return prisma.user.findMany({
    where: {
      restaurant_id: restaurantId,
      role: 'staff',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      is_active: true,
      created_at: true,
    },
    orderBy: { created_at: 'desc' },
  });
}

export async function adminCreateStaff(
  restaurantId: string,
  data: { name: string; email: string; password: string }
) {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();

  if (!cleanName) throw new Error('Vui lòng nhập họ tên nhân viên.');
  if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Email không hợp lệ.');
  if (!data.password || data.password.length < 6) {
    throw new Error('Mật khẩu tối thiểu phải từ 6 ký tự trở lên.');
  }

  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });
  if (existing) {
    throw new Error('Email này đã được sử dụng bởi một tài khoản khác.');
  }

  const password_hash = await hashPassword(data.password);

  return prisma.user.create({
    data: {
      restaurant_id: restaurantId,
      name: cleanName,
      email: cleanEmail,
      password_hash,
      role: 'staff',
      is_active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      is_active: true,
      created_at: true,
    },
  });
}

export async function adminToggleStaffActive(
  restaurantId: string,
  userId: string,
  isActive: boolean
) {
  const user = await prisma.user.findFirst({
    where: { id: userId, restaurant_id: restaurantId, role: 'staff' },
  });
  if (!user) throw new Error('Tài khoản nhân viên không tồn tại.');

  return prisma.user.update({
    where: { id: userId },
    data: { is_active: isActive },
    select: {
      id: true,
      name: true,
      email: true,
      is_active: true,
    },
  });
}

export async function adminResetStaffPassword(
  restaurantId: string,
  userId: string,
  newPassword: string
) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Mật khẩu mới tối thiểu 6 ký tự.');
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, restaurant_id: restaurantId, role: 'staff' },
  });
  if (!user) throw new Error('Tài khoản nhân viên không tồn tại.');

  const password_hash = await hashPassword(newPassword);

  return prisma.user.update({
    where: { id: userId },
    data: { password_hash },
  });
}
