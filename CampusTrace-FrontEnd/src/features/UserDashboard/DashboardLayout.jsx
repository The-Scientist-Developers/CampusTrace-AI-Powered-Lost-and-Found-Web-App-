// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import { supabase } from "../../api/apiClient";
// import {
//   NavLink as RouterNavLink,
//   useNavigate,
//   useLocation,
// } from "react-router-dom";
// import {
//   FileText,
//   Search,
//   Bell,
//   User,
//   LogOut,
//   Plus,
//   Menu,
//   X,
//   Settings,
//   HelpCircle,
//   LayoutGrid,
//   Sun,
//   Moon,
//   Award,
//   MessageSquare,
// } from "lucide-react";
// import logo from "../../Images/Logo.svg";
// import { useTheme } from "../../contexts/ThemeContext";
// import Skeleton from "react-loading-skeleton";
// import "react-loading-skeleton/dist/skeleton.css";

// // --- Skeleton Loader --- //
// const DashboardSkeleton = ({ isSidebarOpen, mobileMenu }) => (
//   <div className="h-screen flex flex-col bg-neutral-50 dark:bg-[#1a1a1a] text-neutral-800 dark:text-neutral-300 overflow-hidden">
//     <header className="h-14 sm:h-16 px-3 sm:px-4 lg:px-6 bg-white/70 dark:bg-[#2a2a2a]/70 backdrop-blur-lg border-b border-neutral-200 dark:border-[#3a3a3a] flex items-center justify-between shadow-sm z-30 flex-shrink-0">
//       <div className="flex items-center gap-2">
//         <Skeleton circle width={32} height={32} className="md:hidden" />
//         <Skeleton circle width={32} height={32} className="hidden md:block" />
//         <h1 className="hidden sm:block">
//           <Skeleton width={120} height={24} />
//         </h1>
//       </div>
//       <div className="flex items-center gap-2">
//         <Skeleton circle width={32} height={32} />
//         <Skeleton circle width={32} height={32} />
//         <Skeleton
//           width={140}
//           height={40}
//           borderRadius={8}
//           className="hidden sm:block"
//         />
//         <Skeleton
//           width={40}
//           height={40}
//           borderRadius={8}
//           className="sm:hidden"
//         />
//       </div>
//     </header>
//     <div className="flex flex-1 overflow-hidden">
//       <aside
//         className={`fixed md:relative inset-y-0 left-0 z-50 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-md flex flex-col transition-all duration-300 ease-in-out ${
//           mobileMenu
//             ? "translate-x-0 w-[280px] shadow-2xl"
//             : "-translate-x-full md:translate-x-0"
//         } ${isSidebarOpen ? "md:w-64" : "md:w-20"} h-full`}
//       >
//         <div className="flex flex-col h-full overflow-hidden">
//           <div className="p-4 flex items-center gap-3 border-b border-neutral-200 dark:border-[#3a3a3a] flex-shrink-0">
//             <Skeleton circle width={32} height={32} />
//             {(isSidebarOpen || mobileMenu) && (
//               <div className="flex flex-col overflow-hidden">
//                 <Skeleton width={100} height={16} />
//                 <Skeleton width={120} height={12} />
//               </div>
//             )}
//           </div>
//           <div className="flex-1 overflow-y-auto">
//             <nav className="p-3 space-y-1.5">
//               {[...Array(5)].map((_, i) => (
//                 <Skeleton key={i} height={42} borderRadius={8} />
//               ))}
//             </nav>
//           </div>
//           <div className="p-3 border-t border-neutral-200 dark:border-[#3a3a3a] flex-shrink-0">
//             <div className="space-y-1.5">
//               {[...Array(2)].map((_, i) => (
//                 <Skeleton key={i} height={42} borderRadius={8} />
//               ))}
//             </div>
//             <div className="border-t border-neutral-200 dark:border-[#3a3a3a] my-3"></div>
//             <div className="p-2 flex items-center gap-3">
//               <Skeleton circle width={36} height={36} />
//               {(isSidebarOpen || mobileMenu) && (
//                 <div className="flex-1 min-w-0">
//                   <Skeleton width={100} height={16} />
//                   <Skeleton width={140} height={12} />
//                 </div>
//               )}
//             </div>
//             <Skeleton height={42} borderRadius={8} className="mt-2" />
//           </div>
//         </div>
//       </aside>
//       <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-[#1a1a1a]">
//         <div className="p-4 md:p-6 lg:p-8 min-h-full">
//           <Skeleton height={40} width={200} className="mb-6" />
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//             {[...Array(4)].map((_, i) => (
//               <Skeleton key={i} height={120} borderRadius={8} />
//             ))}
//           </div>
//         </div>
//       </main>
//     </div>
//   </div>
// );

