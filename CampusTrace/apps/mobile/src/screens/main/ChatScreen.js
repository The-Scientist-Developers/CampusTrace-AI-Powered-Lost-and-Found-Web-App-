import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { getSupabaseClient } from "@campustrace/core";
import { apiClient } from "../../utils/apiClient";
import { useRoute } from "@react-navigation/native";
import {
  KeyRound,
  AlertCircle,
  Send,
  ArrowLeft,
  User,
} from "lucide-react-native";

// --- Handover Controls Component ---
const HandoverControls = ({
  user,
  conversationDetails,
  onCodeGenerated,
  dynamicStyles,
}) => {
  const { colors } = useTheme();
  const [handoverCode, setHandoverCode] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [handoverError, setHandoverError] = useState(null);

  const isClaimant = user?.id === conversationDetails.claimant_id;
  const isPendingReturn =
    conversationDetails.item?.moderation_status === "pending_return";

  if (!isClaimant || !isPendingReturn) {
    return null; // Don't show controls if not claimant or not pending
  }

  const handleStartHandover = async () => {
    if (!conversationDetails?.item_id) return;
    setCodeLoading(true);
    setHandoverError(null);
    setHandoverCode(null);
    try {
      const { data } = await apiClient.post(
        `/handover/items/${conversationDetails.item_id}/start-handover`
      );
      setHandoverCode(data.code);
      onCodeGenerated(data.code); // Pass code up
    } catch (error) {
      console.error("Error starting handover:", error);
      setHandoverError(
        error.response?.data?.detail || "Could not start handover."
      );
    } finally {
      setCodeLoading(false);
    }
  };

  if (handoverCode) {
    return (
      <View
        style={[
          dynamicStyles.handoverContainer,
          { backgroundColor: colors.primary },
        ]}
      >
        <Text style={dynamicStyles.handoverTitle}>Your Handover Code:</Text>
        <Text style={dynamicStyles.handoverCode}>{handoverCode}</Text>
        <Text style={dynamicStyles.handoverSubtitle}>
          Show this 4-digit code to the finder to complete the handover.
        </Text>
      </View>
    );
  }

  if (handoverError) {
    return (
      <View
        style={[
          dynamicStyles.handoverContainer,
          { backgroundColor: colors.error },
        ]}
      >
        <AlertCircle size={18} color="#FFFFFF" />
        <Text style={dynamicStyles.handoverError}>{handoverError}</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.handoverContainer}>
      <TouchableOpacity
        onPress={handleStartHandover}
        disabled={codeLoading}
        style={[
          dynamicStyles.handoverButton,
          codeLoading && styles.disabledButton,
        ]}
      >
        {codeLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <KeyRound size={18} color="#FFFFFF" />
        )}
        <Text style={dynamicStyles.handoverButtonText}>
          Start Secure Handover (Get Code) Start Secure Handover (Get Code)
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Main Chat Screen Component ---
const ChatScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const route = useRoute();
  const { conversationId, itemTitle, itemStatus } = route.params || {};

  // Create dynamic styles with theme colors
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    messageList: {
      flex: 1,
      paddingHorizontal: 10,
      backgroundColor: colors.background,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 16,
      fontSize: 16,
      marginRight: 10,
      backgroundColor: colors.background,
      color: colors.text,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.primary,
    },
    messageBubble: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 20,
      maxWidth: "80%",
    },
    myMessageBubble: {
      backgroundColor: colors.primary,
    },
    otherMessageBubble: {
      backgroundColor: colors.card,
    },
    myMessageText: {
      color: "#FFFFFF",
      fontSize: 15,
    },
    otherMessageText: {
      fontSize: 15,
      color: colors.text,
    },
    handoverContainer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    handoverButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    handoverButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    handoverTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    handoverCode: {
      fontSize: 40,
      fontWeight: "bold",
      color: "#FFFFFF",
      textAlign: "center",
      marginVertical: 10,
      letterSpacing: 5,
    },
    handoverSubtitle: {
      fontSize: 14,
      color: "#FFFFFF",
      textAlign: "center",
    },
    handoverError: {
      color: "#FFFFFF",
      fontSize: 14,
      marginLeft: 8,
    },
  });

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [conversationDetails, setConversationDetails] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);

  // Get user
  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch conversation details and initial messages
  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    const fetchConversation = async () => {
      try {
        setLoading(true);
        const supabase = getSupabaseClient();

        // Fetch conversation details (to know who is finder/claimant)
        const { data: convoData, error: convoError } = await supabase
          .from("conversations")
          .select("*, item:items(id, title, moderation_status)")
          .eq("id", conversationId)
          .single();

        if (convoError) throw convoError;
        setConversationDetails(convoData);

        // Determine the other user in the conversation
        const otherUserId =
          convoData.user1_id === user?.id
            ? convoData.user2_id
            : convoData.user1_id;

        // Fetch other user's profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", otherUserId)
          .single();

        if (!profileError && profileData) {
          setOtherUser(profileData);
        }

        // Fetch messages
        const { data: msgData, error: msgError } = await supabase
          .from("messages")
          .select("*, sender:profiles(id, full_name, avatar_url)")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false }); // Fetch in reverse for FlatList

        if (msgError) throw msgError;
        setMessages(msgData || []);
      } catch (error) {
        console.error("Error fetching conversation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const supabase = getSupabaseClient();
    const subscription = supabase
      .channel(`chat_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Manually fetch the new message with sender details
          const { data: newMsg, error } = await supabase
            .from("messages")
            .select("*, sender:profiles(id, full_name, avatar_url)")
            .eq("id", payload.new.id)
            .single();

          if (newMsg && !error) {
            setMessages((prevMessages) => [newMsg, ...prevMessages]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !conversationId || isSending) return;

    setIsSending(true);
    const supabase = getSupabaseClient();
    const content = newMessage.trim();
    setNewMessage("");

    try {
      // Insert new message
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(content); // Put text back on error
    } finally {
      setIsSending(false);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMyMessage = item.sender_id === user?.id;
    const showAvatar = !isMyMessage && otherUser;

    return (
      <View
        style={[
          styles.messageRow,
          isMyMessage ? styles.myMessageRow : styles.otherMessageRow,
        ]}
      >
        {showAvatar && (
          <View style={styles.avatarContainer}>
            {otherUser.avatar_url ? (
              <Image
                source={{ uri: otherUser.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.primary },
                ]}
              >
                <User size={16} color="#FFFFFF" />
              </View>
            )}
          </View>
        )}
        <View
          style={[
            dynamicStyles.messageBubble,
            isMyMessage
              ? dynamicStyles.myMessageBubble
              : dynamicStyles.otherMessageBubble,
          ]}
        >
          <Text
            style={
              isMyMessage
                ? dynamicStyles.myMessageText
                : dynamicStyles.otherMessageText
            }
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={colors.primary}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            {otherUser && (
              <View style={styles.headerUserInfo}>
                {otherUser.avatar_url ? (
                  <Image
                    source={{ uri: otherUser.avatar_url }}
                    style={styles.headerAvatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.headerAvatarPlaceholder,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <User size={20} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.headerTextContainer}>
                  <Text style={dynamicStyles.headerTitle} numberOfLines={1}>
                    {otherUser.full_name}
                  </Text>
                  {itemTitle && (
                    <Text
                      style={[
                        dynamicStyles.headerSubtitle,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      About: {itemTitle}
                    </Text>
                  )}
                </View>
              </View>
            )}
            {!otherUser && (
              <Text style={dynamicStyles.headerTitle}>
                {itemTitle || "Chat"}
              </Text>
            )}
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* Chat Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessageItem}
          inverted
          style={dynamicStyles.messageList}
        />

        {/* Handover Controls */}
        {conversationDetails && (
          <HandoverControls
            user={user}
            conversationDetails={conversationDetails}
            onCodeGenerated={(code) => {
              // Optionally send code as a system message
            }}
            dynamicStyles={dynamicStyles}
          />
        )}

        {/* Message Input */}
        <View style={dynamicStyles.inputContainer}>
          <TextInput
            style={dynamicStyles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
            style={[
              dynamicStyles.sendButton,
              (isSending || !newMessage.trim()) && styles.disabledButton,
            ]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageRow: {
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 4,
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  otherMessageRow: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    maxWidth: "80%",
  },
  myMessageText: {
    color: "#FFFFFF",
    fontSize: 15,
  },
  otherMessageText: {
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Handover Styles
  handoverContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  handoverButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  handoverButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  handoverTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  handoverCode: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginVertical: 10,
    letterSpacing: 5,
  },
  handoverSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
  },
  handoverError: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 8,
  },
});

export default ChatScreen;
