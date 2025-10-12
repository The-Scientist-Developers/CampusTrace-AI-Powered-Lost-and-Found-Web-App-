import React, { useState, useEffect, useMemo } from "react";
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
  Grid,
  TrendingUp,
} from "lucide-react";
import logo2 from "../../Images/logo2.png";

const menuItems = [
  { label: "Dashboard", icon: Grid, path: "/dashboard", exact: true },
  { label: "My Posts", icon: FileText, path: "/dashboard/my-posts" },
  { label: "Browse All", icon: Search, path: "/dashboard/browse-all" },
  { label: "Notifications", icon: Bell, path: "/dashboard/notifications" },
  { label: "Profile", icon: User, path: "/dashboard/profile" },
];

const bottomItems = [
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
  { label: "Help", icon: HelpCircle, path: "/dashboard/help" },
];

const headItems = [
  { label: "Post New Item", icon: Plus, path: "/dashboard/post-new" },
];

const NavLink = ({ item, isOpen, exact }) => {
  return (
    <RouterNavLink
      to={item.path}
      end={exact}
      className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${
                  isActive
                    ? "bg-gradient-to-r from-red-600/30 to-red-700/20 text-red-300 border-l-4 border-red-500 shadow-lg shadow-red-500/10"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white border-l-4 border-transparent"
                }
                ${!isOpen ? "justify-center" : ""}
                active:scale-95
            `}
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={`w-5 h-5 flex-shrink-0 ${
              isActive ? "text-red-400" : ""
            }`}
          />
          {isOpen && (
            <>
              <span className="flex-1 text-sm font-medium truncate">
                {item.label}
              </span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs bg-red-600 text-white rounded-full font-bold min-w-[20px] text-center shadow-md">
                  {item.badge}
                </span>
              )}
            </>
          )}
          {!isOpen && item.badge && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
          {!isOpen && <span className="sr-only">{item.label}</span>}
        </>
      )}
    </RouterNavLink>
  );
};

export default function DashboardLayout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("userSidebarOpen");
    return saved !== null ? JSON.parse(saved) : window.innerWidth >= 768;
  });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState(null);
  const [itemsPostedCount, setItemsPostedCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
    };
    fetchProfile();

    const profileSubscription = supabase
      .channel("public:profiles")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!profile?.university_id) return;

    const fetchMonthlyItems = async () => {
      try {
        const { count, error } = await supabase
          .from("items")
          .select("*", { count: "exact", head: true })
          .eq("university_id", profile.university_id)
          .gte(
            "created_at",
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).toISOString()
          );
        if (error) throw error;
        setItemsPostedCount(count || 0);
      } catch (err) {
        console.error("Error fetching monthly items count:", err);
      }
    };
    fetchMonthlyItems();
  }, [profile]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchNotificationCount = async () => {
      try {
        const { count, error, status } = await supabase
          .from("notifications")
          .select("*", { head: true, count: "exact" })
          .eq("recipient_id", user.id)
          .eq("status", "unread");
        if (error && status !== 406) {
          setNotificationCount(0);
        } else {
          setNotificationCount(count || 0);
        }
      } catch (err) {
        setNotificationCount(0);
      }
    };
    fetchNotificationCount();
  }, [user?.id]);

  const computedMenuItems = useMemo(() => {
    return menuItems.map((item) => {
      if (item.label === "My Posts") {
        return {
          ...item,
          badge: itemsPostedCount > 0 ? String(itemsPostedCount) : null,
        };
      }
      if (item.label === "Notifications") {
        return {
          ...item,
          badge: notificationCount > 0 ? String(notificationCount) : null,
        };
      }
      return item;
    });
  }, [itemsPostedCount, notificationCount]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setMobileMenu(false);
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
    setIsLoggingOut(false);
  };

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "User";
  const avatarUrl =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${displayName[0]}&background=ef4444&color=ffffff`;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-zinc-950 to-black text-zinc-300 overflow-hidden">
      {mobileMenu && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <header className="h-14 sm:h-16 px-3 sm:px-4 lg:px-6 bg-black/80 backdrop-blur-xl border-b border-zinc-800/60 flex items-center justify-between shadow-2xl z-30 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden p-1.5 sm:p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg"
          >
            {mobileMenu ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:block p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src={logo2}
              alt="Campus Trace Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
            />
            <div className="hidden sm:block">
              <span className="font-bold text-lg sm:text-xl text-white">
                Campus Trace
              </span>
              <p className="text-xs text-zinc-500 leading-tight">
                User Dashboard
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
          <button
            onClick={() => navigate("/dashboard/notifications")}
            className="p-1.5 sm:p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg relative"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("/dashboard/post-new")}
            className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white font-semibold text-xs sm:text-sm rounded-lg hover:bg-red-700 flex items-center gap-1.5 sm:gap-2"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">Post</span>
            <span className="hidden sm:inline">New Item</span>
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <img
              src={avatarUrl}
              alt="User"
              className="w-8 h-8 rounded-full border-2 border-zinc-700 hover:border-red-500 cursor-pointer"
              onClick={() => navigate("/dashboard/profile")}
            />
            <span className="hidden lg:block text-sm text-zinc-400 max-w-[120px] xl:max-w-[180px] truncate">
              {displayName}
            </span>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`fixed md:relative inset-y-0 left-0 z-50 bg-zinc-900/98 md:bg-black/95 backdrop-blur-xl border-r border-zinc-800/60 flex flex-col transition-all duration-300 ease-in-out top-14 sm:top-16 md:top-0 ${
            mobileMenu
              ? "translate-x-0 w-72 shadow-2xl"
              : "-translate-x-full md:translate-x-0"
          } ${
            isSidebarOpen ? "md:w-64" : "md:w-16"
          } h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] md:h-full overflow-hidden`}
        >
          {(isSidebarOpen || mobileMenu) && (
            <div className="p-3 sm:p-4 flex-shrink-0">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl border border-zinc-700/50 shadow-lg">
                <div className="flex justify-between items-center text-xs text-zinc-400 mb-2">
                  <span className="font-medium">This Month</span>
                  <div className="flex items-center gap-1 text-green-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {itemsPostedCount}
                </p>
                <p className="text-xs text-zinc-500">Items Posted</p>
              </div>
            </div>
          )}
          <nav className="flex-1 p-2 sm:p-3 space-y-1 overflow-y-auto">
            {headItems.map((item, i) => (
              <NavLink
                key={`head-${i}`}
                item={item}
                isOpen={isSidebarOpen || mobileMenu}
              />
            ))}
            <div className="my-2 sm:my-3 border-t border-zinc-800/60" />
            {computedMenuItems.map((item, i) => (
              <NavLink
                key={`menu-${i}`}
                item={item}
                isOpen={isSidebarOpen || mobileMenu}
                exact={item.exact}
              />
            ))}
            <div className="my-2 sm:my-3 border-t border-zinc-800/60" />
            {bottomItems.map((item, i) => (
              <NavLink
                key={`bottom-${i}`}
                item={item}
                isOpen={isSidebarOpen || mobileMenu}
              />
            ))}
          </nav>
          <div className="p-2 sm:p-3 border-t border-zinc-800/60 flex-shrink-0 space-y-2 sm:space-y-3 bg-black/20">
            {(isSidebarOpen || mobileMenu) && user && (
              <div className="px-3 py-2.5 bg-zinc-800/60 rounded-lg border border-zinc-700/50">
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">
                  Logged in as
                </p>
                <p className="text-sm text-white truncate font-medium mt-0.5">
                  {user.email}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 disabled:opacity-50 ${
                !isSidebarOpen && !mobileMenu ? "justify-center" : ""
              }`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {(isSidebarOpen || mobileMenu) && (
                <span className="text-sm font-medium">
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </span>
              )}
              {/* --- FIX: Corrected the variable from 'isOpen' to 'isSidebarOpen' --- */}
              {!isSidebarOpen && !mobileMenu && (
                <span className="sr-only">Sign Out</span>
              )}
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900/30 to-black/50">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
