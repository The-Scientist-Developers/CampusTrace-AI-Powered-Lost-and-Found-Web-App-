import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
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
} from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";

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
      setLoading(true);
      const supabase = getSupabaseClient();

      if (!user?.id) {
        setNotifications([]);
        return;
      }

      // EXACT same query as web app
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

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

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877F2" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color="#DFE0E4" />
            <Text style={styles.emptyStateText}>No notifications</Text>
            <Text style={styles.emptyStateSubtext}>
              We'll notify you when something happens
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onPress={() => {
                // Handle notification press
                if (notification.type === "message") {
                  navigation.navigate("Messages");
                } else if (notification.item_id) {
                  // Navigate to item detail
                  navigation.navigate("ItemDetail", {
                    itemId: notification.item_id,
                  });
                }
              }}
              getTimeAgo={getTimeAgo}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const NotificationItem = ({ notification, onPress, getTimeAgo }) => {
  const getIcon = () => {
    const iconProps = { size: 24, color: "#FFFFFF" };
    switch (notification.type) {
      case "message":
        return <MessageCircle {...iconProps} />;
      case "claim":
        return <UserCheck {...iconProps} />;
      case "match":
        return <CheckCircle {...iconProps} />;
      case "status_update":
        return <AlertCircle {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const getIconBackgroundColor = () => {
    switch (notification.type) {
      case "message":
        return "#1877F2";
      case "claim":
        return "#10B981";
      case "match":
        return "#3B82F6";
      case "status_update":
        return "#F59E0B";
      default:
        return "#8E8E93";
    }
  };

  const isUnread = !notification.is_read;

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        isUnread && styles.notificationItemUnread,
      ]}
      onPress={onPress}
    >
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getIconBackgroundColor() },
        ]}
      >
        {getIcon()}
      </View>

      {/* Content */}
      <View style={styles.notificationContent}>
        <Text
          style={[
            styles.notificationTitle,
            isUnread && styles.notificationTitleUnread,
          ]}
          numberOfLines={2}
        >
          {notification.title}
        </Text>
        <Text style={styles.notificationBody} numberOfLines={3}>
          {notification.body}
        </Text>
        <Text style={styles.timestamp}>
          {notification.created_at ? getTimeAgo(notification.created_at) : ""}
        </Text>
      </View>

      {/* Unread Indicator */}
      {isUnread && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
};

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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  notificationItemUnread: {
    backgroundColor: "#F0F8FF",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  notificationTitleUnread: {
    fontWeight: "700",
  },
  notificationBody: {
    fontSize: 14,
    color: "#606770",
    marginBottom: 6,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: "#8E8E93",
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1877F2",
    marginTop: 6,
  },
});

export default NotificationScreen;
