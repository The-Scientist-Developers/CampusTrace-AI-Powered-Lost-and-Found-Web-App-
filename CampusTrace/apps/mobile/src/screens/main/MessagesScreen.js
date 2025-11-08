import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageCircle, ChevronRight } from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";

const MessagesScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchMessages();
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

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      if (!user?.id) {
        setConversations([]);
        return;
      }

      // EXACT same query as web app
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
            id,
            item:items(id, title, image_url, status),
            finder:profiles!conversations_finder_id_fkey(id, full_name, avatar_url),
            claimant:profiles!conversations_claimant_id_fkey(id, full_name, avatar_url)
          `
        )
        .or(`finder_id.eq.${user.id},claimant_id.eq.${user.id}`);

      if (error) throw error;

      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877F2" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Conversations List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color="#DFE0E4" />
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start a conversation about an item
            </Text>
          </View>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onPress={() => {
                navigation.navigate("Chat", {
                  conversationId: conversation.id,
                });
              }}
              getTimeAgo={getTimeAgo}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const ConversationItem = ({ conversation, onPress, getTimeAgo }) => {
  const otherUser = conversation.other_user || {};
  const lastMessage = conversation.last_message || {};
  const hasUnread = conversation.unread_count > 0;

  return (
    <TouchableOpacity style={styles.conversationItem} onPress={onPress}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {otherUser.avatar_url ? (
          <Image source={{ uri: otherUser.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {otherUser.full_name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}
        {hasUnread && <View style={styles.unreadDot} />}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text
            style={[styles.userName, hasUnread && styles.userNameUnread]}
            numberOfLines={1}
          >
            {otherUser.full_name || "Unknown User"}
          </Text>
          <Text style={styles.timestamp}>
            {lastMessage.created_at ? getTimeAgo(lastMessage.created_at) : ""}
          </Text>
        </View>

        <View style={styles.messagePreview}>
          <Text
            style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
            numberOfLines={2}
          >
            {lastMessage.content || "No messages yet"}
          </Text>
          {hasUnread && conversation.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {conversation.unread_count}
              </Text>
            </View>
          )}
        </View>

        {/* Item Reference */}
        {conversation.item && (
          <Text style={styles.itemReference} numberOfLines={1}>
            About: {conversation.item.title}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <ChevronRight size={20} color="#8E8E93" />
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
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1877F2",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  unreadDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1877F2",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  conversationContent: {
    flex: 1,
    marginRight: 8,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
  },
  userNameUnread: {
    fontWeight: "700",
  },
  timestamp: {
    fontSize: 12,
    color: "#8E8E93",
    marginLeft: 8,
  },
  messagePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#8E8E93",
    flex: 1,
  },
  lastMessageUnread: {
    color: "#000000",
    fontWeight: "500",
  },
  unreadBadge: {
    backgroundColor: "#1877F2",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: "center",
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  itemReference: {
    fontSize: 12,
    color: "#8E8E93",
    fontStyle: "italic",
  },
});

export default MessagesScreen;
