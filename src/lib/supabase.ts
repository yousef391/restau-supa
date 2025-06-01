import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    flowType: 'pkce',
    persistSession: true,
    storageKey: 'supabase.auth.token',
    storage: {
      getItem: (key) => {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      },
      setItem: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
      },
      removeItem: (key) => {
        localStorage.removeItem(key);
      },
    },
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Prefer': 'return=representation',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Initialize session and update headers
const initializeSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      supabase.rest.headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${session.access_token}`,
        'Prefer': 'return=representation',
      };
    }
  } catch (error) {
    console.error('Error initializing session:', error);
  }
};

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    supabase.rest.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${session.access_token}`,
      'Prefer': 'return=representation',
    };
  }
});

// Initialize session on load
initializeSession();

// Auth helpers
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { data: null, error };
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
};

// Get current session
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    console.error('Get session error:', error);
    return { session: null, error };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    console.error('Get user error:', error);
    return { user: null, error };
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const { session } = await getCurrentSession();
    return !!session;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

// Restaurant helpers
export const getRestaurantByOwner = async (ownerId: string) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', ownerId)
      .single();

    if (error) {
      console.error('Error fetching restaurant:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getRestaurantByOwner:', error);
    return { data: null, error };
  }
};

export const ensureRestaurantExists = async (ownerId: string) => {
  // First try to get existing restaurant
  const { data: existingRestaurant, error: fetchError } = await getRestaurantByOwner(ownerId);
  
  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
    throw fetchError;
  }
  
  if (existingRestaurant) {
    return { data: existingRestaurant, error: null };
  }
  
  // If no restaurant exists, create one
  const { data: newRestaurant, error: createError } = await createRestaurant({
    name: 'My Restaurant',
    slug: `restaurant-${ownerId.slice(0, 8)}`,
    description: 'Welcome to my restaurant!',
    owner_id: ownerId,
  });
  
  return { data: newRestaurant, error: createError };
};

export const createRestaurant = async (restaurant: {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  owner_id: string;
}) => {
  const { data, error } = await supabase
    .from('restaurants')
    .insert(restaurant)
    .select()
    .single();
  return { data, error };
};

// Menu helpers
export const getCategories = async (restaurantId: string) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('display_order', { ascending: true });
  return { data, error };
};

export const createCategory = async (category: {
  name: string;
  display_order: number;
  restaurant_id: string;
}) => {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();
  return { data, error };
};

export const updateCategory = async (categoryId: string, updates: {
  name?: string;
  display_order?: number;
}) => {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single();
  return { data, error };
};

export const deleteCategory = async (categoryId: string) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);
  return { error };
};

export const getMenuItems = async (restaurantId: string) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId);
  return { data, error };
};

export const createMenuItem = async (menuItem: {
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  available: boolean;
  category_id: string;
  restaurant_id: string;
}) => {
  const { data, error } = await supabase
    .from('menu_items')
    .insert(menuItem)
    .select()
    .single();
  return { data, error };
};

export const updateMenuItem = async (menuItemId: string, updates: {
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  available?: boolean;
  category_id?: string;
}) => {
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', menuItemId)
    .select()
    .single();
  return { data, error };
};

export const deleteMenuItem = async (menuItemId: string) => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', menuItemId);
  return { error };
};

// Order helpers
export const getOrders = async (restaurantId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (
          name
        )
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const updateOrderStatus = async (orderId: string, status: 'received' | 'preparing' | 'ready') => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();
  return { data, error };
};

