import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { createBrowserClient } from "@supabase/ssr";
import { Restaurant, Category, MenuItem } from "../../types";
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  CheckCircle2,
  AlertCircle,
  Coffee,
} from "lucide-react";

const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CoffeePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showCart, setShowCart] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  });
  const [formErrors, setFormErrors] = useState<{
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }>({});
  const [orderStatus, setOrderStatus] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message?: string;
    orderId?: string;
  }>({ status: "idle" });

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch restaurant (must be coffee type)
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("slug", slug)
          .eq("type", "coffee")
          .maybeSingle();

        if (restaurantError) throw restaurantError;
        if (!restaurantData) {
          setError("Coffee shop not found");
          setLoading(false);
          return;
        }

        const transformedRestaurant: Restaurant = {
          id: restaurantData.id,
          name: restaurantData.name,
          slug: restaurantData.slug,
          description: restaurantData.description,
          logoUrl: restaurantData.logo_url,
          bannerUrl: restaurantData.banner_url,
          ownerId: restaurantData.owner_id,
          updatedAt: restaurantData.updated_at,
          type: restaurantData.type || "coffee",
        };

        setRestaurant(transformedRestaurant);

        // Fetch categories separately
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .eq("restaurant_id", restaurantData.id)
          .order("display_order");

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch menu items separately
        const { data: menuItemsData, error: menuItemsError } = await supabase
          .from("menu_items")
          .select("*")
          .eq("restaurant_id", restaurantData.id)
          .eq("available", true);

        if (menuItemsError) throw menuItemsError;

        // Transform menu items to match the expected format
        const transformedMenuItems =
          menuItemsData?.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            image_url: item.image_url,
            available: item.available,
            category_id: item.category_id,
            restaurant_id: item.restaurant_id,
            created_at: item.created_at,
          })) || [];

        setMenuItems(transformedMenuItems);
      } catch (err: any) {
        console.error("Error fetching coffee shop data:", err);
        setError(err.message || "Failed to load coffee shop data");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [slug]);

  // Add to cart function
  const addToCart = (menuItemId: string) => {
    setCart((prevCart) => ({
      ...prevCart,
      [menuItemId]: (prevCart[menuItemId] || 0) + 1,
    }));
  };

  // Remove from cart function
  const removeFromCart = (menuItemId: string) => {
    setCart((prevCart) => {
      const newCart = { ...prevCart };
      if (newCart[menuItemId] > 1) {
        newCart[menuItemId]--;
      } else {
        delete newCart[menuItemId];
      }
      return newCart;
    });
  };

  // Calculate total price
  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find((item) => item.id === itemId);
      return total + (item ? item.price * quantity : 0);
    }, 0);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOrderForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Submit order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors: typeof formErrors = {};
    if (!orderForm.customerName) errors.customerName = "Name is required";
    if (!orderForm.customerPhone) errors.customerPhone = "Phone is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setOrderStatus({ status: "loading" });

    try {
      // Calculate total
      const total = calculateTotal();

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurant?.id || "",
          total,
          customer_name: orderForm.customerName,
          customer_phone: orderForm.customerPhone,
          status: "received",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = Object.entries(cart).map(([menuItemId, quantity]) => {
        const menuItem = menuItems.find((item) => item.id === menuItemId);
        return {
          order_id: orderData.id,
          menu_item_id: menuItemId,
          quantity,
          price: menuItem?.price || 0,
        };
      });

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Success
      setOrderStatus({
        status: "success",
        message: "Your order has been placed successfully!",
        orderId: orderData.id,
      });

      // Clear cart and form
      setCart({});
      setOrderForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
      });
    } catch (error: any) {
      console.error("Error placing order:", error);
      setOrderStatus({
        status: "error",
        message: error.message || "Failed to place order. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
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
        <div className="text-lg text-gray-600">Coffee shop not found</div>
      </div>
    );
  }

  // Organize menu items by category
  const menuItemsByCategory = categories.map((category) => ({
    ...category,
    items: menuItems.filter((item) => item.category_id === category.id),
  }));

  const cartItems = Object.entries(cart).map(([itemId, quantity]) => {
    const menuItem = menuItems.find((item) => item.id === itemId);
    return { menuItem, quantity };
  });

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Coffee shop banner */}
      {restaurant.bannerUrl && (
        <div className="relative h-64 overflow-hidden">
          {/* Background blur for aesthetics */}
          <div className="absolute inset-0 z-0">
            <img
              src={restaurant.bannerUrl}
              alt={restaurant.name}
              className="h-full w-full object-cover blur-xl scale-110 brightness-50"
            />
          </div>
          {/* Main image */}
          <img
            src={restaurant.bannerUrl}
            alt={restaurant.name}
            className="relative h-full w-full object-cover brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/40 to-transparent" />
        </div>
      )}

      {/* Coffee shop Info */}
      <div className="mx-auto max-w-7xl px-4 -mt-20 sm:px-6 lg:px-8 relative z-10 py-6">
        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8 bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-white/20">
          {restaurant.logoUrl && (
            <img
              src={restaurant.logoUrl}
              alt={`${restaurant.name} logo`}
              className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl object-cover border-4 border-white shadow-2xl ring-4 ring-slate-100/50 flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
              {restaurant.name}
            </h1>
            {restaurant.description && (
              <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                {restaurant.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                <Coffee className="mr-1 h-3.5 w-3.5" />
                Coffee Shop
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Menu</h2>

        {/* Categories and Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {menuItemsByCategory.map((category) => (
            <div key={category.id} className="mb-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                {category.name}
              </h3>
              <div className="space-y-4">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="text-lg font-medium text-slate-900">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-lg font-medium text-slate-900 mt-2">
                        ${(item.price / 100).toFixed(2)}
                      </p>
                    </div>
                    {item.image_url && (
                      <div className="flex-shrink-0 h-20 w-20 rounded-md overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="ml-4 flex-shrink-0">
                      {cart[item.id] ? (
                        <div className="flex items-center">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            <Minus className="h-4 w-4 text-slate-600" />
                          </button>
                          <span className="px-3 font-medium">
                            {cart[item.id]}
                          </span>
                          <button
                            onClick={() => addToCart(item.id)}
                            className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            <Plus className="h-4 w-4 text-slate-600" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item.id)}
                          className="p-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Button */}
      {Object.keys(cart).length > 0 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setShowCart(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3 px-5 rounded-full shadow-lg transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">
              {Object.values(cart).reduce((a, b) => a + b, 0)} items
            </span>
            <span className="font-medium">
              ${(calculateTotal() / 100).toFixed(2)}
            </span>
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Your Order</h3>
              <button
                onClick={() => setShowCart(false)}
                className="p-1 rounded-full hover:bg-slate-100"
              >
                <X className="h-6 w-6 text-slate-500" />
              </button>
            </div>
            <div className="divide-y">
              {cartItems.map(({ menuItem, quantity }) => (
                <div
                  key={menuItem?.id}
                  className="py-3 flex justify-between items-center"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 truncate">
                      {menuItem?.name}
                    </h4>
                    <p className="text-sm text-slate-600">
                      ${((menuItem?.price || 0) / 100).toFixed(2)} x {quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => removeFromCart(menuItem?.id || "")}
                      className="p-1 rounded-full bg-slate-100 hover:bg-slate-200"
                    >
                      <Minus className="h-4 w-4 text-slate-600" />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => addToCart(menuItem?.id || "")}
                      className="p-1 rounded-full bg-slate-100 hover:bg-slate-200"
                    >
                      <Plus className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium text-slate-900">Total</span>
                <span className="font-bold text-lg text-slate-900">
                  ${(calculateTotal() / 100).toFixed(2)}
                </span>
              </div>
              <form onSubmit={handleSubmitOrder}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="customerName"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      value={orderForm.customerName}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${
                        formErrors.customerName
                          ? "border-red-500"
                          : "border-slate-300"
                      } px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500`}
                    />
                    {formErrors.customerName && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.customerName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="customerPhone"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="customerPhone"
                      name="customerPhone"
                      value={orderForm.customerPhone}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${
                        formErrors.customerPhone
                          ? "border-red-500"
                          : "border-slate-300"
                      } px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500`}
                    />
                    {formErrors.customerPhone && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.customerPhone}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      Object.keys(cart).length === 0 ||
                      orderStatus.status === "loading"
                    }
                  >
                    {orderStatus.status === "loading"
                      ? "Placing Order..."
                      : "Place Order"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Status Modal */}
      {orderStatus.status === "success" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Order Placed!
            </h3>
            <p className="text-slate-600 mb-4">{orderStatus.message}</p>
            <p className="text-sm text-slate-500 mb-6">
              Order ID: {orderStatus.orderId}
            </p>
            <button
              onClick={() => setOrderStatus({ status: "idle" })}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {orderStatus.status === "error" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Order Failed
            </h3>
            <p className="text-slate-600 mb-6">{orderStatus.message}</p>
            <button
              onClick={() => setOrderStatus({ status: "idle" })}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoffeePage;
