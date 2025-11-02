import React, { useState, useEffect, useMemo, useCallback } from "react";
import logo from "../../Images/Logo.svg";
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
  ShieldCheck,
  Palette,
  MoreVertical,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const DashboardSkeleton = ({ isSidebarOpen, mobileMenu }) => (
  <div className="h-screen flex flex-col bg-neutral-50 dark:bg-[#1a1a1a] text-neutral-800 dark:text-neutral-300 overflow-hidden">
    <header className="h-16 px-3 sm:px-4 lg:px-6 bg-white/70 dark:bg-[#2a2a2a]/70 backdrop-blur-lg border-b border-neutral-200 dark:border-[#3a3a3a] flex items-center justify-between shadow-sm z-30 flex-shrink-0">
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
      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 min-h-[44px]
      ${
        isActive
          ? "bg-gradient-to-r from-primary-500/20 to-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold shadow-sm"
          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white"
      }
      ${!isOpen ? "justify-center" : ""}
      group relative
    `}
  >
    {({ isActive }) => (
      <>
        <item.icon
          className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
            isActive
              ? "text-primary-500 scale-110"
              : "text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-white group-hover:scale-105"
          }`}
        />
        {isOpen && (
          <>
            <span className="flex-1 text-sm font-medium truncate">
              {item.label}
            </span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full font-bold min-w-[20px] text-center shadow-sm animate-pulse">
                {item.badge}
              </span>
            )}
            {isActive && (
              <ChevronRight className="w-4 h-4 text-primary-500 opacity-50" />
            )}
          </>
        )}
        {!isOpen && item.badge && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-500 rounded-full shadow-sm animate-pulse"></span>
        )}
      </>
    )}
  </RouterNavLink>
);

