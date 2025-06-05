import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, Facebook, Instagram, MapPin, Clock } from "lucide-react";

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
  opening_hours?: string;
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
    if (identifier) {
      fetchRestaurantData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier]);

  const fetchRestaurantData = async () => {
    try {
      if (!identifier) throw new Error("Restaurant identifier is required");

      // Determine if the identifier is a UUID or a slug
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          identifier
        );

      // Fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq(isUuid ? "id" : "slug", identifier)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantData.id)
        .order("display_order", { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);

      // Fetch menu items
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantData.id)
        .eq("available", true);

      if (menuItemsError) throw menuItemsError;
      setMenuItems(menuItemsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };
  // No cart or ordering functionality in this version

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === null || item.category_id === selectedCategory;
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
    <div className="min-h-screen bg-white">
      {/* Header with restaurant info */}
      <header className="bg-white border-b py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-16 h-16 rounded-full object-cover mr-4 mb-4 sm:mb-0"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-gray-600 text-sm mt-1">
                  {restaurant.description}
                </p>
              )}
              <div className="flex items-center mt-1 text-gray-600 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                <span>11:00 am - 8:30 pm</span>
              </div>
            </div>
            <div className="sm:ml-auto mt-4 sm:mt-0">
              {(restaurant.facebook_url ||
                restaurant.instagram_url ||
                restaurant.google_maps_url) && (
                <div className="flex gap-2">
                  {restaurant.facebook_url && (
                    <a
                      href={restaurant.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:text-blue-800"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {restaurant.instagram_url && (
                    <a
                      href={restaurant.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-pink-600 hover:text-pink-800"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {restaurant.google_maps_url && (
                    <a
                      href={restaurant.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <MapPin className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Category Selection */}
      <div className="bg-gray-50 sticky top-0 z-10 border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="overflow-x-auto py-3">
            <div className="flex space-x-4">
              <button
                className={`px-4 py-2 rounded-full font-medium text-sm ${
                  selectedCategory === null
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                Popular Items
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-4 py-2 rounded-full font-medium text-sm ${
                    selectedCategory === category.id
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-xl font-semibold mb-6">
          {selectedCategory
            ? categories.find((c) => c.id === selectedCategory)?.name
            : "Popular Items"}
          <span className="text-sm text-gray-500 font-normal ml-2">
            The most commonly ordered items and dishes from this store
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredItems.map((item) => (
            <div key={item.id} className="flex">
              <div className="flex-1">
                <h3 className="font-medium text-lg mb-1">{item.name}</h3>
                {item.description && (
                  <p className="text-gray-600 text-sm mb-1">
                    {item.description}
                  </p>
                )}
                <p className="text-gray-900 font-medium">
                  {item.price.toFixed(2) + " "}DZ
                </p>
              </div>
              {item.image_url && (
                <div className="ml-4">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
