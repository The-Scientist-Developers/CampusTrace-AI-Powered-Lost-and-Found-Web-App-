import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./api/apiClient";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import LandingPage from "./features/MainPages/landingPage";
import LoginPage from "./features/MainPages/LoginPage";
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
import AboutUsPage from "./features/MainPages/aboutPage";
import LearnMorePage from "./features/MainPages/learnMorePage";
import BrowseAllPage from "./features/UserDashboard/Pages/browseAllPage";
import HelpPage from "./features/UserDashboard/Pages/userHelpPage";
import NotificationPage from "./features/UserDashboard/Pages/userNotificationPage";
import UserSettingsPage from "./features/UserDashboard/Pages/userSettingsPage";

function PrivateRouter({ children, isLoading, session }) {
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RoleBasedRouter({ children, profile, isLoading, requiredRole }) {
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (
    !profile ||
    profile.role?.toLowerCase().trim() !== requiredRole.toLowerCase().trim()
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AuthRedirect({ session, profile, isLoading }) {
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Silent refresh function - does NOT touch isLoading
  const refreshAuth = useCallback(async () => {
    // Prevent multiple simultaneous refreshes
    if (window.refreshInProgress) return;
    window.refreshInProgress = true;

    try {
      console.log("🔄 Refreshing auth silently...");

      // Get fresh session
      const {
        data: { session: freshSession },
      } = await supabase.auth.getSession();

      if (freshSession?.user) {
        // Get fresh profile
        const { data: freshProfile } = await supabase
          .from("profiles")
          .select("role, is_banned")
          .eq("id", freshSession.user.id)
          .single();

        setSession(freshSession);
        setProfile(freshProfile);
      } else {
        setSession(freshSession);
        setProfile(null);
      }

      // ✅ NO setIsLoading here - this is a background refresh
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      window.refreshInProgress = false;
    }
  }, []);

  // Simplified visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("👀 Tab visible - refreshing auth");
        refreshAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshAuth]);

  // Initial auth setup - ONLY time we use isLoading
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("🚀 Initializing auth...");

        // Handle magic link
        if (window.location.hash.includes("access_token")) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
          window.history.replaceState({}, document.title, "/");
        }

        // Get session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, is_banned")
            .eq("id", session.user.id)
            .single();

          setProfile(profile);
        }

        setSession(session);
        setIsLoading(false);

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth event:", event);

          if (session?.user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role, is_banned")
              .eq("id", session.user.id)
              .single();

            setProfile(profile);
          } else {
            setProfile(null);
          }

          setSession(session);

          // Only set loading false on initial load
          if (isLoading) {
            setIsLoading(false);
          }
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error("Auth error:", error);
        setSession(null);
        setProfile(null);
        setIsLoading(false);
      }
    };

    initAuth();
  }, []); // Empty dependency array - only run once on mount

  // Absolute failsafe - prevent infinite loading (2 seconds max)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn("⚠️ Forcing loading to stop after timeout");
        setIsLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
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

        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/learn-more" element={<LearnMorePage />} />

        {/* --- User Dashboard Routes (Protected by PrivateRoute) --- */}
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
          {/* These are the nested pages inside the User Dashboard. */}
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

        {/* --- Admin Dashboard Routes (Protected by PrivateRoute and RoleBasedRoute) --- */}
        <Route
          path="/admin"
          element={
            <PrivateRouter session={session} isLoading={isLoading}>
              <RoleBasedRouter
                profile={profile}
                requiredRole="admin"
                isLoading={isLoading}
              >
                <AdminDashboardLayout user={session?.user}>
                  <Outlet />
                </AdminDashboardLayout>
              </RoleBasedRouter>
            </PrivateRouter>
          }
        >
          {/* Nested pages for the Admin Dashboard. */}
          <Route index element={<AdminMainPage user={session?.user} />} />
          <Route
            path="user-management"
            element={<UserManagementPage user={session?.user} />}
          />
          <Route
            path="post-moderation"
            element={<PostModerationPage user={session?.user} />}
          />
          <Route
            path="settings"
            element={<AdminSettingsPage user={session?.user} />}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
