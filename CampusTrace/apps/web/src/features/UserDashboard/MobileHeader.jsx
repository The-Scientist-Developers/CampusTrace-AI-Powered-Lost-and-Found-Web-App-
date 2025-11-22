import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, MessageCircle } from "lucide-react";
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
    title: "Browse All Items",
    showActions: false,
  },
  "/dashboard/profile": {
    type: "title",
    title: "Profile",
    showActions: false,
  },
  "/dashboard/my-posts": {
    type: "title",
    title: "My Activity",
    showActions: false,
  },
  "/dashboard/post-new": {
    type: "title",
    title: "Post Item",
    showActions: false,
  },
  "/dashboard/leaderboard": {
    type: "title",
    title: "Leaderboard",
    showActions: false,
  },
  "/dashboard/notifications": {
    type: "title",
    title: "Notifications",
    showActions: false,
  },
  "/dashboard/messages": {
    type: "title",
    title: "Messages",
    showActions: false,
  },
  "/dashboard/settings": {
    type: "title",
    title: "Settings",
    showActions: false,
  },
  "/dashboard/help": {
    type: "title",
    title: "Help & Support",
    showActions: false,
  },
};

const MobileHeader = ({
  notificationCount = 0,
  messageCount = 0,
  profile,
  siteName = "CampusTrace",
}) => {
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
        className="sticky top-0 left-0 right-0 z-50 md:hidden"
        style={{
          backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
        }}
      >
        <div className="flex items-center justify-between px-5 py-3.5">
          {/* Dynamic Header Content */}
          {pageConfig.type === "logo" ? (
            <div>
              {siteName && siteName !== "CampusTrace" && (
                <p
                  className="text-xs font-medium mb-0.5"
                  style={{
                    color: isDark ? "#a3a3a3" : "#737373",
                    letterSpacing: "0.3px",
                  }}
                >
                  {siteName}
                </p>
              )}
              <h1
                className="font-['Poppins'] tracking-tight"
                style={{
                  fontSize: "26px",
                  fontWeight: "700",
                  color: isDark ? "#ffffff" : "#000000",
                  letterSpacing: "-0.6px",
                  lineHeight: "32px",
                }}
              >
                CampusTrace
              </h1>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <h2
                className="font-semibold leading-tight truncate"
                style={{
                  color: isDark ? "#ffffff" : "#000000",
                  fontSize: "22px",
                  fontWeight: "600",
                }}
              >
                {pageConfig.title}
              </h2>
            </div>
          )}

          {/* Action Icons - Only show on dashboard home */}
          {pageConfig.showActions && (
            <div className="flex items-center gap-4">
              {/* Notifications - Bell Icon */}
              <button
                onClick={() => navigate("/dashboard/notifications")}
                className="relative p-2 transition-all duration-200 active:scale-95 hover:opacity-80"
                aria-label="Notifications"
                style={{
                  minWidth: "44px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell
                  size={22}
                  style={{ color: primaryColor }}
                  strokeWidth={2.5}
                />
                {notificationCount > 0 && (
                  <span
                    className="absolute text-white text-xs font-bold rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: "#FF3250",
                      top: "6px",
                      right: "6px",
                      minWidth: "18px",
                      height: "18px",
                      padding: "0 4px",
                      fontSize: "10px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>

              {/* Messages - MessageCircle Icon */}
              <button
                onClick={() => navigate("/dashboard/messages")}
                className="relative p-2 transition-all duration-200 active:scale-95 hover:opacity-80"
                aria-label="Messages"
                style={{
                  minWidth: "44px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircle
                  size={22}
                  style={{ color: primaryColor }}
                  strokeWidth={2.5}
                />
                {messageCount > 0 && (
                  <span
                    className="absolute text-white text-xs font-bold rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: "#FF3250",
                      top: "6px",
                      right: "6px",
                      minWidth: "18px",
                      height: "18px",
                      padding: "0 4px",
                      fontSize: "10px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    {messageCount > 9 ? "9+" : messageCount}
                  </span>
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
