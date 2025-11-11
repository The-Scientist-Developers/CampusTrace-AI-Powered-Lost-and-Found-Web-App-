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
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r z-40"
      style={{
        backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
        borderRightColor: isDark ? "#262626" : "#dbdbdb",
      }}
    >
      {/* Logo with Pacifico Font (Instagram style) */}
      <div className="p-6 pt-8 pb-4">
        <h1
          className="text-3xl font-['Pacifico'] tracking-tight"
          style={{
            color: isDark ? "#ffffff" : "#000000",
            letterSpacing: "-0.5px",
          }}
        >
          CampusTrace
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 group ${
                    isActive ? "font-bold" : "font-normal hover:bg-opacity-10"
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive
                    ? primaryColor
                    : isDark
                    ? "#a8a8a8"
                    : "#737373",
                  backgroundColor: isActive
                    ? isDark
                      ? primaryColor + "20"
                      : primaryColor + "10"
                    : "transparent",
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains("font-bold")) {
                    e.currentTarget.style.backgroundColor = isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  const isActive =
                    e.currentTarget.getAttribute("aria-current") === "page";
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  } else {
                    e.currentTarget.style.backgroundColor = isDark
                      ? primaryColor + "20"
                      : primaryColor + "10";
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <item.icon
                        size={28}
                        strokeWidth={isActive ? 2.5 : 2}
                        className="transition-transform group-hover:scale-110"
                      />
                      {item.count > 0 && (
                        <span
                          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1"
                          style={{ backgroundColor: "#ff3250" }}
                        >
                          {item.count > 9 ? "9+" : item.count}
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

      {/* Bottom Section - Minimal */}
      <div
        className="p-3 border-t space-y-1"
        style={{ borderTopColor: isDark ? "#262626" : "#dbdbdb" }}
      >
        <NavLink
          to="/dashboard/settings"
          className="flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200"
          style={({ isActive }) => ({
            color: isActive ? primaryColor : isDark ? "#a8a8a8" : "#737373",
            fontWeight: isActive ? "bold" : "normal",
            backgroundColor: isActive
              ? isDark
                ? primaryColor + "20"
                : primaryColor + "10"
              : "transparent",
          })}
          onMouseEnter={(e) => {
            const isActive =
              e.currentTarget.getAttribute("aria-current") === "page";
            if (!isActive) {
              e.currentTarget.style.backgroundColor = isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)";
            }
          }}
          onMouseLeave={(e) => {
            const isActive =
              e.currentTarget.getAttribute("aria-current") === "page";
            if (!isActive) {
              e.currentTarget.style.backgroundColor = "transparent";
            } else {
              e.currentTarget.style.backgroundColor = isDark
                ? primaryColor + "20"
                : primaryColor + "10";
            }
          }}
        >
          <Settings size={28} strokeWidth={2} />
          <span className="text-base">Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200"
          style={{ color: isDark ? "#a8a8a8" : "#737373" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.05)";
            e.currentTarget.style.color = isDark ? "#ffffff" : "#000000";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = isDark ? "#a8a8a8" : "#737373";
          }}
        >
          <LogOut size={28} strokeWidth={2} />
          <span className="text-base">Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
