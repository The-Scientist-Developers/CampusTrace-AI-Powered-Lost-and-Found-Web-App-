// import React, { useState, useEffect } from "react";
// import { supabase } from "./api/apiClient";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
//   Outlet,
// } from "react-router-dom";

// // Import all your components
// import LandingPage from "./features/MainPages/landingPage";
// import LoginPage from "./features/MainPages/LoginPage";
// import DashboardLayout from "./features/UserDashboard/DashboardLayout";
// import UserMainPage from "./features/UserDashboard/Pages/userMainPage";
// import AdminDashboardLayout from "./features/AdminDashboard/adminDashboardLayout";
// import LoadingScreen from "./components/LoadingScreen";
// import UserProfilePage from "./features/UserDashboard/Pages/userProfilePage";
// import AdminMainPage from "./features/AdminDashboard/Pages/AdminMainPage";
// import PostNewItem from "./features/UserDashboard/Pages/userPostItems";
// import UserManagement from "./features/AdminDashboard/Pages/adminUserManagement";
// import PostModerationPage from "./features/AdminDashboard/Pages/postModerationPage";
// import AdminSettingsPage from "./features/AdminDashboard/Pages/adminSettings";
// import MyPostsPage from "./features/UserDashboard/Pages/userMypostPage";
// import AboutUsPage from "./features/MainPages/aboutPage";
// import LearnMorePage from "./features/MainPages/learnMorePage";
// import BrowseAllPage from "./features/UserDashboard/Pages/browseAllPage";
// import HelpPage from "./features/UserDashboard/Pages/userHelpPage";
// import NotificationPage from "./features/UserDashboard/Pages/userNotificationPage";
// import UserSettingsPage from "./features/UserDashboard/Pages/userSettingsPage";

// function PrivateRouter({ children, isLoading, session }) {
//   if (isLoading) return <LoadingScreen />;
//   if (!session) return <Navigate to="/login" replace />;
//   return children;
// }

// function RoleBasedRouter({ children, profile, isLoading, requiredRole }) {
//   if (isLoading) return <LoadingScreen />;
//   if (
//     !profile ||
//     profile.role?.toLowerCase().trim() !== requiredRole.toLowerCase().trim()
//   ) {
//     return <Navigate to="/dashboard" replace />;
//   }
//   return children;
// }

// function AuthRedirect({ session, profile, isLoading }) {
//   if (isLoading) return <LoadingScreen />;
//   if (!session) return <Navigate to="/login" replace />;
//   if (profile?.role === "admin") return <Navigate to="/admin" replace />;
//   return <Navigate to="/dashboard" replace />;
// }

