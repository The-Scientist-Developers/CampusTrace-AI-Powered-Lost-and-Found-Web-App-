// import React, { useState } from "react";
// import { NavLink, useNavigate } from "react-router-dom";
// import {
//   Home,
//   Search,
//   PlusSquare,
//   Heart,
//   MessageCircle,
//   User,
//   Settings,
//   Award,
//   FileText,
//   LogOut,
// } from "lucide-react";
// import { useTheme } from "../../contexts/ThemeContext";
// import { supabase } from "../../api/apiClient";

// // Color mode definitions matching mobile app
// const THEME_COLORS = {
//   blue: { primary: "#1877F2", hover: "rgba(24, 119, 242, 0.1)" },
//   purple: { primary: "#A855F7", hover: "rgba(168, 85, 247, 0.1)" },
//   pink: { primary: "#EC4899", hover: "rgba(236, 72, 153, 0.1)" },
//   green: { primary: "#22C55E", hover: "rgba(34, 197, 94, 0.1)" },
// };

// const DesktopSidebar = ({
//   profile,
//   notificationCount,
//   messageCount,
//   siteName = "CampusTrace",
// }) => {
//   const navigate = useNavigate();
//   const { theme, colorMode } = useTheme();
//   const [hoveredItem, setHoveredItem] = useState(null);

//   const primaryColor =
//     THEME_COLORS[colorMode]?.primary || THEME_COLORS.blue.primary;
//   const hoverColor = THEME_COLORS[colorMode]?.hover || THEME_COLORS.blue.hover;

//   const isDark = theme === "dark";

//   // Neutral colors for professional look
//   const colors = {
//     bg: isDark ? "#1a1a1a" : "#FFFFFF", // Smooth background matching main pages
//     border: isDark ? "#3a3a3a" : "#E5E5E5",
//     textPrimary: isDark ? "#FFFFFF" : "#171717",
//     textSecondary: isDark ? "#A3A3A3" : "#737373",
//     hoverBg: isDark ? "#1F1F1F" : "#F5F5F5",
//   };

//   const navItems = [
//     { path: "/dashboard", icon: Home, label: "Home", exact: true },
//     { path: "/dashboard/browse-all", icon: Search, label: "Search" },
//     {
//       path: "/dashboard/notifications",
//       icon: Heart,
//       label: "Notifications",
//       count: notificationCount,
//     },
//     {
//       path: "/dashboard/messages",
//       icon: MessageCircle,
//       label: "Messages",
//       count: messageCount,
//     },
//     { path: "/dashboard/post-new", icon: PlusSquare, label: "Create" },
//     { path: "/dashboard/my-posts", icon: FileText, label: "My Posts" },
//     { path: "/dashboard/leaderboard", icon: Award, label: "Leaderboard" },
//     { path: "/dashboard/profile", icon: User, label: "Profile" },
//   ];

//   const handleLogout = async () => {
//     try {
//       await supabase.auth.signOut();
//       navigate("/login");
//     } catch (error) {
//       console.error("Error logging out:", error);
//     }
//   };

//   return (
//     <aside
//       className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 flex-col transition-colors duration-200"
//       style={{
//         backgroundColor: colors.bg,
//         borderRight: `1px solid ${colors.border}`,
//         zIndex: 40,
//       }}
//     >
//       {/* Logo Section - Clean & Professional */}
//       <div className="px-6 py-6">
//         <div className="flex items-center gap-3">
//           <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
//             <img
//               src="/Icon.svg"
//               alt="CampusTrace Logo"
//               className="w-full h-full object-cover"
//             />
//           </div>
//           <div className="flex flex-col justify-center">
//             <h1
//               className="text-lg font-bold tracking-tight leading-none"
//               style={{ color: colors.textPrimary }}
//             >
//               CampusTrace
//             </h1>
//             {siteName && siteName !== "CampusTrace" && (
//               <span
//                 className="text-[10px] uppercase tracking-wider font-medium mt-1"
//                 style={{ color: colors.textSecondary }}
//               >
//                 {siteName}
//               </span>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Section Divider */}
//       <div
//         className="w-full h-[1px] mb-4"
//         style={{ backgroundColor: colors.border }}
//       />

