/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createBrowserClient } from "@supabase/ssr";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import Button from "../../components/ui/Button";

interface LoginFormData {
  email: string;
  password: string;
}

const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Check if user has a restaurant
      const { data: { user } = { user: null } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (!restaurant) {
        // If no restaurant exists, redirect to registration
        navigate("/register");
        return;
      }

      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-xl">
        {/* Optional: Background pattern/texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none rounded-lg"></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Spotify Logo (Placeholder) */}
          <div className="flex justify-center mb-8">
            {/* Replace with your actual logo if needed */}
            {/* <img className="h-10 w-auto" src="/your-logo.svg" alt="Your Logo" /> */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 167.6 167.6"
              className="h-10 w-auto text-green-500"
            >
              <path
                fill="currentColor"
                d="M83.8 0C37.5 0 0 37.5 0 83.8s37.5 83.8 83.8 83.8 83.8-37.5 83.8-83.8S130.1 0 83.8 0zm42.5 120.7c-2.3 3.9-7.2 5.1-11.1 2.8-16.1-9.8-36.4-12.4-62-7.9-4.3.7-8.6-1.8-9.3-6.1-.7-4.3 1.8-8.6 6.1-9.3 29.6-5 52.7-2.2 71.5 9 3.9 2.3 5.1 7.2 2.9 11.1zm10.7-21.9c-2.7 4.6-8.3 6.2-12.9 3.5-18.5-10.9-46.8-14.2-78-9.2-4.8.8-9.7-1.8-10.5-6.6-.8-4.8 1.8-9.7 6.6-10.5 34.3-5.6 65.1-2.3 86.5 10.7 4.7 2.8 6.2 8.4 3.6 13zm0-22.4c-3.1 5.2-10 6.6-15.2 3.5-22.7-14-56.9-17.7-90.6-10.5-5.5 1.1-11.2-2.3-12.2-7.9-1.1-5.5 2.3-11.2 7.9-12.2 37.4-7.3 76.3-3.9 102.6 12.1 5.2 3.1 6.6 10 3.5 15.2z"
              />
            </svg>
          </div>

          {/* Sign In / Sign Up Tabs */}
          <div className="flex justify-center mb-8 space-x-6">
            <button className="text-white text-lg font-semibold border-b-2 border-green-500 pb-1">
              SIGN IN
            </button>
            <Link
              to="/register"
              className="text-gray-400 hover:text-white text-lg font-semibold transition-colors duration-200 pb-1"
            >
              SIGN UP
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200 animate-shake mb-6">
              <AlertCircle size={16} className="text-red-700" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
                Username or email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`block w-full rounded-md border-0 bg-gray-700 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6 transition-all duration-200 p-3 ${
                    errors.email ? "ring-red-500 focus:ring-red-500" : ""
                  }`}
                  placeholder="Username or email address"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`block w-full rounded-md border-0 bg-gray-700 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6 transition-all duration-200 p-3 ${
                    errors.password ? "ring-red-500 focus:ring-red-500" : ""
                  }`}
                  placeholder="Password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me / Stay signed in */}
            {/* <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Stay signed in
              </label>
            </div> */}

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                className="flex w-full justify-center rounded-full bg-green-500 px-8 py-3 text-base font-semibold text-black shadow-md hover:bg-green-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                isLoading={isLoading}
              >
                SIGN IN
              </Button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-center">
              <a
                href="#"
                className="font-medium text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Forgot your password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