export default function DashboardLayout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, colorMode, setColorMode } = useTheme();

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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);

  // Split into two functions: one for profile/siteName, one for counts
  const fetchProfileAndSiteName = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchCounts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { count: notifCount, error: notifError } = await supabase
        .from("notifications")
        .select("*", { head: true, count: "exact" })
        .eq("recipient_id", user.id)
        .eq("status", "unread");

      if (!notifError) setNotificationCount(notifCount || 0);

      const { count: msgCount, error: msgError } = await supabase
        .from("conversations")
        .select("*", { head: true, count: "exact" })
        .or(`finder_id.eq.${user.id},claimant_id.eq.${user.id}`);

      if (!msgError) setMessageCount(msgCount || 0);

      const { count: postsCount, error: postsError } = await supabase
        .from("items")
        .select("*", { head: true, count: "exact" })
        .eq("user_id", user.id)
        .in("status", ["active", "pending", "claimed"]);

      if (!postsError) setMyPostsCount(postsCount || 0);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  }, [user?.id]);

  // Main effect: only runs once on mount or when user.id changes
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Only set loading on initial load
    setIsLoading(true);

    // Fetch profile and counts separately
    fetchProfileAndSiteName();
    fetchCounts();

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

    // Notification subscription - only updates count
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
        () => fetchCounts()
      )
      .subscribe();

    // Messages subscription - only updates count
    const messageSubscription = supabase
      .channel(`user:messages:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => fetchCounts()
      )
      .subscribe();

    // Posts subscription - only updates count
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
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(notificationSubscription);
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(postsSubscription);
    };
  }, [user?.id, fetchProfileAndSiteName, fetchCounts]);

  // Separate effect for site name - runs when profile is loaded
  useEffect(() => {
    if (!profile?.university_id) {
      setSiteName("CampusTrace");
      return;
    }

    const universityId = profile.university_id;

    // Fetch site name
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
        setSiteName("CampusTrace");
      }
    };

    fetchSiteName();

    // Subscribe to site name changes
    const siteNameSubscription = supabase
      .channel(`site-name:${universityId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "site_settings",
          filter: `university_id=eq.${universityId}`,
        },
        (payload) => {
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

    return () => {
      supabase.removeChannel(siteNameSubscription);
    };
  }, [profile]);

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

    if (!location.pathname.includes("/notifications")) {
      refetchNotificationCount();
    }
  }, [location.pathname, user?.id]);

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
      if (window.innerWidth >= 768) {
        setMobileMenu(false);
        setShowMobileDropdown(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      localStorage.setItem("userSidebarOpen", JSON.stringify(isSidebarOpen));
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    setMobileMenu(false);
    setShowMobileDropdown(false);
  }, [location]);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColorPicker && !event.target.closest(".color-picker-container")) {
        setShowColorPicker(false);
      }
      if (
        showMobileDropdown &&
        !event.target.closest(".mobile-dropdown-container")
      ) {
        setShowMobileDropdown(false);
      }
    };

    if (showColorPicker || showMobileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker, showMobileDropdown]);

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
    <div className="h-screen flex flex-col bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-[#1a1a1a] dark:to-[#0f0f0f] text-neutral-800 dark:text-neutral-300 overflow-hidden">
      {mobileMenu && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* Redesigned Header */}
      <header className="h-16 px-3 sm:px-4 lg:px-6 bg-white/80 dark:bg-[#1f1f1f]/80 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800 flex items-center justify-between shadow-sm z-30 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            {mobileMenu ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Desktop Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo on Mobile, Page Title on Desktop */}
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-8 h-8 md:hidden" />
            <h1 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
              <span className="hidden md:inline">{pageTitle}</span>
              <span className="md:hidden truncate max-w-[120px] sm:max-w-none inline-block">
                {siteName}
              </span>
            </h1>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Desktop: All buttons visible */}
          <div className="hidden sm:flex items-center gap-1">
            {profile?.role === "admin" && (
              <button
                onClick={() => {
                  navigate("/admin");
                  setTimeout(() => window.location.reload(), 100);
                }}
                className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all hover:scale-105"
                title="Admin Panel"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all hover:scale-105"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            <div className="relative color-picker-container">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all hover:scale-105"
                title="Color Theme"
              >
                <Palette className="w-5 h-5" />
              </button>

              {showColorPicker && (
                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-3 w-52 z-50">
                  <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-2 px-2 uppercase tracking-wider">
                    Color Theme
                  </div>
                  {[
                    {
                      value: "default",
                      label: "Default",
                      color: "#6366f1",
                      emoji: "🎨",
                    },
                    {
                      value: "purple",
                      label: "Purple (GAD)",
                      color: "#a855f7",
                      emoji: "💜",
                    },
                    {
                      value: "pink",
                      label: "Pink (Breast Cancer)",
                      color: "#ec4899",
                      emoji: "💗",
                    },
                    {
                      value: "blue",
                      label: "Blue (Autism)",
                      color: "#3b82f6",
                      emoji: "💙",
                    },
                    {
                      value: "green",
                      label: "Green (Environmental)",
                      color: "#22c55e",
                      emoji: "💚",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setColorMode(option.value);
                        setShowColorPicker(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left hover:scale-[1.02] ${
                        colorMode === option.value
                          ? "bg-gradient-to-r from-primary-500/20 to-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      }`}
                    >
                      <span className="text-lg">{option.emoji}</span>
                      <span className="text-sm flex-1">{option.label}</span>
                      {colorMode === option.value && (
                        <div
                          className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white dark:ring-neutral-800"
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => navigate("/dashboard/notifications")}
            className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl relative transition-all hover:scale-105"
          >
            <Bell className="w-5 h-5" />
            {totalNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
                {totalNotifications > 9 ? "9+" : totalNotifications}
              </span>
            )}
          </button>

          {/* Post New Button - Always visible with icon on mobile */}
          <button
            onClick={() => navigate("/dashboard/post-new")}
            className="flex items-center gap-1.5 px-2 sm:px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-sm rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post New</span>
          </button>

          {/* Mobile: More Options Dropdown */}
          <div className="relative mobile-dropdown-container sm:hidden">
            <button
              onClick={() => setShowMobileDropdown(!showMobileDropdown)}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all hover:scale-105"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMobileDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-2 w-56 max-h-[70vh] overflow-y-auto z-50">
                {profile?.role === "admin" && (
                  <button
                    onClick={() => {
                      navigate("/admin");
                      setTimeout(() => window.location.reload(), 100);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-sm">Admin Panel</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    toggleTheme();
                    setShowMobileDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  {theme === "light" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {theme === "light" ? "Dark Mode" : "Light Mode"}
                  </span>
                </button>

                {/* Color Theme Section */}
                <div className="border-t border-neutral-200 dark:border-neutral-700 my-2"></div>
                <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1 px-3 uppercase tracking-wider">
                  Color Theme
                </div>

                {[
                  {
                    value: "default",
                    label: "Default",
                    color: "#6366f1",
                    emoji: "🎨",
                  },
                  {
                    value: "purple",
                    label: "Purple (GAD)",
                    color: "#a855f7",
                    emoji: "💜",
                  },
                  {
                    value: "pink",
                    label: "Pink (Breast Cancer)",
                    color: "#ec4899",
                    emoji: "💗",
                  },
                  {
                    value: "blue",
                    label: "Blue (Autism)",
                    color: "#3b82f6",
                    emoji: "💙",
                  },
                  {
                    value: "green",
                    label: "Green (Environmental)",
                    color: "#22c55e",
                    emoji: "💚",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setColorMode(option.value);
                      setShowMobileDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left hover:scale-[1.02] ${
                      colorMode === option.value
                        ? "bg-gradient-to-r from-primary-500/20 to-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    <span className="text-base">{option.emoji}</span>
                    <span className="text-xs flex-1">{option.label}</span>
                    {colorMode === option.value && (
                      <div
                        className="w-2.5 h-2.5 rounded-full shadow-sm ring-2 ring-white dark:ring-neutral-800"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Redesigned Sidebar */}
        <aside
          className={`fixed md:relative inset-y-0 left-0 z-50 bg-white/95 dark:bg-[#1f1f1f]/95 backdrop-blur-xl md:bg-white/80 dark:md:bg-[#1f1f1f]/80 flex flex-col transition-all duration-300 ease-in-out border-r border-neutral-200/50 dark:border-neutral-800 ${
            mobileMenu
              ? "translate-x-0 w-[280px] shadow-2xl"
              : "-translate-x-full md:translate-x-0"
          } ${isSidebarOpen ? "md:w-64" : "md:w-20"} h-full md:h-auto`}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Sidebar Header */}
            <div
              className={`p-4 flex items-center gap-3 border-b border-neutral-200/50 dark:border-neutral-800 flex-shrink-0 ${
                !isSidebarOpen && !mobileMenu ? "justify-center" : ""
              }`}
            >
              <img
                src={logo}
                alt="CampusTrace logo"
                className="w-10 h-10 flex-shrink-0 drop-shadow-md"
              />
              {(isSidebarOpen || mobileMenu) && (
                <div className="flex flex-col overflow-hidden">
                  <span className="font-bold text-sm bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent truncate">
                    {siteName}
                  </span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-500">
                    Powered by CampusTrace
                  </span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
              <nav className="px-3 space-y-1">
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

            {/* Sidebar Footer */}
            <div className="border-t border-neutral-200/50 dark:border-neutral-800 flex-shrink-0">
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

                <div className="border-t border-neutral-200/50 dark:border-neutral-800 my-3"></div>

                {/* User Profile */}
                <div
                  className={`p-3 flex items-center gap-3 cursor-pointer rounded-xl hover:bg-gradient-to-r hover:from-neutral-100 hover:to-neutral-50 dark:hover:from-neutral-800/60 dark:hover:to-neutral-800/30 transition-all ${
                    !isSidebarOpen && !mobileMenu ? "justify-center" : ""
                  }`}
                  onClick={() => navigate("/dashboard/profile")}
                >
                  <img
                    src={avatarUrl}
                    alt="User Avatar"
                    className="w-9 h-9 rounded-xl flex-shrink-0 ring-2 ring-primary-500/20 shadow-md"
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

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-500/5 hover:text-red-500 hover:border-red-500/20 border border-transparent transition-all duration-200 disabled:opacity-50 min-h-[44px] ${
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-[#1a1a1a] dark:to-[#0f0f0f]">
          <div className="p-4 md:p-6 lg:p-8 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
