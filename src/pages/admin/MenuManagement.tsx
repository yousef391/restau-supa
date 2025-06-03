import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  Trash2,
  Coffee,
  Utensils,
  Pizza,
  Salad,
  IceCream,
  Wine,
  Beer,
  Sandwich,
  Soup,
  Cake,
  Cookie,
} from "lucide-react";
import type { MenuItem, Category } from "../../types";
import React from "react";

// Define available icons for categories
const CATEGORY_ICONS = {
  coffee: Coffee,
  food: Utensils,
  pizza: Pizza,
  salad: Salad,
  dessert: IceCream,
  wine: Wine,
  beer: Beer,
  sandwich: Sandwich,
  soup: Soup,
  cake: Cake,
  cookie: Cookie,
} as const;

type CategoryIcon = keyof typeof CATEGORY_ICONS;

interface NewCategory {
  name: string;
  icon: CategoryIcon;
}

interface NewItem {
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  available: boolean;
}

export default function MenuManagement() {
  const { session } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newItem, setNewItem] = useState<NewItem>({
    name: "",
    description: "",
    price: 0,
    category_id: "",
    image_url: "",
    available: true,
  });
  const [newCategory, setNewCategory] = useState<NewCategory>({
    name: "",
    icon: "food",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showSuccessItemModal, setShowSuccessItemModal] = useState(false);
  const [showSuccessCategoryModal, setShowSuccessCategoryModal] =
    useState(false);

  useEffect(() => {
    if (!session) {
      setError("No active session");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", session.user.id)
          .single();

        if (restaurantError) {
          if (restaurantError.code === "PGRST116") {
            const { data: newRestaurant, error: createError } = await supabase
              .from("restaurants")
              .insert([
                {
                  owner_id: session.user.id,
                  name: "My Restaurant",
                  description: "Welcome to my restaurant",
                },
              ])
              .select()
              .single();

            if (createError) throw createError;
            if (!newRestaurant) throw new Error("Failed to create restaurant");

            await Promise.all([
              fetchCategories(newRestaurant.id),
              fetchMenuItems(newRestaurant.id),
            ]);
          } else {
            throw restaurantError;
          }
        } else if (restaurantData) {
          await Promise.all([
            fetchCategories(restaurantData.id),
            fetchMenuItems(restaurantData.id),
          ]);
        }
      } catch (err) {
        console.error("Error in menu management:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const fetchCategories = async (restaurantId: string) => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("display_order");

    if (error) throw error;
    setCategories(data || []);
  };

  const fetchMenuItems = async (restaurantId: string) => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("name");

    if (error) throw error;
    setMenuItems(data || []);
  };

  const handleAddItem = async () => {
    if (!session) {
      alert("No active session");
      return;
    }

    try {
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      if (restaurantError) throw restaurantError;
      if (!restaurant) throw new Error("Restaurant not found");

      const { error } = await supabase.from("menu_items").insert([
        {
          name: newItem.name,
          description: newItem.description,
          price: newItem.price,
          category_id: newItem.category_id,
          restaurant_id: restaurant.id,
          image_url: newItem.image_url,
          available: newItem.available,
        },
      ]);

      if (error) throw error;
      await fetchMenuItems(restaurant.id);
      setNewItem({
        name: "",
        description: "",
        price: 0,
        category_id: "",
        image_url: "",
        available: true,
      });
      setShowAddItemModal(false);
      setShowSuccessItemModal(true);

      // Hide success message after 2.5 seconds
      setTimeout(() => {
        setShowSuccessItemModal(false);
      }, 2500);
    } catch (err) {
      console.error("Error adding menu item:", err);
      alert(err instanceof Error ? err.message : "Failed to add menu item");
    }
  };
  const handleDeleteItem = async (itemId: string) => {
    if (!session) {
      alert("No active session");
      return;
    }

    setItemToDelete(itemId);
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!session || !itemToDelete) {
      return;
    }

    try {
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      if (restaurantError) throw restaurantError;
      if (!restaurant) throw new Error("Restaurant not found");
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", itemToDelete)
        .eq("restaurant_id", restaurant.id);
      if (error) throw error;
      await fetchMenuItems(restaurant.id);
      setShowDeleteModal(false);
      setItemToDelete(null);

      // Show success notification
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-slideUp bg-white rounded-xl shadow-xl p-4 flex items-center gap-3 border-l-4 border-green-500";
      notification.innerHTML = `
        <div class="bg-green-100 rounded-full p-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 class="font-medium text-gray-800">Success!</h3>
          <p class="text-sm text-gray-600">Menu item has been deleted successfully</p>
        </div>
      `;
      document.body.appendChild(notification);

      // Remove notification after 2.5 seconds
      setTimeout(() => {
        notification.remove();
      }, 2500);
    } catch (err) {
      console.error("Error deleting menu item:", err);
      alert(err instanceof Error ? err.message : "Failed to delete menu item");
    }
  };

  const handleAddCategory = async () => {
    if (!session) {
      alert("No active session");
      return;
    }

    try {
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      if (restaurantError) throw restaurantError;
      if (!restaurant) throw new Error("Restaurant not found");

      // Get the highest display_order
      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("display_order")
        .eq("restaurant_id", restaurant.id)
        .order("display_order", { ascending: false })
        .limit(1);

      if (categoriesError) throw categoriesError;

      const nextDisplayOrder =
        categories && categories.length > 0
          ? categories[0].display_order + 1
          : 1;

      const { error } = await supabase.from("categories").insert([
        {
          name: newCategory.name,
          icon_id: newCategory.icon,
          restaurant_id: restaurant.id,
          display_order: nextDisplayOrder,
        },
      ]);

      if (error) throw error;
      await fetchCategories(restaurant.id);
      setNewCategory({ name: "", icon: "food" });
      setShowAddCategoryModal(false);
      setShowSuccessCategoryModal(true);

      // Hide success message after 2.5 seconds
      setTimeout(() => {
        setShowSuccessCategoryModal(false);
      }, 2500);
    } catch (err) {
      console.error("Error adding category:", err);
      alert(err instanceof Error ? err.message : "Failed to add category");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingImage(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `b1887de3-d005-40ac-a989-ba159fedc812/menu-items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("restaurant-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("restaurant-images").getPublicUrl(filePath);

      setNewItem({ ...newItem, image_url: publicUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  const filteredItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category_id === selectedCategory);

  const selectedCategoryName =
    selectedCategory === "all"
      ? "All Items"
      : categories.find((c) => c.id === selectedCategory)?.name || "All Items";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
            >
              Add Category
            </button>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              Add Menu Item
            </button>
          </div>
        </div>

        {/* Categories Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Categories
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              className={`group relative px-8 py-4 rounded-2xl transition-all duration-300 flex items-center gap-4 ${
                selectedCategory === "all"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-100"
              }`}
              onClick={() => setSelectedCategory("all")}
            >
              <span className="font-semibold text-lg">All Items</span>
            </button>
            {categories.map((category) => {
              const IconComponent =
                CATEGORY_ICONS[category.icon_id as CategoryIcon];
              return (
                <button
                  key={category.id}
                  className={`group relative px-8 py-4 rounded-2xl transition-all duration-300 flex items-center gap-4 ${
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-100"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {IconComponent && (
                    <span
                      className={`inline-flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 ${
                        selectedCategory === category.id
                          ? "bg-white/20 backdrop-blur-sm"
                          : "bg-gray-50 group-hover:bg-blue-50"
                      }`}
                    >
                      <IconComponent
                        className={`w-7 h-7 transition-all duration-300 ${
                          selectedCategory === category.id
                            ? "text-white transform scale-110"
                            : "text-gray-600 group-hover:text-blue-600"
                        }`}
                      />
                    </span>
                  )}
                  <span className="font-semibold text-lg">{category.name}</span>
                  {selectedCategory === category.id && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-white/30 rounded-b-2xl"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              {selectedCategoryName}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredItems.length} items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="relative h-48 bg-gray-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <Utensils className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-800">
                      {item.name}
                    </h3>
                    <p className="text-lg font-bold text-blue-600">
                      {Math.round(item.price)} DZD
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                      {categories.find((c) => c.id === item.category_id)
                        ?.name || "Uncategorized"}
                    </span>
                    <button
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No items found in this category
              </div>
            )}
          </div>
        </div>
      </div>{" "}
      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md my-12 ">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Add New Menu Item
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Description
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Price (DZD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="500 DZ"
                    className="w-full p-2  border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={Math.round(newItem.price) || ""}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Category
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newItem.category_id}
                  onChange={(e) =>
                    setNewItem({ ...newItem, category_id: e.target.value })
                  }
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    {newItem.image_url ? (
                      <div className="relative">
                        <img
                          src={newItem.image_url}
                          alt="Preview"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() =>
                            setNewItem({ ...newItem, image_url: "" })
                          }
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Utensils className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                          >
                            <span>Upload an image</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  onClick={handleAddItem}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? "Uploading..." : "Add Item"}
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  onClick={() => setShowAddItemModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}{" "}
      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md my-12 mt-16">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Add New Category
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Category Icon
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newCategory.icon}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      icon: e.target.value as CategoryIcon,
                    })
                  }
                >
                  {Object.entries(CATEGORY_ICONS).map(([icon]) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4 mb-4">
                {newCategory.icon && (
                  <span className="inline-flex items-center justify-center rounded-xl p-3 bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    {(() => {
                      const Icon = CATEGORY_ICONS[newCategory.icon];
                      return Icon ? (
                        <Icon className="w-8 h-8 text-gray-700 transform hover:scale-110 transition-transform duration-300" />
                      ) : null;
                    })()}
                  </span>
                )}
                <span className="text-gray-700 font-semibold text-lg">
                  Preview
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  onClick={handleAddCategory}
                >
                  Add Catagory
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  onClick={() => setShowAddCategoryModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm transform transition-all duration-300 scale-100 animate-fadeIn">
            <div className="text-center mb-5">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Delete Menu Item
              </h3>
              <p className="text-gray-600">
                Are you sure you want to delete this menu item? This action
                cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
                onClick={confirmDeleteItem}
              >
                Delete
              </button>
              <button
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success Item Modal */}
      {showSuccessItemModal && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-slideUp">
          <div className="bg-white rounded-xl shadow-xl p-4 flex items-center gap-3 border-l-4 border-green-500">
            <div className="bg-green-100 rounded-full p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Success!</h3>
              <p className="text-sm text-gray-600">
                Menu item has been added successfully
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Success Category Modal */}
      {showSuccessCategoryModal && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-slideUp">
          <div className="bg-white rounded-xl shadow-xl p-4 flex items-center gap-3 border-l-4 border-green-500">
            <div className="bg-green-100 rounded-full p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Success!</h3>
              <p className="text-sm text-gray-600">
                Category has been added successfully
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
