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
    myPosts: 0,
    foundItems: 0,
    lostItems: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

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

      // Load stats and recent activity
      // TODO: Implement actual data fetching from your backend
      setStats({
        totalItems: 0,
        myPosts: 0,
        foundItems: 0,
        lostItems: 0,
      });

      setRecentActivity([]);
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

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877F2" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Instagram-style Header */}
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
            onPress={() => {
              /* TODO: Navigate to notifications */
            }}
          >
            <Bell size={26} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              /* TODO: Navigate to messages - need to add Messages screen to stack */
            }}
          >
            <MessageCircle size={26} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

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
              label="My Posts"
              value={stats.myPosts}
              color="#10B981"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon={CheckCircle}
              label="Found"
              value={stats.foundItems}
              color="#10B981"
            />
            <StatCard
              icon={AlertCircle}
              label="Lost"
              value={stats.lostItems}
              color="#EF4444"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <ActionButton
              icon={FileText}
              label="Report Lost Item"
              onPress={() => navigation.navigate("PostItem", { type: "lost" })}
              color="#EF4444"
            />
            <ActionButton
              icon={CheckCircle}
              label="Report Found Item"
              onPress={() => navigation.navigate("PostItem", { type: "found" })}
              color="#10B981"
            />
            <ActionButton
              icon={Search}
              label="Browse Items"
              onPress={() => navigation.navigate("Browse")}
              color="#1877F2"
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {recentActivity.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock size={48} color="#DFE0E4" />
                <Text style={styles.emptyStateText}>No recent activity</Text>
                <Text style={styles.emptyStateSubtext}>
                  Your recent posts and updates will appear here
                </Text>
              </View>
            ) : (
              recentActivity.map((item, index) => (
                <ActivityItem key={index} item={item} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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

const ActivityItem = ({ item }) => (
  <View style={styles.activityItem}>
    <View style={styles.activityDot} />
    <View style={styles.activityContent}>
      <Text style={styles.activityText}>{item.text}</Text>
      <Text style={styles.activityTime}>{item.time}</Text>
    </View>
  </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 12,
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
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
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
  emptyStateSubtext: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
    textAlign: "center",
  },
  activityItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1877F2",
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: "#8E8E93",
  },
});

export default DashboardScreen;