// const menuItems = [
//   { label: "Leaderboard", icon: Award, path: "/dashboard/leaderboard" },
//   { label: "Dashboard", icon: LayoutGrid, path: "/dashboard", exact: true },
//   { label: "My Posts", icon: FileText, path: "/dashboard/my-posts" },
//   { label: "Browse All", icon: Search, path: "/dashboard/browse-all" },
//   { label: "Messages", icon: MessageSquare, path: "/dashboard/messages" },
//   { label: "Notifications", icon: Bell, path: "/dashboard/notifications" },
//   { label: "Profile", icon: User, path: "/dashboard/profile" },
// ];

// const bottomItems = [
//   { label: "Settings", icon: Settings, path: "/dashboard/settings" },
//   { label: "Help", icon: HelpCircle, path: "/dashboard/help" },
// ];

// const NavLink = ({ item, isOpen, exact }) => (
//   <RouterNavLink
//     to={item.path}
//     end={exact}
//     title={!isOpen ? item.label : ""}
//     className={({ isActive }) => `
//       flex items-center gap-3 px-3 py-2.5 sm:py-2.5 rounded-lg transition-all duration-200 min-h-[44px]
//       ${
//         isActive
//           ? "bg-primary-500/10 text-primary-500 font-semibold"
//           : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white"
//       }
//       ${!isOpen ? "justify-center" : ""}
//       group relative
//     `}
//   >
//     {({ isActive }) => (
//       <>
//         <item.icon
//           className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
//             isActive
//               ? "text-primary-500"
//               : "text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-white"
//           }`}
//         />
//         {isOpen && (
//           <>
//             <span className="flex-1 text-sm font-medium truncate">
//               {item.label}
//             </span>
//             {item.badge && (
//               <span className="px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full font-bold min-w-[20px] text-center shadow-md">
//                 {item.badge}
//               </span>
//             )}
//           </>
//         )}
//         {!isOpen && item.badge && (
//           <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
//         )}
//       </>
//     )}
//   </RouterNavLink>
// );

// export default function DashboardLayout({ children, user }) {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { theme, toggleTheme } = useTheme();

//   const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
//     const saved = localStorage.getItem("userSidebarOpen");
//     return saved !== null ? JSON.parse(saved) : window.innerWidth >= 1024;
//   });
//   const [mobileMenu, setMobileMenu] = useState(false);
//   const [isLoggingOut, setIsLoggingOut] = useState(false);
//   const [profile, setProfile] = useState(null);
//   const [notificationCount, setNotificationCount] = useState(0);
//   const [messageCount, setMessageCount] = useState(0);
//   const [myPostsCount, setMyPostsCount] = useState(0);
//   const [siteName, setSiteName] = useState("CampusTrace");
//   const [isLoading, setIsLoading] = useState(true);

//   // Fetch all data including real-time counts
//   const fetchAllData = useCallback(async () => {
//     if (!user?.id) {
//       setIsLoading(false);
//       return;
//     }

//     try {
//       // Fetch user profile
//       const { data: profileData, error: profileError } = await supabase
//         .from("profiles")
//         .select("*")
//         .eq("id", user.id)
//         .single();

//       if (profileError) {
//         console.error("Error fetching profile:", profileError);
//       } else {
//         setProfile(profileData);

//         // Fetch site settings
//         if (profileData?.university_id) {
//           const { data: settingsData } = await supabase
//             .from("site_settings")
//             .select("setting_value")
//             .eq("university_id", profileData.university_id)
//             .eq("setting_key", "site_name")
//             .single();

//           if (settingsData) {
//             setSiteName(settingsData.setting_value);
//           }
//         }
//       }

//       // Fetch notification count
//       const { count: notifCount, error: notifError } = await supabase
//         .from("notifications")
//         .select("*", { head: true, count: "exact" })
//         .eq("recipient_id", user.id)
//         .eq("status", "unread");

//       if (!notifError) setNotificationCount(notifCount || 0);

//       // Fetch unread messages count (via conversations)
//       // Note: Messages are linked to conversations, not directly to users
//       // For now, we'll count total conversations as a proxy for message activity
//       const { count: msgCount, error: msgError } = await supabase
//         .from("conversations")
//         .select("*", { head: true, count: "exact" })
//         .or(`finder_id.eq.${user.id},claimant_id.eq.${user.id}`);

//       if (!msgError) setMessageCount(msgCount || 0);

//       // Fetch active posts count
//       const { count: postsCount, error: postsError } = await supabase
//         .from("items")
//         .select("*", { head: true, count: "exact" })
//         .eq("user_id", user.id)
//         .in("status", ["active", "pending", "claimed"]);

//       if (!postsError) setMyPostsCount(postsCount || 0);
//     } catch (error) {
//       console.error("Error in fetchAllData:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [user?.id]);

//   // Initial data fetch and real-time subscriptions
//   useEffect(() => {
//     fetchAllData();

//     // Profile updates subscription
//     const profileSubscription = supabase
//       .channel(`user:profiles:${user.id}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "UPDATE",
//           schema: "public",
//           table: "profiles",
//           filter: `id=eq.${user.id}`,
//         },
//         (payload) => setProfile(payload.new)
//       )
//       .subscribe();

