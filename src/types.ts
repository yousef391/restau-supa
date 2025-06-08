export interface Restaurant {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  description: string | null;
  banner_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  opening_hours: string | null;
  ownerId: string;
  created_at: string;
  updated_at: string;
  type: string | 'restaurant' | 'coffee';
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
  icon_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  server_id: string | null;
  table_number: number;
  status: 'received' | 'completed' ;
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

export interface StaffMember {
  id: string;
  email: string;
  restaurant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantType {
  type: string | 'restaurant' | 'coffee';
}