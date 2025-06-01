import { Outlet, Navigate } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Utensils } from 'lucide-react';
import LoadingScreen from '../ui/LoadingScreen';

const AuthLayout = () => {
  const { session, isLoading } = useSessionContext();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (session) {
    return <Navigate to="/admin/dashboard\" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="m-auto w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center">
          <Utensils className="mb-2 h-12 w-12 text-primary-500" />
          <h1 className="text-center text-2xl font-bold text-gray-900">QR Menu</h1>
          <p className="text-center text-gray-600">Restaurant management made simple</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;