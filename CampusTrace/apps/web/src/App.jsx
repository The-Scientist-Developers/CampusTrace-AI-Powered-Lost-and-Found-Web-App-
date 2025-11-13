import React, { useState, useEffect, lazy, Suspense } from "react";
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

import ErrorBoundary from "./components/errorBoundary.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";

// Lazy load all page components for code splitting
const NotFoundPage = lazy(() =>
  import("./features/MainPages/notFoundPage.jsx")
);
const LandingPage = lazy(() => import("./features/MainPages/landingPage.jsx"));
const LoginPage = lazy(() => import("./features/MainPages/LoginPage.jsx"));
const DashboardLayout = lazy(() =>
  import("./features/UserDashboard/DashboardLayout.jsx")
);
const UserMainPage = lazy(() =>
  import("./features/UserDashboard/Pages/userMainPage.jsx")
);
const AdminDashboardLayout = lazy(() =>
  import("./features/AdminDashboard/adminDashboardLayout.jsx")
);
const UserProfilePage = lazy(() =>
  import("./features/UserDashboard/Pages/userProfilePage.jsx")
);
const AdminMainPage = lazy(() =>
  import("./features/AdminDashboard/Pages/AdminMainPage.jsx")
);
const PostNewItem = lazy(() =>
  import("./features/UserDashboard/Pages/userPostItems.jsx")
);
const UserManagement = lazy(() =>
  import("./features/AdminDashboard/Pages/adminUserManagement.jsx")
);
const PostModerationPage = lazy(() =>
  import("./features/AdminDashboard/Pages/postModerationPage.jsx")
);
const AdminSettingsPage = lazy(() =>
  import("./features/AdminDashboard/Pages/adminSettings.jsx")
);
const MyPostsPage = lazy(() =>
  import("./features/UserDashboard/Pages/userMypostPage.jsx")
);
const AboutUsPage = lazy(() => import("./features/MainPages/aboutPage.jsx"));
const LearnMorePage = lazy(() =>
  import("./features/MainPages/learnMorePage.jsx")
);
const BrowseAllPage = lazy(() =>
  import("./features/UserDashboard/Pages/browseAllPage.jsx")
);
const HelpPage = lazy(() =>
  import("./features/UserDashboard/Pages/userHelpPage.jsx")
);
const NotificationPage = lazy(() =>
  import("./features/UserDashboard/Pages/userNotificationPage.jsx")
);
const UserSettingsPage = lazy(() =>
  import("./features/UserDashboard/Pages/userSettingsPage.jsx")
);
const RegisterUniversityPage = lazy(() =>
  import("./features/MainPages/RegisterUniversityPage.jsx")
);
const UpdatePasswordPage = lazy(() =>
  import("./features/MainPages/UpdatePasswordPage.jsx")
);
const AdminNotificationPage = lazy(() =>
  import("./features/AdminDashboard/Pages/adminNotificationPage.jsx")
);
const LeaderboardPage = lazy(() =>
  import("./features/UserDashboard/Pages/leaderBoardPage.jsx")
);
const AdminProfilePage = lazy(() =>
  import("./features/AdminDashboard/Pages/adminProfile.jsx")
);
const MessagesPage = lazy(() =>
  import("./features/UserDashboard/Pages/userMessageApp.jsx")
);
const ManualRegisterPage = lazy(() =>
  import("./features/MainPages/manualRegisterPage.jsx")
);
const ManualVerificationAdminPage = lazy(() =>
  import("./features/AdminDashboard/Pages/adminVerificationPage.jsx")
);
const PendingApprovalPage = lazy(() =>
  import("./features/MainPages/pendingApprovalPage.jsx")
);
const ForgotPasswordPage = lazy(() =>
  import("./features/MainPages/forgotPasswordPage.jsx")
);
const ConfirmEmailPage = lazy(() =>
  import("./features/MainPages/confirmPage.jsx")
);
const AdminBackupPage = lazy(() =>
  import("./features/AdminDashboard/Pages/adminBackupPage.jsx")
);

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
      <ErrorBoundary>
        <Router>
          <Suspense fallback={<LoadingScreen />}>
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
              <Route
                path="/manual-verification"
                element={<ManualRegisterPage />}
              />
              <Route path="/reset-password" element={<UpdatePasswordPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/confirm-email" element={<ConfirmEmailPage />} />
              <Route path="/about" element={<AboutUsPage />} />
              <Route path="/learn-more" element={<LearnMorePage />} />
              <Route
                path="/pending-approval"
                element={<PendingApprovalPage />}
              />

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
                <Route
                  path="help"
                  element={<HelpPage user={session?.user} />}
                />
              </Route>

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
                <Route
                  path="backup"
                  element={<AdminBackupPage user={session?.user} />}
                />
                <Route
                  path="help"
                  element={<HelpPage user={session?.user} />}
                />
              </Route>

              {/* This must be the LAST route in the list */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Router>
      </ErrorBoundary>
    </SkeletonTheme>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
