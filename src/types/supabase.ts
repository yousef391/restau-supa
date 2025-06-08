export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {      restaurants: {
        Row: {
          id: string
          created_at: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          banner_url: string | null
          owner_id: string
          updated_at: string | null
          type: 'restaurant' | 'coffee'
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          owner_id: string
          updated_at?: string | null
          type?: 'restaurant' | 'coffee'
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          owner_id?: string
          updated_at?: string | null
          type?: 'restaurant' | 'coffee'
        }
      }
      categories: {
        Row: {
          id: string
          created_at: string
          name: string
          display_order: number
          restaurant_id: string
          icon: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          display_order: number
          restaurant_id: string
          icon?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          display_order?: number
          restaurant_id?: string
          icon?: string | null
        }
      }
      menu_items: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          available: boolean
          category_id: string
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          available?: boolean
          category_id: string
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          available?: boolean
          category_id?: string
          restaurant_id?: string
          updated_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          created_at: string
          status: 'received'  | 'completed' 
          total: number
          customer_name: string | null
          customer_phone: string | null
          table_number: string | null
          restaurant_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          status?: 'received' | 'preparing' | 'ready'
          total: number
          customer_name?: string | null
          customer_phone?: string | null
          table_number?: string | null
          restaurant_id: string
        }
        Update: {
          id?: string
          created_at?: string
          status?: 'received' | 'preparing' | 'ready'
          total?: number
          customer_name?: string | null
          customer_phone?: string | null
          table_number?: string | null
          restaurant_id?: string
        }
      }
      order_items: {
        Row: {
          id: string
          created_at: string
          order_id: string
          menu_item_id: string
          quantity: number
          price: number
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          order_id: string
          menu_item_id: string
          quantity: number
          price: number
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          price?: number
          notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}