//     // Notifications subscription
//     const notificationSubscription = supabase
//       .channel(`user:notifications:${user.id}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "notifications",
//           filter: `recipient_id=eq.${user.id}`,
//         },
//         async () => {
//           // Refetch notification count
//           const { count } = await supabase
//             .from("notifications")
//             .select("*", { head: true, count: "exact" })
//             .eq("recipient_id", user.id)
//             .eq("status", "unread");
//           setNotificationCount(count || 0);
//         }
//       )
//       .subscribe();

//     // Messages subscription (track via conversations)
//     const messageSubscription = supabase
//       .channel(`user:messages:${user.id}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "conversations",
//         },
//         async () => {
//           // Refetch conversation count when conversations change
//           const { count } = await supabase
//             .from("conversations")
//             .select("*", { head: true, count: "exact" })
//             .or(`finder_id.eq.${user.id},claimant_id.eq.${user.id}`);
//           setMessageCount(count || 0);
//         }
//       )
//       .subscribe();

//     // Posts subscription for user's own posts
//     const postsSubscription = supabase
//       .channel(`user:posts:${user.id}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "items",
//           filter: `user_id=eq.${user.id}`,
//         },
//         async () => {
//           // Refetch posts count
//           const { count } = await supabase
//             .from("items")
//             .select("*", { head: true, count: "exact" })
//             .eq("user_id", user.id)
//             .in("status", ["active", "pending", "claimed"]);
//           setMyPostsCount(count || 0);
//         }
//       )
//       .subscribe();

//     // Comments subscription for user's posts
//     const commentsSubscription = supabase
//       .channel(`user:comments`)
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "comments",
//         },
//         async (payload) => {
//           // Check if comment is on user's post
//           const { data: post } = await supabase
//             .from("items")
//             .select("user_id")
//             .eq("id", payload.new.post_id)
//             .single();

//           if (post?.user_id === user.id) {
//             // Trigger notification refetch
//             fetchAllData();
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(profileSubscription);
//       supabase.removeChannel(notificationSubscription);
//       supabase.removeChannel(messageSubscription);
//       supabase.removeChannel(postsSubscription);
//       supabase.removeChannel(commentsSubscription);
//     };
//   }, [user?.id, fetchAllData]);

//   // Refetch notification count when leaving notification page
//   useEffect(() => {
//     const refetchNotificationCount = async () => {
//       if (!user?.id) return;

//       const { count } = await supabase
//         .from("notifications")
//         .select("*", { head: true, count: "exact" })
//         .eq("recipient_id", user.id)
//         .eq("status", "unread");

//       setNotificationCount(count || 0);
//     };

//     // Refetch when navigating away from notifications page
//     if (!location.pathname.includes("/notifications")) {
//       refetchNotificationCount();
//     }
//   }, [location.pathname, user?.id]);

//   // Compute menu items with badges
//   const computedMenuItems = useMemo(() => {
//     return menuItems.map((item) => {
//       if (item.label === "Notifications") {
//         return {
//           ...item,
//           badge: notificationCount > 0 ? String(notificationCount) : null,
//         };
//       }
//       if (item.label === "Messages") {
//         return {
//           ...item,
//           badge: messageCount > 0 ? String(messageCount) : null,
//         };
//       }
//       if (item.label === "My Posts") {
//         return {
//           ...item,
//           badge: myPostsCount > 0 ? String(myPostsCount) : null,
//         };
//       }
//       return item;
//     });
//   }, [notificationCount, messageCount, myPostsCount]);

//   // Handle window resize
//   useEffect(() => {
//     const handleResize = () => {
//       if (window.innerWidth >= 768) setMobileMenu(false);
//     };
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   // Save sidebar state
//   useEffect(() => {
//     if (window.innerWidth >= 768) {
//       localStorage.setItem("userSidebarOpen", JSON.stringify(isSidebarOpen));
//     }
//   }, [isSidebarOpen]);

//   // Close mobile menu on navigation
//   useEffect(() => {
//     setMobileMenu(false);
//   }, [location]);

//   // Prevent body scroll when mobile menu is open
//   useEffect(() => {
//     if (mobileMenu) {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "";
//     }
//     return () => {
//       document.body.style.overflow = "";
//     };
//   }, [mobileMenu]);

//   // Handle logout
//   const handleLogout = async () => {
//     setIsLoggingOut(true);

//     try {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();
//       if (!session) {
//         console.log("No active session found. Skipping server logout.");
//       } else {
//         await supabase.auth.signOut();
//         console.log("Logout successful.");
//       }
//     } catch (error) {
//       console.error("Logout failed:", error.message);
//       await supabase.auth.signOut({ scope: "local" });
//       console.log("Fallback: Local logout completed.");
//     } finally {
//       setIsLoggingOut(false);
//       navigate("/login");
//     }
//   };

