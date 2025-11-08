import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FileText,
  Search,
  Bell,
  MessageCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";

const DashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    lostItems: 0,
    foundItems: 0,
    recoveredItems: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [myRecentPosts, setMyRecentPosts] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = getSupabaseClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch user profile to get university_id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error("User profile not found.");

      // Fetch all user's items for stats calculation
      const { data: allMyItems = [], error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id);

      if (itemsError) throw itemsError;

      // Fetch active posts
      const { data: activePosts = [] } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .in("moderation_status", ["approved", "pending", "pending_return"])
        .order("created_at", { ascending: false })
        .limit(4);

      setMyRecentPosts(activePosts);

      // Fetch community activity
      if (profile.university_id) {
        const { data: communityData = [] } = await supabase
          .from("items")
          .select("*, profiles(id, full_name, email)")
          .eq("university_id", profile.university_id)
          .eq("moderation_status", "approved")
          .order("created_at", { ascending: false })
          .limit(50);
        setRecentActivity(communityData);
      } else {
        setRecentActivity([]);
        console.warn(
          "User profile does not have a university_id, community activity cannot be fetched."
        );
      }

      // Calculate stats
      const lostCount = allMyItems.filter(
        (item) => item.status === "Lost"
      ).length;
      const foundCount = allMyItems.filter(
        (item) => item.status === "Found"
      ).length;
      const recoveredCount = allMyItems.filter(
        (item) => item.moderation_status === "recovered"
      ).length;

      setStats({
        totalItems: allMyItems.length,
        lostItems: lostCount,
        foundItems: foundCount,
        recoveredItems: recoveredCount,
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Instagram-style Header - Always visible */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>CT</Text>
          </View>
          <Text style={styles.appNameHeader}>CampusTrace</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Bell size={26} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate("Messages")}
          >
            <MessageCircle size={26} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877F2" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.user_metadata?.full_name ||
                user?.email?.split("@")[0] ||
                "User"}
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                icon={FileText}
                label="Total Items"
                value={stats.totalItems}
                color="#1877F2"
              />
              <StatCard
                icon={TrendingUp}
                label="Lost Items"
                value={stats.lostItems}
                color="#EF4444"
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                icon={CheckCircle}
                label="Found Items"
                value={stats.foundItems}
                color="#10B981"
              />
              <StatCard
                icon={Clock}
                label="Recovered"
                value={stats.recoveredItems}
                color="#3B82F6"
              />
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>

            {recentActivity.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No recent activity</Text>
              </View>
            ) : (
              recentActivity.map((item, index) => (
                <ActivityItem key={item.id || index} item={item} />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// Activity Item Component
const ActivityItem = ({ item }) => {
  const statusColor = {
    Lost: "#EF4444",
    Found: "#10B981",
  };

  const statusBgColor = {
    Lost: "#FEE2E2",
    Found: "#D1FAE5",
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const posterName =
    item.profiles?.full_name ||
    (item.profiles?.email ? item.profiles.email.split("@")[0] : "Anonymous");

  return (
    <View style={styles.activityItem}>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityUser}>{posterName}</Text>
        <Text style={styles.activityTime}>
          {item.created_at ? getTimeAgo(item.created_at) : "Recently"}
        </Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: statusBgColor[item.status] || "#F3F4F6" },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: statusColor[item.status] || "#6B7280" },
          ]}
        >
          {item.status}
        </Text>
      </View>
    </View>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: color + "15" }]}>
      <Icon size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionButton = ({ icon: Icon, label, onPress, color }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View
      style={[styles.actionIconContainer, { backgroundColor: color + "15" }]}
    >
      <Icon size={28} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#606770",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1877F2",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  appNameHeader: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: -0.5,
    fontFamily: "System",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 20,
  },
  headerIconButton: {
    padding: 4,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  greeting: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  statsContainer: {
    padding: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#8E8E93",
  },
  section: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    marginTop: 8,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: "#000000",
    textAlign: "center",
    fontWeight: "500",
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  activityUser: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#8E8E93",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 12,
  },
});

export default DashboardScreen;
