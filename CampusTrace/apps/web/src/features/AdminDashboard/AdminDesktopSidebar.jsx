import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  UserCheck,
  MessageSquare,
  HelpCircle,
  Database,
  LayoutGrid,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../api/apiClient";

export default function AdminDesktopSidebar({
  user,
  profile,
  siteName,
  notificationCount,
  messageCount,
  pendingPostsCount,
  pendingVerificationsCount,
}) {
  const navigate = useNavigate();
  const { primaryColor } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [hoveredItem, setHoveredItem] = React.useState(null);

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "Admin";

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

  const adminMenuItems = [
    {
      path: "/admin",
      icon: Home,
      label: "Overview",
      exact: true,
    },
    {
      path: "/admin/user-management",
      icon: Users,
      label: "Users",
    },
    {
      path: "/admin/post-moderation",
      icon: ShieldCheck,
      label: "Moderation",
      badge: pendingPostsCount,
    },
    {
      path: "/admin/manual-verifications",
      icon: UserCheck,
      label: "Verifications",
      badge: pendingVerificationsCount,
    },
    {
      path: "/admin/notifications",
      icon: MessageSquare,
      label: "Notifications",
      badge: notificationCount,
    },
    {
      path: "/admin/backup",
      icon: Database,
      label: "Backup",
    },
    {
      path: "/admin/help",
      icon: HelpCircle,
      label: "Help",
    },
    {
      path: "/admin/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen w-64 bg-white dark:bg-[#1a1a1a] border-r border-neutral-200 dark:border-[#3a3a3a] z-40">
      {/* Admin Branding */}
      <div className="h-20 px-6 flex items-center border-b border-neutral-200 dark:border-[#3a3a3a]">
        <h1
          className="text-2xl font-bold text-neutral-900 dark:text-white"
          style={{
            fontFamily: '"Poppins", sans-serif',
            letterSpacing: "-0.5px",
            fontWeight: "700",
          }}
        >
          {siteName || "CampusTrace"}
          <span className="text-xs font-normal ml-2 text-neutral-500 dark:text-neutral-400">
            Admin
          </span>
        </h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
              className={({ isActive }) => `
                flex items-center gap-4 px-3 py-3 my-1 rounded-lg transition-all duration-200 relative
                ${
                  isActive
                    ? "font-semibold"
                    : "text-neutral-700 dark:text-neutral-300 font-normal"
                }
              `}
              style={
                isActive
                  ? {
                      color: primaryColor,
                      backgroundColor:
                        hoveredItem === item.path
                          ? `${primaryColor}30`
                          : `${primaryColor}20`,
                    }
                  : hoveredItem === item.path
                  ? { backgroundColor: "rgba(0, 0, 0, 0.05)" }
                  : {}
              }
            >
              <Icon className="w-6 h-6 flex-shrink-0" />
              <span className="text-base">{item.label}</span>
              {item.badge > 0 && (
                <span
                  className="ml-auto px-2 py-0.5 text-xs font-bold text-white rounded-full"
                  style={{ backgroundColor: primaryColor }}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Switch to User View & Logout */}
      <div className="border-t border-neutral-200 dark:border-[#3a3a3a] px-3 py-4">
        <button
          onClick={() => {
            navigate("/dashboard");
            setTimeout(() => window.location.reload(), 100);
          }}
          onMouseEnter={() => setHoveredItem("switch-user")}
          onMouseLeave={() => setHoveredItem(null)}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 mb-2"
        >
          <LayoutGrid className="w-6 h-6 flex-shrink-0" />
          <span className="text-base font-medium">User View</span>
        </button>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          onMouseEnter={() => setHoveredItem("logout")}
          onMouseLeave={() => setHoveredItem(null)}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 text-neutral-700 dark:text-neutral-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
        >
          <LogOut className="w-6 h-6 flex-shrink-0" />
          <span className="text-base font-medium">
            {isLoggingOut ? "Signing out..." : "Logout"}
          </span>
        </button>

        {/* Admin Profile Section */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-[#3a3a3a]">
          <div className="flex items-center gap-3 px-3">
            <img
              src={
                profile?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  displayName
                )}&background=6366f1&color=ffffff&bold=true`
              }
              alt="Admin Avatar"
              className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-neutral-200 dark:border-neutral-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                Administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
