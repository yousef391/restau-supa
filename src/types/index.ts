export type OrderStatus = 'received' | 'preparing' | 'ready';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  ownerId: string;
  updatedAt: string | null;
}

export interface Category {
  id: string;
  name: string;
  display_order: number;
  restaurant_id: string;
  icon_id: string | null;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  category_id: string;
  restaurant_id: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes: string | null;
}

export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  customer_name: string | null;
  customer_phone: string | null;
  table_number: string | null;
  restaurant_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}