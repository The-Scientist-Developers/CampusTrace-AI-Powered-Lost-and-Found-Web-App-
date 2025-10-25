import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { supabase } from "./api/apiClient.js";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext.jsx";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// Page Imports
import LandingPage from "./features/MainPages/landingPage.jsx";
import LoginPage from "./features/MainPages/LoginPage.jsx";
import DashboardLayout from "./features/UserDashboard/DashboardLayout.jsx";
import UserMainPage from "./features/UserDashboard/Pages/userMainPage.jsx";
import AdminDashboardLayout from "./features/AdminDashboard/adminDashboardLayout.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import UserProfilePage from "./features/UserDashboard/Pages/userProfilePage.jsx";
import AdminMainPage from "./features/AdminDashboard/Pages/AdminMainPage.jsx";
import PostNewItem from "./features/UserDashboard/Pages/userPostItems.jsx";
import UserManagement from "./features/AdminDashboard/Pages/adminUserManagement.jsx";
import PostModerationPage from "./features/AdminDashboard/Pages/postModerationPage.jsx";
import AdminSettingsPage from "./features/AdminDashboard/Pages/adminSettings.jsx";
import MyPostsPage from "./features/UserDashboard/Pages/userMypostPage.jsx";
import AboutUsPage from "./features/MainPages/aboutPage.jsx";
import LearnMorePage from "./features/MainPages/learnMorePage.jsx";
import BrowseAllPage from "./features/UserDashboard/Pages/browseAllPage.jsx";
import HelpPage from "./features/UserDashboard/Pages/userHelpPage.jsx";
import NotificationPage from "./features/UserDashboard/Pages/userNotificationPage.jsx";
import UserSettingsPage from "./features/UserDashboard/Pages/userSettingsPage.jsx";
import RegisterUniversityPage from "./features/MainPages/RegisterUniversityPage.jsx";
import UpdatePasswordPage from "./features/MainPages/UpdatePasswordPage.jsx";
import AdminNotificationPage from "./features/AdminDashboard/Pages/adminNotificationPage.jsx";
import LeaderboardPage from "./features/UserDashboard/Pages/leaderBoardPage.jsx";
import AdminProfilePage from "./features/AdminDashboard/Pages/adminProfile.jsx";
import MessagesPage from "./features/UserDashboard/Pages/userMessageApp.jsx";
import ManualRegisterPage from "./features/MainPages/manualRegisterPage.jsx";
import ManualVerificationAdminPage from "./features/AdminDashboard/Pages/adminVerificationPage.jsx";
import PendingApprovalPage from "./features/MainPages/pendingApprovalPage.jsx";
// --- Router Guards ---
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
    const MINIMUM_LOAD_TIME = 2000;

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

// --- Main App Content Component ---
// This component now contains the core logic and can access the theme context.
function AppContent() {
  const { theme } = useTheme();
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
        try {
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("role, is_banned")
            .eq("id", session.user.id)
            .single();

          if (error) throw error;
          setProfile(profileData);
        } catch (error) {
          console.error("Error fetching initial profile:", error.message);
          setProfile(null);
        }
      }
      setIsLoading(false);
    };

    fetchSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "Auth event:",
        event,
        "Session:",
        session ? "exists" : "null"
      );
      setSession(session);
      if (event === "SIGNED_OUT") {
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
    <SkeletonTheme
      baseColor={theme === "dark" ? "#2a2a2a" : "#ebebeb"}
      highlightColor={theme === "dark" ? "#333333" : "#f5f5f5"}
    >
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
          <Route path="/manual-verification" element={<ManualRegisterPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/learn-more" element={<LearnMorePage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />

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
            <Route path="leaderboard" element={<LeaderboardPage />} />
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
              path="messages"
              element={<MessagesPage user={session?.user} />}
            />
            <Route
              path="messages/:conversationId"
              element={<MessagesPage user={session?.user} />}
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
            <Route
              path="profile"
              element={<AdminProfilePage user={session?.user} />}
            />
            <Route
              path="manual-verifications"
              element={<ManualVerificationAdminPage />}
            />
          </Route>
        </Routes>
      </Router>
    </SkeletonTheme>
  );
}

// --- App Component Wrapper ---
// The main App component now only provides the theme context.
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
