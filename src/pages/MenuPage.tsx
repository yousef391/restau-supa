import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, Facebook, Instagram, MapPin } from "lucide-react";

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
  }; // No cart or ordering functionality in this version

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
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant banner as background */}
      <div
        className="relative bg-cover bg-center py-8 shadow-md"
        style={{
          backgroundImage: restaurant.banner_url
            ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${restaurant.banner_url})`
            : "linear-gradient(to right, #991b1b, #7f1d1d)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center py-8">
          {restaurant.logo_url && (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-white"
            />
          )}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">{restaurant.name}</h1>
            {restaurant.opening_hours && (
              <div className="text-gray-200 mt-2">
                <span>{restaurant.opening_hours || "11:00 am - 8:30 pm"}</span>
              </div>
            )}
          </div>
        </div>
      </div>{" "}
      {/* Main menu content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Menu banner with decorative elements */}
        <div className="relative border border-gray-200 bg-white p-6 mb-8">
          {/* Decorative corners and borders */}
          <div className="absolute top-0 left-0 right-0 bottom-0 border-4 border-gray-200 m-4 pointer-events-none"></div>{" "}
          {/* Menu title banner */}
          <div className="bg-red-800 text-white py-3 text-center my-6">
            <h1 className="text-3xl font-serif tracking-wider uppercase">
              MENU
            </h1>
          </div>{" "}
          {/* "View All" button above categories */}
          <div className="flex justify-between items-center mb-4">
            {/* Mobile category selector */}
            <div className="w-full sm:w-auto"></div>
          </div>
          {/* Category tabs */}
          <div className="relative mb-6">
            <div
              className="flex overflow-x-auto py-3 justify-start space-x-4 border-b border-gray-200 scrollbar-thin scrollbar-thumb-red-800 scrollbar-track-gray-100 pb-2"
              style={{ scrollbarWidth: "thin" }}
            >
              <button
                className={`px-4 py-1 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === null
                    ? "text-red-800 border-b-2 border-red-800"
                    : "text-gray-700 hover:text-red-800"
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-4 py-1 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === category.id
                      ? "text-red-800 border-b-2 border-red-800"
                      : "text-gray-700 hover:text-red-800"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
            {/* Scroll indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>
          {/* Always show all categories, but filter if a category is selected */}
          {categories
            .filter(
              (category) =>
                // If no category selected, show all. Otherwise show only the selected category
                selectedCategory === null || category.id === selectedCategory
            )
            .map((category) => {
              const itemsInCategory = menuItems.filter(
                (item) => item.category_id === category.id
              );
              if (itemsInCategory.length === 0) return null;

              return (
                <div key={category.id} className="mb-12">
                  <div className="flex items-center mb-6">
                    <div className="flex-grow h-0.5 bg-gray-200"></div>
                    <h2 className="font-serif text-lg sm:text-xl px-4 sm:px-6 text-center uppercase">
                      {category.name}
                    </h2>
                    <div className="flex-grow h-0.5 bg-gray-200"></div>
                  </div>
                  <div className="space-y-6">
                    {itemsInCategory.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row">
                        {item.image_url && (
                          <div className="mb-3 sm:mb-0 sm:mr-4 w-full sm:w-24 h-40 sm:h-24 flex-shrink-0">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-md shadow-sm"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-baseline flex-wrap sm:flex-nowrap">
                            <h3 className="font-medium mr-2 sm:mr-0">
                              {item.name}
                            </h3>
                            <div className="hidden sm:block flex-grow mx-2 border-b border-dotted border-gray-300"></div>
                            <span className="text-red-800 font-medium ml-auto sm:ml-0">
                              {item.price.toFixed(2)} DZ
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-gray-600 text-sm italic mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Social links */}
        <div className="text-center mt-6 space-x-4">
          {restaurant.facebook_url && (
            <a
              href={restaurant.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block p-2 text-gray-600 hover:text-blue-800"
            >
              <Facebook className="w-5 h-5" />
            </a>
          )}
          {restaurant.instagram_url && (
            <a
              href={restaurant.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block p-2 text-gray-600 hover:text-pink-600"
            >
              <Instagram className="w-5 h-5" />
            </a>
          )}
          {restaurant.google_maps_url && (
            <a
              href={restaurant.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block p-2 text-gray-600 hover:text-red-600"
            >
              <MapPin className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
