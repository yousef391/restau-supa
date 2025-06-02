import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { createBrowserClient } from '@supabase/ssr';
import { Restaurant, Category, MenuItem, Order } from '../types';
import { ShoppingCart, Plus, Minus, X, CheckCircle2, AlertCircle } from 'lucide-react';

const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const RestaurantPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showCart, setShowCart] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  });
  const [formErrors, setFormErrors] = useState<{
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }>({});
  const [orderStatus, setOrderStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
    orderId?: string;
  }>({ status: 'idle' });

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*') // Fetch restaurant without joining menu_items
          .eq('slug', slug)
          .maybeSingle();

        if (restaurantError) throw restaurantError;
        if (!restaurantData) {
          setError('Restaurant not found');
          setLoading(false);
          return;
        }

        setRestaurant(restaurantData);

        // Fetch categories separately
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .order('display_order');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch menu items separately
        const { data: menuItemsData, error: menuItemsError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .eq('available', true);
          
        if (menuItemsError) throw menuItemsError;
        
        // Transform menu items to match the expected format
        const transformedMenuItems = menuItemsData?.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.image_url,
          available: item.available,
          categoryId: item.category_id,
          restaurantId: item.restaurant_id,
          createdAt: item.created_at
        })) || [];

        setMenuItems(transformedMenuItems);

      } catch (err: any) {
        console.error('Error fetching restaurant data:', err);
        setError(err.message || 'Failed to load restaurant data');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [slug]);

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find(i => i.id === itemId);
      return total + (item?.price || 0) * quantity;
    }, 0);
  };

  const validateForm = () => {
    const errors: typeof formErrors = {};
    if (!orderForm.customerName.trim()) {
      errors.customerName = 'Name is required';
    }
    if (!orderForm.customerEmail.trim()) {
      errors.customerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderForm.customerEmail)) {
      errors.customerEmail = 'Invalid email format';
    }
    if (!orderForm.customerPhone.trim()) {
      errors.customerPhone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(orderForm.customerPhone)) {
      errors.customerPhone = 'Invalid phone number format';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !validateForm()) return;

    try {
      setOrderStatus({ status: 'loading' });

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          customer_name: orderForm.customerName,
          customer_email: orderForm.customerEmail,
          customer_phone: orderForm.customerPhone,
          status: 'received',
          total_amount: getCartTotal(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = Object.entries(cart).map(([menuItemId, quantity]) => ({
        order_id: order.id,
        menu_item_id: menuItemId,
        quantity,
        price: menuItems.find(item => item.id === menuItemId)?.price || 0,
      }));

      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (orderItemsError) throw orderItemsError;

      // Clear cart and form
      setCart({});
      setOrderForm({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
      });
      setShowCart(false);
      setOrderStatus({
        status: 'success',
        message: 'Order placed successfully!',
        orderId: order.id,
      });

      // Start order tracking
      const orderTracking = supabase
        .channel(`order-${order.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${order.id}`,
          },
          (payload) => {
            const newStatus = payload.new.status;
            if (newStatus === 'completed') {
              setOrderStatus({
                status: 'success',
                message: 'Your order has been completed!',
                orderId: order.id,
              });
              orderTracking.unsubscribe();
            }
          }
        )
        .subscribe();

    } catch (err) {
      setOrderStatus({
        status: 'error',
        message: 'Failed to place order. Please try again.',
      });
      console.error('Error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-red-600">{error || 'Restaurant not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
          {restaurant.description && (
            <p className="mt-2 text-gray-600">{restaurant.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            {restaurant.address && (
              <div className="flex items-center gap-1">
                <span>📍</span>
                <span>{restaurant.address}</span>
              </div>
            )}
            {restaurant.opening_hours && (
              <div className="flex items-center gap-1">
                <span>🕒</span>
                <span>{restaurant.opening_hours}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {restaurant.menu_items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-lg bg-white shadow"
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-48 w-full object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {item.name}
                  </h3>
                  <p className="text-lg font-medium text-primary-500">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
                {item.description && (
                  <p className="mt-2 text-sm text-gray-500">
                    {item.description}
                  </p>
                )}
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
                    {item.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            {categories.map(category => (
              <div key={category.id} className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">{category.name}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {menuItems
                    .filter(item => item.category_id === category.id)
                    .map(item => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-gray-200 p-4 shadow-sm"
                      >
                        <h3 className="font-medium">{item.name}</h3>
                        {item.description && (
                          <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-medium">${item.price.toFixed(2)}</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="rounded-md bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300"
                              disabled={!cart[item.id]}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center">
                              {cart[item.id] || 0}
                            </span>
                            <button
                              onClick={() => addToCart(item.id)}
                              className="rounded-md bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Cart Section - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="rounded-lg border border-gray-200 p-4 shadow-sm sticky top-4">
              <h2 className="mb-4 text-xl font-semibold">Your Order</h2>
              {Object.entries(cart).length === 0 ? (
                <p className="text-gray-600">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {Object.entries(cart).map(([itemId, quantity]) => {
                      const item = menuItems.find(i => i.id === itemId);
                      if (!item) return null;
                      return (
                        <div key={itemId} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              ${item.price.toFixed(2)} x {quantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => removeFromCart(itemId)}
                              className="rounded-md bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span>{quantity}</span>
                            <button
                              onClick={() => addToCart(itemId)}
                              className="rounded-md bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <form onSubmit={handleOrderSubmit} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        id="customerName"
                        value={orderForm.customerName}
                        onChange={e => setOrderForm(prev => ({ ...prev, customerName: e.target.value }))}
                        className={`mt-1 block w-full rounded-md border ${
                          formErrors.customerName ? 'border-red-300' : 'border-gray-300'
                        } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        required
                      />
                      {formErrors.customerName && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.customerName}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        id="customerEmail"
                        value={orderForm.customerEmail}
                        onChange={e => setOrderForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                        className={`mt-1 block w-full rounded-md border ${
                          formErrors.customerEmail ? 'border-red-300' : 'border-gray-300'
                        } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        required
                      />
                      {formErrors.customerEmail && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.customerEmail}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="customerPhone"
                        value={orderForm.customerPhone}
                        onChange={e => setOrderForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                        className={`mt-1 block w-full rounded-md border ${
                          formErrors.customerPhone ? 'border-red-300' : 'border-gray-300'
                        } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        required
                      />
                      {formErrors.customerPhone && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.customerPhone}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={orderStatus.status === 'loading'}
                      className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {orderStatus.status === 'loading' ? 'Placing Order...' : 'Place Order'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Button - Mobile Only */}
      {Object.keys(cart).length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-8 right-8 flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-white shadow-lg hover:bg-blue-700 lg:hidden"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="font-medium">
            {Object.values(cart).reduce((a, b) => a + b, 0)} items
          </span>
          <span className="font-bold">
            ${getCartTotal().toFixed(2)}
          </span>
        </button>
      )}

      {/* Cart Modal - Mobile Only */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-y-auto lg:hidden">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowCart(false)} />
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <button
                onClick={() => setShowCart(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="mb-4 text-2xl font-bold">Your Order</h2>
              <div className="space-y-4">
                {Object.entries(cart).map(([itemId, quantity]) => {
                  const item = menuItems.find(i => i.id === itemId);
                  if (!item) return null;
                  return (
                    <div key={itemId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          ${item.price.toFixed(2)} x {quantity}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeFromCart(itemId)}
                          className="rounded-md bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span>{quantity}</span>
                        <button
                          onClick={() => addToCart(itemId)}
                          className="rounded-md bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleOrderSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="mobileCustomerName" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="mobileCustomerName"
                    value={orderForm.customerName}
                    onChange={e => setOrderForm(prev => ({ ...prev, customerName: e.target.value }))}
                    className={`mt-1 block w-full rounded-md border ${
                      formErrors.customerName ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    required
                  />
                  {formErrors.customerName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.customerName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="mobileCustomerEmail" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="mobileCustomerEmail"
                    value={orderForm.customerEmail}
                    onChange={e => setOrderForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                    className={`mt-1 block w-full rounded-md border ${
                      formErrors.customerEmail ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    required
                  />
                  {formErrors.customerEmail && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.customerEmail}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="mobileCustomerPhone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="mobileCustomerPhone"
                    value={orderForm.customerPhone}
                    onChange={e => setOrderForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className={`mt-1 block w-full rounded-md border ${
                      formErrors.customerPhone ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    required
                  />
                  {formErrors.customerPhone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.customerPhone}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={orderStatus.status === 'loading'}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {orderStatus.status === 'loading' ? 'Placing Order...' : 'Place Order'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Status Modal */}
      {orderStatus.status !== 'idle' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setOrderStatus({ status: 'idle' })} />
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="text-center">
                {orderStatus.status === 'loading' && (
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                )}
                {orderStatus.status === 'success' && (
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                )}
                {orderStatus.status === 'error' && (
                  <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                )}
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {orderStatus.status === 'loading' && 'Placing your order...'}
                  {orderStatus.status === 'success' && 'Order Placed Successfully!'}
                  {orderStatus.status === 'error' && 'Order Failed'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {orderStatus.message}
                </p>
                {orderStatus.status === 'success' && orderStatus.orderId && (
                  <p className="mt-2 text-sm text-gray-500">
                    Order ID: {orderStatus.orderId}
                  </p>
                )}
                <div className="mt-6">
                  <button
                    onClick={() => setOrderStatus({ status: 'idle' })}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {orderStatus.status === 'success' ? 'Done' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantPage; 