import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/apiClient";
import { toast } from "react-hot-toast"; // For notifications
import {
  Search,
  Shield,
  Ban,
  User,
  Settings as SettingsIcon,
} from "lucide-react";

// Debounce hook to prevent API calls on every keystroke
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function UserManagement({ user }) {
  // <-- Prop is named 'user'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchUsers = useCallback(async () => {
    // Check if the user object is available before fetching
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: adminProfile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", user.id) // <-- CORRECTED: Use 'user.id'
        .single();

      if (profileError) throw profileError;
      const adminUniversityId = adminProfile.university_id;

      if (!adminUniversityId) {
        throw new Error("Admin university ID not found.");
      }

      let query = supabase
        .from("profiles")
        .select(`*, items:items(count)`)
        .eq("university_id", adminUniversityId)
        .order("created_at", { ascending: false });

      if (debouncedSearchTerm) {
        query = query.or(
          `full_name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, user?.id]); // <-- CORRECTED: Use 'user?.id'

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdate = async (userId, updateData) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId)
        .select() // Use select() to get the updated row back
        .single();

      if (error) throw error;

      setUsers((currentUsers) =>
        currentUsers.map((u) => (u.id === userId ? data : u))
      );
      toast.success("User updated successfully!");
    } catch (error) {
      console.error("Action failed:", error);
      toast.error("Action failed.");
    }
  };

  const toggleBan = (userId, currentStatus) =>
    handleUpdate(userId, { is_banned: !currentStatus });
  const changeRole = (userId, newRole) =>
    handleUpdate(userId, { role: newRole });

  // The JSX part of your component is already correct and doesn't need changes.
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <p className="text-zinc-400 mt-1">
          Manage users and their roles for your university
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500"
        />
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800/50 border-b border-zinc-800">
            <tr>
              <th className="text-left p-4 text-zinc-400 font-medium">User</th>
              <th className="text-left p-4 text-zinc-400 font-medium">Role</th>
              <th className="text-left p-4 text-zinc-400 font-medium">
                Status
              </th>
              <th className="text-left p-4 text-zinc-400 font-medium">
                Items Posted
              </th>
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
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-8 text-zinc-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
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
                      value={user.role || "member"} // changed from user to member
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    >
                      <option value="member">Member</option> // changed from
                      user to member
                      <option value="moderator">Moderator</option>
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
                  <td className="p-4 text-white text-center">
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
    </div>
  );
}
