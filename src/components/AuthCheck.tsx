import { useEffect, useState } from 'react';
import { supabase, getCurrentSession, getCurrentUser } from '../lib/supabase';

const AuthCheck = () => {
  const [authStatus, setAuthStatus] = useState<{
    isAuthenticated: boolean;
    session: any;
    user: any;
    error: string | null;
  }>({
    isAuthenticated: false,
    session: null,
    user: null,
    error: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check session
        const { session, error: sessionError } = await getCurrentSession();
        if (sessionError) throw sessionError;

        // Check user
        const { user, error: userError } = await getCurrentUser();
        if (userError) throw userError;

        setAuthStatus({
          isAuthenticated: !!session,
          session,
          user,
          error: null,
        });

        console.log('Auth Status:', {
          isAuthenticated: !!session,
          session,
          user,
        });
      } catch (error: any) {
        console.error('Auth check error:', error);
        setAuthStatus({
          isAuthenticated: false,
          session: null,
          user: null,
          error: error.message,
        });
      }
    };

    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      checkAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
      <h3 className="font-bold mb-2">Auth Status</h3>
      <div className="text-sm">
        <p>Authenticated: {authStatus.isAuthenticated ? 'Yes' : 'No'}</p>
        {authStatus.user && (
          <p>User ID: {authStatus.user.id}</p>
        )}
        {authStatus.error && (
          <p className="text-red-500">Error: {authStatus.error}</p>
        )}
      </div>
    </div>
  );
};

export default AuthCheck; 