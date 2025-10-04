import React, { useState, useEffect } from "react";
import {
  useLocation,
  NavLink as RouterNavLink,
  useNavigate,
} from "react-router-dom";
import { supabase } from "../../api/apiClient";
import {
  Home,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Search,
  Bell,
} from "lucide-react";

// Menu items configuration
const menuItems = [
  { href: "/admin", label: "Overview", icon: Home, exact: true },
  { href: "/admin/moderation", label: "Post Moderation", icon: ShieldCheck },
  { href: "/admin/user-management", label: "User Management", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// NavLink component with proper active state handling
const AdminNavLink = ({ item, isOpen, onClick }) => {
  const location = useLocation();

  // For the overview page, we want exact match, for others prefix match
  const isActive = item.exact
    ? location.pathname === item.href
    : location.pathname.startsWith(item.href);

  return (
    <RouterNavLink
      to={item.href}
      onClick={onClick} // Close mobile menu on click
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium
        ${
          isActive
            ? "bg-red-500/20 text-red-500 border-l-4 border-red-500"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-white border-l-4 border-transparent"
        }
        ${!isOpen ? "justify-center" : ""}
      `}
    >
      <item.icon
        className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-red-500" : ""}`}
      />
      {isOpen && (
        <span className="transition-opacity duration-200">{item.label}</span>
      )}
      {!isOpen && (
        <span className="sr-only">{item.label}</span> // For accessibility
      )}
    </RouterNavLink>
  );
};

export default function AdminDashboardLayout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [isSidebarOpen, setSidebarOpen] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem("adminSidebarOpen");
    return saved !== null ? JSON.parse(saved) : window.innerWidth >= 768;
  });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle window resize
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

  // Save sidebar preference to localStorage
  useEffect(() => {
    if (window.innerWidth >= 768) {
      localStorage.setItem("adminSidebarOpen", JSON.stringify(isSidebarOpen));
    }
  }, [isSidebarOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenu(false);
  }, [location]);

  // Handle logout with loading state
  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Redirect to login page after successful logout
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Toggle sidebar (desktop only)
  const toggleSidebar = () => {
    if (window.innerWidth >= 768) {
      setSidebarOpen(!isSidebarOpen);
    }
  };

  // Handle mobile menu item click
  const handleMobileNavClick = () => {
    if (window.innerWidth < 768) {
      setMobileMenu(false);
    }
  };

  // Get user initial for avatar
  const getInitial = () => {
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name[0].toUpperCase();
    }
    return "A";
  };

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
            aria-label="Toggle menu"
          >
            {mobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden md:block p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-md transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-xl font-semibold text-white">Admin Panel</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors">
            <Search className="w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm outline-none w-32 lg:w-48 text-white placeholder-zinc-500"
            />
          </div>

          {/* Notification bell */}
          <button className="p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-md transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <img
              src={`https://ui-avatars.com/api/?name=${getInitial()}&background=ef4444&color=ffffff`}
              alt="Admin"
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
          `}
        >
          {/* Logo/Header */}
          <div className="p-4 border-b border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              {(isSidebarOpen || mobileMenu) && (
                <div className="transition-opacity duration-200">
                  <span className="font-bold text-lg text-white">
                    Campus Trace
                  </span>
                  <p className="text-xs text-zinc-500">Administrator</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <AdminNavLink
                key={item.href}
                item={item}
                isOpen={isSidebarOpen || mobileMenu}
                onClick={handleMobileNavClick}
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
