import React, { useState, useEffect } from "react";
import { supabase } from "../../api/apiClient";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";

import {
  ChevronLeft,
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

// Refactored NavLink component to use React Router's NavLink
const NavLink = ({ item, open, exact }) => (
  <RouterNavLink
    to={item.path}
    end={exact}
    // NavLink provides an `isActive` boolean in a render prop for className
    className={({ isActive }) => `
    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
    ${
      isActive
        ? "bg-red-700/30 text-red-300 border-l-4 border-red-500"
        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
    }
    ${!open ? "justify-center" : ""}
`}
  >
    {({ isActive }) => (
      <>
        <item.icon className={`w-5 h-5 ${isActive ? "text-red-400" : ""}`} />
        {open && (
          <>
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs bg-zinc-700 text-zinc-300 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </>
    )}
  </RouterNavLink>
);

const { count, error } = await supabase
  .from("items")
  .select("*", { count: "exact", head: true });

if (error) {
  console.error("Error fetching count:", error);
}

console.log("Total rows:", count);

export default function DashboardLayout({ children, user }) {
  const [open, setOpen] = useState(window.innerWidth >= 768);
  const [mobileMenu, setMobileMenu] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setOpen(desktop);
      if (desktop) setMobileMenu(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const username = user?.email?.split("@")[0] || "User";
  const initial = username[0].toUpperCase();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-zinc-950 to-black text-zinc-300">
      {/* Mobile Overlay */}
      {mobileMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* Header - Fixed at top */}
      <header
        className="h-16 px-4 lg:px-8 bg-black/70 backdrop-blur-md border-b border-zinc-800 
                            flex items-center justify-between shadow-lg z-30 flex-shrink-0"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenu(true)}
            className="md:hidden p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 
                                bg-zinc-800 rounded-lg border border-zinc-700"
          >
            <Search className="w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search items..."
              className="bg-transparent text-sm outline-none w-48 text-white placeholder-zinc-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-zinc-400 hover:text-white relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Use the navigate function to go to the 'post-new' page */}
          <button
            onClick={() => navigate("/dashboard/post-new")}
            className="px-4 py-2 bg-red-600 text-white font-semibold text-sm 
                                    rounded-md hover:bg-red-700 transition-colors shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post New Item</span>
            <span className="sm:hidden">Post</span>
          </button>

          <img
            src={`https://placehold.co/32x32/18181b/ffffff?text=${initial}`}
            alt="User"
            className="w-8 h-8 rounded-full border-2 border-red-500"
          />
        </div>
      </header>

      {/* Body - Flex container for sidebar and main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fixed height, no scrolling */}
        <aside
          className={`
                fixed md:relative inset-y-0 left-0 top-16 md:top-0 z-50
                bg-black border-r border-zinc-800
                flex flex-col transition-all duration-300
                ${
                  mobileMenu
                    ? "translate-x-0"
                    : "-translate-x-full md:translate-x-0"
                }
                ${open ? "w-72" : "w-20"}
                h-[calc(100vh-4rem)] md:h-full
                overflow-hidden
            `}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-zinc-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600 rounded-lg shadow-md">
                  <img
                    src={logo2}
                    alt="Logo"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                {open && (
                  <div>
                    <span className="font-bold text-xl text-white">
                      Campus Trace
                    </span>
                    <p className="text-xs text-zinc-500">Lost & Found System</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setMobileMenu(false)}
                className="md:hidden p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Desktop toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="hidden md:block absolute -right-3 top-9 p-1.5 
                                        bg-zinc-800 border border-zinc-700 rounded-full
                                        text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <ChevronLeft
                className={`w-5 h-5 transition-transform ${
                  !open && "rotate-180"
                }`}
              />
            </button>
          </div>

          {/* Stats Card */}
          {open && (
            <div className="p-4 flex-shrink-0">
              <div className="p-3 bg-zinc-800 rounded-lg">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>This Month</span>
                  <TrendingUp className="w-3 h-3 text-green-400" />
                </div>
                <p className="text-xl font-bold text-white">{count}</p>
                <p className="text-xs text-zinc-500">Items Posted</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-hidden">
            {/* We no longer need to pass the 'active' prop */}
            {menuItems.map((item, i) => (
              <NavLink key={i} item={item} open={open} exact={item.exact} />
            ))}
            <div className="my-3 border-t border-zinc-800" />
            {bottomItems.map((item, i) => (
              <NavLink key={i} item={item} open={open} />
            ))}
            <div className="my-3 border-t border-zinc-800" />
            {headItems.map((item, i) => (
              <NavLink key={i} item={item} open={open} />
            ))}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t border-zinc-800 flex-shrink-0">
            {open && (
              <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg mb-2">
                <img
                  src={`https://placehold.co/32x32/18181b/ffffff?text=${initial}`}
                  alt="User"
                  className="w-8 h-8 rounded-full border-2 border-red-500"
                />
                <div>
                  <p className="text-sm font-medium text-white">{username}</p>
                  <p className="text-xs text-zinc-500">Online</p>
                </div>
              </div>
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                                        text-zinc-400 hover:bg-red-700/20 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {open && <span className="text-sm">Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Main Content - Scrollable */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
