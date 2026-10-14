export type UserRole = 'owner' | 'manager' | 'staff';

export interface SessionPayload {
  userId: string;
  restaurantId: string;
  email: string;
  name: string;
  role: UserRole;
}

export type OrderStatus = 'pending' | 'preparing' | 'served' | 'cancelled';
export type TableSessionStatus = 'open' | 'paid';
export type PaymentMethod = 'cash' | 'transfer';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  note?: string;
}

export interface MenuItemData {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  category?: {
    id: string;
    name: string;
  };
}

export interface CategoryData {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  menu_items?: MenuItemData[];
}
