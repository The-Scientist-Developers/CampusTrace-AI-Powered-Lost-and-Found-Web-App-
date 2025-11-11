import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  ShieldCheck,
  UserCheck,
  MessageSquare,
  Settings,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export default function AdminMobileBottomNav({
  pendingPostsCount,
  pendingVerificationsCount,
  notificationCount,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { primaryColor, theme } = useTheme();
  const [touchedItem, setTouchedItem] = React.useState(null);

  const navItems = [
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
      label: "Moderate",
      badge: pendingPostsCount,
    },
    {
      path: "/admin/manual-verifications",
      icon: UserCheck,
      label: "Verify",
      badge: pendingVerificationsCount,
    },
    {
      path: "/admin/notifications",
      icon: MessageSquare,
      label: "Notifications",
      badge: notificationCount,
    },
    {
      path: "/admin/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#1a1a1a] border-t border-neutral-200 dark:border-[#3a3a3a] z-50">
      <div className="h-full flex items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const isTouched = touchedItem === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              onTouchStart={() => setTouchedItem(item.path)}
              onTouchEnd={() => setTimeout(() => setTouchedItem(null), 150)}
              className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 relative min-w-[56px]"
              style={
                active
                  ? {
                      backgroundColor:
                        theme === "dark"
                          ? `${primaryColor}15`
                          : `${primaryColor}08`,
                      transform: isTouched ? "scale(0.95)" : "scale(1)",
                    }
                  : {
                      transform: isTouched ? "scale(0.95)" : "scale(1)",
                    }
              }
            >
              <div className="relative">
                <Icon
                  className="w-6 h-6"
                  style={
                    active
                      ? { color: primaryColor, strokeWidth: 2.5 }
                      : { strokeWidth: 2 }
                  }
                />
                {item.badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-[16px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  active ? "font-semibold" : ""
                }`}
                style={active ? { color: primaryColor } : {}}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
