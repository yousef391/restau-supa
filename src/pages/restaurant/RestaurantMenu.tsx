import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Restaurant, Category, MenuItem } from '../../types';
import { useCartStore } from '../../store/cartStore';
import MenuItemCard from '../../components/restaurant/MenuItemCard';
import CartButton from '../../components/restaurant/CartButton';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { CATEGORY_ICONS } from '../../lib/constants';

const RestaurantMenu = () => {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setRestaurantInfo } = useCartStore();
  
  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!restaurantSlug) return;

      try {
        setIsLoading(true);
        setError(null);

        // Wait for session to be initialized
        const { data: { session } } = await supabase.auth.getSession();
        
        // Determine if we're using a UUID or slug
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurantSlug);
        
        // Fetch restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq(isUuid ? 'id' : 'slug', restaurantSlug)
          .maybeSingle({
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            }
          });

        if (restaurantError) throw restaurantError;
        if (!restaurantData) throw new Error('Restaurant not found');

        setRestaurant(restaurantData);
        setRestaurantInfo(restaurantData.id, restaurantData.slug);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .order('display_order');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch menu items
        const { data: menuItemsData, error: menuItemsError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .eq('available', true);

        if (menuItemsError) throw menuItemsError;

        // Transform menu items to match the expected format
        const transformedMenuItems = menuItemsData.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.image_url,
          available: item.available,
          categoryId: item.category_id,
          restaurantId: item.restaurant_id,
          createdAt: item.created_at
        }));

        setMenuItems(transformedMenuItems);

        // Set first category as active if available
        if (categoriesData && categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching restaurant data:', err);
        setError(err.message || 'Failed to load menu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantData();
  }, [restaurantSlug, setRestaurantInfo]);
  
  const getMenuItemsByCategory = (categoryId: string) => {
    return menuItems.filter((item) => item.categoryId === categoryId);
  };
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (error || !restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md text-center">
          <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h2 className="mb-2 text-2xl font-bold">Restaurant Not Found</h2>
          <p className="mb-6 text-gray-600">
            {error || "We couldn't find the restaurant you were looking for."}
          </p>
          <Link to="/" className="btn-primary">
            Go back home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Restaurant Header */}
      <div 
        className="bg-primary-500 px-4 py-6 text-white"
        style={{
          backgroundImage: 'linear-gradient(rgba(139, 0, 0, 0.9), rgba(139, 0, 0, 0.7))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container-custom">
          <Link to="/" className="mb-4 inline-flex items-center text-white/90 hover:text-white">
            <ArrowLeft size={16} className="mr-1" />
            Back to home
          </Link>
          <div className="flex items-center">
            {restaurant.logoUrl ? (
              <img 
                src={restaurant.logoUrl} 
                alt={restaurant.name} 
                className="mr-3 h-12 w-12 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white/10">
                <span className="text-xl font-bold">{restaurant.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-sm text-white/90">{restaurant.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Categories Tabs */}
      <div className="sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="container-custom">
          <div className="overflow-x-auto">
            <div className="flex whitespace-nowrap py-3">
              {categories.map((category) => {
                const IconComponent = CATEGORY_ICONS[category.icon] || CATEGORY_ICONS.utensils;
                return (
                  <button
                    key={category.id}
                    className={`mr-2 flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      activeCategory === category.id
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <IconComponent 
                      className={`mr-2 h-4 w-4 ${
                        activeCategory === category.id 
                          ? 'text-white' 
                          : 'text-primary-500'
                      }`} 
                    />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="container-custom py-6">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-xl font-medium">No menu items available</h3>
            <p className="text-gray-600">
              This restaurant hasn't added any items to their menu yet.
            </p>
          </div>
        ) : (
          <div>
            {categories.map((category) => (
              <div
                key={category.id}
                id={`category-${category.id}`}
                className={activeCategory === category.id ? 'block' : 'hidden'}
              >
                <h2 className="mb-4 text-xl font-bold">{category.name}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {getMenuItemsByCategory(category.id).length > 0 ? (
                    getMenuItemsByCategory(category.id).map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))
                  ) : (
                    <p className="col-span-full py-4 text-center text-gray-500">
                      No items in this category
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Cart Button */}
      {restaurantSlug && <CartButton restaurantSlug={restaurantSlug} />}
    </div>
  );
};

export default RestaurantMenu;