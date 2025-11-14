import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Moon, Sun, ShieldCheck } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export default function AdminMobileHeader({
  notificationCount,
  pendingPostsCount,
  siteName,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, primaryColor } = useTheme();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/admin" || path === "/admin/") return "Overview";
    if (path.includes("/admin/user-management")) return "Users";
    if (path.includes("/admin/post-moderation")) return "Moderation";
    if (path.includes("/admin/manual-verifications")) return "Verifications";
    if (path.includes("/admin/backup")) return "Backup";
    if (path.includes("/admin/help")) return "Help";
    if (path.includes("/admin/settings")) return "Settings";
    if (path.includes("/admin/notifications")) return "Notifications";
    if (path.includes("/admin/profile")) return "Profile";
    return "Admin Panel";
  };

  return (
    <header
      className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-[#1a1a1a] border-b border-neutral-200 dark:border-[#2a2a2a] z-50"
      style={{
        boxShadow:
          theme === "dark"
            ? "0 1px 3px 0 rgba(0, 0, 0, 0.3)"
            : "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="h-16 px-5 flex items-center justify-between">
        {/* Left: Site Name/Branding */}
        <div className="flex items-center gap-2.5">
          <h1
            className="text-2xl font-bold text-neutral-900 dark:text-white"
            style={{
              fontFamily: '"Poppins", sans-serif',
              letterSpacing: "-0.6px",
              fontWeight: "700",
            }}
          >
            {siteName || "CampusTrace"}
          </h1>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-md"
            style={{
              backgroundColor:
                theme === "dark"
                  ? "rgba(99, 102, 241, 0.2)"
                  : "rgba(99, 102, 241, 0.1)",
              color: theme === "dark" ? "#A5B4FC" : "#4F46E5",
            }}
          >
            Admin
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200 active:scale-95"
            style={{
              minWidth: "44px",
              minHeight: "44px",
            }}
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={() => navigate("/admin/notifications")}
            className="p-2.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg relative transition-all duration-200 active:scale-95"
            style={{
              minWidth: "44px",
              minHeight: "44px",
            }}
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span
                className="absolute text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5"
                style={{
                  backgroundColor: primaryColor,
                  top: "4px",
                  right: "4px",
                  minWidth: "20px",
                  height: "20px",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                }}
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {/* Moderate Button */}
          <button
            onClick={() => navigate("/admin/post-moderation")}
            className="px-4 py-2.5 text-white font-bold text-sm rounded-lg flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
            style={{
              backgroundColor: primaryColor,
              minHeight: "44px",
            }}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Moderate</span>
            {pendingPostsCount > 0 && (
              <span
                className="ml-0.5 px-2 py-0.5 bg-white text-xs font-bold rounded-full"
                style={{ color: primaryColor }}
              >
                {pendingPostsCount > 9 ? "9+" : pendingPostsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Page Title Bar */}
      <div className="px-5 py-3 bg-neutral-50 dark:bg-[#0f0f0f] border-t border-neutral-200 dark:border-[#2a2a2a]">
        <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 tracking-wide uppercase">
          {getPageTitle()}
        </h2>
      </div>
    </header>
  );
}
