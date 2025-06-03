import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { StaffMember } from "../../types";

// Placeholder for any UI components you might need (e.g., modals, forms)
// import { Button, Input, Modal, Form } from '../components/ui';

const ServerManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [servers, setServers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
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
      setIsAddServerModalOpen(false);
      fetchServers(); // Refresh the server list
    }
    setLoading(false);
  };

  const handleResetPassword = async (server: StaffMember) => {
    const newPassword = prompt(`Enter new password for ${server.email}:`);
    if (!newPassword) return;

    setLoading(true);
    setError(null);

    // You might need a different RPC or approach for password reset
    // This is a placeholder - password reset logic needs to be implemented securely
    // For now, I'll use the crypt function directly, but this is NOT secure for a real application
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
      // Optional: Fetch servers again if password reset affects display (unlikely)
    }
    setLoading(false);
  };

  // Placeholder for generating salt (you might need a proper library)
  const genSalt = (rounds: number) => {
    // In a real app, use a secure library to generate a salt
    return `rounds=${rounds}${Math.random().toString(36).substring(2)}`;
  };

  const handleDeleteServer = async (server: StaffMember) => {
    if (!confirm(`Are you sure you want to delete server ${server.email}?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("servers")
      .delete()
      .eq("id", server.id);

    if (error) {
      console.error("Error deleting server:", error);
      setError(`Failed to delete server: ${error.message}`);
    } else {
      console.log("Server deleted successfully:", server.email);
      fetchServers(); // Refresh the server list
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Server Management</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <button
        onClick={() => setIsAddServerModalOpen(true)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        disabled={loading}
      >
        Add New Server
      </button>

      {/* Basic Server List */}
      {loading ? (
        <p>Loading servers...</p>
      ) : servers.length === 0 ? (
        <p>No servers found.</p>
      ) : (
        <ul className="bg-white shadow rounded-lg divide-y divide-gray-200">
          {servers.map((server) => (
            <li
              key={server.id}
              className="p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-gray-900 font-semibold">{server.email}</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleResetPassword(server)}
                  className="text-yellow-600 hover:text-yellow-900"
                  disabled={loading}
                >
                  Reset Password
                </button>
                <button
                  onClick={() => handleDeleteServer(server)}
                  className="text-red-600 hover:text-red-900"
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Basic Add Server Modal (using prompt for simplicity) */}
      {/* Replace with a proper modal component later if needed */}
      {isAddServerModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Add New Server</h3>
            <form onSubmit={handleAddServer}>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="name"
                >
                  Name
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="name"
                  type="text"
                  placeholder="Server Name"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="email"
                  type="email"
                  placeholder="Server Email"
                  value={newServerEmail}
                  onChange={(e) => setNewServerEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-6">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                  id="password"
                  type="password"
                  placeholder="******************"
                  value={newServerPassword}
                  onChange={(e) => setNewServerPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Server"}
                </button>
                <button
                  className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                  type="button"
                  onClick={() => setIsAddServerModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerManagementPage;
