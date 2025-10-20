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
  Menu,
  X,
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import logo from "../../Images/Logo.svg";
import { useTheme } from "../../contexts/ThemeContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// ---------------- Skeleton Loader ---------------- //
const AdminDashboardSkeleton = ({ isSidebarOpen, mobileMenu }) => (
  <div className="h-screen flex flex-col bg-slate-50 dark:bg-black">
    <header className="h-16 px-6 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
      <Skeleton circle width={32} height={32} />
      <Skeleton width={120} height={24} />
    </header>
    <div className="flex flex-1 overflow-hidden">
      <aside
        className={`transition-all duration-300 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border-r border-neutral-200/40 dark:border-neutral-800/40 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="p-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={40} borderRadius={8} className="mb-2" />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        <Skeleton height={40} width={200} />
        <Skeleton height={300} className="mt-6" />
      </main>
    </div>
  </div>
);

// ---------------- Menu Config ---------------- //
const menuItems = [
  { href: "/admin", label: "Overview", icon: Home, exact: true },
  {
    href: "/admin/post-moderation",
    label: "Post Moderation",
    icon: ShieldCheck,
  },
  { href: "/admin/user-management", label: "User Management", icon: Users },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// ---------------- NavLink ---------------- //
const AdminNavLink = ({ item, isOpen, onClick }) => {
  const location = useLocation();
  const isActive = item.exact
    ? location.pathname === item.href
    : location.pathname.startsWith(item.href);

  return (
    <RouterNavLink
      to={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
        ${
          isActive
            ? "bg-gradient-to-r from-indigo-500/15 to-indigo-500/10 text-indigo-500 border border-indigo-500/30 shadow-sm"
            : "text-neutral-600 dark:text-neutral-400 hover:bg-white/20 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white hover:shadow-[0_0_10px_rgba(99,102,241,0.1)]"
        }
        ${!isOpen ? "justify-center" : ""}
        group`}
    >
      <item.icon
        className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
          isActive
            ? "text-indigo-500"
            : "text-neutral-500 dark:text-neutral-500"
        }`}
      />
      {isOpen && (
        <span className="transition-opacity duration-300 ease-in-out opacity-90 group-hover:opacity-100">
          {item.label}
        </span>
      )}
    </RouterNavLink>
  );
};

// ---------------- Main Layout ---------------- //
export default function AdminDashboardLayout({
  children,
  user,
  isLoading = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [isSidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("adminSidebarOpen");
    return saved !== null ? JSON.parse(saved) : window.innerWidth >= 1024;
  });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenu(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 768)
      localStorage.setItem("adminSidebarOpen", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    setMobileMenu(false);
  }, [location]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    navigate("/login");
    setIsLoggingOut(false);
  };

  const getInitial = () => user?.email?.[0].toUpperCase() || "A";

  if (isLoading)
    return (
      <AdminDashboardSkeleton
        isSidebarOpen={isSidebarOpen}
        mobileMenu={mobileMenu}
      />
    );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-black dark:to-neutral-950 text-neutral-900 dark:text-neutral-300 transition-all duration-300">
      {mobileMenu && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* Header */}
      <header className="h-16 px-6 lg:px-10 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden p-2 text-neutral-500 hover:bg-white/30 dark:hover:bg-neutral-800/60 rounded-lg transition"
          >
            {mobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="hidden md:block p-2 text-neutral-500 hover:bg-white/30 dark:hover:bg-neutral-800/60 rounded-lg transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white opacity-90">
            Admin Panel
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 text-neutral-500 hover:bg-white/30 dark:hover:bg-neutral-800/60 rounded-lg transition"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
          <button className="p-2 text-neutral-500 relative hover:bg-white/30 dark:hover:bg-neutral-800/60 rounded-lg transition">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Sidebar + Main */}
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`fixed md:relative inset-y-0 left-0 z-50 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border-r border-neutral-200/40 dark:border-neutral-800/40 transition-all duration-500 ease-in-out top-16 md:top-0 shadow-[inset_0_0_1px_rgba(255,255,255,0.3)] ${
            mobileMenu
              ? "translate-x-0 w-72"
              : "-translate-x-full md:translate-x-0"
          } ${
            isSidebarOpen ? "md:w-64" : "md:w-20"
          } h-[calc(100vh-4rem)] md:h-full`}
        >
          {/* Logo */}
          <div className="p-4 flex items-center gap-3 border-b border-neutral-200/40 dark:border-neutral-800/40">
            <img
              src={logo}
              alt="Campus Trace Logo"
              className="w-8 h-8 rounded-full"
            />
            {(isSidebarOpen || mobileMenu) && (
              <span className="font-semibold text-neutral-900 dark:text-white text-lg opacity-90">
                Campus Trace
              </span>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-neutral-400/30 transition-all">
            {menuItems.map((item) => (
              <AdminNavLink
                key={item.href}
                item={item}
                isOpen={isSidebarOpen || mobileMenu}
                onClick={() => mobileMenu && setMobileMenu(false)}
              />
            ))}
          </nav>

          {/* Profile + Sign out */}
          <div className="p-3 border-t border-neutral-200/40 dark:border-neutral-800/40">
            <div
              className="p-2 flex items-center gap-3 cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition"
              onClick={() => navigate("/admin/profile")}
            >
              <img
                src={`https://ui-avatars.com/api/?name=${getInitial()}&background=6366f1&color=ffffff`}
                alt="Admin"
                className="w-9 h-9 rounded-full"
              />
              {(isSidebarOpen || mobileMenu) && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-neutral-800 dark:text-white">
                    {user?.email?.split("@")[0] || "Admin"}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {user?.email}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 mt-2 ${
                !isSidebarOpen && !mobileMenu ? "justify-center" : ""
              }`}
            >
              <LogOut className="w-5 h-5" />
              {(isSidebarOpen || mobileMenu) && (
                <span className="text-sm font-medium">
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </span>
              )}
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="p-6 sm:p-8 lg:p-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
