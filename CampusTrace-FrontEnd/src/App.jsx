// import React, { useState, useEffect } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
//   Outlet,
// } from "react-router-dom";
// import { supabase } from "./api/apiClient";
// import { ThemeProvider } from "./contexts/ThemeContext";

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
// import RegisterUniversityPage from "./features/MainPages/RegisterUniversityPage";
// import UpdatePasswordPage from "./features/MainPages/UpdatePasswordPage";
// import AdminNotificationPage from "./features/AdminDashboard/Pages/adminNotificationPage";
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
//     const fetchSessionAndProfile = async () => {
//       // Actively fetch the session when the app loads
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();
//       setSession(session);

//       if (session?.user) {
//         console.log("Initial session found, fetching profile...");
//         try {
//           const { data: profileData, error } = await supabase
//             .from("profiles")
//             .select("role, is_banned")
//             .eq("id", session.user.id)
//             .single();

//           if (error) throw error;
//           setProfile(profileData);
//           console.log("Profile fetched on initial load:", profileData);
//         } catch (error) {
//           console.error("Error fetching initial profile:", error.message);
//           setProfile(null);
//         }
//       } else {
//         console.log("No initial session found.");
//       }
//       setIsLoading(false);
//     };

//     fetchSessionAndProfile();

//     // Also listen for future changes (e.g., logout)
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//       // Re-fetch profile if the session changes to a new user
//       if (_event === "SIGNED_IN" && session?.user) {
//         // This part is redundant if fetchSessionAndProfile works, but good for robustness
//       } else if (_event === "SIGNED_OUT") {
//         setProfile(null);
//       }
//     });

//     return () => {
//       subscription?.unsubscribe();
//     };
//   }, []);

//   if (isLoading) {
//     return <LoadingScreen />;
//   }

//   return (
//     <ThemeProvider>
//       <Router>
//         <Routes>
//           <Route
//             path="/"
//             element={
//               session ? (
//                 <AuthRedirect
//                   session={session}
//                   profile={profile}
//                   isLoading={isLoading}
//                 />
//               ) : (
//                 <LandingPage />
//               )
//             }
//           />
//           <Route
//             path="/login"
//             element={
//               session ? (
//                 <AuthRedirect
//                   session={session}
//                   profile={profile}
//                   isLoading={isLoading}
//                 />
//               ) : (
//                 <LoginPage />
//               )
//             }
//           />
//           <Route
//             path="/register-university"
//             element={<RegisterUniversityPage />}
//           />
//           <Route path="/update-password" element={<UpdatePasswordPage />} />
//           <Route path="/about" element={<AboutUsPage />} />
//           <Route path="/learn-more" element={<LearnMorePage />} />
//           <Route
//             path="/dashboard"
//             element={
//               <PrivateRouter session={session} isLoading={isLoading}>
//                 <DashboardLayout user={session?.user}>
//                   <Outlet />
//                 </DashboardLayout>
//               </PrivateRouter>
//             }
//           >
//             <Route index element={<UserMainPage user={session?.user} />} />
//             <Route
//               path="profile"
//               element={<UserProfilePage user={session?.user} />}
//             />
//             <Route
//               path="post-new"
//               element={<PostNewItem user={session?.user} />}
//             />
//             <Route
//               path="my-posts"
//               element={<MyPostsPage user={session?.user} />}
//             />
//             <Route
//               path="notifications"
//               element={<NotificationPage user={session?.user} />}
//             />
//             <Route
//               path="browse-all"
//               element={<BrowseAllPage user={session?.user} />}
//             />
//             <Route
//               path="settings"
//               element={<UserSettingsPage user={session?.user} />}
//             />
//             <Route path="help" element={<HelpPage user={session?.user} />} />
//           </Route>
//           <Route
//             path="/admin"
//             element={
//               <PrivateRouter session={session} isLoading={isLoading}>
//                 <RoleBasedRouter
//                   profile={profile}
//                   requiredRole="admin"
//                   isLoading={isLoading}
//                 >
//                   <AdminDashboardLayout user={session?.user}>
//                     <Outlet />
//                   </AdminDashboardLayout>
//                 </RoleBasedRouter>
//               </PrivateRouter>
//             }
//           >
//             <Route index element={<AdminMainPage user={session?.user} />} />
//             <Route
//               path="user-management"
//               element={<UserManagement user={session?.user} />}
//             />
//             <Route
//               path="post-moderation"
//               element={<PostModerationPage user={session?.user} />}
//             />
//             <Route
//               path="notifications"
//               element={<AdminNotificationPage user={session?.user} />}
//             />
//             <Route
//               path="settings"
//               element={<AdminSettingsPage user={session?.user} />}
//             />
//           </Route>
//         </Routes>
//       </Router>
//     </ThemeProvider>
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
  useLocation,
} from "react-router-dom";
import { supabase } from "./api/apiClient";
import { ThemeProvider } from "./contexts/ThemeContext";

