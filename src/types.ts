export interface Restaurant {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  opening_hours: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  categories?: { name: string };
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  server_id: string | null;
  table_number: number;
  status: 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total: number;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  items?: { id: string; name: string; quantity: number; price: number }[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
} 