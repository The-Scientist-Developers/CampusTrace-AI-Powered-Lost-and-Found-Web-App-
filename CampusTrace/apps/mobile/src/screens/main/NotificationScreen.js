import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList, // Use FlatList for better performance
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  MessageCircle,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Info,
  Package,
} from "lucide-react-native";
import { getSupabaseClient, BRAND_COLOR } from "@campustrace/core";
import SimpleLoadingScreen from "../../components/SimpleLoadingScreen";

// ====================
// Helper Function
// ====================
const getTimeAgo = (dateString) => {
  if (!dateString) return "unknown time";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "invalid date";

  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label.charAt(0)} ago`; // e.g., "5m ago"
    }
  }
  return "just now";
};

// ====================
// Main Component
// ====================
const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  const getCurrentUser = async () => {
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error("Error getting user:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      if (!refreshing) setLoading(true);
      const supabase = getSupabaseClient();

      if (!user?.id) {
        setNotifications([]);
        return;
      }

      // EXACT same query as web app - no joins needed
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId) => {
    try {
      const supabase = getSupabaseClient();
      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, status: "read" } : n
        )
      );

      // Update in Supabase
      await supabase
        .from("notifications")
        .update({ status: "read" })
        .eq("id", notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationPress = (notification) => {
    // Mark as read first
    if (notification.status !== "read") {
      markAsRead(notification.id);
    }

    // Navigate based on link_to if provided
    if (notification.link_to) {
      // Parse the link and navigate accordingly
      // For now, just navigate to Messages or Dashboard
      if (notification.link_to.includes("/messages")) {
        navigation.navigate("Messages");
      }
    }
  };

  if (loading && !refreshing) {
    return <SimpleLoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>
          Stay updated with important alerts and messages
        </Text>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={64} color="#DFE0E4" />
            <Text style={styles.emptyStateText}>No notifications</Text>
            <Text style={styles.emptyStateSubtext}>
              We'll notify you when something happens
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// ====================
// NotificationItem Component (simplified like web-app)
// ====================
const NotificationItem = ({ notification, onPress }) => {
  const { type, message, created_at, status } = notification;
  const is_read = status === "read";

  // Dynamically generate icon based on type
  let Icon, iconColor;

  switch (type) {
    case "message":
      Icon = MessageCircle;
      iconColor = BRAND_COLOR;
      break;
    case "claim":
      Icon = UserCheck;
      iconColor = "#10B981";
      break;
    case "match":
      Icon = CheckCircle;
      iconColor = "#3B82F6";
      break;
    case "status_update":
    case "moderation":
      Icon = AlertCircle;
      iconColor = "#F59E0B";
      break;
    case "claim_accepted":
      Icon = CheckCircle;
      iconColor = "#10B981";
      break;
    case "claim_rejected":
      Icon = AlertCircle;
      iconColor = "#EF4444";
      break;
    case "item_recovered":
      Icon = Package;
      iconColor = BRAND_COLOR;
      break;
    default:
      Icon = Info;
      iconColor = "#8E8E93";
  }

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !is_read && styles.notificationItemUnread,
      ]}
      onPress={onPress}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
        <Icon size={24} color="#FFFFFF" />
      </View>

      {/* Content */}
      <View style={styles.notificationContent}>
        <Text
          style={[
            styles.notificationTitle,
            !is_read && styles.notificationTitleUnread,
          ]}
          numberOfLines={3}
        >
          {message || "New notification"}
        </Text>
        <Text style={styles.timestamp}>
          {created_at ? getTimeAgo(created_at) : ""}
        </Text>
      </View>

      {/* Unread Indicator */}
      {!is_read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
};

// ====================
// Styles
// ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
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
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16, // Increased padding
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0", // Lighter border
  },
  notificationItemUnread: {
    backgroundColor: "#F0F8FF", // Light blue for unread
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2, // Align with text
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333", // Darker text
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationTitleUnread: {
    fontWeight: "700",
    color: "#000000",
  },
  timestamp: {
    fontSize: 12,
    color: "#8E8E93",
  },
  unreadIndicator: {
    width: 10, // Made indicator slightly larger
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND_COLOR,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default NotificationScreen;
