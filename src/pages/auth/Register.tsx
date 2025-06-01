import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createBrowserClient } from '@supabase/ssr';
import { Mail, Lock, User, Store, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Button from '../../components/ui/Button';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  restaurantName: string;
}

const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>();
  
  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
  };
  
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account');
      
      // 2. Create restaurant
      const slug = createSlug(data.restaurantName);
      
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          name: data.restaurantName,
          slug,
          owner_id: authData.user.id,
        });
      
      if (restaurantError) throw restaurantError;
      
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold">Create your account</h2>
      
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-error/10 p-3 text-sm text-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            Your name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <User size={16} className="text-gray-400" />
            </div>
            <input
              id="name"
              type="text"
              className={`input pl-10 ${errors.name ? 'border-error' : ''}`}
              placeholder="John Doe"
              {...register('name', { required: 'Name is required' })}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs text-error">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Mail size={16} className="text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              className={`input pl-10 ${errors.email ? 'border-error' : ''}`}
              placeholder="you@example.com"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-error">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Lock size={16} className="text-gray-400" />
            </div>
            <input
              id="password"
              type="password"
              className={`input pl-10 ${errors.password ? 'border-error' : ''}`}
              placeholder="••••••••"
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-error">{errors.password.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="restaurantName" className="mb-1 block text-sm font-medium text-gray-700">
            Restaurant name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Store size={16} className="text-gray-400" />
            </div>
            <input
              id="restaurantName"
              type="text"
              className={`input pl-10 ${errors.restaurantName ? 'border-error' : ''}`}
              placeholder="My Amazing Restaurant"
              {...register('restaurantName', { required: 'Restaurant name is required' })}
            />
          </div>
          {errors.restaurantName && (
            <p className="mt-1 text-xs text-error">{errors.restaurantName.message}</p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          isLoading={isLoading}
        >
          Create account
        </Button>
        
        <div className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-500 hover:text-primary-600">
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;