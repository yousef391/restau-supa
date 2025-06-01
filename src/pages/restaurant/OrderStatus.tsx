import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem, OrderStatus as OrderStatusType } from '../../types';
import LoadingScreen from '../../components/ui/LoadingScreen';
import Button from '../../components/ui/Button';

const OrderStatusDisplay = ({ status }: { status: OrderStatusType }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'received':
        return {
          label: 'Order Received',
          description: 'Your order has been received by the restaurant.',
          color: 'text-secondary-500',
          bgColor: 'bg-secondary-500',
          icon: <Clock className="h-6 w-6" />,
        };
      case 'preparing':
        return {
          label: 'Preparing',
          description: 'The kitchen is preparing your order.',
          color: 'text-primary-500',
          bgColor: 'bg-primary-500',
          icon: <Loader2 className="h-6 w-6 animate-spin" />,
        };
      case 'ready':
        return {
          label: 'Ready',
          description: 'Your order is ready!',
          color: 'text-success',
          bgColor: 'bg-success',
          icon: <CheckCircle className="h-6 w-6" />,
        };
      default:
        return {
          label: 'Unknown',
          description: 'Status unknown',
          color: 'text-gray-500',
          bgColor: 'bg-gray-500',
          icon: <Clock className="h-6 w-6" />,
        };
    }
  };

  const { label, description, color, bgColor, icon } = getStatusInfo();

  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Order Status</h2>
        <div className={`rounded-full px-3 py-1 text-xs font-medium text-white ${bgColor}`}>
          {label}
        </div>
      </div>
      
      <div className="mt-6">
        <div className="relative">
          <div className="flex items-center justify-between">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                status === 'received' || status === 'preparing' || status === 'ready'
                  ? 'bg-success text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                status === 'preparing' || status === 'ready'
                  ? 'bg-success text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              <Loader2 className="h-5 w-5" />
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                status === 'ready'
                  ? 'bg-success text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          
          <div className="absolute left-0 right-0 top-5 -z-10 h-0.5 bg-gray-200">
            <div
              className="h-full bg-success transition-all duration-500"
              style={{
                width:
                  status === 'received'
                    ? '0%'
                    : status === 'preparing'
                    ? '50%'
                    : '100%',
              }}
            />
          </div>
        </div>
        
        <div className="mt-2 flex justify-between text-sm">
          <div className="text-center">
            <p className="font-medium">Received</p>
          </div>
          <div className="text-center">
            <p className="font-medium">Preparing</p>
          </div>
          <div className="text-center">
            <p className="font-medium">Ready</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex items-center">
        <div className={`mr-3 ${color}`}>{icon}</div>
        <div>
          <h3 className="font-medium">{label}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
};

const OrderStatus = () => {
  const { restaurantSlug, orderId } = useParams<{ restaurantSlug: string; orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        if (!orderId) return;
        
        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        
        if (orderError) throw orderError;
        if (!orderData) throw new Error('Order not found');
        
        // Fetch order items
        const { data: orderItemsData, error: orderItemsError } = await supabase
          .from('order_items')
          .select('*, menu_items(name)')
          .eq('order_id', orderId);
        
        if (orderItemsError) throw orderItemsError;
        
        const orderItems: OrderItem[] = orderItemsData.map((item) => ({
          id: item.id,
          menuItemId: item.menu_item_id,
          menuItemName: item.menu_items?.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes,
        }));
        
        setOrder({
          id: orderData.id,
          createdAt: orderData.created_at,
          status: orderData.status,
          total: orderData.total,
          customerName: orderData.customer_name,
          customerPhone: orderData.customer_phone,
          tableNumber: orderData.table_number,
          restaurantId: orderData.restaurant_id,
          items: orderItems,
        });
      } catch (err: any) {
        console.error('Error fetching order data:', err);
        setError(err.message || 'Failed to load order data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderData();
    
    // Set up real-time subscription
    const orderSubscription = supabase
      .channel('order-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new) {
            setOrder((prevOrder) => {
              if (!prevOrder) return null;
              return {
                ...prevOrder,
                status: payload.new.status,
              };
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(orderSubscription);
    };
  }, [orderId]);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md text-center">
          <Clock className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h2 className="mb-2 text-2xl font-bold">Order Not Found</h2>
          <p className="mb-6 text-gray-600">
            {error || "We couldn't find the order you were looking for."}
          </p>
          {restaurantSlug && (
            <Link to={`/r/${restaurantSlug}`} className="btn-primary">
              Back to menu
            </Link>
          )}
        </div>
      </div>
    );
  }
  
  // Calculate order date and time
  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString();
  const formattedTime = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        {restaurantSlug && (
          <Link to={`/r/${restaurantSlug}`} className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} className="mr-1" />
            Back to menu
          </Link>
        )}
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-gray-600">
            Placed on {formattedDate} at {formattedTime}
          </p>
        </div>
        
        <OrderStatusDisplay status={order.status} />
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold">Order Details</h2>
              
              <div className="divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-start">
                          <span className="mr-2 text-gray-800">{item.quantity}x</span>
                          <div>
                            <h3 className="font-medium">{item.menuItemName}</h3>
                            {item.notes && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Note:</span> {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold">Customer Information</h2>
              
              <div className="space-y-3">
                {order.customerName && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Name</h3>
                    <p>{order.customerName}</p>
                  </div>
                )}
                
                {order.customerPhone && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Phone</h3>
                    <p>{order.customerPhone}</p>
                  </div>
                )}
                
                {order.tableNumber && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Table Number</h3>
                    <p>{order.tableNumber}</p>
                  </div>
                )}
                
                {!order.customerName && !order.customerPhone && !order.tableNumber && (
                  <p className="text-gray-600">No customer information provided</p>
                )}
              </div>
              
              {restaurantSlug && (
                <div className="mt-6">
                  <Link to={`/r/${restaurantSlug}`}>
                    <Button variant="outline" className="w-full">
                      Place another order
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;