//   const displayName =
//     profile?.full_name || user?.email?.split("@")[0] || "User";
//   const avatarUrl =
//     profile?.avatar_url ||
//     `https://ui-avatars.com/api/?name=${encodeURIComponent(
//       displayName
//     )}&background=4f46e5&color=ffffff&bold=true`;

//   const pageTitle =
//     menuItems.find((item) =>
//       item.exact
//         ? location.pathname === item.path
//         : location.pathname.startsWith(item.path)
//     )?.label || "Dashboard";

//   // Total count for header notification bell
//   const totalNotifications = notificationCount + messageCount;

//   if (isLoading) {
//     return (
//       <DashboardSkeleton
//         isSidebarOpen={isSidebarOpen}
//         mobileMenu={mobileMenu}
//       />
//     );
//   }

//   return (
//     <div className="h-screen flex flex-col bg-neutral-50 dark:bg-[#1a1a1a] text-neutral-800 dark:text-neutral-300 overflow-hidden">
//       {/* Mobile menu overlay */}
//       {mobileMenu && (
//         <div
//           className="fixed inset-0 bg-black/60 z-40 md:hidden"
//           onClick={() => setMobileMenu(false)}
//         />
//       )}

//       {/* Header */}
//       <header className="h-14 sm:h-16 px-3 sm:px-4 lg:px-6 bg-white/70 dark:bg-[#2a2a2a]/70 backdrop-blur-lg border-b border-neutral-200 dark:border-[#3a3a3a] flex items-center justify-between shadow-sm z-30 flex-shrink-0">
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => setMobileMenu(!mobileMenu)}
//             className="md:hidden p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
//           >
//             {mobileMenu ? (
//               <X className="w-6 h-6" />
//             ) : (
//               <Menu className="w-6 h-6" />
//             )}
//           </button>
//           <button
//             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//             className="hidden md:block p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
//           >
//             <Menu className="w-5 h-5" />
//           </button>
//           <h1 className="text-lg sm:text-xl font-semibold text-neutral-800 dark:text-white truncate">
//             <span className="hidden sm:inline">{pageTitle}</span>
//             <span className="sm:hidden">
//               {pageTitle === "Dashboard" ? siteName : pageTitle}
//             </span>
//           </h1>
//         </div>
//         <div className="flex items-center gap-1 sm:gap-2">
//           <button
//             onClick={toggleTheme}
//             className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
//           >
//             {theme === "light" ? (
//               <Moon className="w-5 h-5" />
//             ) : (
//               <Sun className="w-5 h-5" />
//             )}
//           </button>
//           <button
//             onClick={() => navigate("/dashboard/notifications")}
//             className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg relative transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
//           >
//             <Bell className="w-5 h-5" />
//             {totalNotifications > 0 && (
//               <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-neutral-900 animate-pulse">
//                 {totalNotifications > 9 ? "9+" : totalNotifications}
//               </span>
//             )}
//           </button>
//           <button
//             onClick={() => navigate("/dashboard/messages")}
//             className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg relative transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
//           >
//             <MessageSquare className="w-5 h-5" />
//             {messageCount > 0 && (
//               <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-neutral-900 animate-pulse">
//                 {messageCount > 9 ? "9+" : messageCount}
//               </span>
//             )}
//           </button>
//           <button
//             onClick={() => navigate("/dashboard/post-new")}
//             className="px-3 sm:px-4 py-2 bg-primary-600 text-white font-semibold text-sm rounded-lg hover:bg-primary-700 flex items-center gap-1 sm:gap-2 transition-colors shadow-sm"
//           >
//             <Plus className="w-4 h-4" />
//             <span className="hidden sm:inline">Post New Item</span>
//             <span className="sm:hidden">Post</span>
//           </button>
//         </div>
//       </header>

//       {/* Main content area */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* Sidebar */}
//         <aside
//           className={`fixed md:relative inset-y-0 left-0 z-50 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-md md:bg-white dark:md:bg-neutral-900 flex flex-col transition-all duration-300 ease-in-out ${
//             mobileMenu
//               ? "translate-x-0 w-[280px] shadow-2xl"
//               : "-translate-x-full md:translate-x-0"
//           } ${isSidebarOpen ? "md:w-64" : "md:w-20"} h-full md:h-auto`}
//         >
//           {/* Sidebar content wrapper - this ensures proper scrolling */}
//           <div className="flex flex-col h-full overflow-hidden">
//             {/* Logo section */}
//             <div
//               className={`p-4 flex items-center gap-3 border-b border-neutral-200 dark:border-[#3a3a3a] flex-shrink-0 ${
//                 !isSidebarOpen && !mobileMenu ? "justify-center" : ""
//               }`}
//             >
//               <img
//                 src={logo}
//                 alt="CampusTrace logo"
//                 className="w-10 h-10 flex-shrink-0"
//               />
//               {(isSidebarOpen || mobileMenu) && (
//                 <div className="flex flex-col overflow-hidden">
//                   <span className="font-bold text-sm text-neutral-800 dark:text-white leading-tight truncate">
//                     {siteName}
//                   </span>
//                   <span className="text-xs text-neutral-500 dark:text-neutral-400">
//                     Powered by CampusTrace
//                   </span>
//                 </div>
//               )}
//             </div>

