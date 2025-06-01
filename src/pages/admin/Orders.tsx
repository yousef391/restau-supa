import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, CheckCircle, List } from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import type { Order } from '../../types';

const Orders = () => {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Order['status'] | 'all'>('all');

  useEffect(() => {
    if (!session) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [session]);

  const fetchOrders = async () => {
    try {
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();

      if (!restaurant) throw new Error('Restaurant not found');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            quantity,
            menu_item:menu_items(
              name,
              price
            )
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    }
  };

  const getStatusIcon = (status: Order['status'] | 'all') => {
    switch (status) {
      case 'all':
        return <List className="h-3.5 w-3.5 text-gray-500" />;
      case 'preparing':
        return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'preparing':
        return 'bg-yellow-50 text-yellow-700';
      case 'completed':
        return 'bg-green-50 text-green-700';
    }
  };

  const getStatusTitle = (status: Order['status'] | 'all') => {
    switch (status) {
      case 'all':
        return 'All Orders';
      case 'preparing':
        return 'Preparing';
      case 'completed':
        return 'Completed';
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  const ordersByStatus = {
    all: orders,
    preparing: orders.filter(order => order.status === 'preparing'),
    completed: orders.filter(order => order.status === 'completed')
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Orders</h2>

      {/* Status Selection Bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(ordersByStatus).map(([status, statusOrders]) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status as Order['status'] | 'all')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
              selectedStatus === status
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {getStatusIcon(status as Order['status'] | 'all')}
            <span className="font-medium text-sm whitespace-nowrap">{getStatusTitle(status as Order['status'] | 'all')}</span>
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${
              selectedStatus === status
                ? 'bg-primary-100 text-primary-700'
                : getStatusColor(status as Order['status'])
            }`}>
              {statusOrders.length}
            </span>
          </button>
        ))}
      </div>

      {/* Selected Status Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {getStatusIcon(selectedStatus)}
            <h3 className="text-lg font-medium text-gray-900">
              {getStatusTitle(selectedStatus)}
            </h3>
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(selectedStatus as Order['status'])}`}>
              {ordersByStatus[selectedStatus].length}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {ordersByStatus[selectedStatus].length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">No orders</p>
            </div>
          ) : (
            ordersByStatus[selectedStatus].map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <p className="text-lg font-medium text-primary-600">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 bg-gray-50 rounded-md p-3">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">
                        {item.quantity}x {item.menu_item.name}
                      </span>
                      <span className="text-gray-600 font-medium">
                        {formatPrice(item.quantity * item.menu_item.price)}
                      </span>
                    </div>
                  ))}
                </div>

                {order.status === 'preparing' && (
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
                    >
                      Complete Order
                    </button>
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders; 