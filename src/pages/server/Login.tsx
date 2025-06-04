import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Button from "../../components/ui/Button";
import { AlertCircle, Mail, Lock, Utensils } from "lucide-react";

const ServerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("Attempting server login with:", { email });

      const { data, error } = await supabase.rpc("authenticate_server", {
        p_email: email,
        p_password: password,
      });

      console.log("Server login response:", { data, error });

      if (error) {
        console.error("Server login error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error("No server data returned");
        throw new Error("Invalid email or password");
      }

      const server = data[0];
      console.log("Server authenticated:", server);

      // Store server info in localStorage
      localStorage.setItem("server", JSON.stringify(server));

      // Redirect to server dashboard
      navigate(`/server/${server.restaurant_id}/dashboard`);
    } catch (err) {
      console.error("Server login error:", err);
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-md rounded-xl bg-gray-800 p-8 shadow-xl">
        {/* Background pattern/texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none rounded-xl"></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo and Title */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary-400/20 flex items-center justify-center shadow-lg mb-4">
              <Utensils className="w-8 h-8 text-primary-200" />
            </div>
            <h2 className="text-white text-3xl font-bold">Server Login</h2>
            <p className="text-primary-200 text-sm mt-1">
              Manage orders and tables
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-md bg-red-900/30 p-3 text-sm text-red-300 border border-red-800 animate-shake">
              <AlertCircle size={16} className="text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-lg border-0 bg-gray-700 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6 p-3 pl-12 transition-all duration-200"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-lg border-0 bg-gray-700 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6 p-3 pl-12 transition-all duration-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                isLoading={loading}
                className="w-full justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-3 text-base font-semibold text-white shadow-lg hover:shadow-primary-500/30 hover:from-primary-600 hover:to-primary-700 focus-visible:outline-primary-600 transition-all duration-200"
              >
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServerLogin;
