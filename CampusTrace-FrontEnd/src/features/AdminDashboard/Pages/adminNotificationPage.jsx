import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { Bell, CheckCheck, MailOpen, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

// --- 1. SKELETON IMPORTS ---
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// --- (No changes to timeAgo function) ---
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)} years ago`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)} months ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)} days ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)} hours ago`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)} minutes ago`;
  return `${Math.floor(seconds)} seconds ago`;
};

// --- 2. SKELETON COMPONENTS ---

const NotificationItemSkeleton = () => (
  <div className="p-4 flex items-start gap-4">
    <div className="flex-shrink-0 mt-1.5">
      <Skeleton circle width={10} height={10} /> {/* Unread dot */}
    </div>
    <div className="flex-grow">
      <Skeleton height={20} width="80%" /> {/* Message */}
      <Skeleton height={16} width="30%" className="mt-1" /> {/* Time ago */}
    </div>
    <div className="flex-shrink-0 flex items-center gap-2">
      <Skeleton circle width={36} height={36} />{" "}
      {/* Mark as read button (p-2) */}
      <Skeleton width={45} height={26} borderRadius={6} /> {/* View button */}
    </div>
  </div>
);

const AdminNotificationsPageSkeleton = () => (
  <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      {/* Title */}
      <Skeleton height={40} width={300} />
      {/* Mark all button */}
      <Skeleton height={38} width={180} borderRadius={6} />
    </div>
    {/* List container */}
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm divide-y divide-neutral-200 dark:divide-[#3a3a3a]">
      {[...Array(6)].map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default function AdminNotificationPage({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    // --- (No changes to the fetch logic itself) ---
    if (!user?.id) {
      setLoading(false);
      setError("User not found. Please log in again.");
      return;
    }
    setLoading(true); // Keep setLoading(true) here
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications.");
      toast.error("Could not load notifications.");
    } finally {
      // --- 3. 2-SECOND DELAY ADDED ---
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // --- (No changes to handlers: handleMarkAsRead, handleMarkAllAsRead) ---
  const handleMarkAsRead = async (notificationId) => {
    try {
      // Optimistic UI update removed as fetchNotifications is called anyway
      const { error } = await supabase
        .from("notifications")
        .update({ status: "read" })
        .eq("id", notificationId);
      if (error) throw error;
      fetchNotifications(); // Refresh data after update
    } catch (err) {
      toast.error("Failed to mark as read.");
      console.error("Error updating notification:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Optimistic UI update removed as fetchNotifications is called anyway
      const { error } = await supabase
        .from("notifications")
        .update({ status: "read" })
        .eq("recipient_id", user.id)
        .eq("status", "unread");
      if (error) throw error;
      toast.success("All notifications marked as read!");
      fetchNotifications(); // Refresh data after update
    } catch (err) {
      toast.error("Failed to mark all as read.");
    }
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  // --- 4. UPDATED LOADING CHECK ---
  if (loading) {
    return <AdminNotificationsPageSkeleton />;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  // --- (No changes to final JSX return) ---
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-4xl font-bold text-neutral-800 dark:text-white flex items-center gap-3">
          <Bell className="w-8 h-8 text-primary-600" />
          Admin Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-gray-100 font-semibold text-sm rounded-md hover:bg-neutral-200 dark:hover:bg-zinc-700"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm">
          <Bell className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
          <h3 className="mt-4 text-lg font-semibold text-neutral-800 dark:text-white">
            All Caught Up!
          </h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            You have no new notifications.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm divide-y divide-neutral-200 dark:divide-[#3a3a3a]">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 flex items-start gap-4 transition-colors ${
                notification.status === "unread"
                  ? "bg-primary-50 dark:bg-primary-500/5"
                  : ""
              }`}
            >
              <div className="flex-shrink-0 mt-1.5">
                {notification.status === "unread" && (
                  <span
                    className="w-2.5 h-2.5 bg-primary-500 rounded-full flex"
                    title="Unread"
                  ></span>
                )}
              </div>
              <div className="flex-grow">
                <p className="text-neutral-700 dark:text-neutral-200">
                  {notification.message}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                  {timeAgo(notification.created_at)}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {notification.status === "unread" && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="p-2 rounded-full text-neutral-500 dark:text-gray-400 hover:bg-neutral-100 dark:hover:bg-zinc-700 hover:text-neutral-800 dark:hover:text-white"
                    title="Mark as read"
                  >
                    <MailOpen className="w-5 h-5" />
                  </button>
                )}
                {notification.link_to && (
                  <Link
                    to={notification.link_to}
                    className="px-3 py-1 bg-neutral-100 dark:bg-zinc-700 text-neutral-800 dark:text-white text-xs font-semibold rounded-md hover:bg-neutral-200 dark:hover:bg-zinc-600"
                  >
                    View
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