import LandingPage from "./features/MainPages/landingPage";
import LoginPage from "./features/MainPages/LoginPage";
import DashboardLayout from "./features/UserDashboard/DashboardLayout";
import UserMainPage from "./features/UserDashboard/Pages/userMainPage";
import AdminDashboardLayout from "./features/AdminDashboard/adminDashboardLayout";
import LoadingScreen from "./components/LoadingScreen";
import UserProfilePage from "./features/UserDashboard/Pages/userProfilePage";
import AdminMainPage from "./features/AdminDashboard/Pages/AdminMainPage";
import PostNewItem from "./features/UserDashboard/Pages/userPostItems";
import UserManagement from "./features/AdminDashboard/Pages/adminUserManagement";
import PostModerationPage from "./features/AdminDashboard/Pages/postModerationPage";
import AdminSettingsPage from "./features/AdminDashboard/Pages/adminSettings";
import MyPostsPage from "./features/UserDashboard/Pages/userMypostPage";
import AboutUsPage from "./features/MainPages/aboutPage";
import LearnMorePage from "./features/MainPages/learnMorePage";
import BrowseAllPage from "./features/UserDashboard/Pages/browseAllPage";
import HelpPage from "./features/UserDashboard/Pages/userHelpPage";
import NotificationPage from "./features/UserDashboard/Pages/userNotificationPage";
import UserSettingsPage from "./features/UserDashboard/Pages/userSettingsPage";
import RegisterUniversityPage from "./features/MainPages/RegisterUniversityPage";
import UpdatePasswordPage from "./features/MainPages/UpdatePasswordPage";
import AdminNotificationPage from "./features/AdminDashboard/Pages/adminNotificationPage";

function PrivateRouter({ children, isLoading, session }) {
  if (isLoading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function RoleBasedRouter({ children, profile, isLoading, requiredRole }) {
  if (isLoading) return <LoadingScreen />;
  if (
    !profile ||
    profile.role?.toLowerCase().trim() !== requiredRole.toLowerCase().trim()
  ) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AuthRedirect({ session, profile, isLoading }) {
  if (isLoading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

// Admin Layout Wrapper with loading state
function AdminLayoutWrapper({ user }) {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) {
      setIsPageLoading(false);
      return;
    }

    let isMounted = true;
    const startTime = Date.now();
    const MINIMUM_LOAD_TIME = 2000; // 2 seconds minimum for skeleton

    const fetchAdminData = async () => {
      try {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("university_id")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        
        if (isMounted) {
          setProfile(profileData);
          
          // Calculate remaining time to meet minimum load time
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, MINIMUM_LOAD_TIME - elapsedTime);
          
          setTimeout(() => {
            if (isMounted) {
              setIsPageLoading(false);
            }
          }, remainingTime);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
        if (isMounted) {
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, MINIMUM_LOAD_TIME - elapsedTime);
          
          setTimeout(() => {
            setIsPageLoading(false);
          }, remainingTime);
        }
      }
    };

    fetchAdminData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <AdminDashboardLayout user={user} isLoading={isPageLoading}>
      <Outlet context={{ profile }} />
    </AdminDashboardLayout>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        console.log("Initial session found, fetching profile...");
        try {
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("role, is_banned")
            .eq("id", session.user.id)
            .single();

          if (error) throw error;
          setProfile(profileData);
          console.log("Profile fetched on initial load:", profileData);
        } catch (error) {
          console.error("Error fetching initial profile:", error.message);
          setProfile(null);
        }
      } else {
        console.log("No initial session found.");
      }
      setIsLoading(false);
    };

    fetchSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === "SIGNED_OUT") {
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              session ? (
                <AuthRedirect
                  session={session}
                  profile={profile}
                  isLoading={isLoading}
                />
              ) : (
                <LandingPage />
              )
            }
          />
          <Route
            path="/login"
            element={
              session ? (
                <AuthRedirect
                  session={session}
                  profile={profile}
                  isLoading={isLoading}
                />
              ) : (
                <LoginPage />
              )
            }
          />
          <Route
            path="/register-university"
            element={<RegisterUniversityPage />}
          />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/learn-more" element={<LearnMorePage />} />
          
          {/* User Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRouter session={session} isLoading={isLoading}>
                <DashboardLayout user={session?.user}>
                  <Outlet />
                </DashboardLayout>
              </PrivateRouter>
            }
          >
            <Route index element={<UserMainPage user={session?.user} />} />
            <Route
              path="profile"
              element={<UserProfilePage user={session?.user} />}
            />
            <Route
              path="post-new"
              element={<PostNewItem user={session?.user} />}
            />
            <Route
              path="my-posts"
              element={<MyPostsPage user={session?.user} />}
            />
            <Route
              path="notifications"
              element={<NotificationPage user={session?.user} />}
            />
            <Route
              path="browse-all"
              element={<BrowseAllPage user={session?.user} />}
            />
            <Route
              path="settings"
              element={<UserSettingsPage user={session?.user} />}
            />
            <Route path="help" element={<HelpPage user={session?.user} />} />
          </Route>

          {/* Admin Dashboard Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRouter session={session} isLoading={isLoading}>
                <RoleBasedRouter
                  profile={profile}
                  requiredRole="admin"
                  isLoading={isLoading}
                >
                  <AdminLayoutWrapper user={session?.user} />
                </RoleBasedRouter>
              </PrivateRouter>
            }
          >
            <Route index element={<AdminMainPage user={session?.user} />} />
            <Route
              path="user-management"
              element={<UserManagement user={session?.user} />}
            />
            <Route
              path="post-moderation"
              element={<PostModerationPage user={session?.user} />}
            />
            <Route
              path="notifications"
              element={<AdminNotificationPage user={session?.user} />}
            />
            <Route
              path="settings"
              element={<AdminSettingsPage user={session?.user} />}
            />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;