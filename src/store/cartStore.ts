import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantSlug: string | null;
  addItem: (menuItem: MenuItem, quantity: number, notes?: string) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemNotes: (id: string, notes: string) => void;
  clearCart: () => void;
  setRestaurantInfo: (restaurantId: string, restaurantSlug: string) => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantSlug: null,
      
      addItem: (menuItem, quantity, notes = null) => {
        // Check if we're switching restaurants
        const { restaurantId, items } = get();
        if (restaurantId && restaurantId !== menuItem.restaurantId) {
          // Clear cart if switching restaurants
          set({ items: [], restaurantId: menuItem.restaurantId });
        }
        
        // Check if item already exists in cart
        const existingItemIndex = items.findIndex(
          item => item.menuItem.id === menuItem.id
        );
        
        if (existingItemIndex > -1) {
          // Update existing item
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += quantity;
          set({ items: updatedItems });
        } else {
          // Add new item
          const newItem: CartItem = {
            id: uuidv4(),
            menuItem,
            quantity,
            notes
          };
          set(state => ({ 
            items: [...state.items, newItem],
            restaurantId: menuItem.restaurantId
          }));
        }
      },
      
      removeItem: (id) => {
        set(state => ({
          items: state.items.filter(item => item.id !== id)
        }));
      },
      
      updateItemQuantity: (id, quantity) => {
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        }));
      },
      
      updateItemNotes: (id, notes) => {
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, notes } : item
          )
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      setRestaurantInfo: (restaurantId, restaurantSlug) => {
        set({ restaurantId, restaurantSlug });
      },
      
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.menuItem.price * item.quantity,
          0
        );
      }
    }),
    {
      name: 'cart-storage'
    }
  )
);