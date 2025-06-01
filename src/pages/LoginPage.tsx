import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createBrowserClient } from '@supabase/ssr';
import { AlertCircle } from 'lucide-react';

const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        throw error;
      }

      // Check if user has a restaurant
      const { data: { user } = { user: null } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (!restaurant) {
        // If no restaurant exists, redirect to registration
        navigate('/register');
        return;
      }

      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-xl">
        {/* Optional: Background pattern/texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none rounded-lg"></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Admin Panel Title */}
          <div className="flex justify-center mb-8">
            <h2 className="text-white text-3xl font-bold">Admin Panel</h2>
          </div>

          {/* Sign In Tab */}
          <div className="flex justify-center mb-8">
            <button className="text-white text-lg font-semibold border-b-2 border-violet-500 pb-1">SIGN IN</button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 text-red-400 text-sm text-center">{error}</div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label htmlFor="email-address" className="sr-only">Username or email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border-0 bg-gray-700 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-violet-500 sm:text-sm sm:leading-6 p-3"
                placeholder="Username or email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-md border-0 bg-gray-700 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-violet-500 sm:text-sm sm:leading-6 p-3"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Stay signed in (Optional) */}
            {/* <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Stay signed in
              </label>
            </div> */}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-full bg-violet-600 px-8 py-3 text-base font-semibold text-white shadow-md hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'SIGN IN'}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-center">
              <a href="#" className="font-medium text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Forgot your password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;