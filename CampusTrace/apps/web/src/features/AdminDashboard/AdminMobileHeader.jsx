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
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-[#1a1a1a] border-b border-neutral-200 dark:border-[#3a3a3a] z-50">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: Site Name/Branding */}
        <div className="flex items-center gap-2">
          <h1
            className="text-xl font-bold text-neutral-900 dark:text-white"
            style={{
              fontFamily: '"Poppins", sans-serif',
              letterSpacing: "-0.5px",
              fontWeight: "700",
            }}
          >
            {siteName || "CampusTrace"}
          </h1>
          <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
            Admin
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
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
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span
                className="absolute top-0 right-0 min-w-[18px] h-[18px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                style={{ backgroundColor: primaryColor }}
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {/* Moderate Button */}
          <button
            onClick={() => navigate("/admin/post-moderation")}
            className="px-3 py-1.5 text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Mod</span>
            {pendingPostsCount > 0 && (
              <span
                className="ml-1 px-1.5 py-0.5 bg-white text-xs font-bold rounded-full"
                style={{ color: primaryColor }}
              >
                {pendingPostsCount > 9 ? "9+" : pendingPostsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Page Title Bar */}
      <div className="px-4 py-2 bg-neutral-50 dark:bg-[#0a0a0a] border-b border-neutral-200 dark:border-[#3a3a3a]">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {getPageTitle()}
        </h2>
      </div>
    </header>
  );
}
