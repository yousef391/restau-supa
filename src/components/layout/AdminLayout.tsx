import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  UtensilsCrossed, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Utensils,
  ChevronDown 
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Menu Management', path: '/admin/menu', icon: <UtensilsCrossed size={20} /> },
    { label: 'Orders', path: '/admin/orders', icon: <ClipboardList size={20} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white transition duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center">
            <Utensils className="mr-2 h-6 w-6 text-primary-500" />
            <span className="text-lg font-bold">QR Menu</span>
          </div>
          <button 
            className="rounded p-1 hover:bg-gray-100 lg:hidden"
            onClick={toggleSidebar}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="mt-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-500'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-500">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="ml-2 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-700">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          <button 
            className="rounded p-1 hover:bg-gray-100 lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center ml-auto">
            <div className="relative">
              <button className="flex items-center rounded-full py-1 pl-2 pr-1 text-sm hover:bg-gray-100">
                <span className="mr-1">My Restaurant</span>
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </header>
        
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;