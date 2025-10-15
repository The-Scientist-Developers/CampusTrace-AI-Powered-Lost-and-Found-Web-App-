// import React, { useState, useEffect, useCallback } from "react";
// import { supabase } from "../../../api/apiClient"; // We'll use this for direct updates
// import { toast } from "react-hot-toast";
// import { Bell, CheckCheck, MailOpen, Loader2 } from "lucide-react";
// import { Link } from "react-router-dom";

// const timeAgo = (date) => {
//   const seconds = Math.floor((new Date() - new Date(date)) / 1000);
//   let interval = seconds / 31536000;
//   if (interval > 1) return `${Math.floor(interval)} years ago`;
//   interval = seconds / 2592000;
//   if (interval > 1) return `${Math.floor(interval)} months ago`;
//   interval = seconds / 86400;
//   if (interval > 1) return `${Math.floor(interval)} days ago`;
//   interval = seconds / 3600;
//   if (interval > 1) return `${Math.floor(interval)} hours ago`;
//   interval = seconds / 60;
//   if (interval > 1) return `${Math.floor(interval)} minutes ago`;
//   return `${Math.floor(seconds)} seconds ago`;
// };

// export default function NotificationsPage({ user }) {
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchNotifications = useCallback(async () => {
//     if (!user?.id) {
//       setLoading(false);
//       setError("User not found. Please log in again.");
//       return;
//     }
//     setLoading(true);
//     try {
//       // Fetch directly from Supabase since we have policies in place
//       const { data, error } = await supabase
//         .from("notifications")
//         .select("*")
//         .eq("recipient_id", user.id)
//         .order("created_at", { ascending: false });

//       if (error) throw error;
//       setNotifications(data || []);
//     } catch (err) {
//       console.error("Error fetching notifications:", err);
//       setError("Failed to load notifications.");
//       toast.error("Could not load notifications.");
//     } finally {
//       setLoading(false);
//     }
//   }, [user]);

//   useEffect(() => {
//     fetchNotifications();
//   }, [fetchNotifications]);

//   const handleMarkAsRead = async (notificationId) => {
//     try {
//       // Optimistically update the UI
//       setNotifications((prev) =>
//         prev.map((n) =>
//           n.id === notificationId ? { ...n, status: "read" } : n
//         )
//       );
//       // Update the database
//       const { error } = await supabase
//         .from("notifications")
//         .update({ status: "read" })
//         .eq("id", notificationId);
//       if (error) throw error;
//     } catch (err) {
//       toast.error("Failed to mark as read.");
//       console.error("Error updating notification:", err);
//       fetchNotifications(); // Re-fetch to correct UI on error
//     }
//   };

//   const handleMarkAllAsRead = async () => {
//     try {
//       setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
//       const { error } = await supabase
//         .from("notifications")
//         .update({ status: "read" })
//         .eq("recipient_id", user.id)
//         .eq("status", "unread");
//       if (error) throw error;
//       toast.success("All notifications marked as read!");
//     } catch (err) {
//       toast.error("Failed to mark all as read.");
//       fetchNotifications();
//     }
//   };

//   const unreadCount = notifications.filter((n) => n.status === "unread").length;

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-full p-8 text-zinc-400">
//         <Loader2 className="w-8 h-8 animate-spin mr-3" />
//         Loading Notifications...
//       </div>
//     );
//   }

//   if (error) {
//     return <div className="p-8 text-center text-red-500">{error}</div>;
//   }

//   return (
//     <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
//         <h1 className="text-4xl font-bold text-white flex items-center gap-3">
//           <Bell className="w-8 h-8 text-red" />
//           Notifications
//         </h1>
//         {unreadCount > 0 && (
//           <button
//             onClick={handleMarkAllAsRead}
//             className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 font-semibold text-sm rounded-md hover:bg-zinc-700"
//           >
//             <CheckCheck className="w-4 h-4" />
//             Mark All as Read ({unreadCount})
//           </button>
//         )}
//       </div>

//       {notifications.length === 0 ? (
//         <div className="text-center p-12 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg">
//           <Bell className="mx-auto h-12 w-12 text-neutral-600" />
//           <h3 className="mt-4 text-lg font-semibold text-white">
//             All Caught Up!
//           </h3>
//           <p className="mt-2 text-sm text-neutral-400">
//             You have no new notifications.
//           </p>
//         </div>
//       ) : (
//         <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg divide-y divide-neutral-800">
//           {notifications.map((notification) => (
//             <div
//               key={notification.id}
//               className={`p-4 flex items-start gap-4 transition-colors ${
//                 notification.status === "unread" ? "bg-red-500/5" : ""
//               }`}
//             >
//               <div className="flex-shrink-0 mt-1">
//                 {notification.status === "unread" && (
//                   <span
//                     className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0"
//                     title="Unread"
//                   ></span>
//                 )}
//               </div>
//               <div className="flex-grow">
//                 <p className="text-neutral-200">{notification.message}</p>
//                 <p className="text-xs text-neutral-500 mt-1">
//                   {timeAgo(notification.created_at)}
//                 </p>
//               </div>
//               <div className="flex-shrink-0 flex items-center gap-2">
//                 {notification.status === "unread" && (
//                   <button
//                     onClick={() => handleMarkAsRead(notification.id)}
//                     className="p-2 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-white"
//                     title="Mark as read"
//                   >
//                     <MailOpen className="w-5 h-5" />
//                   </button>
//                 )}
//                 {notification.link_to && (
//                   <Link
//                     to={notification.link_to}
//                     className="px-3 py-1 bg-zinc-700 text-white text-xs font-semibold rounded-md hover:bg-zinc-600"
//                   >
//                     View
//                   </Link>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }










import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { Bell, CheckCheck, MailOpen, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";

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

export default function NotificationsPage({ user }) {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setError("User not found. Please log in again.");
      return;
    }
    setLoading(true);
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
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, status: "read" } : n
        )
      );
      const { error } = await supabase
        .from("notifications")
        .update({ status: "read" })
        .eq("id", notificationId);
      if (error) throw error;
    } catch (err) {
      toast.error("Failed to mark as read.");
      console.error("Error updating notification:", err);
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
      const { error } = await supabase
        .from("notifications")
        .update({ status: "read" })
        .eq("recipient_id", user.id)
        .eq("status", "unread");
      if (error) throw error;
      toast.success("All notifications marked as read!");
    } catch (err) {
      toast.error("Failed to mark all as read.");
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8 text-neutral-600 dark:text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        Loading Notifications...
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
          <Bell className="w-8 h-8 text-red" />
          Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-200 dark:bg-zinc-800 text-neutral-900 dark:text-zinc-300 font-semibold text-sm rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-700"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg">
          <Bell className="mx-auto h-12 w-12 text-neutral-600 dark:text-neutral-400" />
          <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
            All Caught Up!
          </h3>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            You have no new notifications.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg divide-y divide-neutral-200 dark:divide-neutral-800">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 flex items-start gap-4 transition-colors ${
                notification.status === "unread"
                  ? "bg-red-50 dark:bg-red-500/5"
                  : ""
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {notification.status === "unread" && (
                  <span
                    className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0"
                    title="Unread"
                  ></span>
                )}
              </div>
              <div className="flex-grow">
                <p className="text-neutral-800 dark:text-neutral-200">
                  {notification.message}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-500 mt-1">
                  {timeAgo(notification.created_at)}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {notification.status === "unread" && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="p-2 rounded-full text-neutral-600 dark:text-zinc-400 hover:bg-neutral-200 dark:hover:bg-zinc-700 hover:text-neutral-900 dark:hover:text-white"
                    title="Mark as read"
                  >
                    <MailOpen className="w-5 h-5" />
                  </button>
                )}
                {notification.link_to && (
                  <Link
                    to={notification.link_to}
                    className="px-3 py-1 bg-neutral-200 dark:bg-zinc-700 text-neutral-900 dark:text-white text-xs font-semibold rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-600"
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






// import React, { useState, useEffect, useCallback } from "react";
// import { supabase } from "../../../api/apiClient";
// import { toast } from "react-hot-toast";
// import { Bell, CheckCheck, MailOpen, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
// import { Link } from "react-router-dom";
// import { useTheme } from "../../../contexts/ThemeContext";

// const timeAgo = (date) => {
//   const seconds = Math.floor((new Date() - new Date(date)) / 1000);
//   let interval = seconds / 31536000;
//   if (interval > 1) return `${Math.floor(interval)} years ago`;
//   interval = seconds / 2592000;
//   if (interval > 1) return `${Math.floor(interval)} months ago`;
//   interval = seconds / 86400;
//   if (interval > 1) return `${Math.floor(interval)} days ago`;
//   interval = seconds / 3600;
//   if (interval > 1) return `${Math.floor(interval)} hours ago`;
//   interval = seconds / 60;
//   if (interval > 1) return `${Math.floor(interval)} minutes ago`;
//   return `${Math.floor(seconds)} seconds ago`;
// };

// // Get notification icon and styling based on type
// const getNotificationStyle = (type) => {
//   switch (type) {
//     case 'approved':
//       return {
//         icon: CheckCircle,
//         bgColor: 'bg-green-50 dark:bg-green-500/10',
//         iconColor: 'text-green-600 dark:text-green-400',
//         dotColor: 'bg-green-500'
//       };
//     case 'rejected':
//       return {
//         icon: XCircle,
//         bgColor: 'bg-red-100 dark:bg-red-500/10',
//         iconColor: 'text-red-600 dark:text-red-400',
//         dotColor: 'bg-red-500'
//       };
//     case 'pending':
//       return {
//         icon: AlertCircle,
//         bgColor: 'bg-yellow-50 dark:bg-yellow-500/10',
//         iconColor: 'text-yellow-600 dark:text-yellow-400',
//         dotColor: 'bg-yellow-500'
//       };
//     default:
//       return {
//         icon: Bell,
//         bgColor: 'bg-blue-50 dark:bg-blue-500/10',
//         iconColor: 'text-blue-600 dark:text-blue-400',
//         dotColor: 'bg-blue-500'
//       };
//   }
// };

// export default function NotificationsPage({ user }) {
//   const { theme } = useTheme();
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchNotifications = useCallback(async () => {
//     if (!user?.id) {
//       setLoading(false);
//       setError("User not found. Please log in again.");
//       return;
//     }
//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         .from("notifications")
//         .select("*")
//         .eq("recipient_id", user.id)
//         .order("created_at", { ascending: false });

//       if (error) throw error;
//       setNotifications(data || []);
//     } catch (err) {
//       console.error("Error fetching notifications:", err);
//       setError("Failed to load notifications.");
//       toast.error("Could not load notifications.");
//     } finally {
//       setLoading(false);
//     }
//   }, [user]);

//   useEffect(() => {
//     fetchNotifications();

//     // Real-time subscription for new notifications
//     const notificationSubscription = supabase
//       .channel('user-notifications')
//       .on(
//         'postgres_changes',
//         {
//           event: 'INSERT',
//           schema: 'public',
//           table: 'notifications',
//           filter: `recipient_id=eq.${user.id}`
//         },
//         (payload) => {
//           setNotifications((prev) => [payload.new, ...prev]);
          
//           // Show different toast based on notification type
//           const notifType = payload.new.type;
//           if (notifType === 'approved') {
//             toast.success('🎉 Your post has been approved!', { duration: 4000 });
//           } else if (notifType === 'rejected') {
//             toast.error('❌ Your post was rejected', { duration: 4000 });
//           } else {
//             toast('🔔 New notification', { duration: 3000 });
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(notificationSubscription);
//     };
//   }, [fetchNotifications, user.id]);

//   const handleMarkAsRead = async (notificationId) => {
//     try {
//       setNotifications((prev) =>
//         prev.map((n) =>
//           n.id === notificationId ? { ...n, status: "read" } : n
//         )
//       );
//       const { error } = await supabase
//         .from("notifications")
//         .update({ status: "read" })
//         .eq("id", notificationId);
//       if (error) throw error;
//     } catch (err) {
//       toast.error("Failed to mark as read.");
//       console.error("Error updating notification:", err);
//       fetchNotifications();
//     }
//   };

//   const handleMarkAllAsRead = async () => {
//     try {
//       setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
//       const { error } = await supabase
//         .from("notifications")
//         .update({ status: "read" })
//         .eq("recipient_id", user.id)
//         .eq("status", "unread");
//       if (error) throw error;
//       toast.success("All notifications marked as read!");
//     } catch (err) {
//       toast.error("Failed to mark all as read.");
//       fetchNotifications();
//     }
//   };

//   const unreadCount = notifications.filter((n) => n.status === "unread").length;

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-full p-8 text-neutral-600 dark:text-zinc-400">
//         <Loader2 className="w-8 h-8 animate-spin mr-3" />
//         Loading Notifications...
//       </div>
//     );
//   }

//   if (error) {
//     return <div className="p-8 text-center text-red-500">{error}</div>;
//   }

//   return (
//     <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
//         <h1 className="text-4xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
//           <Bell className="w-8 h-8 text-red-600" />
//           Notifications
//         </h1>
//         {unreadCount > 0 && (
//           <button
//             onClick={handleMarkAllAsRead}
//             className="flex items-center gap-2 px-4 py-2 bg-neutral-200 dark:bg-zinc-800 text-neutral-900 dark:text-zinc-300 font-semibold text-sm rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-700"
//           >
//             <CheckCheck className="w-4 h-4" />
//             Mark All as Read ({unreadCount})
//           </button>
//         )}
//       </div>

//       {notifications.length === 0 ? (
//         <div className="text-center p-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg">
//           <Bell className="mx-auto h-12 w-12 text-neutral-600 dark:text-neutral-400" />
//           <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
//             All Caught Up!
//           </h3>
//           <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
//             You have no new notifications.
//           </p>
//         </div>
//       ) : (
//         <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg divide-y divide-neutral-200 dark:divide-neutral-800">
//           {notifications.map((notification) => {
//             const style = getNotificationStyle(notification.type);
//             const NotificationIcon = style.icon;
            
//             return (
//               <div
//                 key={notification.id}
//                 className={`p-4 flex items-start gap-4 transition-colors ${
//                   notification.status === "unread"
//                     ? style.bgColor
//                     : ""
//                 }`}
//               >
//                 {/* Icon indicator */}
//                 <div className="flex-shrink-0 mt-1">
//                   <NotificationIcon className={`w-6 h-6 ${style.iconColor}`} />
//                 </div>

//                 {/* Unread dot */}
//                 <div className="flex-shrink-0 mt-2">
//                   {notification.status === "unread" && (
//                     <span
//                       className={`w-2.5 h-2.5 ${style.dotColor} rounded-full flex-shrink-0`}
//                       title="Unread"
//                     ></span>
//                   )}
//                 </div>

//                 {/* Message content */}
//                 <div className="flex-grow">
//                   <p className="text-neutral-800 dark:text-neutral-200 font-medium">
//                     {notification.message}
//                   </p>
//                   <p className="text-xs text-neutral-600 dark:text-neutral-500 mt-1">
//                     {timeAgo(notification.created_at)}
//                   </p>
//                 </div>

//                 {/* Action buttons */}
//                 <div className="flex-shrink-0 flex items-center gap-2">
//                   {notification.status === "unread" && (
//                     <button
//                       onClick={() => handleMarkAsRead(notification.id)}
//                       className="p-2 rounded-full text-neutral-600 dark:text-zinc-400 hover:bg-neutral-200 dark:hover:bg-zinc-700 hover:text-neutral-900 dark:hover:text-white"
//                       title="Mark as read"
//                     >
//                       <MailOpen className="w-5 h-5" />
//                     </button>
//                   )}
//                   {notification.link_to && (
//                     <Link
//                       to={notification.link_to}
//                       className="px-3 py-1 bg-neutral-200 dark:bg-zinc-700 text-neutral-900 dark:text-white text-xs font-semibold rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-600"
//                     >
//                       View
//                     </Link>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }