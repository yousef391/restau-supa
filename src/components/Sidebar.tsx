import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  Menu,
  ShoppingCart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store
} from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [restaurant, setRestaurant] = useState<{ name: string; logo_url: string | null } | null>(null);
  const location = useLocation();

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('name, logo_url')
        .eq('owner_id', user.id)
        .single();

      setRestaurant(restaurant);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/menu', icon: Menu, label: 'Menu' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className={`h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} shadow-xl`}>
      <div className="flex flex-col h-full">
        {/* Restaurant Info */}
        <div className="p-4 border-b border-primary-700/30">
          <div className="flex items-center gap-3">
            {restaurant?.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-primary-400/30 shadow-lg"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary-400/20 flex items-center justify-center shadow-lg">
                <Store className="w-7 h-7 text-primary-200" />
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-lg truncate text-primary-50">{restaurant?.name || 'My Restaurant'}</h2>
                <p className="text-xs text-primary-200">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-primary-100 hover:bg-primary-700/50 hover:shadow-md'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-primary-200'}`} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-primary-700/30 space-y-2">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-primary-100 hover:bg-primary-700/50 hover:shadow-md transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Sign Out</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full px-3 py-2 rounded-xl text-primary-100 hover:bg-primary-700/50 hover:shadow-md transition-all duration-200"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 