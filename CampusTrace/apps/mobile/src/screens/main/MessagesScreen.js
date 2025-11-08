import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  FlatList, // Use FlatList for better performance
  Alert, // Import Alert for confirmation
  Animated, // Import Animated for swipe animation
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageCircle, ChevronRight, User, Trash2 } from "lucide-react-native";
import { getSupabaseClient, BRAND_COLOR } from "@campustrace/core";
// --- 1. IMPORT GESTURE HANDLER ---
import { Swipeable } from "react-native-gesture-handler";
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
      return `${count}${interval.label.charAt(0)} ago`; // e.g., "5m ago", "2h ago"
    }
  }
  return "just now";
};

// ====================
// Swipe Actions Component
// ====================
const RightSwipeActions = ({ progress, dragX, onPress }) => {
  const trans = dragX.interpolate({
    inputRange: [-80, 0],
    outputRange: [0, 80],
    extrapolate: "clamp",
  });
  return (
    <TouchableOpacity style={styles.deleteButton} onPress={onPress}>
      <Animated.View style={{ transform: [{ translateX: trans }] }}>
        <Trash2 size={24} color="#FFFFFF" />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ====================
// Swipeable Conversation Component
// ====================
const SwipeableConversation = ({
  item,
  navigation,
  onDelete,
  onSwipeableOpen,
}) => {
  const swipeableRef = useRef(null);

  const handleSwipeableOpen = () => {
    onSwipeableOpen(swipeableRef.current);
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={(progress, dragX) => (
        <RightSwipeActions
          progress={progress}
          dragX={dragX}
          onPress={() => {
            swipeableRef.current?.close();
            onDelete(item.id);
          }}
        />
      )}
      onSwipeableOpen={handleSwipeableOpen}
    >
      <ConversationItem
        conversation={item}
        onPress={() => {
          navigation.navigate("Chat", {
            conversationId: item.id,
            otherUser: item.other_user,
            item: item.item,
          });
        }}
      />
    </Swipeable>
  );
};

// ====================
// Main Component
// ====================
const MessagesScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  // Ref to keep track of the currently open swipeable item
  const openSwipeableRef = useRef(null);

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
      if (!refreshing) setLoading(true);
      const supabase = getSupabaseClient();

      if (!user?.id) {
        setConversations([]);
        return;
      }

      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          id,
          item:items(id, title, image_url, status),
          finder:profiles!conversations_finder_id_fkey(id, full_name, avatar_url),
          claimant:profiles!conversations_claimant_id_fkey(id, full_name, avatar_url),
          messages(id, content, created_at, sender_id)
        `
        )
        .or(`finder_id.eq.${user.id},claimant_id.eq.${user.id}`)
        .order("created_at", { referencedTable: "messages", ascending: false })
        .limit(1, { referencedTable: "messages" });

      if (error) throw error;

      const processedConversations = (data || []).map((convo) => {
        const finderId = convo.finder?.id;
        const claimantId = convo.claimant?.id;

        const otherUser = finderId === user.id ? convo.claimant : convo.finder;

        const lastMessage = convo.messages[0] || null;
        const unread_count = 0;

        return {
          ...convo,
          other_user: otherUser || {
            full_name: "Unknown User",
            avatar_url: null,
          },
          last_message: lastMessage,
          unread_count: unread_count,
        };
      });

      setConversations(processedConversations);
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

  // --- 2. ADD DELETE FUNCTION ---
  const deleteConversation = (conversationId) => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this entire conversation? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Optimistically remove from UI
              setConversations((prev) =>
                prev.filter((convo) => convo.id !== conversationId)
              );

              // 2. Attempt to delete from Supabase
              const supabase = getSupabaseClient();
              const { error } = await supabase
                .from("conversations")
                .delete()
                .eq("id", conversationId);

              if (error) {
                // If error, refresh from server
                Alert.alert(
                  "Error",
                  "Could not delete conversation. Please try again."
                );
                fetchMessages();
              }
            } catch (err) {
              Alert.alert("Error", "An unexpected error occurred.");
              fetchMessages();
            }
          },
        },
      ]
    );
  };

  // --- 3. CREATE SWIPEABLE ITEM RENDERER ---
  const renderConversationItem = ({ item }) => {
    // This makes sure only one swipeable is open at a time
    const handleSwipeableOpen = (swipeableRef) => {
      if (
        openSwipeableRef.current &&
        openSwipeableRef.current !== swipeableRef
      ) {
        openSwipeableRef.current.close();
      }
      openSwipeableRef.current = swipeableRef;
    };

    return (
      <SwipeableConversation
        item={item}
        navigation={navigation}
        onDelete={deleteConversation}
        onSwipeableOpen={handleSwipeableOpen}
      />
    );
  };

  if (loading && !refreshing) {
    return <SimpleLoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          Connect with other community members
        </Text>
      </View>

      {/* --- 4. UPDATE FLATLIST --- */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderConversationItem} // Use the new renderer
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MessageCircle size={64} color="#DFE0E4" />
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start a conversation about an item
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// ====================
// Sub-Component
// ====================
const ConversationItem = ({ conversation, onPress }) => {
  const { other_user, last_message, unread_count, item } = conversation;
  const hasUnread = unread_count > 0;

  return (
    <TouchableOpacity style={styles.conversationItem} onPress={onPress}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {other_user.avatar_url ? (
          <Image
            source={{ uri: other_user.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User size={28} color="#FFFFFF" />
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
            {other_user.full_name || "Unknown User"}
          </Text>
          <Text style={styles.timestamp}>
            {last_message?.created_at
              ? getTimeAgo(last_message.created_at)
              : ""}
          </Text>
        </View>

        <View style={styles.messagePreview}>
          <Text
            style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
            numberOfLines={1}
          >
            {last_message?.content || "No messages yet"}
          </Text>
          {hasUnread && unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unread_count}</Text>
            </View>
          )}
        </View>

        {item && (
          <Text style={styles.itemReference} numberOfLines={1}>
            About: {item.title}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <ChevronRight size={20} color="#8E8E93" />
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
    flex: 1,
    justifyContent: "center",
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
    backgroundColor: "#FFFFFF", // Added background color
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
    backgroundColor: BRAND_COLOR,
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
    backgroundColor: BRAND_COLOR,
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
    backgroundColor: BRAND_COLOR,
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
    marginTop: 2,
  },
  // --- 6. ADD DELETE BUTTON STYLE ---
  deleteButton: {
    backgroundColor: "#EF4444", // Red color
    justifyContent: "center",
    alignItems: "flex-end", // Align icon to the right
    width: 80, // Fixed width for the swipe action
    height: "100%",
    paddingRight: 24,
  },
});

export default MessagesScreen;
