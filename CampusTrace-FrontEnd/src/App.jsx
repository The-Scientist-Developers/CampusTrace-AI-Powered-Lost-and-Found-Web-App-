import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    // This is the main function to check for a session and get the user's role.
    const fetchSessionAndProfile = async () => {
      // Start by setting loading to true.
      setIsLoading(true);

      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();
      setSession(initialSession);

      // If a session exists, fetch the user's role from our 'profiles' table.
      if (initialSession) {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", initialSession.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          setProfile(null);
        } else {
          setProfile(data); // Store the profile data (e.g., { role: 'admin' })
        }
      } else {
        // If there's no session, ensure the profile is also null.
        setProfile(null);
      }

      // We're done with the initial check, so stop the loading screen.
      setIsLoading(false);
    };

    // Call the function to perform the initial check.
    fetchSessionAndProfile();

    // Set up a listener. Supabase will tell us if the user logs in or out in the future.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // When the auth state changes, update our session state.
      setSession(newSession);

      // If the user just logged in (newSession exists), refetch their profile.
      if (newSession) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", newSession.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) setProfile(null);
            else setProfile(data);
          });
      } else {
        // If the user just logged out, clear their profile data.
        setProfile(null);
      }
    });

    // This is a cleanup function. It removes the listener when the app closes to prevent memory leaks.
    return () => subscription.unsubscribe();
  }, []); // The empty array `[]` means this `useEffect` only runs once.

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
        ></Route>

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
        ></Route>

        {/* --- User Dashboard Routes (Protected by PrivateRoute) --- */}
        <Route
          path="/dashboard"
          element={
            <PrivateRouter session={session} isLoading={isLoading}>
              <DashboardLayout user={session?.user}>
                <Outlet />{" "}
                {/* Outlet is the placeholder where nested routes will be rendered. */}
              </DashboardLayout>
            </PrivateRouter>
          }
        >
          {/* These are the nested pages inside the User Dashboard. */}
          <Route index element={<UserMainPage />} />{" "}
          {/* This renders at /dashboard */}
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="post-new" element={<PostNewItem />} />
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
                  <Outlet /> {/* Outlet for nested admin routes. */}
                </AdminDashboardLayout>
              </RoleBasedRouter>
            </PrivateRouter>
          }
        >
          {/* Nested pages for the Admin Dashboard. */}
          <Route index element={<AdminMainPage />} />
          <Route path="user-management" element={<UserManagementPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
