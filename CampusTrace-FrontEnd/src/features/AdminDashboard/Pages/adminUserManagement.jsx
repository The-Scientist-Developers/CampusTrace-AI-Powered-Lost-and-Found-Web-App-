import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
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
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- NEW: A card component for the mobile view ---
const UserCard = ({ user, changeRole, toggleBan }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg p-4 space-y-4">
    {/* User Info */}
    <div className="flex items-center gap-4">
      <img
        src={`https://ui-avatars.com/api/?name=${
          user.full_name || user.email
        }&background=27272a&color=a3a3a3`}
        alt={user.full_name || user.email}
        className="w-12 h-12 rounded-full"
      />
      <div className="flex-1">
        <p className="font-bold text-white">{user.full_name || "No Name"}</p>
        <p className="text-sm text-neutral-400">{user.email}</p>
      </div>
    </div>

    {/* Stats and Status */}
    <div className="grid grid-cols-2 gap-4 text-sm border-y border-neutral-800 py-3">
      <div>
        <p className="text-neutral-500">Role</p>
        <p className="font-semibold text-white">{user.role}</p>
      </div>
      <div>
        <p className="text-neutral-500">Status</p>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.is_banned
              ? "bg-red-500/20 text-red-400"
              : "bg-green-500/20 text-green-400"
          }`}
        >
          {user.is_banned ? "Banned" : "Active"}
        </span>
      </div>
    </div>

    {/* Actions */}
    <div className="flex gap-2">
      <select
        value={user.role || "member"}
        onChange={(e) => changeRole(user.id, e.target.value)}
        className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm"
      >
        <option value="member">Member</option>
        <option value="moderator">Moderator</option>
        <option value="admin">Admin</option>
      </select>
      <button
        onClick={() => toggleBan(user.id, user.is_banned)}
        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
          user.is_banned
            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
        }`}
      >
        {user.is_banned ? "Unban" : "Ban"}
      </button>
    </div>
  </div>
);

export default function UserManagement({ user: sessionUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchUsers = useCallback(async () => {
    if (!sessionUser?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: adminProfile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", sessionUser.id)
        .single();

      if (profileError) throw profileError;
      const adminUniversityId = adminProfile.university_id;

      if (!adminUniversityId) throw new Error("Admin university ID not found.");

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
  }, [debouncedSearchTerm, sessionUser?.id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdate = async (userId, updateData) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId)
        .select()
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8 text-zinc-400">
        <SettingsIcon className="w-8 h-8 animate-spin mr-3" />
        Loading User Management...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Search - now responsive */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-zinc-400 mt-1">
            Manage users and roles for your university
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500"
          />
        </div>
      </div>

      {/* --- RENDER LOGIC: Table for Desktop, Cards for Mobile --- */}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800/50 border-b border-zinc-800">
            <tr>
              <th className="text-left p-4 text-zinc-400 font-medium">User</th>
              <th className="text-left p-4 text-zinc-400 font-medium">Role</th>
              <th className="text-left p-4 text-zinc-400 font-medium">
                Status
              </th>
              <th className="text-center p-4 text-zinc-400 font-medium">
                Items Posted
              </th>
              <th className="text-left p-4 text-zinc-400 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-8 text-zinc-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-zinc-800 last:border-b-0 hover:bg-zinc-800/30"
                >
                  <td className="p-4 align-top">
                    <div>
                      <div className="text-white font-medium">
                        {user.full_name || "No name"}
                      </div>
                      <div className="text-zinc-400 text-sm">{user.email}</div>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <select
                      value={user.role || "member"}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    >
                      <option value="member">Member</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4 align-top">
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
                  <td className="p-4 text-white text-center align-top">
                    {user.items?.[0]?.count || 0}
                  </td>
                  <td className="p-4 align-top">
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

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {users.length === 0 ? (
          <div className="text-center p-8 text-zinc-500">No users found.</div>
        ) : (
          users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              changeRole={changeRole}
              toggleBan={toggleBan}
            />
          ))
        )}
      </div>

      {/* Pagination would go here */}
    </div>
  );
}
