import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { StaffMember } from "../../types";
import { Plus } from "lucide-react";
import Button from "../../components/ui/Button";

const ServerManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [servers, setServers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewServerModal, setShowNewServerModal] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [newServerEmail, setNewServerEmail] = useState("");
  const [newServerPassword, setNewServerPassword] = useState("");

  useEffect(() => {
    if (user) {
      fetchServers();
    }
  }, [user]);

  const fetchServers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("servers")
      .select("id, email, restaurant_id, name, created_at, updated_at"); // Select all StaffMember fields

    if (error) {
      console.error("Error fetching servers:", error);
      setError("Failed to fetch servers.");
    } else {
      setServers(data || []);
      setError(null);
    }
    setLoading(false);
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!newServerName || !newServerEmail || !newServerPassword) {
      setError("Name, email, and password are required.");
      setLoading(false);
      return;
    }

    // Get the current restaurant ID from the user's session
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to add servers.");
      setLoading(false);
      return;
    }

    // Get the restaurant ID for the current user
    const { data: restaurantData, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (restaurantError || !restaurantData) {
      setError("Could not find restaurant for the current user.");
      setLoading(false);
      return;
    }

    // Call the RPC to create the server with password hashing
    const { data, error } = await supabase.rpc("create_server_with_password", {
      p_restaurant_id: restaurantData.id,
      p_name: newServerName,
      server_email: newServerEmail,
      server_password: newServerPassword,
    });

    if (error) {
      console.error("Error adding server:", error);
      setError(`Failed to add server: ${error.message}`);
    } else {
      console.log("Server added successfully:", data);
      setNewServerName("");
      setNewServerEmail("");
      setNewServerPassword("");
      setShowNewServerModal(false);
      fetchServers(); // Refresh the server list
    }
    setLoading(false);
  };
  const handleResetServerPassword = async (serverId: string) => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return;

    const newPassword = prompt(`Enter new password for ${server.email}:`);
    if (!newPassword) return;

    setLoading(true);
    setError(null);

    const { data: hashedPassword, error: hashError } = await supabase.rpc(
      "crypt",
      { password: newPassword, salt: genSalt(16) }
    );

    if (hashError) {
      console.error("Error hashing password:", hashError);
      setError("Failed to hash password.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("servers")
      .update({ password: hashedPassword })
      .eq("id", server.id);

    if (error) {
      console.error("Error resetting password:", error);
      setError(`Failed to reset password: ${error.message}`);
    } else {
      console.log("Password reset successfully for", server.email);
    }
    setLoading(false);
  };

  // Placeholder for generating salt (you might need a proper library)
  const genSalt = (rounds: number) => {
    // In a real app, use a secure library to generate a salt
    return `rounds=${rounds}${Math.random().toString(36).substring(2)}`;
  };
  const handleDeleteServer = async (serverId: string) => {
    if (!confirm(`Are you sure you want to delete this server?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("servers")
      .delete()
      .eq("id", serverId);

    if (error) {
      console.error("Error deleting server:", error);
      setError(`Failed to delete server: ${error.message}`);
    } else {
      console.log("Server deleted successfully");
      fetchServers(); // Refresh the server list
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6">
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Server Management Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Servers</h2>
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Manage Servers
                </h4>
                <p className="text-sm text-gray-500">
                  Add and manage servers who can create orders
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowNewServerModal(true)}
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Server
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading servers...</p>
              </div>
            ) : servers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No servers found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {servers.map((server) => (
                  <div
                    key={server.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-medium">
                        {server.name || server.email}
                      </p>
                      <p className="text-sm text-gray-500">{server.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetServerPassword(server.id)}
                        disabled={loading}
                      >
                        Reset Password
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteServer(server.id)}
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Server Modal */}
      {showNewServerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Add New Server
            </h3>
            <form onSubmit={handleAddServer}>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-gray-700"
                    htmlFor="name"
                  >
                    Name
                  </label>
                  <input
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    id="name"
                    type="text"
                    placeholder="Server Name"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-gray-700"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    id="email"
                    type="email"
                    placeholder="Server Email"
                    value={newServerEmail}
                    onChange={(e) => setNewServerEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-gray-700"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <input
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={newServerPassword}
                    onChange={(e) => setNewServerPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => {}}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Adding..." : "Add Server"}
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => setShowNewServerModal(false)}
                    type="button"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerManagementPage;
