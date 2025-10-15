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
import logo from "../../Images/logo1.jpg";
import { useTheme } from "../../contexts/ThemeContext";

const menuItems = [
  { href: "/admin", label: "Overview", icon: Home, exact: true },
  {
    href: "/admin/post-moderation",
    label: "Post Moderation",
    icon: ShieldCheck,
  },
  { href: "/admin/user-management", label: "User Management", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const AdminNavLink = ({ item, isOpen, onClick }) => {
  const location = useLocation();
  const isActive = item.exact
    ? location.pathname === item.href
    : location.pathname.startsWith(item.href);

  return (
    <RouterNavLink
      to={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium
        ${
          isActive
            ? "bg-primary-500/10 text-primary-500 font-semibold"
            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
        }
        ${!isOpen ? "justify-center" : ""}
        group
      `}
    >
      <item.icon
        className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
          isActive
            ? "text-primary-500"
            : "text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white"
        }`}
      />
      {isOpen && (
        <span className="transition-opacity duration-200">{item.label}</span>
      )}
      {!isOpen && <span className="sr-only">{item.label}</span>}
    </RouterNavLink>
  );
};

export default function AdminDashboardLayout({ children, user }) {
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
      if (window.innerWidth >= 768) {
        setMobileMenu(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      localStorage.setItem("adminSidebarOpen", JSON.stringify(isSidebarOpen));
    }
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

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-black text-neutral-900 dark:text-neutral-300">
      {mobileMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <header className="h-16 px-4 lg:px-8 bg-white dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shadow-sm z-30 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden p-2 text-neutral-500 rounded-md"
            aria-label="Toggle menu"
          >
            {mobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="hidden md:block p-2 text-neutral-500 rounded-md"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Admin Panel
          </h1>
        </div>

        <div className="flex items-center gap-3">
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
          <button className="p-2 text-neutral-500 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-2">
            <img
              src={`https://ui-avatars.com/api/?name=${getInitial()}&background=4f46e5&color=ffffff`}
              alt="Admin"
              className="w-8 h-8 rounded-full border-2 border-neutral-300 dark:border-neutral-700"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`fixed md:relative inset-y-0 left-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md md:bg-white dark:md:bg-neutral-900 flex flex-col transition-all duration-300 top-16 md:top-0 border-r border-neutral-200 dark:border-neutral-800 ${
            mobileMenu
              ? "translate-x-0 w-72"
              : "-translate-x-full md:translate-x-0"
          } ${
            isSidebarOpen ? "md:w-64" : "md:w-20"
          } h-[calc(100vh-4rem)] md:h-full`}
        >
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
            <img
              src={logo}
              alt="Campus Trace Logo"
              className="w-8 h-8 rounded-full"
            />
            {(isSidebarOpen || mobileMenu) && (
              <div className="transition-opacity duration-200">
                <span className="font-bold text-lg text-neutral-900 dark:text-white">
                  Campus Trace
                </span>
              </div>
            )}
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <AdminNavLink
                key={item.href}
                item={item}
                isOpen={isSidebarOpen || mobileMenu}
                onClick={() => mobileMenu && setMobileMenu(false)}
              />
            ))}
          </nav>
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50 ${
                !isSidebarOpen && !mobileMenu ? "justify-center" : ""
              }`}
            >
              <LogOut className="w-5 h-5" />
              {(isSidebarOpen || mobileMenu) && (
                <span className="text-sm">
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </span>
              )}
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