// Real-time subscriptions
export const subscribeToOrders = (restaurantId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('orders-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToMenuItems = (restaurantId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('menu-items-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'menu_items',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToCategories = (restaurantId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('categories-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'categories',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      callback
    )
    .subscribe();
};

// Dashboard helpers
export const getTodayOrders = async (restaurantId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const getTodayStats = async (restaurantId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('orders')
    .select('total, status')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', today.toISOString());
  
  if (error) return { data: null, error };
  
  const stats = {
    totalOrders: data.length,
    totalRevenue: data.reduce((sum, order) => sum + order.total, 0),
    ordersByStatus: {
      received: data.filter(order => order.status === 'received').length,
      preparing: data.filter(order => order.status === 'preparing').length,
      ready: data.filter(order => order.status === 'ready').length,
    }
  };
  
  return { data: stats, error: null };
};

export const getRecentOrders = async (restaurantId: string, limit: number = 5) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (
          name
        )
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return { data, error };
};

export const getPopularItems = async (restaurantId: string, limit: number = 5) => {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      menu_item_id,
      menu_items (
        name,
        price
      ),
      count:quantity
    `)
    .eq('menu_items.restaurant_id', restaurantId)
    .order('count', { ascending: false })
    .limit(limit);
  
  return { data, error };
};

// Logo management helpers
export const uploadRestaurantLogo = async (file: File, restaurantId: string) => {
  try {
    console.log('Starting logo upload for restaurant:', restaurantId);

    // Get current session
    const { session, error: sessionError } = await getCurrentSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('No active session found. Please sign in again.');

    // Get current user
    const { user, error: userError } = await getCurrentUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not found. Please sign in again.');

    console.log('Current user:', user.id);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 2MB');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${restaurantId}/logo.${fileExt}`;
    console.log('File name for upload:', fileName);

    // First, try to delete any existing logo
    try {
      await supabase.storage
        .from('restaurant-logos')
        .remove([fileName]);
      console.log('Successfully removed existing logo if any');
    } catch (error) {
      console.log('No existing logo to delete or error:', error);
    }

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('restaurant-logos')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }
    console.log('Successfully uploaded file to storage:', uploadData);

    // Get signed URL that expires in 1 year
    const { data: { signedUrl }, error: signedUrlError } = await supabase.storage
      .from('restaurant-logos')
      .createSignedUrl(fileName, 31536000); // 1 year in seconds

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      throw new Error(`Failed to get signed URL: ${signedUrlError.message}`);
    }

    console.log('Generated signed URL:', signedUrl);

    // First verify the restaurant exists and belongs to the user
    const { data: existingRestaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .eq('owner_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching restaurant:', fetchError);
      throw new Error(`Restaurant not found or you don't have permission: ${fetchError.message}`);
    }
    console.log('Found restaurant:', existingRestaurant);

    // Update restaurant record with the new logo URL
    const { data: restaurant, error: updateError } = await supabase
      .from('restaurants')
      .update({ 
        logo_url: signedUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', restaurantId)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      // Try to get more details about the error
      const { data: errorDetails } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('owner_id', user.id)
        .single();
      console.log('Current restaurant data:', errorDetails);
      throw new Error(`Failed to update restaurant: ${updateError.message}`);
    }

    // Verify the update was successful
    const { data: verifyRestaurant, error: verifyError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .eq('owner_id', user.id)
      .single();

    if (verifyError) {
      console.error('Verification error:', verifyError);
      throw new Error(`Failed to verify update: ${verifyError.message}`);
    }

    if (!verifyRestaurant.logo_url) {
      throw new Error('Logo URL was not saved in the database');
    }

    console.log('Successfully updated restaurant with new logo URL:', verifyRestaurant);
    return { data: verifyRestaurant, error: null };
  } catch (error) {
    console.error('Logo upload error:', error);
    return { data: null, error };
  }
};

export const deleteRestaurantLogo = async (restaurantId: string) => {
  try {
    // Get current logo URL
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('logo_url')
      .eq('id', restaurantId)
      .single();

    if (fetchError) throw fetchError;

    if (restaurant?.logo_url) {
      // Extract file path from URL
      const urlParts = restaurant.logo_url.split('/');
      const fileName = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('restaurant-logos')
        .remove([fileName]);

      if (deleteError) throw deleteError;
    }

    // Update restaurant record
    const { data: updatedRestaurant, error: updateError } = await supabase
      .from('restaurants')
      .update({ logo_url: null })
      .eq('id', restaurantId)
      .select()
      .single();

    if (updateError) throw updateError;

    return { data: updatedRestaurant, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getRestaurantLogo = async (restaurantId: string) => {
  try {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('logo_url')
      .eq('id', restaurantId)
      .single();

    if (error) throw error;

    return { data: restaurant?.logo_url, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Add a new function to update restaurant settings
export const updateRestaurantSettings = async (restaurantId: string, updates: {
  name?: string;
  description?: string;
  logo_url?: string;
}) => {
  try {
    console.log('Updating restaurant settings:', { restaurantId, updates });

    // First verify the restaurant exists
    const { data: existingRestaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (fetchError) {
      console.error('Error fetching restaurant:', fetchError);
      throw new Error(`Restaurant not found: ${fetchError.message}`);
    }

    // Update restaurant record
    const { data: restaurant, error: updateError } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', restaurantId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update restaurant: ${updateError.message}`);
    }

    // Verify the update was successful
    const { data: verifyRestaurant, error: verifyError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (verifyError) {
      console.error('Verification error:', verifyError);
      throw new Error(`Failed to verify update: ${verifyError.message}`);
    }

    console.log('Successfully updated restaurant settings:', verifyRestaurant);
    return { data: verifyRestaurant, error: null };
  } catch (error) {
    console.error('Settings update error:', error);
    return { data: null, error };
  }
};

// Add a new function to refresh the logo URL
export const refreshLogoUrl = async (restaurantId: string) => {
  try {
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (fetchError) throw fetchError;
    if (!restaurant?.logo_url) return { data: null, error: null };

    // Extract file path from URL
    const urlParts = restaurant.logo_url.split('/');
    const fileName = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1];

    // Get new signed URL
    const { data: { signedUrl }, error: signedUrlError } = await supabase.storage
      .from('restaurant-logos')
      .createSignedUrl(fileName, 31536000);

    if (signedUrlError) throw signedUrlError;

    // Update restaurant with new URL
    const { data: updatedRestaurant, error: updateError } = await supabase
      .from('restaurants')
      .update({ 
        logo_url: signedUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', restaurantId)
      .select()
      .single();

    if (updateError) throw updateError;

    return { data: updatedRestaurant, error: null };
  } catch (error) {
    console.error('Refresh logo URL error:', error);
    return { data: null, error };
  }
};

export const uploadRestaurantBanner = async (file: File, restaurantId: string) => {
  try {
    console.log('Starting banner upload for restaurant:', restaurantId);

    // Get current session
    const { session, error: sessionError } = await getCurrentSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('No active session found. Please sign in again.');

    // Get current user
    const { user, error: userError } = await getCurrentUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not found. Please sign in again.');

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 2MB');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${restaurantId}/banner.${fileExt}`;
    console.log('File name for upload:', fileName);

    // First, try to delete any existing banner
    try {
      await supabase.storage
        .from('restaurant-logos')
        .remove([fileName]);
      console.log('Successfully removed existing banner if any');
    } catch (error) {
      console.log('No existing banner to delete or error:', error);
    }

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('restaurant-logos')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload banner: ${uploadError.message}`);
    }
    console.log('Successfully uploaded file to storage:', uploadData);

    // Get signed URL that expires in 1 year
    const { data: { signedUrl }, error: signedUrlError } = await supabase.storage
      .from('restaurant-logos')
      .createSignedUrl(fileName, 31536000); // 1 year in seconds

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      throw new Error(`Failed to get signed URL: ${signedUrlError.message}`);
    }

    console.log('Generated signed URL:', signedUrl);

    // First verify the restaurant exists and belongs to the user
    const { data: existingRestaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .eq('owner_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching restaurant:', fetchError);
      throw new Error(`Restaurant not found or you don't have permission: ${fetchError.message}`);
    }
    console.log('Found restaurant:', existingRestaurant);

    // Update restaurant record with the new banner URL
    const { data: restaurant, error: updateError } = await supabase
      .from('restaurants')
      .update({ 
        banner_url: signedUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', restaurantId)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update restaurant: ${updateError.message}`);
    }

    // Verify the update was successful
    const { data: verifyRestaurant, error: verifyError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .eq('owner_id', user.id)
      .single();

    if (verifyError) {
      console.error('Verification error:', verifyError);
      throw new Error(`Failed to verify update: ${verifyError.message}`);
    }

    if (!verifyRestaurant.banner_url) {
      throw new Error('Banner URL was not saved in the database');
    }

    console.log('Successfully updated restaurant with new banner URL:', verifyRestaurant);
    return { data: verifyRestaurant, error: null };
  } catch (error) {
    console.error('Banner upload error:', error);
    return { data: null, error };
  }
};

export const deleteRestaurantBanner = async (restaurantId: string) => {
  try {
    // Get the current banner URL
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('banner_url')
      .eq('id', restaurantId)
      .single();

    if (fetchError) throw fetchError;

    if (restaurant?.banner_url) {
      // Extract the file path from the URL
      const url = new URL(restaurant.banner_url);
      const filePath = url.pathname.split('/').pop();

      if (filePath) {
        // Delete the file from storage
        const { error: deleteError } = await supabase.storage
          .from('restaurants')
          .remove([`banners/${filePath}`]);

        if (deleteError) throw deleteError;
      }
    }

    // Update the restaurant record
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ banner_url: null })
      .eq('id', restaurantId);

    if (updateError) throw updateError;

    return { error: null };
  } catch (error) {
    console.error('Error deleting banner:', error);
    return { error };
  }
};