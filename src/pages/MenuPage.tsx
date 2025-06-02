import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Utensils, Facebook, Instagram, MapPin, ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { categoryIcons } from '../utils/categoryIcons';

const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id: string;
  available: boolean;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
  icon_id: string | null;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  google_maps_url: string | null;
}

const MenuPage = () => {
  const { identifier } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showCart, setShowCart] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  });
  const [formErrors, setFormErrors] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  });

  useEffect(() => {
    fetchRestaurantData();
  }, [identifier]);

  const fetchRestaurantData = async () => {
    try {
      if (!identifier) throw new Error('Restaurant identifier is required');

      // Determine if the identifier is a UUID or a slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

      // Fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq(isUuid ? 'id' : 'slug', identifier)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);

      // Fetch menu items
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .eq('available', true);

      if (menuItemsError) throw menuItemsError;
      setMenuItems(menuItemsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

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

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
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

      alert('Order placed successfully!');
    } catch (err) {
      setError('Failed to place order');
      console.error('Error:', err);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === null || item.category_id === selectedCategory;
    return matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Restaurant not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Banner */}
      {restaurant.banner_url && (
        <div className="relative h-72 w-full overflow-hidden">
          {/* Blurred background */}
          <div className="absolute inset-0">
            <img
              src={restaurant.banner_url}
              alt=""
              className="h-full w-full object-cover blur-xl scale-110 brightness-50"
            />
          </div>
          {/* Main image */}
          <img
            src={restaurant.banner_url}
            alt={restaurant.name}
            className="relative h-full w-full object-cover brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
        </div>
      )}

      {/* Restaurant Info */}
      <div className="mx-auto max-w-7xl px-4 -mt-20 sm:px-6 lg:px-8 relative z-10 py-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-white/20 text-center sm:text-left">
          {restaurant.logo_url && (
            <img
              src={restaurant.logo_url}
              alt={`${restaurant.name} logo`}
              className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl object-cover border-4 border-white shadow-2xl ring-4 ring-slate-100/50 flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
              {restaurant.name}
            </h1>
            {restaurant.description && (
              <div className="prose prose-slate max-w-none">
                <p className="text-lg text-slate-600 leading-relaxed">
                  {restaurant.description}
                </p>
              </div>
            )}
            {(restaurant.facebook_url || restaurant.instagram_url || restaurant.google_maps_url) && (
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-sm text-gray-500">
                {restaurant.facebook_url && (
                  <a
                    href={restaurant.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1877F2] text-white hover:bg-[#1877F2]/90 transition-colors duration-200"
                  >
                    <Facebook className="w-5 h-5" />
                    <span>Facebook</span>
                  </a>
                )}
                {restaurant.instagram_url && (
                  <a
                    href={restaurant.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90 transition-opacity duration-200"
                  >
                    <Instagram className="w-5 h-5" />
                    <span>Instagram</span>
                  </a>
                )}
                {restaurant.google_maps_url && (
                  <a
                    href={restaurant.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4285F4] text-white hover:bg-[#4285F4]/90 transition-colors duration-200"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>View on Map</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Selection */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 mb-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Menu Categories</h2>
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3">
          <button
            className={`group relative px-8 py-4 rounded-2xl transition-all duration-300 flex items-center gap-4 ${
              selectedCategory === null
                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-xl'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100'
            }`}
            onClick={() => setSelectedCategory(null)}
          >
            <span className={`inline-flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 ${
              selectedCategory === null 
                ? 'bg-white/20 backdrop-blur-sm' 
                : 'bg-gray-50 group-hover:bg-indigo-50'
            }`}>
              <Utensils className={`w-7 h-7 transition-all duration-300 ${
                selectedCategory === null 
                  ? 'text-white transform scale-110' 
                  : 'text-gray-600 group-hover:text-indigo-600'
              }`} />
            </span>
            <span className="font-semibold text-lg">All Items</span>
          </button>
          {categories.map((category) => {
            const categoryIcon = categoryIcons.find(icon => icon.id === category.icon_id) || categoryIcons[0];
            const IconComponent = categoryIcon.icon;
            return (
              <button
                key={category.id}
                className={`group relative px-8 py-4 rounded-2xl transition-all duration-300 flex items-center gap-4 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-xl'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className={`inline-flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 ${
                  selectedCategory === category.id 
                    ? 'bg-white/20 backdrop-blur-sm' 
                    : 'bg-gray-50 group-hover:bg-indigo-50'
                }`}>
                  <IconComponent className={`w-7 h-7 transition-all duration-300 ${
                    selectedCategory === category.id 
                      ? 'text-white transform scale-110' 
                      : 'text-gray-600 group-hover:text-indigo-600'
                  }`} />
                </span>
                <span className="font-semibold text-lg">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Items */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">
            {selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.name 
              : 'All Menu Items'}
          </h2>
          <span className="text-sm text-slate-500">
            {filteredItems.length} items
          </span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-slate-100"
            >
              {item.image_url && (
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <p className="text-xl font-bold text-indigo-600">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
                      disabled={!cart[item.id]}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {cart[item.id] || 0}
                    </span>
                    <button
                      onClick={() => addToCart(item.id)}
                      className="rounded-lg bg-indigo-100 p-2 text-indigo-600 hover:bg-indigo-200"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {Object.keys(cart).length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-8 right-8 flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-white shadow-lg hover:bg-indigo-700"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="font-medium">
            {Object.values(cart).reduce((a, b) => a + b, 0)} items
          </span>
          <span className="font-bold">
            {formatPrice(getCartTotal())}
          </span>
        </button>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
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
                          {formatPrice(item.price)} x {quantity}
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
                  <span>{formatPrice(getCartTotal())}</span>
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
                    className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${formErrors.customerName ? 'border-red-500' : ''}`}
                    required
                  />
                  {formErrors.customerName && <p className="mt-1 text-sm text-red-500">{formErrors.customerName}</p>}
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
                    className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${formErrors.customerEmail ? 'border-red-500' : ''}`}
                    required
                  />
                  {formErrors.customerEmail && <p className="mt-1 text-sm text-red-500">{formErrors.customerEmail}</p>}
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
                    className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${formErrors.customerPhone ? 'border-red-500' : ''}`}
                    required
                  />
                  {formErrors.customerPhone && <p className="mt-1 text-sm text-red-500">{formErrors.customerPhone}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Place Order
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage; 