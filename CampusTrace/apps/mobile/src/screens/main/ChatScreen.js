import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Send, MessageCircle } from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";
import SimpleLoadingScreen from "../../components/SimpleLoadingScreen";
import { useTheme } from "../../contexts/ThemeContext";

const ChatScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { conversationId } = route.params;
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const scrollViewRef = useRef(null);
  const supabase = getSupabaseClient();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (user?.id && conversationId) {
      fetchConversation();
      fetchMessages();
    }
  }, [user?.id, conversationId]);

  // Real-time message subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new) {
            setMessages((currentMessages) => [...currentMessages, payload.new]);
            // Auto-scroll to bottom on new message
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error(
            `Subscription error for messages_${conversationId}:`,
            err
          );
        } else {
          console.log(
            `Subscribed to messages_${conversationId} status: ${status}`
          );
        }
      });

    return () => {
      console.log(`Unsubscribing from messages_${conversationId}`);
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error("Error getting user:", error);
    }
  };

  const fetchConversation = async () => {
    try {
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
        .eq("id", conversationId)
        .single();

      if (error) throw error;
      setConversation(data);
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Scroll to bottom after loading messages
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSubmit = async () => {
    if (newMessage.trim() === "" || sending) return;

    setSending(true);
    const messageToSend = newMessage;
    setNewMessage(""); // Clear input optimistically

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: messageToSend,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageToSend); // Restore message on failure
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return "--:--";
    }
  };

  if (loading) {
    return <SimpleLoadingScreen />;
  }

  if (!conversation) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Conversation not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const otherUser =
    conversation.finder?.id === user.id
      ? conversation.claimant
      : conversation.finder;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>

          <Image
            source={{
              uri:
                otherUser?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  otherUser?.full_name || "?"
                )}&background=6366f1&color=fff`,
            }}
            style={styles.avatar}
          />

          <View style={styles.headerInfo}>
            <Text
              style={[styles.headerName, { color: colors.text }]}
              numberOfLines={1}
            >
              {otherUser?.full_name || "Unknown User"}
            </Text>
            <Text
              style={[styles.headerSubtext, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              Regarding: {conversation.item?.title || "Unknown Item"}
            </Text>
          </View>
        </View>

        {/* Item Info Bar */}
        {conversation.item?.status && (
          <View
            style={[
              styles.itemInfoBar,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Text style={styles.itemEmoji}>
              {conversation.item.status === "lost" ? "🔍" : "📦"}
            </Text>
            <Text
              style={[styles.itemInfoText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {conversation.item.status === "lost" ? "Lost" : "Found"} Item:{" "}
              {conversation.item.title}
            </Text>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={[
            styles.messagesContainer,
            { backgroundColor: colors.background },
          ]}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageCircle size={64} color={colors.border} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                No messages yet
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtext,
                  { color: colors.textSecondary },
                ]}
              >
                Start the conversation!
              </Text>
            </View>
          ) : (
            messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  msg.sender_id === user.id
                    ? styles.messageWrapperSent
                    : styles.messageWrapperReceived,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    msg.sender_id === user.id
                      ? {
                          ...styles.messageBubbleSent,
                          backgroundColor: colors.primary,
                        }
                      : {
                          ...styles.messageBubbleReceived,
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      msg.sender_id === user.id
                        ? styles.messageTextSent
                        : { ...styles.messageTextReceived, color: colors.text },
                    ]}
                  >
                    {msg.content}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      msg.sender_id === user.id
                        ? styles.messageTimeSent
                        : {
                            ...styles.messageTimeReceived,
                            color: colors.textSecondary,
                          },
                    ]}
                  >
                    {formatTime(msg.created_at)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Input Footer */}
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!newMessage.trim() || sending}
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
              (!newMessage.trim() || sending) && {
                ...styles.sendButtonDisabled,
                opacity: 0.5,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Send color="white" size={20} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  headerSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  itemInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  itemEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  itemInfoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#2563eb",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  messageWrapperSent: {
    alignItems: "flex-end",
  },
  messageWrapperReceived: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageBubbleSent: {
    backgroundColor: "#2563eb",
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextSent: {
    color: "#ffffff",
  },
  messageTextReceived: {
    color: "#111827",
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  messageTimeSent: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  messageTimeReceived: {
    color: "#9ca3af",
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    fontSize: 14,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen;
