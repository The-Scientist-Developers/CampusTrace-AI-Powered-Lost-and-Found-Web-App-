import React, { useState, useEffect } from "react";
import { supabase } from "../../../api/apiClient";
import {
  Search,
  Shield,
  Ban,
  User,
  Settings as SettingsIcon,
} from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          *,
          items:items(count)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Simple ban/unban function
  const toggleBan = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      fetchUsers(); // Refresh list
    } catch (error) {
      alert("Action failed");
    }
  };

  // Change user role
  const changeRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      alert("Role updated successfully");
      fetchUsers();
    } catch (error) {
      alert("Failed to update role");
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8 text-zinc-400">
        <SettingsIcon className="w-8 h-8 animate-spin mr-3" />
        Loading User Managemnt...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <p className="text-zinc-400 mt-1">Manage users and their roles</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800/50 border-b border-zinc-800">
            <tr>
              <th className="text-left p-4 text-zinc-400 font-medium">User</th>
              <th className="text-left p-4 text-zinc-400 font-medium">Role</th>
              <th className="text-left p-4 text-zinc-400 font-medium">
                Status
              </th>
              <th className="text-left p-4 text-zinc-400 font-medium">Items</th>
              <th className="text-left p-4 text-zinc-400 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center p-8 text-zinc-500">
                  Loading...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-8 text-zinc-500">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-zinc-800 hover:bg-zinc-800/30"
                >
                  <td className="p-4">
                    <div>
                      <div className="text-white font-medium">
                        {user.full_name || "No name"}
                      </div>
                      <div className="text-zinc-400 text-sm">{user.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={user.role || "user"}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_banned
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {user.is_banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="p-4 text-white">
                    {user.items?.[0]?.count || 0}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleBan(user.id, user.is_banned)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        user.is_banned
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      }`}
                    >
                      {user.is_banned ? "Unban" : "Ban"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Simple Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-zinc-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-zinc-400 text-sm">Admins</p>
              <p className="text-2xl font-bold text-white">
                {users.filter((u) => u.role === "admin").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <div className="flex items-center gap-3">
            <Ban className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-zinc-400 text-sm">Banned</p>
              <p className="text-2xl font-bold text-white">
                {users.filter((u) => u.is_banned).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
