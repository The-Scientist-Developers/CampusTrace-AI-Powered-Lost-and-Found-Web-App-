import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import {
  Bell,
  CheckCheck,
  MailOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

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

const NotificationItemSkeleton = () => (
  <div className="p-4 flex items-start gap-4">
    <div className="flex-shrink-0 mt-1.5">
      <Skeleton circle width={10} height={10} />
    </div>
    <div className="flex-grow">
      <Skeleton height={20} width="80%" />
      <Skeleton height={16} width="30%" className="mt-1" />
    </div>
    <div className="flex-shrink-0 flex items-center gap-2">
      <Skeleton circle width={36} height={36} />
      <Skeleton width={45} height={26} borderRadius={6} />
    </div>
  </div>
);

const AdminNotificationsPageSkeleton = () => (
  <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <Skeleton height={40} width={300} />
      <Skeleton height={38} width={180} borderRadius={6} />
    </div>
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

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setError("User not found. Please log in again.");
      return;
    }
    setLoading(true);
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id);

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Fetch paginated data
      const from = (currentPage - 1) * rowsPerPage;
      const to = from + rowsPerPage - 1;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications.");
      toast.error("Could not load notifications.");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }, [user, currentPage, rowsPerPage]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ status: "read" })
        .eq("id", notificationId);
      if (error) throw error;
      fetchNotifications();
    } catch (err) {
      toast.error("Failed to mark as read.");
      console.error("Error updating notification:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ status: "read" })
        .eq("recipient_id", user.id)
        .eq("status", "unread");
      if (error) throw error;
      toast.success("All notifications marked as read!");
      fetchNotifications();
    } catch (err) {
      toast.error("Failed to mark all as read.");
    }
  };

  // Calculate unread count from all notifications (not just current page)
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id) return;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("status", "unread");
      setUnreadCount(count || 0);
    };
    fetchUnreadCount();
  }, [user, notifications]);

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const startEntry = totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = Math.min(currentPage * rowsPerPage, totalCount);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  if (loading) {
    return <AdminNotificationsPageSkeleton />;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

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
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-gray-100 font-semibold text-sm rounded-md hover:bg-neutral-200 dark:hover:bg-zinc-700 transition"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 && totalCount === 0 ? (
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
        <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm relative">
          <div className="divide-y divide-neutral-200 dark:divide-[#3a3a3a]">
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
                      className="p-2 rounded-full text-neutral-500 dark:text-gray-400 hover:bg-neutral-100 dark:hover:bg-zinc-700 hover:text-neutral-800 dark:hover:text-white transition"
                      title="Mark as read"
                    >
                      <MailOpen className="w-5 h-5" />
                    </button>
                  )}
                  {notification.link_to && (
                    <Link
                      to={notification.link_to}
                      className="px-3 py-1 bg-neutral-100 dark:bg-zinc-700 text-neutral-800 dark:text-white text-xs font-semibold rounded-md hover:bg-neutral-200 dark:hover:bg-zinc-600 transition"
                    >
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-neutral-200 dark:border-[#3a3a3a] relative z-10">
              {/* Rows per page selector */}
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 relative z-20">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  className="px-2 py-1 bg-white dark:bg-[#1a1a1a] border border-neutral-300 dark:border-neutral-600 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 relative z-20 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Page info */}
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Showing {startEntry} to {endEntry} of {totalCount} entries
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                            currentPage === pageNum
                              ? "bg-primary-600 text-white"
                              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#2a2a2a]"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return (
                        <span
                          key={pageNum}
                          className="px-2 text-neutral-500 dark:text-neutral-400"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
