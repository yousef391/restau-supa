import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Menu, 
  ShoppingCart, 
  Settings,
  LogOut,
  Store
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/menu', icon: Menu, label: 'Menu' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/servers', icon: Settings, label: 'Server Management' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="h-screen w-64 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Restaurant Info */}
          <div className="p-4 border-b border-primary-700/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-400/20 flex items-center justify-center shadow-lg">
                <Store className="w-7 h-7 text-primary-200" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-lg truncate text-primary-50">My Restaurant</h2>
                <p className="text-xs text-primary-200">Admin Panel</p>
              </div>
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
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-primary-200'}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-primary-700/30 space-y-2">
            <button
              onClick={() => {/* Add sign out logic */}}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-primary-100 hover:bg-primary-700/50 hover:shadow-md transition-all duration-200"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 