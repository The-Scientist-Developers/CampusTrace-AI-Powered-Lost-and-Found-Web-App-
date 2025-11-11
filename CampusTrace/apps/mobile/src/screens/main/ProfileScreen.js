import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  FileText,
  CheckCircle,
  Package,
} from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";
import { useTheme } from "../../contexts/ThemeContext";

const ProfileScreen = ({ navigation }) => {
  const { colors, fontSizes } = useTheme();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
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
    menuButton: {
      padding: 4,
    },
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },
    profileSection: {
      alignItems: "center",
      paddingVertical: 32,
      backgroundColor: colors.surface,
      marginBottom: 1,
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
    statsContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 20,
      gap: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      flexDirection: "column",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    statIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
    },
    statContent: {
      alignItems: "center",
    },
    statValue: {
      fontSize: fontSizes.xxl,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      textAlign: "center",
      fontWeight: "500",
    },
    recentPostsSection: {
      backgroundColor: colors.surface,
      marginTop: 8,
      marginBottom: 8,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: fontSizes.large,
      fontWeight: "700",
      color: colors.text,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    recentPostsContainer: {
      paddingHorizontal: 16,
    },
    recentPostItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    recentPostImage: {
      width: 52,
      height: 52,
      borderRadius: 10,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    postThumbnail: {
      width: "100%",
      height: "100%",
    },
    recentPostInfo: {
      flex: 1,
      marginRight: 8,
    },
    recentPostTitle: {
      fontSize: fontSizes.base,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    recentPostDate: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    statusBadgeText: {
      fontSize: fontSizes.small,
      fontWeight: "600",
    },
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
        {/* Removed hamburger/menu button as requested */}
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

          {/* Stats Cards */}
          <View style={dynamicStyles.statsContainer}>
            <StatCard
              label="Total Posts"
              value={stats.totalPosts}
              icon={FileText}
              color="#6366F1"
              dynamicStyles={dynamicStyles}
              colors={colors}
            />
            <StatCard
              label="Items Found"
              value={stats.foundItems}
              icon={CheckCircle}
              color="#10B981"
              dynamicStyles={dynamicStyles}
              colors={colors}
            />
            <StatCard
              label="Recovered"
              value={stats.recoveredItems}
              icon={Package}
              color="#3B82F6"
              dynamicStyles={dynamicStyles}
              colors={colors}
            />
          </View>

          {/* Recent Posts */}
          {posts.length > 0 && (
            <View style={dynamicStyles.recentPostsSection}>
              <Text style={dynamicStyles.sectionTitle}>Recent Posts</Text>
              <View style={dynamicStyles.recentPostsContainer}>
                {posts.slice(0, 5).map((post) => (
                  <RecentPostItem
                    key={post.id}
                    post={post}
                    dynamicStyles={dynamicStyles}
                    colors={colors}
                  />
                ))}
              </View>
            </View>
          )}

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

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  dynamicStyles,
  colors,
}) => (
  <View style={dynamicStyles.statCard}>
    <View
      style={[
        dynamicStyles.statIconContainer,
        { backgroundColor: color + "20" },
      ]}
    >
      <Icon size={24} color={color} />
    </View>
    <View style={dynamicStyles.statContent}>
      <Text style={dynamicStyles.statValue}>{value}</Text>
      <Text style={dynamicStyles.statLabel}>{label}</Text>
    </View>
  </View>
);

const RecentPostItem = ({ post, dynamicStyles, colors }) => (
  <View style={dynamicStyles.recentPostItem}>
    <View style={dynamicStyles.recentPostImage}>
      {post.image_url ? (
        <Image
          source={{ uri: post.image_url }}
          style={dynamicStyles.postThumbnail}
        />
      ) : (
        <FileText size={20} color={colors.textSecondary} />
      )}
    </View>
    <View style={dynamicStyles.recentPostInfo}>
      <Text style={dynamicStyles.recentPostTitle} numberOfLines={1}>
        {post.title}
      </Text>
      <Text style={dynamicStyles.recentPostDate}>
        {new Date(post.created_at).toLocaleDateString()}
      </Text>
    </View>
    <View
      style={[
        dynamicStyles.statusBadge,
        {
          backgroundColor:
            post.moderation_status === "approved"
              ? "#10B98120"
              : post.moderation_status === "recovered"
              ? "#3B82F620"
              : "#EAB30820",
        },
      ]}
    >
      <Text
        style={[
          dynamicStyles.statusBadgeText,
          {
            color:
              post.moderation_status === "approved"
                ? "#10B981"
                : post.moderation_status === "recovered"
                ? "#3B82F6"
                : "#EAB308",
          },
        ]}
      >
        {post.moderation_status?.charAt(0).toUpperCase() +
          post.moderation_status?.slice(1).replace("_", " ")}
      </Text>
    </View>
  </View>
);

export default ProfileScreen;
