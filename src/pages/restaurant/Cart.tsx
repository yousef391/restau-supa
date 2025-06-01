import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import { formatPrice } from '../../utils/currency';

const Cart = () => {
  const navigate = useNavigate();
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const { items, removeItem, updateItemQuantity, updateItemNotes, clearCart, getTotal, restaurantId } = useCartStore();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handlePlaceOrder = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!restaurantId) {
        throw new Error('Restaurant information missing');
      }
      
      if (items.length === 0) {
        throw new Error('Your cart is empty');
      }
      
      // Create order
      const orderId = uuidv4();
      const total = getTotal();
      
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          restaurant_id: restaurantId,
          status: 'received',
          total,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          table_number: tableNumber || null,
        });
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map((item) => ({
        id: uuidv4(),
        order_id: orderId,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price,
        notes: item.notes,
      }));
      
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (orderItemsError) throw orderItemsError;
      
      // Clear cart and navigate to order status page
      clearCart();
      navigate(`/r/${restaurantSlug}/order/${orderId}`);
    } catch (err: any) {
      console.error('Error placing order:', err);
      setError(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container-custom py-6">
          <Link to={`/r/${restaurantSlug}`} className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} className="mr-1" />
            Back to menu
          </Link>
          
          <div className="mt-12 flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="mb-4 h-16 w-16 text-gray-400" />
            <h2 className="mb-2 text-2xl font-bold">Your cart is empty</h2>
            <p className="mb-6 text-gray-600">
              Add some delicious items from the menu to get started.
            </p>
            <Link to={`/r/${restaurantSlug}`} className="btn-primary">
              Browse menu
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        <Link to={`/r/${restaurantSlug}`} className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} className="mr-1" />
          Back to menu
        </Link>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Your Order</h1>
          <p className="text-gray-600">Review your items before placing the order</p>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-error/10 p-3 text-sm text-error">
            {error}
          </div>
        )}
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold">Cart Items</h2>
              
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.id} className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{item.menuItem.name}</h3>
                            <p className="text-sm text-gray-600">
                              {formatPrice(item.menuItem.price)} each
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatPrice(item.menuItem.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                        
                        {item.notes && (
                          <div className="mt-1">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Note:</span> {item.notes}
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-md border border-gray-300 p-1">
                            <button 
                              className="rounded p-1 hover:bg-gray-100"
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateItemQuantity(item.id, item.quantity - 1);
                                } else {
                                  removeItem(item.id);
                                }
                              }}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="min-w-6 text-center text-sm">{item.quantity}</span>
                            <button 
                              className="rounded p-1 hover:bg-gray-100"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          
                          <button 
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-error"
                            onClick={() => removeItem(item.id)}
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => clearCart()}
                >
                  Clear cart
                </Button>
              </div>
            </div>
          </div>
          
          <div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold">Order Summary</h2>
              
              <div className="mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(getTotal())}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(getTotal())}</span>
                </div>
              </div>
              
              <div className="mb-4 space-y-3">
                <div>
                  <label htmlFor="customerName" className="mb-1 block text-sm font-medium text-gray-700">
                    Your Name (optional)
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    className="input"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="customerPhone" className="mb-1 block text-sm font-medium text-gray-700">
                    Phone Number (optional)
                  </label>
                  <input
                    id="customerPhone"
                    type="tel"
                    className="input"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="For order notifications"
                  />
                </div>
                
                <div>
                  <label htmlFor="tableNumber" className="mb-1 block text-sm font-medium text-gray-700">
                    Table Number (optional)
                  </label>
                  <input
                    id="tableNumber"
                    type="text"
                    className="input"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. 12"
                  />
                </div>
              </div>
              
              <Button
                className="w-full"
                onClick={handlePlaceOrder}
                isLoading={isSubmitting}
              >
                Place Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;