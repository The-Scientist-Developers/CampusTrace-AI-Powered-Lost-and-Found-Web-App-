import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  PlusSquare,
  Heart,
  MessageCircle,
  User,
  Settings,
  Award,
  FileText,
  LogOut,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../api/apiClient";

// Color mode definitions matching mobile app
const THEME_COLORS = {
  blue: { primary: "#1877F2" },
  purple: { primary: "#A855F7" },
  pink: { primary: "#EC4899" },
  green: { primary: "#22C55E" },
};

const DesktopSidebar = ({ profile, notificationCount, messageCount }) => {
  const navigate = useNavigate();
  const { theme, colorMode } = useTheme();

  const primaryColor =
    THEME_COLORS[colorMode]?.primary || THEME_COLORS.blue.primary;
  const isDark = theme === "dark";

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home", exact: true },
    { path: "/dashboard/browse-all", icon: Search, label: "Search" },
    {
      path: "/dashboard/notifications",
      icon: Heart,
      label: "Notifications",
      count: notificationCount,
    },
    {
      path: "/dashboard/messages",
      icon: MessageCircle,
      label: "Messages",
      count: messageCount,
    },
    { path: "/dashboard/post-new", icon: PlusSquare, label: "Create" },
    { path: "/dashboard/my-posts", icon: FileText, label: "My Posts" },
    { path: "/dashboard/leaderboard", icon: Award, label: "Leaderboard" },
    { path: "/dashboard/profile", icon: User, label: "Profile" },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col"
      style={{
        backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
        borderRight: `1px solid ${isDark ? "#262626" : "#dbdbdb"}`,
        zIndex: 40,
      }}
    >
      {/* Logo Section */}
      <div className="px-6 py-6 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden">
            <img
              src="/Icon.svg" // ← Place your uploaded image in public/assets/
              alt="CampusTrace Logo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Wordmark */}
          <h1
            className="text-xl font-['Inter'] tracking-tight"
            style={{
              color: isDark ? "#ffffff" : "#111111",
              fontWeight: "600",
              letterSpacing: "-0.025em",
              fontSize: "20px",
            }}
          >
            Campus
            <span style={{ color: primaryColor, fontWeight: "700" }}>
              Trace
            </span>
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.exact}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group"
                style={({ isActive }) => ({
                  color: isActive
                    ? isDark
                      ? "#ffffff"
                      : "#000000"
                    : isDark
                    ? "#6b7280"
                    : "#6b7280",
                  backgroundColor: isActive
                    ? isDark
                      ? primaryColor + "15"
                      : primaryColor + "08"
                    : "transparent",
                  fontWeight: isActive ? "500" : "400",
                  borderLeft: isActive
                    ? `4px solid ${primaryColor}`
                    : "4px solid transparent",
                })}
              >
                {({ isActive }) => (
                  <>
                    <div className="relative flex-shrink-0">
                      <item.icon
                        size={22}
                        strokeWidth={isActive ? 2 : 1.5}
                        style={{
                          color: isActive ? primaryColor : "inherit",
                        }}
                      />
                      {item.count > 0 && (
                        <span
                          className="absolute -top-2 -right-2 min-w-[22px] h-[22px] flex items-center justify-center text-xs font-medium text-white rounded-full px-1.5"
                          style={{
                            backgroundColor: "#ef4444",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          {item.count > 99 ? "99+" : item.count}
                        </span>
                      )}
                    </div>
                    <span className="text-base">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div
        className="px-3 py-4 space-y-1"
        style={{
          borderTop: `1px solid ${isDark ? "#262626" : "#dbdbdb"}`,
        }}
      >
        <NavLink
          to="/dashboard/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
          style={({ isActive }) => ({
            color: isActive
              ? isDark
                ? "#ffffff"
                : "#000000"
              : isDark
              ? "#6b7280"
              : "#6b7280",
            backgroundColor: isActive
              ? isDark
                ? primaryColor + "15"
                : primaryColor + "08"
              : "transparent",
            fontWeight: isActive ? "500" : "400",
            borderLeft: isActive
              ? `4px solid ${primaryColor}`
              : "4px solid transparent",
          })}
        >
          <Settings size={22} strokeWidth={1.5} />
          <span className="text-base">Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
          style={{
            color: isDark ? "#6b7280" : "#6b7280",
            backgroundColor: "transparent",
            border: "none",
            borderLeft: "4px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.05)";
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.borderLeftColor = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = isDark ? "#6b7280" : "#6b7280";
            e.currentTarget.style.borderLeftColor = "transparent";
          }}
        >
          <LogOut size={22} strokeWidth={1.5} />
          <span className="text-base">Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
