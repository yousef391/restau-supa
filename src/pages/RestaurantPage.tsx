import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { createBrowserClient } from "@supabase/ssr";
import { Restaurant, Category, MenuItem } from "../types";
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

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

        // Fetch restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("*") // Fetch restaurant without joining menu_items
          .eq("slug", slug)
          .maybeSingle();

        if (restaurantError) throw restaurantError;
        if (!restaurantData) {
          setError("Restaurant not found");
          setLoading(false);
          return;
        }

        setRestaurant(restaurantData);

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
            imageUrl: item.image_url,
            available: item.available,
            categoryId: item.category_id,
            restaurantId: item.restaurant_id,
            createdAt: item.created_at,
          })) || [];

        setMenuItems(transformedMenuItems);
      } catch (err: any) {
        console.error("Error fetching restaurant data:", err);
        setError(err.message || "Failed to load restaurant data");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [slug]);

  const addToCart = (itemId: string) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
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
      const item = menuItems.find((i) => i.id === itemId);
      return total + (item?.price || 0) * quantity;
    }, 0);
  };

  const validateForm = () => {
    const errors: typeof formErrors = {};
    if (!orderForm.customerName.trim()) {
      errors.customerName = "Name is required";
    }
    if (!orderForm.customerEmail.trim()) {
      errors.customerEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderForm.customerEmail)) {
      errors.customerEmail = "Invalid email format";
    }
    if (!orderForm.customerPhone.trim()) {
      errors.customerPhone = "Phone number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(orderForm.customerPhone)) {
      errors.customerPhone = "Invalid phone number format";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !validateForm()) return;

    try {
      setOrderStatus({ status: "loading" });

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurant.id,
          customer_name: orderForm.customerName,
          customer_email: orderForm.customerEmail,
          customer_phone: orderForm.customerPhone,
          status: "received",
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
        price: menuItems.find((item) => item.id === menuItemId)?.price || 0,
      }));

      const { error: orderItemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (orderItemsError) throw orderItemsError;

      // Clear cart and form
      setCart({});
      setOrderForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
      });
      setShowCart(false);
      setOrderStatus({
        status: "success",
        message: "Order placed successfully!",
        orderId: order.id,
      });

      // Start order tracking
      const orderTracking = supabase
        .channel(`order-${order.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${order.id}`,
          },
          (payload) => {
            const newStatus = payload.new.status;
            if (newStatus === "completed") {
              setOrderStatus({
                status: "success",
                message: "Your order has been completed!",
                orderId: order.id,
              });
              orderTracking.unsubscribe();
            }
          }
        )
        .subscribe();
    } catch (err) {
      setOrderStatus({
        status: "error",
        message: "Failed to place order. Please try again.",
      });
      console.error("Error:", err);
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
        <div className="text-lg text-red-600">
          {error || "Restaurant not found"}
        </div>
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
        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8 bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-white/20">
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
              <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                {restaurant.description}
              </p>
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
      </div>

      {/* Menu and Cart Layout */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu Sections */}
        <div className="lg:col-span-2">
          {categories.map((category) => {
            const itemsInCategory = menuItems.filter(
              (item) => item.categoryId === category.id
            );

            if (itemsInCategory.length === 0) return null; // Don't show empty categories

            return (
              <section key={category.id} className="mb-12">
                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 mb-6 border-b pb-3 border-slate-200">
                  {category.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {itemsInCategory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-40 sm:h-48 object-cover"
                        />
                      )}
                      <div className="p-4 flex-grow flex flex-col">
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-lg font-bold text-primary-600">
                            ${item.price.toFixed(2)}
                          </span>
                          {cart[item.id] ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-primary-600 hover:text-primary-800 p-1 rounded-full bg-primary-100"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-semibold text-slate-700">
                                {cart[item.id]}
                              </span>
                              <button
                                onClick={() => addToCart(item.id)}
                                className="text-primary-600 hover:text-primary-800 p-1 rounded-full bg-primary-100"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item.id)}
                              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                            >
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Order Summary / Cart (Fixed on larger screens) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-xl sticky top-8">
            <h2 className="text-2xl font-bold mb-4">Your Order</h2>
            {Object.keys(cart).length === 0 ? (
              <p className="text-slate-600">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(cart).map(([itemId, quantity]) => {
                  const item = menuItems.find((i) => i.id === itemId);
                  if (!item) return null;
                  return (
                    <div
                      key={itemId}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.name} x {quantity}
                        </p>
                        <p className="text-sm text-slate-600">
                          ${(item.price * quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="text-green-600 hover:text-green-800 p-1 rounded-full"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-xl font-bold text-slate-800">
                    Total:
                  </span>
                  <span className="text-xl font-bold text-primary-600">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
                {/* Order Form */}
                <form onSubmit={handleOrderSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="customerName"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      id="customerName"
                      value={orderForm.customerName}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          customerName: e.target.value,
                        })
                      }
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        formErrors.customerName ? "border-red-500" : ""
                      }`}
                      required
                    />
                    {formErrors.customerName && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.customerName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="customerEmail"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      id="customerEmail"
                      value={orderForm.customerEmail}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          customerEmail: e.target.value,
                        })
                      }
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        formErrors.customerEmail ? "border-red-500" : ""
                      }`}
                      required
                    />
                    {formErrors.customerEmail && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.customerEmail}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="customerPhone"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      id="customerPhone"
                      value={orderForm.customerPhone}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          customerPhone: e.target.value,
                        })
                      }
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        formErrors.customerPhone ? "border-red-500" : ""
                      }`}
                      required
                    />
                    {formErrors.customerPhone && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.customerPhone}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      Object.keys(cart).length === 0 ||
                      orderStatus.status === "loading"
                    }
                  >
                    {orderStatus.status === "loading"
                      ? "Placing Order..."
                      : "Place Order"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Button for Mobile */}
      {Object.keys(cart).length > 0 && !showCart && (
        <button
          className="fixed bottom-6 right-6 lg:hidden bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors z-40"
          onClick={() => setShowCart(true)}
          aria-label="Open Cart"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)}
          </span>
        </button>
      )}

      {/* Cart Modal for Mobile */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 lg:hidden">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-auto p-6 transform transition-all duration-300 ease-out scale-100 opacity-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Your Order</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-600 hover:text-gray-900 p-1 rounded-full"
                aria-label="Close Cart"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {Object.keys(cart).length === 0 ? (
              <p className="text-slate-600">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(cart).map(([itemId, quantity]) => {
                  const item = menuItems.find((i) => i.id === itemId);
                  if (!item) return null;
                  return (
                    <div
                      key={itemId}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.name} x {quantity}
                        </p>
                        <p className="text-sm text-slate-600">
                          ${(item.price * quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="text-green-600 hover:text-green-800 p-1 rounded-full"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-xl font-bold text-slate-800">
                    Total:
                  </span>
                  <span className="text-xl font-bold text-primary-600">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
                {/* Order Form */}
                <form onSubmit={handleOrderSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="customerName"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      id="customerName"
                      value={orderForm.customerName}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          customerName: e.target.value,
                        })
                      }
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        formErrors.customerName ? "border-red-500" : ""
                      }`}
                      required
                    />
                    {formErrors.customerName && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.customerName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="customerEmail"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      id="customerEmail"
                      value={orderForm.customerEmail}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          customerEmail: e.target.value,
                        })
                      }
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        formErrors.customerEmail ? "border-red-500" : ""
                      }`}
                      required
                    />
                    {formErrors.customerEmail && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.customerEmail}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="customerPhone"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      id="customerPhone"
                      value={orderForm.customerPhone}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          customerPhone: e.target.value,
                        })
                      }
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        formErrors.customerPhone ? "border-red-500" : ""
                      }`}
                      required
                    />
                    {formErrors.customerPhone && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.customerPhone}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      Object.keys(cart).length === 0 ||
                      orderStatus.status === "loading"
                    }
                  >
                    {orderStatus.status === "loading"
                      ? "Placing Order..."
                      : "Place Order"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Status Modal */}
      {orderStatus.status !== "idle" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-auto p-6 text-center">
            {orderStatus.status === "loading" && (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
                <p className="text-lg font-semibold">Placing Order...</p>
              </div>
            )}
            {orderStatus.status === "success" && (
              <div className="flex flex-col items-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-semibold mb-2">
                  {orderStatus.message || "Order Successful!"}
                </p>
                {orderStatus.orderId && (
                  <p className="text-sm text-gray-600">
                    Order ID: {orderStatus.orderId}
                  </p>
                )}
              </div>
            )}
            {orderStatus.status === "error" && (
              <div className="flex flex-col items-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-lg font-semibold mb-2">
                  {orderStatus.message || "Order Failed!"}
                </p>
              </div>
            )}
            <button
              onClick={() => setOrderStatus({ status: "idle" })}
              className="mt-6 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantPage;