//             {/* Scrollable navigation area */}
//             <div className="flex-1 overflow-y-auto overflow-x-hidden">
//               <nav className="p-3 space-y-1">
//                 {computedMenuItems.map((item) => (
//                   <NavLink
//                     key={`menu-${item.label}`}
//                     item={item}
//                     isOpen={isSidebarOpen || mobileMenu}
//                     exact={item.exact}
//                   />
//                 ))}
//               </nav>
//             </div>

//             {/* Bottom section - fixed at bottom */}
//             <div className="border-t border-neutral-200 dark:border-[#3a3a3a] flex-shrink-0">
//               <div className="p-3">
//                 <div className="space-y-1">
//                   {bottomItems.map((item) => (
//                     <NavLink
//                       key={`bottom-${item.label}`}
//                       item={item}
//                       isOpen={isSidebarOpen || mobileMenu}
//                     />
//                   ))}
//                 </div>

//                 {/* Divider */}
//                 <div className="border-t border-neutral-200 dark:border-[#3a3a3a] my-3"></div>

//                 {/* User profile section */}
//                 <div
//                   className={`p-2 flex items-center gap-3 cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors ${
//                     !isSidebarOpen && !mobileMenu ? "justify-center" : ""
//                   }`}
//                   onClick={() => navigate("/dashboard/profile")}
//                 >
//                   <img
//                     src={avatarUrl}
//                     alt="User Avatar"
//                     className="w-9 h-9 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-primary-500/20"
//                   />
//                   {(isSidebarOpen || mobileMenu) && (
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-semibold truncate text-neutral-800 dark:text-white">
//                         {displayName}
//                       </p>
//                       <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
//                         {user.email}
//                       </p>
//                     </div>
//                   )}
//                 </div>

//                 {/* Sign out button */}
//                 <button
//                   onClick={handleLogout}
//                   disabled={isLoggingOut}
//                   className={`w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 disabled:opacity-50 min-h-[44px] ${
//                     !isSidebarOpen && !mobileMenu ? "justify-center" : ""
//                   }`}
//                   title={!isSidebarOpen && !mobileMenu ? "Sign Out" : ""}
//                 >
//                   <LogOut className="w-5 h-5 flex-shrink-0" />
//                   {(isSidebarOpen || mobileMenu) && (
//                     <span className="text-sm font-medium">
//                       {isLoggingOut ? "Signing out..." : "Sign Out"}
//                     </span>
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </aside>

