import { useEffect, useState } from 'react';
import { supabase, getRestaurantByOwner, getOrders, updateOrderStatus, subscribeToOrders } from '../../lib/supabase';
import type { Order } from '../../types';
import { Clock, CheckCircle, Loader2, Search, Eye, FilterX, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function OrderManagement() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user found');
          setError('Please sign in to access this page');
          setLoading(false);
          return;
        }

        console.log('Fetching data for user:', user.id);
        
        // Fetch restaurant data
        const { data: restaurantData, error: restaurantError } = await getRestaurantByOwner(user.id);
        if (restaurantError) {
          console.error('Error fetching restaurant:', restaurantError);
          throw restaurantError;
        }
        console.log('Restaurant data:', restaurantData);
        setRestaurant(restaurantData);

        // Fetch orders
        const { data: ordersData, error: ordersError } = await getOrders(restaurantData.id);
        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          throw ordersError;
        }
        console.log('Orders data:', ordersData);
        setOrders(ordersData || []);

        setLoading(false);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription for orders
    if (restaurant?.id) {
      const ordersSubscription = subscribeToOrders(restaurant.id, (payload) => {
        console.log('Orders change:', payload);
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(order => 
            order.id === payload.new.id ? payload.new : order
          ));
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(order => order.id !== payload.old.id));
        }
      });

      return () => {
        ordersSubscription.unsubscribe();
      };
    }
  }, [restaurant?.id]);

  const handleStatusUpdate = async (orderId: string, newStatus: 'received' | 'preparing' | 'ready') => {
    try {
      const { data, error } = await updateOrderStatus(orderId, newStatus);
      if (error) throw error;
      console.log('Order status updated:', data);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!restaurant) {
    return <div>No restaurant found</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium">Order #{order.id}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                order.status === 'ready' ? 'bg-green-100 text-green-800' :
                order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Items:</h4>
              <ul className="space-y-1">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.menu_items.name} x {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center">
              <div className="font-medium">
                Total: ${order.total.toFixed(2)}
              </div>
              <div className="space-x-2">
                {order.status === 'received' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'preparing')}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'ready')}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Mark as Ready
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}