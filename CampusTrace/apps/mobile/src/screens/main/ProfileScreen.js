import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Award,
  Heart,
} from "lucide-react-native"; // Removed unused icons (FileText, CheckCircle, Package, Shield)
import { getSupabaseClient } from "@campustrace/core";
import { useTheme } from "../../contexts/ThemeContext";
import { apiClient } from "../../utils/apiClient";

// Lazy load heavy components
const BadgeList = React.lazy(() => import("../../components/BadgeList"));
const ThankYouNotes = React.lazy(() =>
  import("../../components/ThankYouNotes")
);

const ProfileScreen = ({ navigation }) => {
  const { colors, fontSizes } = useTheme();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]); // Kept logic as requested
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    // Kept logic as requested
    totalPosts: 0,
    foundItems: 0,
    recoveredItems: 0,
  });

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let profileListener = null;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (profileListener) {
          supabase.removeChannel(profileListener);
          profileListener = null;
        }

        if (event === "SIGNED_OUT") {
          setProfile(null);
          return;
        }

        const userId = currentUser?.id;

        if (userId) {
          (async () => {
            try {
              const { data: profileData, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

              if (error) throw error;
              setProfile(profileData);
            } catch (error) {
              console.error("Error fetching initial profile:", error);
              setProfile(null);
            }
          })();

          profileListener = supabase
            .channel(`public:profiles:id=eq.${userId}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "profiles",
                filter: `id=eq.${userId}`,
              },
              (payload) => {
                setProfile((prev) => ({ ...prev, ...payload.new }));
              }
            )
            .subscribe();
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
      if (profileListener) {
        supabase.removeChannel(profileListener);
      }
    };
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const supabase = getSupabaseClient();
      try {
        const { data: postsData, error } = await supabase
          .from("items")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setPosts(postsData || []);

        const totalPosts = postsData?.length || 0;
        const foundItems =
          postsData?.filter((p) => p.status?.toLowerCase() === "found")
            .length || 0;
        const recoveredItems =
          postsData?.filter(
            (p) => p.moderation_status?.toLowerCase() === "recovered"
          ).length || 0;

        setStats({ totalPosts, foundItems, recoveredItems });

        // Fetch badges
        try {
          const badgesData = await apiClient.get(
            `/api/badges/user/${user.id}/badges`
          );
          setBadges(badgesData.badges || []);
        } catch (badgeError) {
          console.error("Error fetching badges:", badgeError);
          setBadges([]);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchPosts();
    }
  }, [user?.id]);

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            const supabase = getSupabaseClient();
            await supabase.auth.signOut();
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  // Create dynamic styles
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: fontSizes.xl,
      fontWeight: "700",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      marginTop: 2,
    },
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },
    profileSection: {
      alignItems: "center",
      paddingVertical: 32,
      backgroundColor: colors.surface,
      marginBottom: 8, // Enhanced UI: Added consistent spacing
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarLarge: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
      overflow: "hidden",
      borderWidth: 3,
      borderColor: colors.border,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    userName: {
      fontSize: fontSizes.xl,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    // --- Removed Stats Styles ---
    badgesSection: {
      paddingVertical: 20,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      marginBottom: 8,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    thankYouNotesSection: {
      paddingVertical: 20,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      marginBottom: 8,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      gap: 8,
    },
    sectionTitle: {
      fontSize: fontSizes.lg,
      fontWeight: "700",
      color: colors.text,
    },
    // --- Removed Recent Posts Styles ---
    menuSection: {
      backgroundColor: colors.surface,
      marginBottom: 8,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    menuItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    menuItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    menuItemLabel: {
      fontSize: fontSizes.base,
      color: colors.text,
      fontWeight: "500",
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.surface,
      paddingVertical: 16,
      marginTop: 16,
      marginHorizontal: 16,
      marginBottom: 32,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.error || "#EF4444",
    },
    logoutText: {
      fontSize: fontSizes.base,
      fontWeight: "700",
      color: colors.error || "#EF4444",
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerContent}>
          <Text style={dynamicStyles.headerTitle}>Profile</Text>
          <Text style={dynamicStyles.headerSubtitle}>
            Manage your account and view your activity
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={dynamicStyles.scrollView}>
          {/* Profile Info */}
          <View style={dynamicStyles.profileSection}>
            <View style={dynamicStyles.avatarLarge}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={dynamicStyles.avatarImage}
                />
              ) : (
                <User size={48} color="#FFFFFF" />
              )}
            </View>
            <Text style={dynamicStyles.userName}>
              {profile?.full_name || user?.email?.split("@")[0] || "User"}
            </Text>
            <Text style={dynamicStyles.userEmail}>{user?.email}</Text>
          </View>

          {/* --- Stats Cards Removed --- */}

          {/* Badges Section */}
          <View style={dynamicStyles.badgesSection}>
            <View style={dynamicStyles.sectionHeader}>
              <Award size={24} color={colors.primary} />
              <Text style={dynamicStyles.sectionTitle}>Badges</Text>
            </View>
            <BadgeList badges={badges} colors={colors} />
          </View>

          {/* Thank You Notes Section */}
          <View style={dynamicStyles.thankYouNotesSection}>
            <View style={dynamicStyles.sectionHeader}>
              <Heart size={24} color={colors.primary} />
              <Text style={dynamicStyles.sectionTitle}>Thank You Notes</Text>
            </View>
            <ThankYouNotes userId={user?.id} colors={colors} />
          </View>

          {/* --- Recent Posts Removed --- */}

          {/* Menu Items */}
          <View style={dynamicStyles.menuSection}>
            <MenuItem
              icon={Settings}
              label="Settings"
              onPress={() => navigation.navigate("Settings")}
              dynamicStyles={dynamicStyles}
              colors={colors}
            />
            <MenuItem
              icon={Bell}
              label="Notifications"
              onPress={() =>
                navigation.navigate("Dashboard", { screen: "Notifications" })
              }
              dynamicStyles={dynamicStyles}
              colors={colors}
            />
            <MenuItem
              icon={HelpCircle}
              label="Help & Support"
              onPress={() => navigation.navigate("Help")}
              dynamicStyles={dynamicStyles}
              colors={colors}
            />
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={dynamicStyles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.error || "#EF4444"} />
            <Text style={dynamicStyles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const MenuItem = ({ icon: Icon, label, onPress, dynamicStyles, colors }) => (
  <TouchableOpacity style={dynamicStyles.menuItem} onPress={onPress}>
    <View style={dynamicStyles.menuItemLeft}>
      <Icon size={24} color={colors.text} />
      <Text style={dynamicStyles.menuItemLabel}>{label}</Text>
    </View>
    <ChevronRight size={20} color={colors.textSecondary} />
  </TouchableOpacity>
);

// --- StatCard Component Removed ---

// --- RecentPostItem Component Removed ---

export default ProfileScreen;
