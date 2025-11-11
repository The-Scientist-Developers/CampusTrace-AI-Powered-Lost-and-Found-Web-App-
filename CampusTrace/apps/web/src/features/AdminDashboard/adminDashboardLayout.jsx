import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../api/apiClient";
import { useTheme } from "../../contexts/ThemeContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import AdminDesktopSidebar from "./AdminDesktopSidebar";
import AdminMobileHeader from "./AdminMobileHeader";
import AdminMobileBottomNav from "./AdminMobileBottomNav";

const AdminDashboardSkeleton = () => (
  <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a]">
    {/* Mobile Header Skeleton */}
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-[#2a2a2a] border-b border-neutral-200 dark:border-[#3a3a3a] z-50">
      <div className="h-full px-4 flex items-center justify-between">
        <Skeleton width={150} height={24} />
        <div className="flex gap-2">
          <Skeleton circle width={40} height={40} />
          <Skeleton circle width={40} height={40} />
          <Skeleton width={80} height={36} borderRadius={8} />
        </div>
      </div>
    </div>

    {/* Desktop Sidebar Skeleton */}
    <div className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-white dark:bg-[#2a2a2a] border-r border-neutral-200 dark:border-[#3a3a3a]">
      <div className="h-20 px-6 flex items-center border-b border-neutral-200 dark:border-[#3a3a3a]">
        <Skeleton width={180} height={28} />
      </div>
      <div className="p-3 space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} height={48} borderRadius={8} />
        ))}
      </div>
    </div>

    {/* Main Content Skeleton */}
    <div className="pt-14 pb-16 lg:pt-0 lg:pb-0 lg:ml-64">
      <div className="p-6">
        <Skeleton height={40} width={200} className="mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height={120} borderRadius={12} />
          ))}
        </div>
      </div>
    </div>

    {/* Mobile Bottom Nav Skeleton */}
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#2a2a2a] border-t border-neutral-200 dark:border-[#3a3a3a]">
      <div className="h-full flex items-center justify-around px-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton circle width={28} height={28} />
            <Skeleton width={40} height={10} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function AdminDashboardLayout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const [profile, setProfile] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [pendingPostsCount, setPendingPostsCount] = useState(0);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);
  const [siteName, setSiteName] = useState("CampusTrace");
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfile(profileData);

        if (profileData?.university_id) {
          const { data: settingsData } = await supabase
            .from("site_settings")
            .select("setting_value")
            .eq("university_id", profileData.university_id)
            .eq("setting_key", "site_name")
            .single();

          if (settingsData) {
            setSiteName(settingsData.setting_value);
          }
        }
      }

      const { count: notifCount, error: notifError } = await supabase
        .from("notifications")
        .select("*", { head: true, count: "exact" })
        .eq("recipient_id", user.id)
        .eq("status", "unread");

      if (!notifError) setNotificationCount(notifCount || 0);

      const { count: msgCount, error: msgError } = await supabase
        .from("messages")
        .select("*", { head: true, count: "exact" })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (!msgError) setMessageCount(msgCount || 0);

      const { count: postsCount, error: postsError } = await supabase
        .from("posts")
        .select("*", { head: true, count: "exact" })
        .eq("status", "pending");

      if (!postsError) setPendingPostsCount(postsCount || 0);

      const { count: verCount, error: verError } = await supabase
        .from("profiles")
        .select("*", { head: true, count: "exact" })
        .eq("verification_status", "pending");

      if (!verError) setPendingVerificationsCount(verCount || 0);
    } catch (error) {
      console.error("Error in fetchAllData:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAllData();

    const profileSubscription = supabase
      .channel(`admin:profiles:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => setProfile(payload.new)
      )
      .subscribe();

    const notificationSubscription = supabase
      .channel(`admin:notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => fetchAllData()
      )
      .subscribe();

    const messageSubscription = supabase
      .channel(`admin:messages:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => fetchAllData()
      )
      .subscribe();

    const postsSubscription = supabase
      .channel("admin:posts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => fetchAllData()
      )
      .subscribe();

    const verificationsSubscription = supabase
      .channel("admin:verifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(notificationSubscription);
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(postsSubscription);
      supabase.removeChannel(verificationsSubscription);
    };
  }, [user?.id, fetchAllData]);

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a]">
      {/* Mobile Header */}
      <AdminMobileHeader
        notificationCount={notificationCount}
        pendingPostsCount={pendingPostsCount}
        siteName={siteName}
      />

      {/* Desktop Sidebar */}
      <AdminDesktopSidebar
        user={user}
        profile={profile}
        siteName={siteName}
        notificationCount={notificationCount}
        messageCount={messageCount}
        pendingPostsCount={pendingPostsCount}
        pendingVerificationsCount={pendingVerificationsCount}
      />

      {/* Main Content */}
      <main className="pt-14 pb-16 lg:pt-0 lg:pb-0 lg:ml-64">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminMobileBottomNav
        pendingPostsCount={pendingPostsCount}
        pendingVerificationsCount={pendingVerificationsCount}
        notificationCount={notificationCount}
      />
    </div>
  );
}