//         {/* Main content */}
//         <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-[#1a1a1a]">
//           <div className="p-4 md:p-6 lg:p-8 min-h-full">{children}</div>
//         </main>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../api/apiClient";
import {
  NavLink as RouterNavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  FileText,
  Search,
  Bell,
  User,
  LogOut,
  Plus,
  Menu,
  X,
  Settings,
  HelpCircle,
  LayoutGrid,
  Sun,
  Moon,
  Award,
  MessageSquare,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// --- Skeleton Loader --- //
const DashboardSkeleton = ({ isSidebarOpen, mobileMenu }) => (
  <div className="h-screen flex flex-col bg-neutral-50 dark:bg-[#1a1a1a] text-neutral-800 dark:text-neutral-300 overflow-hidden">
    <header className="h-14 sm:h-16 px-3 sm:px-4 lg:px-6 bg-white/70 dark:bg-[#2a2a2a]/70 backdrop-blur-lg border-b border-neutral-200 dark:border-[#3a3a3a] flex items-center justify-between shadow-sm z-30 flex-shrink-0">
      <div className="flex items-center gap-2">
        <Skeleton circle width={32} height={32} className="md:hidden" />
        <Skeleton circle width={32} height={32} className="hidden md:block" />
        <h1 className="hidden sm:block">
          <Skeleton width={120} height={24} />
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton circle width={32} height={32} />
        <Skeleton circle width={32} height={32} />
        <Skeleton
          width={140}
          height={40}
          borderRadius={8}
          className="hidden sm:block"
        />
        <Skeleton
          width={40}
          height={40}
          borderRadius={8}
          className="sm:hidden"
        />
      </div>
    </header>
    <div className="flex flex-1 overflow-hidden">
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-md flex flex-col transition-all duration-300 ease-in-out ${
          mobileMenu
            ? "translate-x-0 w-[280px] shadow-2xl"
            : "-translate-x-full md:translate-x-0"
        } ${isSidebarOpen ? "md:w-64" : "md:w-20"} h-full`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-neutral-200 dark:border-[#3a3a3a] flex-shrink-0">
            <Skeleton circle width={32} height={32} />
            {(isSidebarOpen || mobileMenu) && (
              <div className="flex flex-col overflow-hidden">
                <Skeleton width={100} height={16} />
                <Skeleton width={120} height={12} />
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="p-3 space-y-1.5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={42} borderRadius={8} />
              ))}
            </nav>
          </div>
          <div className="p-3 border-t border-neutral-200 dark:border-[#3a3a3a] flex-shrink-0">
            <div className="space-y-1.5">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} height={42} borderRadius={8} />
              ))}
            </div>
            <div className="border-t border-neutral-200 dark:border-[#3a3a3a] my-3"></div>
            <div className="p-2 flex items-center gap-3">
              <Skeleton circle width={36} height={36} />
              {(isSidebarOpen || mobileMenu) && (
                <div className="flex-1 min-w-0">
                  <Skeleton width={100} height={16} />
                  <Skeleton width={140} height={12} />
                </div>
              )}
            </div>
            <Skeleton height={42} borderRadius={8} className="mt-2" />
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-[#1a1a1a]">
        <div className="p-4 md:p-6 lg:p-8 min-h-full">
          <Skeleton height={40} width={200} className="mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} height={120} borderRadius={8} />
            ))}
          </div>
        </div>
      </main>
    </div>
  </div>
);

const menuItems = [
  { label: "Leaderboard", icon: Award, path: "/dashboard/leaderboard" },
  { label: "Dashboard", icon: LayoutGrid, path: "/dashboard", exact: true },
  { label: "My Posts", icon: FileText, path: "/dashboard/my-posts" },
  { label: "Browse All", icon: Search, path: "/dashboard/browse-all" },
  { label: "Messages", icon: MessageSquare, path: "/dashboard/messages" },
  { label: "Notifications", icon: Bell, path: "/dashboard/notifications" },
  { label: "Profile", icon: User, path: "/dashboard/profile" },
];

const bottomItems = [
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
  { label: "Help", icon: HelpCircle, path: "/dashboard/help" },
];

const NavLink = ({ item, isOpen, exact }) => (
  <RouterNavLink
    to={item.path}
    end={exact}
    title={!isOpen ? item.label : ""}
    className={({ isActive }) => `
      flex items-center gap-3 px-3 py-2.5 sm:py-2.5 rounded-lg transition-all duration-200 min-h-[44px]
      ${
        isActive
          ? "bg-primary-500/10 text-primary-500 font-semibold"
          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white"
      }
      ${!isOpen ? "justify-center" : ""}
      group relative
    `}
  >
    {({ isActive }) => (
      <>
        <item.icon
          className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
            isActive
              ? "text-primary-500"
              : "text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-white"
          }`}
        />
        {isOpen && (
          <>
            <span className="flex-1 text-sm font-medium truncate">
              {item.label}
            </span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full font-bold min-w-[20px] text-center shadow-md">
                {item.badge}
              </span>
            )}
          </>
        )}
        {!isOpen && item.badge && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
        )}
      </>
    )}
  </RouterNavLink>
);

