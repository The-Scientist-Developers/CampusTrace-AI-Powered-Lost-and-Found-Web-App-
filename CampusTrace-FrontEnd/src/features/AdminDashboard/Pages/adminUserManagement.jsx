import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { Search, Loader2 } from "lucide-react";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const UserCard = ({ user, changeRole, toggleBan }) => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-4 space-y-4">
    <div className="flex items-center gap-4">
      <img
        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.full_name || user.email
        )}&background=eef2ff&color=4338ca`}
        alt={user.full_name || user.email}
        className="w-12 h-12 rounded-full"
      />
      <div className="flex-1">
        <p className="font-bold text-neutral-800 dark:text-white">
          {user.full_name || "No Name"}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {user.email}
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 text-sm border-y border-neutral-200 dark:border-neutral-800 py-3">
      <div>
        <p className="text-neutral-500 dark:text-neutral-500">Role</p>
        <p className="font-semibold text-neutral-800 dark:text-white">
          {user.role}
        </p>
      </div>
      <div>
        <p className="text-neutral-500 dark:text-neutral-500">Status</p>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.is_banned
              ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
              : "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
          }`}
        >
          {user.is_banned ? "Banned" : "Active"}
        </span>
      </div>
    </div>

    <div className="flex gap-2">
      <select
        value={user.role || "member"}
        onChange={(e) => changeRole(user.id, e.target.value)}
        className="form-select flex-1"
      >
        <option value="member">Member</option>
        <option value="moderator">Moderator</option>
        <option value="admin">Admin</option>
      </select>
      <button
        onClick={() => toggleBan(user.id, user.is_banned)}
        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
          user.is_banned
            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/30"
            : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30"
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
      <div className="flex justify-center items-center h-full p-8 text-neutral-500 dark:text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        Loading User Management...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">
            User Management
          </h2>
          <p className="text-neutral-500 dark:text-zinc-400 mt-1">
            Manage users and roles for your university
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input w-full pl-10"
          />
        </div>
      </div>

      <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-lg border border-neutral-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-zinc-800/50 border-b border-neutral-200 dark:border-zinc-800">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-zinc-400">
                User
              </th>
              <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-zinc-400">
                Role
              </th>
              <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-zinc-400">
                Status
              </th>
              <th className="text-center p-4 text-sm font-semibold text-neutral-600 dark:text-zinc-400">
                Items Posted
              </th>
              <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-zinc-800">
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="text-center p-8 text-neutral-500 dark:text-zinc-500"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-neutral-50 dark:hover:bg-zinc-800/30"
                >
                  <td className="p-4 align-top">
                    <div>
                      <div className="text-neutral-800 dark:text-white font-medium">
                        {user.full_name || "No name"}
                      </div>
                      <div className="text-neutral-500 dark:text-zinc-400 text-sm">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <select
                      value={user.role || "member"}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="form-select"
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
                          ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
                          : "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
                      }`}
                    >
                      {user.is_banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-800 dark:text-white text-center align-top">
                    {user.items?.[0]?.count || 0}
                  </td>
                  <td className="p-4 align-top">
                    <button
                      onClick={() => toggleBan(user.id, user.is_banned)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        user.is_banned
                          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/30"
                          : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30"
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

      <div className="block md:hidden space-y-4">
        {users.length === 0 ? (
          <div className="text-center p-8 text-neutral-500 dark:text-zinc-500">
            No users found.
          </div>
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
    </div>
  );
}
