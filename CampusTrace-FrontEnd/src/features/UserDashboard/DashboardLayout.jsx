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
} from "lucide-react";
import logo from "../../Images/Logo.svg";
import { useTheme } from "../../contexts/ThemeContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// --- Skeleton Loader --- //
const DashboardSkeleton = ({ isSidebarOpen, mobileMenu }) => (
  <div className="h-screen flex flex-col bg-neutral-50 dark:bg-[#1a1a1a] text-neutral-800 dark:text-neutral-300 overflow-hidden">
    <header className="h-16 px-4 lg:px-6 bg-white/70 dark:bg-[#2a2a2a]/70 backdrop-blur-lg border-b border-neutral-200 dark:border-[#3a3a3a] flex items-center justify-between shadow-sm z-30 flex-shrink-0">
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
        className={`fixed md:relative inset-y-0 left-0 z-50 bg-white/80 dark:bg-[#2a2a2a]/80 flex flex-col transition-all duration-300 ease-in-out top-16 md:top-0 border-r border-neutral-200 dark:border-[#3a3a3a] ${
          mobileMenu
            ? "translate-x-0 w-64 shadow-xl"
            : "-translate-x-full md:translate-x-0"
        } ${
          isSidebarOpen ? "md:w-64" : "md:w-20"
        } h-[calc(100vh-4rem)] md:h-full`}
      >
        <div className="p-4 flex items-center gap-3 border-b border-neutral-200 dark:border-[#3a3a3a] flex-shrink-0 h-16">
          <Skeleton circle width={32} height={32} />
          {(isSidebarOpen || mobileMenu) && (
            <div className="flex flex-col overflow-hidden">
              <Skeleton width={100} height={16} />
              <Skeleton width={120} height={12} />
            </div>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={42} borderRadius={8} />
          ))}
        </nav>
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
  { label: "Dashboard", icon: LayoutGrid, path: "/dashboard", exact: true },
  { label: "My Posts", icon: FileText, path: "/dashboard/my-posts" },
  { label: "Browse All", icon: Search, path: "/dashboard/browse-all" },
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
      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
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
  const [siteName, setSiteName] = useState("CampusTrace");
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
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

        if (profileData?.university_id) {
          const { data: settingsData } = await supabase
            .from("site_settings")
            .select("setting_value")
            .eq("university_id", profileData.university_id)
            .eq("setting_key", "site_name")
            .single();

          if (settingsData) {
            setSiteName(settingsData.setting_value);
          }
        }
      }

      const { count, error: countError } = await supabase
        .from("notifications")
        .select("*", { head: true, count: "exact" })
        .eq("recipient_id", user.id)
        .eq("status", "unread");
      if (countError)
        console.error("Error fetching notification count:", countError);
      else setNotificationCount(count || 0);
    } catch (error) {
      console.error("Error in fetchAllData:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAllData();

    const profileSubscription = supabase
      .channel(`public:profiles:id=eq.${user.id}`)
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

    const notificationSubscription = supabase
      .channel(`public:notifications:recipient_id=eq.${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(notificationSubscription);
    };
  }, [user?.id, fetchAllData]);

  const computedMenuItems = useMemo(() => {
    return menuItems.map((item) => {
      if (item.label === "Notifications") {
        return {
          ...item,
          badge: notificationCount > 0 ? String(notificationCount) : null,
        };
      }
      return item;
    });
  }, [notificationCount]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenu(false);
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
  }, [location]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    navigate("/login");
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
      {mobileMenu && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <header className="h-16 px-4 lg:px-6 bg-white/70 dark:bg-[#2a2a2a]/70 backdrop-blur-lg border-b border-neutral-200 dark:border-[#3a3a3a] flex items-center justify-between shadow-sm z-30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden p-2 text-neutral-500 rounded-lg"
          >
            {mobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:block p-2 text-neutral-500 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-neutral-800 dark:text-white hidden sm:block">
            {pageTitle}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => navigate("/dashboard/notifications")}
            className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg relative"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-neutral-900">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("/dashboard/post-new")}
            className="px-4 py-2 bg-primary-600 text-white font-semibold text-sm rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post New Item</span>
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`fixed md:relative inset-y-0 left-0 z-50 bg-white/80 dark:bg-[#2a2a2a]/80 backdrop-blur-lg md:bg-white dark:md:bg-neutral-900 flex flex-col transition-all duration-300 ease-in-out top-16 md:top-0 border-r border-neutral-200 dark:border-[#3a3a3a] ${
            mobileMenu
              ? "translate-x-0 w-64 shadow-xl"
              : "-translate-x-full md:translate-x-0"
          } ${
            isSidebarOpen ? "md:w-64" : "md:w-20"
          } h-[calc(100vh-4rem)] md:h-full`}
        >
          <div
            className={`p-4 flex items-center gap-3 border-b border-neutral-200 dark:border-[#3a3a3a] flex-shrink-0 h-16 ${
              !isSidebarOpen && !mobileMenu ? "justify-center" : ""
            }`}
          >
            <img
              src={logo}
              alt="Campus Trace Logo"
              className="w-8 h-8 rounded-md flex-shrink-0"
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

          <nav className="flex-1 p-2 space-y-2.5 overflow-y-auto text-m">
            {computedMenuItems.map((item) => (
              <NavLink
                key={`menu-${item.label}`}
                item={item}
                isOpen={isSidebarOpen || mobileMenu}
                exact={item.exact}
              />
            ))}
          </nav>

          <div className="p-3 mt-auto border-t border-neutral-200 dark:border-[#3a3a3a] flex-shrink-0">
            <div className="space-y-2.5">
              {bottomItems.map((item) => (
                <NavLink
                  key={`bottom-${item.label}`}
                  item={item}
                  isOpen={isSidebarOpen || mobileMenu}
                />
              ))}
            </div>
            <div className="border-t border-neutral-200 dark:border-[#3a3a3a] my-3"></div>
            <div
              className="p-2 flex items-center gap-3 cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
              onClick={() => navigate("/dashboard/profile")}
            >
              <img
                src={avatarUrl}
                alt="User Avatar"
                className="w-9 h-9 rounded-full"
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
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 disabled:opacity-50 ${
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
        </aside>
        <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-[#1a1a1a]">
          <div className="p-4 md:p-6 lg:p-8 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