// function App() {
//   const [session, setSession] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // This listener is the core of Supabase auth. It fires on login, logout,
//     // and when the token is refreshed.
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange(async (_event, session) => {
//       try {
//         setSession(session);
//         if (session?.user) {
//           const { data: profileData, error } = await supabase
//             .from("profiles")
//             .select("role, is_banned")
//             .eq("id", session.user.id)
//             .single();
//           if (error) throw error;
//           setProfile(profileData);
//         } else {
//           setProfile(null);
//         }
//       } catch (error) {
//         console.error("Error handling auth state change:", error);
//         setProfile(null);
//       } finally {
//         // This ensures the loading screen is removed once we have an answer.
//         setIsLoading(false);
//       }
//     });

//     // Clean the URL if it contains the magic link token.
//     if (window.location.hash.includes("access_token")) {
//       window.history.replaceState({}, document.title, window.location.pathname);
//     }

//     return () => {
//       subscription?.unsubscribe();
//     };
//   }, []);

//   if (isLoading) {
//     return <LoadingScreen />;
//   }

//   return (
//     <Router>
//       <Routes>
//         <Route
//           path="/"
//           element={
//             session ? (
//               <AuthRedirect
//                 session={session}
//                 profile={profile}
//                 isLoading={isLoading}
//               />
//             ) : (
//               <LandingPage />
//             )
//           }
//         />

//         <Route
//           path="/login"
//           element={
//             session ? (
//               <AuthRedirect
//                 session={session}
//                 profile={profile}
//                 isLoading={isLoading}
//               />
//             ) : (
//               <LoginPage />
//             )
//           }
//         />

//         <Route path="/about" element={<AboutUsPage />} />
//         <Route path="/learn-more" element={<LearnMorePage />} />

//         {/* --- User Dashboard Routes --- */}
//         <Route
//           path="/dashboard"
//           element={
//             <PrivateRouter session={session} isLoading={isLoading}>
//               <DashboardLayout user={session?.user}>
//                 <Outlet />
//               </DashboardLayout>
//             </PrivateRouter>
//           }
//         >
//           <Route index element={<UserMainPage user={session?.user} />} />
//           <Route
//             path="profile"
//             element={<UserProfilePage user={session?.user} />}
//           />
//           <Route
//             path="post-new"
//             element={<PostNewItem user={session?.user} />}
//           />
//           <Route
//             path="my-posts"
//             element={<MyPostsPage user={session?.user} />}
//           />
//           <Route
//             path="notifications"
//             element={<NotificationPage user={session?.user} />}
//           />
//           <Route
//             path="browse-all"
//             element={<BrowseAllPage user={session?.user} />}
//           />
//           <Route
//             path="settings"
//             element={<UserSettingsPage user={session?.user} />}
//           />
//           <Route path="help" element={<HelpPage user={session?.user} />} />
//         </Route>

//         {/* --- Admin Dashboard Routes --- */}
//         <Route
//           path="/admin"
//           element={
//             <PrivateRouter session={session} isLoading={isLoading}>
//               <RoleBasedRouter
//                 profile={profile}
//                 requiredRole="admin"
//                 isLoading={isLoading}
//               >
//                 <AdminDashboardLayout user={session?.user}>
//                   <Outlet />
//                 </AdminDashboardLayout>
//               </RoleBasedRouter>
//             </PrivateRouter>
//           }
//         >
//           <Route index element={<AdminMainPage user={session?.user} />} />
//           <Route
//             path="user-management"
//             element={<UserManagement user={session?.user} />}
//           />
//           <Route
//             path="post-moderation"
//             element={<PostModerationPage user={session?.user} />}
//           />
//           <Route
//             path="settings"
//             element={<AdminSettingsPage user={session?.user} />}
//           />
//         </Route>
//       </Routes>
//     </Router>
//   );
// }

// export default App;

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { supabase } from "./api/apiClient";

// Import all your components
import DashboardLayout from "./features/UserDashboard/DashboardLayout";
import UserMainPage from "./features/UserDashboard/Pages/userMainPage";
import AdminDashboardLayout from "./features/AdminDashboard/adminDashboardLayout";
import LoadingScreen from "./components/LoadingScreen";
import UserProfilePage from "./features/UserDashboard/Pages/userProfilePage";
import AdminMainPage from "./features/AdminDashboard/Pages/AdminMainPage";
import PostNewItem from "./features/UserDashboard/Pages/userPostItems";
import UserManagementPage from "./features/AdminDashboard/Pages/adminUserManagement";
import PostModerationPage from "./features/AdminDashboard/Pages/postModerationPage";
import AdminSettingsPage from "./features/AdminDashboard/Pages/adminSettings";
import MyPostsPage from "./features/UserDashboard/Pages/userMypostPage";
import BrowseAllPage from "./features/UserDashboard/Pages/browseAllPage";
import HelpPage from "./features/UserDashboard/Pages/userHelpPage";
import NotificationPage from "./features/UserDashboard/Pages/userNotificationPage";
import UserSettingsPage from "./features/UserDashboard/Pages/userSettingsPage";
import LandingPage from "./features/MainPages/landingPage"; // Keep for potential revert
import LoginPage from "./features/MainPages/LoginPage"; // Keep for potential revert

// --- HARDCODED USER FOR DEMO ---
const DEMO_USER = {
  id: "d7d24006-3750-4723-82cd-440351fa4495", // Must be a real user ID from your DB
  email: "user@demo.com",
};
const DEMO_SESSION = { user: DEMO_USER };

function App() {
  const [session] = useState(DEMO_SESSION);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDemoProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", DEMO_USER.id)
        .single();

      if (data) {
        setProfile(data);
      } else {
        console.error(
          "Could not fetch profile for hardcoded user. Make sure the user ID exists in your DB."
        );
      }
      setIsLoading(false);
    };
    fetchDemoProfile();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const AuthRedirect = () => {
    if (profile?.role === "admin") return <Navigate to="/admin" />;
    return <Navigate to="/dashboard" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthRedirect />} />
        <Route path="/login" element={<AuthRedirect />} />

        {/* --- FIX: Restored Full User Dashboard Routing --- */}
        <Route
          path="/dashboard"
          element={
            <DashboardLayout user={session.user}>
              <Outlet />
            </DashboardLayout>
          }
        >
          <Route index element={<UserMainPage user={session.user} />} />
          <Route
            path="profile"
            element={<UserProfilePage user={session.user} />}
          />
          <Route
            path="post-new"
            element={<PostNewItem user={session.user} />}
          />
          <Route
            path="my-posts"
            element={<MyPostsPage user={session.user} />}
          />
          <Route
            path="notifications"
            element={<NotificationPage user={session.user} />}
          />
          <Route
            path="browse-all"
            element={<BrowseAllPage user={session.user} />}
          />
          <Route
            path="settings"
            element={<UserSettingsPage user={session.user} />}
          />
          <Route path="help" element={<HelpPage user={session.user} />} />
        </Route>

        {/* --- FIX: Restored Full Admin Dashboard Routing --- */}
        <Route
          path="/admin"
          element={
            <AdminDashboardLayout user={session.user}>
              <Outlet />
            </AdminDashboardLayout>
          }
        >
          <Route index element={<AdminMainPage user={session.user} />} />
          <Route
            path="user-management"
            element={<UserManagementPage user={session.user} />}
          />
          <Route
            path="post-moderation"
            element={<PostModerationPage user={session.user} />}
          />
          <Route
            path="settings"
            element={<AdminSettingsPage user={session.user} />}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