//       {/* Navigation */}
//       <nav className="flex-1 px-4 overflow-y-auto scrollbar-hide">
//         <ul className="space-y-1">
//           {navItems.map((item) => (
//             <li key={item.path}>
//               <NavLink
//                 to={item.path}
//                 end={item.exact}
//                 className="flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all duration-150"
//                 style={({ isActive }) => ({
//                   backgroundColor: isActive
//                     ? hoverColor // Subtle tint of the theme color
//                     : "transparent",
//                   color: isActive ? primaryColor : colors.textSecondary,
//                 })}
//               >
//                 {({ isActive }) => (
//                   <>
//                     <item.icon
//                       size={22}
//                       strokeWidth={isActive ? 2.5 : 2}
//                       style={{
//                         color: isActive ? primaryColor : "currentColor",
//                       }}
//                       className="group-hover:text-opacity-80 transition-colors"
//                     />
//                     <span
//                       className={`text-sm font-medium ${
//                         isActive
//                           ? ""
//                           : "group-hover:text-gray-900 dark:group-hover:text-white"
//                       }`}
//                     >
//                       {item.label}
//                     </span>

//                     {/* Notification Badge - Clean Pill Shape */}
//                     {item.count > 0 && (
//                       <span
//                         className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full"
//                         style={{
//                           backgroundColor: primaryColor,
//                           color: "#FFFFFF",
//                         }}
//                       >
//                         {item.count > 99 ? "99+" : item.count}
//                       </span>
//                     )}
//                   </>
//                 )}
//               </NavLink>
//             </li>
//           ))}
//         </ul>
//       </nav>

//       {/* Section Divider */}
//       <div
//         className="w-full h-[1px] mt-2"
//         style={{ backgroundColor: colors.border }}
//       />

//       {/* Bottom Actions */}
//       <div className="p-4 space-y-1">
//         <NavLink
//           to="/dashboard/settings"
//           className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-neutral-800"
//           style={({ isActive }) => ({
//             backgroundColor: isActive ? hoverColor : "transparent",
//             color: isActive ? primaryColor : colors.textSecondary,
//           })}
//         >
//           <Settings size={22} />
//           <span className="text-sm font-medium">Settings</span>
//         </NavLink>

//         <button
//           onClick={handleLogout}
//           className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 hover:bg-red-50 dark:hover:bg-red-900/10 group"
//           style={{ color: colors.textSecondary }}
//         >
//           <LogOut
//             size={22}
//             className="group-hover:text-red-600 transition-colors"
//           />
//           <span className="text-sm font-medium group-hover:text-red-600 transition-colors">
//             Log out
//           </span>
//         </button>
//       </div>

//       {/* Profile Mini-Row */}
//       <div
//         className="mx-4 mb-6 mt-2 p-3 rounded-xl flex items-center gap-3 border transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
//         style={{
//           borderColor: colors.border,
//           backgroundColor: isDark
//             ? "rgba(255,255,255,0.02)"
//             : "rgba(0,0,0,0.01)",
//         }}
//       >
//         <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
//           {profile?.avatar_url ? (
//             <img
//               src={profile.avatar_url}
//               alt=""
//               className="w-full h-full object-cover"
//             />
//           ) : (
//             <User className="w-full h-full p-1.5 text-gray-400" />
//           )}
//         </div>
//         <div className="flex-1 min-w-0 overflow-hidden">
//           <p
//             className="text-sm font-semibold truncate"
//             style={{ color: colors.textPrimary }}
//           >
//             {profile?.full_name || "User"}
//           </p>
//           <p
//             className="text-[11px] truncate"
//             style={{ color: colors.textSecondary }}
//           >
//             View Profile
//           </p>
//         </div>
//       </div>
//     </aside>
//   );
// };

// export default DesktopSidebar;






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
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../api/apiClient";

