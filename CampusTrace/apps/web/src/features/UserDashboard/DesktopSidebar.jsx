import React, { useState } from "react";
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
  Sparkles,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../api/apiClient";

// Color mode definitions matching mobile app
const THEME_COLORS = {
  blue: { primary: "#1877F2", gradient: "from-blue-500 to-blue-600" },
  purple: { primary: "#A855F7", gradient: "from-purple-500 to-purple-600" },
  pink: { primary: "#EC4899", gradient: "from-pink-500 to-pink-600" },
  green: { primary: "#22C55E", gradient: "from-green-500 to-green-600" },
};

const DesktopSidebar = ({
  profile,
  notificationCount,
  messageCount,
  siteName = "CampusTrace",
}) => {
  const navigate = useNavigate();
  const { theme, colorMode } = useTheme();
  const [hoveredItem, setHoveredItem] = useState(null);

  const primaryColor =
    THEME_COLORS[colorMode]?.primary || THEME_COLORS.blue.primary;
  const gradientClass =
    THEME_COLORS[colorMode]?.gradient || THEME_COLORS.blue.gradient;
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
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col backdrop-blur-lg"
      style={{
        backgroundColor: isDark ? "rgba(26, 26, 26, 0.95)" : "rgba(255, 255, 255, 0.95)",
        borderRight: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
        zIndex: 40,
        boxShadow: isDark 
          ? "4px 0 24px rgba(0, 0, 0, 0.4)" 
          : "4px 0 24px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Logo Section with gradient accent */}
      <div className="px-6 py-6 mb-2 relative">
        <div 
          className="absolute inset-0 opacity-10 bg-gradient-to-br"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}20 0%, transparent 100%)`,
          }}
        />
        <div className="flex items-center gap-3 relative">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden relative group cursor-pointer transform transition-all duration-300 hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
              boxShadow: `0 4px 12px ${primaryColor}40`,
            }}
          >
            <img
              src="/Icon.svg"
              alt="CampusTrace Logo"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </div>

          {/* Wordmark with animated underline */}
          <div className="relative">
            {siteName && siteName !== "CampusTrace" && (
              <p
                className="text-xs font-medium mb-0.5 tracking-wider uppercase"
                style={{
                  color: isDark ? "#a3a3a3" : "#737373",
                  letterSpacing: "0.5px",
                }}
              >
                {siteName}
              </p>
            )}
            <h1
              className="text-xl font-['Inter'] tracking-tight relative"
              style={{
                color: isDark ? "#ffffff" : "#111111",
                fontWeight: "700",
                letterSpacing: "-0.025em",
                fontSize: "20px",
              }}
            >
              CampusTrace
              <Sparkles 
                size={14} 
                className="inline-block ml-1 opacity-50"
                style={{ color: primaryColor }}
              />
            </h1>
            <div 
              className="absolute -bottom-1 left-0 h-0.5 rounded-full transition-all duration-500"
              style={{
                background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}60)`,
                width: "60%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation with enhanced hover effects */}
      <nav className="flex-1 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path} className="relative">
              <NavLink
                to={item.path}
                end={item.exact}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                className="relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden"
                style={({ isActive }) => ({
                  color: isActive
                    ? isDark
                      ? "#ffffff"
                      : "#000000"
                    : isDark
                    ? "#9ca3af"
                    : "#6b7280",
                  backgroundColor: isActive
                    ? isDark
                      ? primaryColor + "20"
                      : primaryColor + "10"
                    : hoveredItem === item.path
                    ? isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)"
                    : "transparent",
                  fontWeight: isActive ? "600" : "400",
                  transform: hoveredItem === item.path ? "translateX(4px)" : "translateX(0)",
                  boxShadow: isActive
                    ? `inset 0 0 0 2px ${primaryColor}30`
                    : "none",
                })}
              >
                {({ isActive }) => (
                  <>
                    {/* Animated background gradient */}
                    {isActive && (
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${primaryColor}40, transparent)`,
                          animation: "slideGradient 3s ease-in-out infinite",
                        }}
                      />
                    )}

                    {/* Active indicator bar */}
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full transition-all duration-300"
                      style={{
                        backgroundColor: isActive ? primaryColor : "transparent",
                        boxShadow: isActive ? `0 0 8px ${primaryColor}60` : "none",
                      }}
                    />

                    {/* Icon with pulse animation for notifications */}
                    <div className="relative flex-shrink-0 z-10">
                      <item.icon
                        size={22}
                        strokeWidth={isActive ? 2.5 : hoveredItem === item.path ? 2 : 1.5}
                        className="transition-all duration-300"
                        style={{
                          color: isActive ? primaryColor : "inherit",
                          filter: isActive ? `drop-shadow(0 0 8px ${primaryColor}40)` : "none",
                        }}
                      />
                      {item.count > 0 && (
                        <>
                          <span
                            className="absolute -top-2 -right-2 min-w-[22px] h-[22px] flex items-center justify-center text-xs font-bold text-white rounded-full px-1.5 animate-bounce"
                            style={{
                              backgroundColor: "#ef4444",
                              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
                            }}
                          >
                            {item.count > 99 ? "99+" : item.count}
                          </span>
                          <span
                            className="absolute -top-2 -right-2 min-w-[22px] h-[22px] rounded-full animate-ping"
                            style={{
                              backgroundColor: "#ef4444",
                              opacity: 0.4,
                            }}
                          />
                        </>
                      )}
                    </div>

                    <span className="text-base z-10 transition-all duration-300">
                      {item.label}
                    </span>

                    {/* Hover accent */}
                    {hoveredItem === item.path && !isActive && (
                      <div
                        className="absolute right-4 w-2 h-2 rounded-full animate-pulse"
                        style={{
                          backgroundColor: primaryColor,
                          boxShadow: `0 0 6px ${primaryColor}`,
                        }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section with glass effect */}
      <div
        className="px-3 py-4 space-y-1 backdrop-blur-xl relative"
        style={{
          borderTop: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
          background: isDark
            ? "linear-gradient(to top, rgba(0, 0, 0, 0.2), transparent)"
            : "linear-gradient(to top, rgba(255, 255, 255, 0.8), transparent)",
        }}
      >
        <NavLink
          to="/dashboard/settings"
          onMouseEnter={() => setHoveredItem("settings")}
          onMouseLeave={() => setHoveredItem(null)}
          className="relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden"
          style={({ isActive }) => ({
            color: isActive
              ? isDark
                ? "#ffffff"
                : "#000000"
              : isDark
              ? "#9ca3af"
              : "#6b7280",
            backgroundColor: isActive
              ? isDark
                ? primaryColor + "20"
                : primaryColor + "10"
              : hoveredItem === "settings"
              ? isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.03)"
              : "transparent",
            fontWeight: isActive ? "600" : "400",
            transform: hoveredItem === "settings" ? "translateX(4px)" : "translateX(0)",
          })}
        >
          <Settings 
            size={22} 
            strokeWidth={1.5} 
            className={hoveredItem === "settings" ? "animate-spin-slow" : ""}
          />
          <span className="text-base">Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          onMouseEnter={() => setHoveredItem("logout")}
          onMouseLeave={() => setHoveredItem(null)}
          className="w-full relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden group"
          style={{
            color: hoveredItem === "logout" ? "#ef4444" : isDark ? "#9ca3af" : "#6b7280",
            backgroundColor: hoveredItem === "logout"
              ? "rgba(239, 68, 68, 0.08)"
              : "transparent",
            border: "none",
            transform: hoveredItem === "logout" ? "translateX(4px)" : "translateX(0)",
          }}
        >
          {/* Animated background on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1), transparent)",
              animation: hoveredItem === "logout" ? "slideGradient 2s ease-in-out infinite" : "none",
            }}
          />
          
          <LogOut 
            size={22} 
            strokeWidth={1.5}
            className="z-10 transition-transform duration-300 group-hover:translate-x-1"
          />
          <span className="text-base z-10">Log out</span>
        </button>
      </div>

      {/* Add CSS animation */}
      <style jsx>{`
        @keyframes slideGradient {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </aside>
  );
};

export default DesktopSidebar;