import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Heart, Send } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

// This component will add the Google Font link to the page <head>
const FontLoader = () => {
  useEffect(() => {
    // Check if the font link already exists
    const fontId = "google-font-poppins";
    if (document.getElementById(fontId)) {
      return;
    }

    // Create and append the link tag for Poppins font (Facebook-style clean bold font)
    const link = document.createElement("link");
    link.id = fontId;
    link.href =
      "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return null; // This component doesn't render anything
};

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

// Page configurations matching mobile app
const PAGE_CONFIGS = {
  "/dashboard": {
    type: "logo", // Show CampusTrace logo
    showActions: true, // Show heart and send icons
  },
  "/dashboard/browse-all": {
    type: "title",
    title: "Browse",
    subtitle: "Discover lost and found items",
    showActions: false,
  },
  "/dashboard/profile": {
    type: "title",
    title: "Profile",
    subtitle: "Manage your account and view your activity",
    showActions: false,
  },
  "/dashboard/my-posts": {
    type: "title",
    title: "My Activity",
    subtitle: "View your posts, claims, and activity history",
    showActions: false,
  },
  "/dashboard/post-new": {
    type: "title",
    title: "Post Item",
    subtitle: "Report a lost or found item",
    showActions: false,
  },
  "/dashboard/leaderboard": {
    type: "title",
    title: "Leaderboard",
    subtitle: "Top contributors in the community",
    showActions: false,
  },
  "/dashboard/notifications": {
    type: "title",
    title: "Notifications",
    subtitle: "Stay updated with your activity",
    showActions: false,
  },
  "/dashboard/messages": {
    type: "title",
    title: "Messages",
    subtitle: "Your conversations",
    showActions: false,
  },
  "/dashboard/settings": {
    type: "title",
    title: "Settings",
    subtitle: "Customize your experience",
    showActions: false,
  },
  "/dashboard/help": {
    type: "title",
    title: "Help & Support",
    subtitle: "Get assistance and learn more",
    showActions: false,
  },
};

const MobileHeader = ({ notificationCount = 0, messageCount = 0, profile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, colorMode } = useTheme();

  // Get primary color based on color mode
  const primaryColor =
    THEME_COLORS[colorMode]?.primary || THEME_COLORS.blue.primary;
  const isDark = theme === "dark";

  // Get page configuration based on current route
  const pageConfig =
    PAGE_CONFIGS[location.pathname] || PAGE_CONFIGS["/dashboard"];

  return (
    <>
      {/* This component will load the 'Poppins' font */}
      <FontLoader />
      <header
        className="sticky top-0 left-0 right-0 border-b z-40 md:hidden shadow-sm"
        style={{
          backgroundColor: isDark ? "#2a2a2a" : "#ffffff",
          borderBottomColor: isDark ? "#3a3a3a" : "#dbdbdb",
          borderBottomWidth: "0.5px",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Dynamic Header Content */}
          {pageConfig.type === "logo" ? (
            <h1
              className="font-['Poppins'] tracking-tight leading-9"
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#000000",
                letterSpacing: "-0.5px",
                lineHeight: "36px",
              }}
            >
              CampusTrace
            </h1>
          ) : (
            <div className="flex-1">
              <h2
                className="text-xl font-semibold leading-tight"
                style={{ color: isDark ? "#ffffff" : "#000000" }}
              >
                {pageConfig.title}
              </h2>
              {pageConfig.subtitle && (
                <p
                  className="text-xs mt-0.5"
                  style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}
                >
                  {pageConfig.subtitle}
                </p>
              )}
            </div>
          )}

          {/* Action Icons - Only show on dashboard home */}
          {pageConfig.showActions && (
            <div className="flex items-center gap-5">
              {/* Notifications - Heart Icon */}
              <button
                onClick={() => navigate("/dashboard/notifications")}
                className="relative p-1 transition-opacity hover:opacity-70"
                aria-label="Notifications"
              >
                <Heart
                  size={26}
                  style={{ color: primaryColor }}
                  strokeWidth={2}
                />
                {notificationCount > 0 && (
                  <span
                    className="absolute top-0.5 right-0.5 text-white text-xs font-bold rounded-full w-2 h-2 flex items-center justify-center"
                    style={{ backgroundColor: "#FF3250" }}
                  />
                )}
              </button>

              {/* Messages - Send Icon */}
              <button
                onClick={() => navigate("/dashboard/messages")}
                className="relative p-1 transition-opacity hover:opacity-70"
                aria-label="Messages"
              >
                <Send
                  size={26}
                  style={{ color: primaryColor }}
                  strokeWidth={2}
                />
                {messageCount > 0 && (
                  <span
                    className="absolute top-0.5 right-0.5 text-white text-xs font-bold rounded-full w-2 h-2 flex items-center justify-center"
                    style={{ backgroundColor: "#FF3250" }}
                  />
                )}
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default MobileHeader;
