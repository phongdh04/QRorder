import { prisma } from '@/lib/prisma';
import { generateTableToken } from '@/lib/utils';
import { deleteUploadedImage } from '@/lib/upload';
import { deleteImageKeysFromStorage } from '@/lib/image/cleanup';
import { hashPassword } from '@/lib/auth';
import { revalidateRestaurantMenuCache } from '@/lib/dal/customer';

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

  const created = await prisma.category.create({
    data: {
      restaurant_id: restaurantId,
      name: data.name.trim(),
      sort_order: data.sort_order ?? ((maxSort._max.sort_order ?? 0) + 1),
      is_active: data.is_active ?? true,
    },
  });

  revalidateRestaurantMenuCache(restaurantId);
  return created;
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

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(typeof data.sort_order === 'number' ? { sort_order: data.sort_order } : {}),
      ...(typeof data.is_active === 'boolean' ? { is_active: data.is_active } : {}),
    },
  });

  revalidateRestaurantMenuCache(restaurantId);
  return updated;
}

export async function adminDeleteCategory(restaurantId: string, categoryId: string) {
  const cat = await prisma.category.findFirst({
    where: { id: categoryId, restaurant_id: restaurantId },
    include: {
      menu_items: {
        include: { image: true },
      },
    },
  });
  if (!cat) throw new Error('Danh mục không tồn tại.');

  // Dọn dẹp ảnh các món thuộc danh mục này
  for (const item of cat.menu_items) {
    if (item.image) {
      await deleteImageKeysFromStorage(restaurantId, [
        item.image.key_thumb,
        item.image.key_medium,
        item.image.key_large,
      ]);
    } else if (item.image_url) {
      deleteUploadedImage(item.image_url);
    }
  }

  // Xóa các món và xóa danh mục
  const result = await prisma.$transaction([
    prisma.menuItem.deleteMany({ where: { category_id: categoryId } }),
    prisma.category.delete({ where: { id: categoryId } }),
  ]);

  revalidateRestaurantMenuCache(restaurantId);
  return result;
}

export async function adminReorderCategories(restaurantId: string, categoryIds: string[]) {
  const updates = categoryIds.map((id, index) =>
    prisma.category.updateMany({
      where: { id, restaurant_id: restaurantId },
      data: { sort_order: index },
    })
  );
  const result = await prisma.$transaction(updates);
  revalidateRestaurantMenuCache(restaurantId);
  return result;
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

  const created = await prisma.menuItem.create({
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

  revalidateRestaurantMenuCache(restaurantId);
  return created;
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
    include: { image: true },
  });
  if (!item) throw new Error('Món không tồn tại.');

  if (data.category_id && data.category_id !== item.category_id) {
    const cat = await prisma.category.findFirst({
      where: { id: data.category_id, restaurant_id: restaurantId },
    });
    if (!cat) throw new Error('Danh mục được chọn không hợp lệ.');
  }

  // Xóa ảnh cũ nếu đổi ảnh hoặc gỡ ảnh
  if (data.image_url !== undefined && data.image_url !== item.image_url) {
    if (item.image) {
      await deleteImageKeysFromStorage(restaurantId, [
        item.image.key_thumb,
        item.image.key_medium,
        item.image.key_large,
      ]);
      await prisma.menuImage.delete({ where: { id: item.image.id } }).catch(() => {});
    } else if (item.image_url) {
      deleteUploadedImage(item.image_url);
    }
  }

  const updated = await prisma.menuItem.update({
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

  revalidateRestaurantMenuCache(restaurantId);
  return updated;
}

export async function adminDeleteMenuItem(restaurantId: string, menuItemId: string) {
  const item = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurant_id: restaurantId },
    include: { image: true },
  });
  if (!item) throw new Error('Món không tồn tại.');

  if (item.image) {
    await deleteImageKeysFromStorage(restaurantId, [
      item.image.key_thumb,
      item.image.key_medium,
      item.image.key_large,
    ]);
  } else if (item.image_url) {
    deleteUploadedImage(item.image_url);
  }

  const deleted = await prisma.menuItem.delete({
    where: { id: menuItemId },
  });

  revalidateRestaurantMenuCache(restaurantId);
  return deleted;
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
  const result = await prisma.$transaction(updates);
  revalidateRestaurantMenuCache(restaurantId);
  return result;
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
    menu_display_mode?: 'photo' | 'minimal';
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

  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.logo_url !== undefined ? { logo_url: data.logo_url } : {}),
      ...(data.menu_display_mode ? { menu_display_mode: data.menu_display_mode } : {}),
      theme: updatedTheme,
    },
  });

  revalidateRestaurantMenuCache(restaurantId);
  return updated;
}

/**
 * 5. QUẢN LÝ NHÂN VIÊN (STAFF & MANAGER)
 */
export async function adminGetStaffList(restaurantId: string, allowedRoles?: string[]) {
  const roles = allowedRoles && allowedRoles.length > 0 ? allowedRoles : ['owner', 'manager', 'staff'];
  return prisma.user.findMany({
    where: {
      restaurant_id: restaurantId,
      role: { in: roles },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      is_active: true,
      last_seen_at: true,
      created_at: true,
    },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  });
}

export async function adminCreateStaff(
  restaurantId: string,
  data: { name: string; email: string; password: string; role?: 'staff' | 'manager' }
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
      role: data.role || 'staff',
      is_active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      is_active: true,
      last_seen_at: true,
      created_at: true,
    },
  });
}

export async function adminToggleStaffActive(
  restaurantId: string,
  userId: string,
  isActive: boolean,
  actorRole: string
) {
  const targetUser = await prisma.user.findFirst({
    where: { id: userId, restaurant_id: restaurantId },
  });
  if (!targetUser) throw new Error('Tài khoản nhân viên không tồn tại.');

  if (targetUser.role === 'owner') {
    throw new Error('Không thể khóa tài khoản Chủ quán.');
  }

  // Manager chỉ được khóa/mở khóa staff
  if (actorRole === 'manager' && targetUser.role !== 'staff') {
    throw new Error('Quản lý chỉ có quyền khóa hoặc mở khóa tài khoản nhân viên (staff).');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { is_active: isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      is_active: true,
      last_seen_at: true,
    },
  });
}

export async function adminUpdateStaffRole(
  restaurantId: string,
  userId: string,
  newRole: 'staff' | 'manager'
) {
  const targetUser = await prisma.user.findFirst({
    where: { id: userId, restaurant_id: restaurantId },
  });
  if (!targetUser) throw new Error('Tài khoản nhân viên không tồn tại.');

  if (targetUser.role === 'owner') {
    throw new Error('Không thể thay đổi vai trò của Chủ quán.');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
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