// Color mode definitions matching mobile app
const THEME_COLORS = {
  blue: { primary: "#1877F2", hover: "rgba(24, 119, 242, 0.1)" },
  purple: { primary: "#A855F7", hover: "rgba(168, 85, 247, 0.1)" },
  pink: { primary: "#EC4899", hover: "rgba(236, 72, 153, 0.1)" },
  green: { primary: "#22C55E", hover: "rgba(34, 197, 94, 0.1)" },
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
  const hoverColor = THEME_COLORS[colorMode]?.hover || THEME_COLORS.blue.hover;

  const isDark = theme === "dark";

  // Neutral colors for professional look
  const colors = {
    bg: isDark ? "#1a1a1a" : "#FFFFFF", // Smooth background matching main pages
    border: isDark ? "#3a3a3a" : "#E5E5E5",
    textPrimary: isDark ? "#FFFFFF" : "#171717",
    textSecondary: isDark ? "#A3A3A3" : "#737373",
    hoverBg: isDark ? "#1F1F1F" : "#F5F5F5",
  };

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
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 flex-col transition-colors duration-200"
      style={{
        backgroundColor: colors.bg,
        borderRight: `1px solid ${colors.border}`,
        zIndex: 40,
      }}
    >
      {/* Logo Section - Clean & Professional */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src="/Icon.svg"
              alt="CampusTrace Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1
              className="text-lg font-bold tracking-tight leading-none"
              style={{ color: colors.textPrimary }}
            >
              CampusTrace
            </h1>
            {siteName && siteName !== "CampusTrace" && (
              <span
                className="text-[10px] uppercase tracking-wider font-medium mt-1"
                style={{ color: colors.textSecondary }}
              >
                {siteName}
              </span>
            )}
                        <span
              className="text-[10px] uppercase tracking-wider font-medium mt-0.5"
              style={{ color: primaryColor }}
            >
              Student
            </span>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div
        className="w-full h-[1px] mb-4"
        style={{ backgroundColor: colors.border }}
      />

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto scrollbar-hide">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.exact}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all duration-150"
                style={({ isActive }) => ({
                  backgroundColor: isActive
                    ? hoverColor // Subtle tint of the theme color
                    : "transparent",
                  color: isActive ? primaryColor : colors.textSecondary,
                })}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 2}
                      style={{
                        color: isActive ? primaryColor : "currentColor",
                      }}
                      className="group-hover:text-opacity-80 transition-colors"
                    />
                    <span
                      className={`text-sm font-medium ${
                        isActive
                          ? ""
                          : "group-hover:text-gray-900 dark:group-hover:text-white"
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* Notification Badge - Clean Pill Shape */}
                    {item.count > 0 && (
                      <span
                        className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: primaryColor,
                          color: "#FFFFFF",
                        }}
                      >
                        {item.count > 99 ? "99+" : item.count}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Section Divider */}
      <div
        className="w-full h-[1px] mt-2"
        style={{ backgroundColor: colors.border }}
      />

      {/* Bottom Actions */}
      <div className="p-4 space-y-1">
        <NavLink
          to="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-neutral-800"
          style={({ isActive }) => ({
            backgroundColor: isActive ? hoverColor : "transparent",
            color: isActive ? primaryColor : colors.textSecondary,
          })}
        >
          <Settings size={22} />
          <span className="text-sm font-medium">Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 hover:bg-red-50 dark:hover:bg-red-900/10 group"
          style={{ color: colors.textSecondary }}
        >
          <LogOut
            size={22}
            className="group-hover:text-red-600 transition-colors"
          />
          <span className="text-sm font-medium group-hover:text-red-600 transition-colors">
            Log out
          </span>
        </button>
      </div>

      {/* Profile Mini-Row */}
      <div
        className="mx-4 mb-6 mt-2 p-3 rounded-xl flex items-center gap-3 border transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
        style={{
          borderColor: colors.border,
          backgroundColor: isDark
            ? "rgba(255,255,255,0.02)"
            : "rgba(0,0,0,0.01)",
        }}
      >
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-full h-full p-1.5 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: colors.textPrimary }}
          >
            {profile?.full_name || "User"}
          </p>
          <p
            className="text-[11px] truncate"
            style={{ color: colors.textSecondary }}
          >
            View Profile
          </p>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
