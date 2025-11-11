import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Search, PlusSquare, Award, User, FileText } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

// Color mode definitions matching mobile app
const THEME_COLORS = {
  blue: {
    primary: "#1877F2",
    light: "#60A5FA",
    dark: "#1565D8",
  },
  purple: {
    primary: "#A855F7",
    light: "#C084FC",
    dark: "#9333EA",
  },
  pink: {
    primary: "#EC4899",
    light: "#F472B6",
    dark: "#DB2777",
  },
  green: {
    primary: "#22C55E",
    light: "#4ADE80",
    dark: "#16A34A",
  },
};

const MobileBottomNav = ({ profile }) => {
  const { theme, colorMode } = useTheme();

  // Get primary color based on color mode
  const primaryColor =
    THEME_COLORS[colorMode]?.primary || THEME_COLORS.blue.primary;
  const isDark = theme === "dark";

  // Get text colors
  const inactiveColor = isDark ? "#9CA3AF" : "#6B7280";

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home", exact: true },
    { path: "/dashboard/browse-all", icon: Search, label: "Browse" },
    { path: "/dashboard/post-new", icon: PlusSquare, label: "Post" },
    { path: "/dashboard/leaderboard", icon: Award, label: "Leaderboard" },
    { path: "/dashboard/my-posts", icon: FileText, label: "My Posts" },
    { path: "/dashboard/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t z-50 md:hidden"
      style={{
        backgroundColor: isDark ? "#2a2a2a" : "#ffffff",
        borderTopColor: isDark ? "#3a3a3a" : "#dbdbdb",
        borderTopWidth: "0.5px",
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 h-14">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className="flex flex-col items-center justify-center min-w-[56px] px-2 rounded-lg transition-all duration-200"
            style={({ isActive }) => ({
              color: isActive ? primaryColor : inactiveColor,
              backgroundColor: isActive
                ? isDark
                  ? primaryColor + "15"
                  : primaryColor + "08"
                : "transparent",
              transform: isActive ? "scale(1.05)" : "scale(1)",
            })}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = "scale(0.95)";
            }}
            onTouchEnd={(e) => {
              const isActive =
                e.currentTarget.getAttribute("aria-current") === "page";
              e.currentTarget.style.transform = isActive
                ? "scale(1.05)"
                : "scale(1)";
            }}
          >
            {({ isActive }) => (
              <>
                {item.path === "/dashboard/profile" && profile?.avatar_url ? (
                  <div className="relative">
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-6 h-6 rounded-full object-cover"
                      style={
                        isActive
                          ? {
                              border: `2px solid ${primaryColor}`,
                            }
                          : {}
                      }
                    />
                  </div>
                ) : (
                  <item.icon
                    className={`w-6 h-6 transition-transform duration-200 ${
                      isActive ? "scale-110" : ""
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{ color: isActive ? primaryColor : inactiveColor }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