export default function DashboardLayout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("userSidebarOpen");
    return saved !== null ? JSON.parse(saved) : window.innerWidth >= 1024;
  });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [myPostsCount, setMyPostsCount] = useState(0);
  const [siteName, setSiteName] = useState("CampusTrace");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data *except* siteName (which depends on profile)
  const fetchAllData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfile(profileData);
        // Site name fetching is now handled by a separate useEffect
      }

      // Fetch notification count
      const { count: notifCount, error: notifError } = await supabase
        .from("notifications")
        .select("*", { head: true, count: "exact" })
        .eq("recipient_id", user.id)
        .eq("status", "unread");

      if (!notifError) setNotificationCount(notifCount || 0);

      // Fetch unread messages count (via conversations)
      const { count: msgCount, error: msgError } = await supabase
        .from("conversations")
        .select("*", { head: true, count: "exact" })
        .or(`finder_id.eq.${user.id},claimant_id.eq.${user.id}`);

      if (!msgError) setMessageCount(msgCount || 0);

      // Fetch active posts count
      const { count: postsCount, error: postsError } = await supabase
        .from("items")
        .select("*", { head: true, count: "exact" })
        .eq("user_id", user.id)
        .in("status", ["active", "pending", "claimed"]);

      if (!postsError) setMyPostsCount(postsCount || 0);
    } catch (error) {
      console.error("Error in fetchAllData:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initial data fetch and real-time subscriptions
  useEffect(() => {
    fetchAllData();

    // Profile updates subscription
    const profileSubscription = supabase
      .channel(`user:profiles:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => setProfile(payload.new)
      )
      .subscribe();

    // Notifications subscription
    const notificationSubscription = supabase
      .channel(`user:notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        async () => {
          // Refetch notification count
          const { count } = await supabase
            .from("notifications")
            .select("*", { head: true, count: "exact" })
            .eq("recipient_id", user.id)
            .eq("status", "unread");
          setNotificationCount(count || 0);
        }
      )
      .subscribe();

    // Messages subscription (track via conversations)
    const messageSubscription = supabase
      .channel(`user:messages:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        async () => {
          // Refetch conversation count when conversations change
          const { count } = await supabase
            .from("conversations")
            .select("*", { head: true, count: "exact" })
            .or(`finder_id.eq.${user.id},claimant_id.eq.${user.id}`);
          setMessageCount(count || 0);
        }
      )
      .subscribe();

    // Posts subscription for user's own posts
    const postsSubscription = supabase
      .channel(`user:posts:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          // Refetch posts count
          const { count } = await supabase
            .from("items")
            .select("*", { head: true, count: "exact" })
            .eq("user_id", user.id)
            .in("status", ["active", "pending", "claimed"]);
          setMyPostsCount(count || 0);
        }
      )
      .subscribe();

    // Comments subscription for user's posts
    const commentsSubscription = supabase
      .channel(`user:comments`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
        },
        async (payload) => {
          // Check if comment is on user's post
          const { data: post } = await supabase
            .from("items")
            .select("user_id")
            .eq("id", payload.new.post_id)
            .single();

          if (post?.user_id === user.id) {
            // Trigger notification refetch
            fetchAllData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(notificationSubscription);
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(postsSubscription);
      supabase.removeChannel(commentsSubscription);
    };
  }, [user?.id, fetchAllData]);

  // --- [NEW EFFECT HOOK FOR SITE NAME] ---
  // This effect fetches the site name when the profile is loaded
  // and subscribes to real-time changes for the site name.
  useEffect(() => {
    // Only run if the profile (with university_id) is loaded
    if (profile?.university_id) {
      const universityId = profile.university_id;

      // 1. Fetch the initial site name
      const fetchSiteName = async () => {
        const { data: settingsData } = await supabase
          .from("site_settings")
          .select("setting_value")
          .eq("university_id", universityId)
          .eq("setting_key", "site_name")
          .single();

        if (settingsData) {
          setSiteName(settingsData.setting_value);
        } else {
          setSiteName("CampusTrace"); // Reset to default if not found
        }
      };

      fetchSiteName();

      // 2. Create a Realtime subscription for THIS specific setting
      const siteNameSubscription = supabase
        .channel(`site-name:${universityId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "site_settings",
            filter: `university_id=eq.${universityId}`, // Filter for this university
          },
          (payload) => {
            // Check if the site_name was the key that changed
            if (payload.new.setting_key === "site_name") {
              console.log(
                "Site name updated in real-time!",
                payload.new.setting_value
              );
              setSiteName(payload.new.setting_value);
            }
          }
        )
        .subscribe();

      // 3. Cleanup
      return () => {
        supabase.removeChannel(siteNameSubscription);
      };
    }
  }, [profile]); // <-- This hook runs every time the profile state changes
  // --- [END OF NEW HOOK] ---

  // Refetch notification count when leaving notification page
  useEffect(() => {
    const refetchNotificationCount = async () => {
      if (!user?.id) return;

      const { count } = await supabase
        .from("notifications")
        .select("*", { head: true, count: "exact" })
        .eq("recipient_id", user.id)
        .eq("status", "unread");

      setNotificationCount(count || 0);
    };

    // Refetch when navigating away from notifications page
    if (!location.pathname.includes("/notifications")) {
      refetchNotificationCount();
    }
  }, [location.pathname, user?.id]);

  // Compute menu items with badges
  const computedMenuItems = useMemo(() => {
    return menuItems.map((item) => {
      if (item.label === "Notifications") {
        return {
          ...item,
          badge: notificationCount > 0 ? String(notificationCount) : null,
        };
      }
      if (item.label === "Messages") {
        return {
          ...item,
          badge: messageCount > 0 ? String(messageCount) : null,
        };
      }
      if (item.label === "My Posts") {
        return {
          ...item,
          badge: myPostsCount > 0 ? String(myPostsCount) : null,
        };
      }
      return item;
    });
  }, [notificationCount, messageCount, myPostsCount]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenu(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Save sidebar state
  useEffect(() => {
    if (window.innerWidth >= 768) {
      localStorage.setItem("userSidebarOpen", JSON.stringify(isSidebarOpen));
    }
  }, [isSidebarOpen]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenu(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenu]);

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session found. Skipping server logout.");
      } else {
        await supabase.auth.signOut();
        console.log("Logout successful.");
      }
    } catch (error) {
      console.error("Logout failed:", error.message);
      await supabase.auth.signOut({ scope: "local" });
      console.log("Fallback: Local logout completed.");
    } finally {
      setIsLoggingOut(false);
      navigate("/login");
    }
  };

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "User";
  const avatarUrl =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=4f46e5&color=ffffff&bold=true`;

  const pageTitle =
    menuItems.find((item) =>
      item.exact
        ? location.pathname === item.path
        : location.pathname.startsWith(item.path)
    )?.label || "Dashboard";

  // Total count for header notification bell
  const totalNotifications = notificationCount + messageCount;

  if (isLoading) {
    return (
      <DashboardSkeleton
        isSidebarOpen={isSidebarOpen}
        mobileMenu={mobileMenu}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-[#1a1a1a] text-neutral-800 dark:text-neutral-300 overflow-hidden">
      {/* Mobile menu overlay */}
      {mobileMenu && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* Header */}
      <header className="h-14 sm:h-16 px-3 sm:px-4 lg:px-6 bg-white/70 dark:bg-[#2a2a2a]/70 backdrop-blur-lg border-b border-neutral-200 dark:border-[#3a3a3a] flex items-center justify-between shadow-sm z-30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            {mobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:block p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-neutral-800 dark:text-white truncate">
            <span className="hidden sm:inline">{pageTitle}</span>
            <span className="sm:hidden">
              {pageTitle === "Dashboard" ? siteName : pageTitle}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => navigate("/dashboard/notifications")}
            className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg relative transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <Bell className="w-5 h-5" />
            {totalNotifications > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-neutral-900 animate-pulse">
                {totalNotifications > 9 ? "9+" : totalNotifications}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("/dashboard/messages")}
            className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg relative transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <MessageSquare className="w-5 h-5" />
            {messageCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-neutral-900 animate-pulse">
                {messageCount > 9 ? "9+" : messageCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("/dashboard/post-new")}
            className="px-3 sm:px-4 py-2 bg-primary-600 text-white font-semibold text-sm rounded-lg hover:bg-primary-700 flex items-center gap-1 sm:gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post New Item</span>
            <span className="sm:hidden">Post</span>
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed md:relative inset-y-0 left-0 z-50 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-md md:bg-white dark:md:bg-neutral-900 flex flex-col transition-all duration-300 ease-in-out ${
            mobileMenu
              ? "translate-x-0 w-[280px] shadow-2xl"
              : "-translate-x-full md:translate-x-0"
          } ${isSidebarOpen ? "md:w-64" : "md:w-20"} h-full md:h-auto`}
        >
          {/* Sidebar content wrapper - this ensures proper scrolling */}
          <div className="flex flex-col h-full overflow-hidden">
            {/* Logo section */}
            <div
              className={`p-4 flex items-center gap-3 border-b border-neutral-200 dark:border-[#3a3a3a] flex-shrink-0 ${
                !isSidebarOpen && !mobileMenu ? "justify-center" : ""
              }`}
            >
              <img
                src="/Logo.svg"
                alt="CampusTrace logo"
                className="w-10 h-10 flex-shrink-0"
              />
              {(isSidebarOpen || mobileMenu) && (
                <div className="flex flex-col overflow-hidden">
                  <span className="font-bold text-sm text-neutral-800 dark:text-white leading-tight truncate">
                    {siteName}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Powered by CampusTrace
                  </span>
                </div>
              )}
            </div>

            {/* Scrollable navigation area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <nav className="p-3 space-y-1">
                {computedMenuItems.map((item) => (
                  <NavLink
                    key={`menu-${item.label}`}
                    item={item}
                    isOpen={isSidebarOpen || mobileMenu}
                    exact={item.exact}
                  />
                ))}
              </nav>
            </div>

            {/* Bottom section - fixed at bottom */}
            <div className="border-t border-neutral-200 dark:border-[#3a3a3a] flex-shrink-0">
              <div className="p-3">
                <div className="space-y-1">
                  {bottomItems.map((item) => (
                    <NavLink
                      key={`bottom-${item.label}`}
                      item={item}
                      isOpen={isSidebarOpen || mobileMenu}
                    />
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-neutral-200 dark:border-[#3a3a3a] my-3"></div>

                {/* User profile section */}
                <div
                  className={`p-2 flex items-center gap-3 cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors ${
                    !isSidebarOpen && !mobileMenu ? "justify-center" : ""
                  }`}
                  onClick={() => navigate("/dashboard/profile")}
                >
                  <img
                    src={avatarUrl}
                    alt="User Avatar"
                    className="w-9 h-9 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-primary-500/20"
                  />
                  {(isSidebarOpen || mobileMenu) && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-neutral-800 dark:text-white">
                        {displayName}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sign out button */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 disabled:opacity-50 min-h-[44px] ${
                    !isSidebarOpen && !mobileMenu ? "justify-center" : ""
                  }`}
                  title={!isSidebarOpen && !mobileMenu ? "Sign Out" : ""}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  {(isSidebarOpen || mobileMenu) && (
                    <span className="text-sm font-medium">
                      {isLoggingOut ? "Signing out..." : "Sign Out"}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-[#1a1a1a]">
          <div className="p-4 md:p-6 lg:p-8 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
