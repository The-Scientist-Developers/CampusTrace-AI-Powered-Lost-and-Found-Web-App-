import React, { useState, useEffect } from "react";
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
  Menu, // Use Menu icon for desktop toggle too
  X,
  Settings,
  HelpCircle,
  Grid,
  TrendingUp,
} from "lucide-react";
import logo2 from "../../Images/logo2.png";

// Menu items configuration
const menuItems = [
  { label: "Dashboard", icon: Grid, path: "/dashboard", exact: true },
  { label: "My Posts", icon: FileText, path: "/dashboard/posts", badge: "12" },
  { label: "Browse All", icon: Search, path: "/dashboard/browse" },
  {
    label: "Notifications",
    icon: Bell,
    path: "/dashboard/notifications",
    badge: "3",
  },
  { label: "Analytics", icon: TrendingUp, path: "/dashboard/analytics" },
  { label: "Profile", icon: User, path: "/dashboard/profile" },
];

const bottomItems = [
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
  { label: "Help", icon: HelpCircle, path: "/dashboard/help" },
];

const headItems = [
  { label: "Post New Item", icon: Plus, path: "/dashboard/post-new" },
];

// NavLink component with proper active state handling
const NavLink = ({ item, isOpen, exact }) => {
  return (
    <RouterNavLink
      to={item.path}
      end={exact}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
        ${
          isActive
            ? "bg-red-700/30 text-red-300 border-l-4 border-red-500"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
        }
        ${!isOpen ? "justify-center" : ""}
    `}
    >
      {({ isActive }) => (
        <>
          <item.icon className={`w-5 h-5 ${isActive ? "text-red-400" : ""}`} />
          {isOpen && ( // Only show text if sidebar is open
            <>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs bg-zinc-700 text-zinc-300 rounded-full">
                  {item.badge}
                </span>
              )}
            </>
          )}
          {!isOpen && ( // For accessibility when sidebar is collapsed
            <span className="sr-only">{item.label}</span>
          )}
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

  const [itemsPostedCount, setItemsPostedCount] = useState(0);

  useEffect(() => {
    const fetchMonthlyItems = async () => {
      try {
        const { count, error } = await supabase
          .from("items")
          .select("*", { count: "exact", head: true })
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
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;
      if (!isDesktop) {
        setMobileMenu(false);
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
  }, [location]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const username = user?.email?.split("@")[0] || "User";
  const initial = username[0].toUpperCase();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-zinc-950 to-black text-zinc-300">
      {/* Mobile Menu Overlay */}
      {mobileMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-200"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* Header */}
      <header className="h-16 px-4 lg:px-8 bg-black/70 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between shadow-lg z-30 flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-md transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Desktop sidebar toggle button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:block p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-md transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Main Logo and Brand in Header */}
          <div className="flex items-center gap-2">
            <img
              src={logo2}
              alt="Campus Trace Logo"
              className="w-8 h-8 object-contain"
            />
            <div>
              <span className="font-bold text-xl text-white">Campus Trace</span>
              <p className="text-xs text-zinc-500">User Dashboard</p>{" "}
              {/* Changed to 'User Dashboard' */}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors">
            <Search className="w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search items..."
              className="bg-transparent text-sm outline-none w-32 lg:w-48 text-white placeholder-zinc-500"
            />
          </div>

          {/* Notification bell */}
          <button className="p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-md transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Post New Item button */}
          <button
            onClick={() => navigate("/dashboard/post-new")}
            className="px-4 py-2 bg-red-600 text-white font-semibold text-sm
                        rounded-md hover:bg-red-700 transition-colors shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post New Item</span>
            <span className="sm:hidden">Post</span>
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <img
              src={`https://ui-avatars.com/api/?name=${initial}&background=ef4444&color=ffffff`}
              alt="User"
              className="w-8 h-8 rounded-full border-2 border-zinc-700"
            />
            {user?.email && (
              <span className="hidden lg:block text-sm text-zinc-400">
                {user.email}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Body container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          style={{ overflowY: "hidden" }}
          className={`
            fixed md:relative inset-y-0 left-0 z-50
            bg-zinc-900/95 md:bg-black backdrop-blur-md md:backdrop-blur-none
            border-r border-zinc-800
            flex flex-col transition-all duration-300
            top-16 md:top-0
            ${
              mobileMenu
                ? "translate-x-0 w-72"
                : "-translate-x-full md:translate-x-0"
            }
            ${isSidebarOpen ? "md:w-64" : "md:w-20"}
            h-[calc(100vh-4rem)] md:h-full
            overflow-hidden  {/* Keep aside overflow-hidden */}
          `}
          onWheel={(e) => e.preventDefault()}
        >
          {/* Mobile close button (for consistency, though overlay click handles it) */}
          {mobileMenu && (
            <div className="p-4 flex justify-end md:hidden border-b border-zinc-800">
              <button
                onClick={() => setMobileMenu(false)}
                className="p-1 text-zinc-400 hover:text-white"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Stats Card (only visible when sidebar is open or on mobile) */}
          {(isSidebarOpen || mobileMenu) && (
            <div className="p-4 flex-shrink-0">
              <div className="p-3 bg-zinc-800 rounded-lg">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>This Month</span>
                  <TrendingUp className="w-3 h-3 text-green-400" />
                </div>
                <p className="text-xl font-bold text-white">
                  {itemsPostedCount}
                </p>
                <p className="text-xs text-zinc-500">Items Posted</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-hidden">
            {headItems.map((item, i) => (
              <NavLink
                key={`head-${i}`}
                item={item}
                isOpen={isSidebarOpen || mobileMenu}
              />
            ))}
            <div className="my-3 border-t border-zinc-800" />
            {menuItems.map((item, i) => (
              <NavLink
                key={`menu-${i}`}
                item={item}
                isOpen={isSidebarOpen || mobileMenu}
                exact={item.exact}
              />
            ))}
            <div className="my-3 border-t border-zinc-800" />
            {bottomItems.map((item, i) => (
              <NavLink
                key={`bottom-${i}`}
                item={item}
                isOpen={isSidebarOpen || mobileMenu}
              />
            ))}
          </nav>

          {/* User info & Sign Out */}
          <div className="p-3 border-t border-zinc-800 flex-shrink-0 space-y-3">
            {/* User info */}
            {(isSidebarOpen || mobileMenu) && user && (
              <div className="px-3 py-2 bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500">Logged in as</p>
                <p className="text-sm text-white truncate">{user.email}</p>
              </div>
            )}

            {/* Sign out button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg
                text-zinc-400 hover:bg-red-500/20 hover:text-red-400
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${!isSidebarOpen && !mobileMenu ? "justify-center" : ""}
              `}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {(isSidebarOpen || mobileMenu) && (
                <span className="text-sm">
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </span>
              )}
              {!isSidebarOpen && !mobileMenu && (
                <span className="sr-only">Sign Out</span>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-900/50">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
