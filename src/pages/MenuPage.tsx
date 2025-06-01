import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Utensils, Facebook, Instagram, MapPin } from 'lucide-react';
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
      <div className="mx-auto max-w-7xl px-4 -mt-20 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-start gap-6 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
          {restaurant.logo_url && (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="h-32 w-32 rounded-2xl object-cover border-4 border-white shadow-2xl ring-4 ring-slate-100/50 flex-shrink-0"
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
              <div className="mt-4 flex items-center gap-4">
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

        {/* Categories Selection */}
        <div className="mt-12 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Menu Categories</h2>
          <div className="flex flex-wrap gap-3">
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
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              {selectedCategory 
                ? categories.find(c => c.id === selectedCategory)?.name 
                : 'All Menu Items'}
            </h2>
            <span className="text-sm text-slate-500">
              {menuItems.filter(item => selectedCategory === null || item.category_id === selectedCategory).length} items
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {menuItems
              .filter(item => selectedCategory === null || item.category_id === selectedCategory)
              .map((item) => (
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
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuPage; 