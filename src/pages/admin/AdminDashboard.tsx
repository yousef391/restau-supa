import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { 
  ShoppingBag, 
  QrCode, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  LayoutDashboard 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import QRCodeGenerator from '../../components/restaurant/QRCodeGenerator';
import { Restaurant } from '../../types';

const AdminDashboard = () => {
  const { user } = useSessionContext();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orderStats, setOrderStats] = useState({
    received: 0,
    preparing: 0,
    ready: 0,
    total: 0,
  });
  const [menuStats, setMenuStats] = useState({
    categories: 0,
    items: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;
        
        // Fetch restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .single();
        
        if (restaurantError) throw restaurantError;
        
        const restaurant: Restaurant = {
          id: restaurantData.id,
          name: restaurantData.name,
          slug: restaurantData.slug,
          logoUrl: restaurantData.logo_url,
          description: restaurantData.description,
          ownerId: restaurantData.owner_id,
        };
        
        setRestaurant(restaurant);
        
        // Fetch order statistics
        const { data: receivedOrders, error: receivedError } = await supabase
          .from('orders')
          .select('id')
          .eq('restaurant_id', restaurant.id)
          .eq('status', 'received');
        
        const { data: preparingOrders, error: preparingError } = await supabase
          .from('orders')
          .select('id')
          .eq('restaurant_id', restaurant.id)
          .eq('status', 'preparing');
        
        const { data: readyOrders, error: readyError } = await supabase
          .from('orders')
          .select('id')
          .eq('restaurant_id', restaurant.id)
          .eq('status', 'ready');
        
        if (receivedError || preparingError || readyError) {
          throw new Error('Failed to fetch order statistics');
        }
        
        setOrderStats({
          received: receivedOrders?.length || 0,
          preparing: preparingOrders?.length || 0,
          ready: readyOrders?.length || 0,
          total: (receivedOrders?.length || 0) + (preparingOrders?.length || 0) + (readyOrders?.length || 0),
        });
        
        // Fetch menu statistics
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id')
          .eq('restaurant_id', restaurant.id);
        
        const { data: menuItems, error: menuItemsError } = await supabase
          .from('menu_items')
          .select('id')
          .eq('restaurant_id', restaurant.id);
        
        if (categoriesError || menuItemsError) {
          throw new Error('Failed to fetch menu statistics');
        }
        
        setMenuStats({
          categories: categories?.length || 0,
          items: menuItems?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Overview of your restaurant</p>
        </div>
      </div>
      
      {restaurant && (
        <>
          {/* Stats Overview */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-primary-100 p-3 text-primary-500">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <h3 className="text-2xl font-bold">{orderStats.received + orderStats.preparing}</h3>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/admin/orders" className="text-sm font-medium text-primary-500 hover:text-primary-600">
                  View all orders
                  <ArrowRight size={16} className="ml-1 inline" />
                </Link>
              </div>
            </div>
            
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-secondary-100 p-3 text-secondary-500">
                  <QrCode size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Menu Items</p>
                  <h3 className="text-2xl font-bold">{menuStats.items}</h3>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/admin/menu" className="text-sm font-medium text-primary-500 hover:text-primary-600">
                  Manage menu
                  <ArrowRight size={16} className="ml-1 inline" />
                </Link>
              </div>
            </div>
            
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-accent-100 p-3 text-accent-600">
                  <LayoutDashboard size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <h3 className="text-2xl font-bold">{menuStats.categories}</h3>
                </div>
              </div>
              <div className="mt-4">
                <Link to="/admin/menu" className="text-sm font-medium text-primary-500 hover:text-primary-600">
                  Manage categories
                  <ArrowRight size={16} className="ml-1 inline" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Order Status Summary */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-bold">Order Status</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="mr-3 rounded-full bg-secondary-100 p-2 text-secondary-500">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Received</p>
                    <h3 className="text-xl font-bold">{orderStats.received}</h3>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="mr-3 rounded-full bg-primary-100 p-2 text-primary-500">
                    <Clock size={20} className="animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Preparing</p>
                    <h3 className="text-xl font-bold">{orderStats.preparing}</h3>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="mr-3 rounded-full bg-success/20 p-2 text-success">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ready</p>
                    <h3 className="text-xl font-bold">{orderStats.ready}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Restaurant QR Code */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold">Restaurant QR Code</h2>
              <p className="mb-4 text-gray-600">
                Use this QR code for your restaurant. Customers can scan it to view your menu and place orders.
              </p>
              
              <div className="flex justify-center">
                <QRCodeGenerator 
                  url={`${window.location.origin}/r/${restaurant.slug}`}
                  restaurantName={restaurant.name}
                />
              </div>
            </div>
            
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold">Quick Actions</h2>
              <div className="grid gap-3">
                <Link to="/admin/menu">
                  <Button variant="outline" className="w-full justify-start">
                    <QrCode size={16} className="mr-2" />
                    Manage Menu
                  </Button>
                </Link>
                <Link to="/admin/orders">
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingBag size={16} className="mr-2" />
                    View Orders
                  </Button>
                </Link>
                <Link to="/admin/settings">
                  <Button variant="outline" className="w-full justify-start">
                    <LayoutDashboard size={16} className="mr-2" />
                    Restaurant Settings
                  </Button>
                </Link>
                <Link to={`/r/${restaurant.slug}`} target="_blank">
                  <Button variant="primary" className="w-full justify-start">
                    <QrCode size={16} className="mr-2" />
                    View Customer Menu
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;