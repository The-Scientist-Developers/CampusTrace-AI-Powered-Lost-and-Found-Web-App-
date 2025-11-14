import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { getSupabaseClient } from "@campustrace/core";
import { apiClient } from "../../utils/apiClient";
import { useRoute } from "@react-navigation/native";
import {
  KeyRound,
  Loader2,
  AlertCircle,
  Send,
  ArrowLeft,
} from "lucide-react-native";

// --- Handover Controls Component ---
const HandoverControls = ({ user, conversationDetails, onCodeGenerated }) => {
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
          styles.handoverContainer,
          { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
      >
        <Text style={styles.handoverTitle}>Your Handover Code:</Text>
        <Text style={styles.handoverCode}>{handoverCode}</Text>
        <Text style={styles.handoverSubtitle}>
          Show this 4-digit code to the finder to complete the handover.
        </Text>
      </View>
    );
  }

  if (handoverError) {
    return (
      <View
        style={[
          styles.handoverContainer,
          { backgroundColor: colors.error, borderColor: colors.error },
        ]}
      >
        <AlertCircle size={18} color="#FFFFFF" />
        <Text style={styles.handoverError}>{handoverError}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.handoverContainer, { borderColor: colors.border }]}>
      <TouchableOpacity
        onPress={handleStartHandover}
        disabled={codeLoading}
        style={[
          styles.handoverButton,
          { backgroundColor: colors.primary },
          codeLoading && styles.disabledButton,
        ]}
      >
        {codeLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <KeyRound size={18} color="#FFFFFF" />
        )}
        <Text style={styles.handoverButtonText}>
          Start Secure Handover (Get Code)
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

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [conversationDetails, setConversationDetails] = useState(null);
  const [isSending, setIsSending] = useState(false);

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
    return (
      <View
        style={[
          styles.messageRow,
          isMyMessage ? styles.myMessageRow : styles.otherMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.card },
          ]}
        >
          <Text
            style={
              isMyMessage
                ? styles.myMessageText
                : [styles.otherMessageText, { color: colors.text }]
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {itemTitle || "Chat"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Chat Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessageItem}
          inverted
          style={styles.messageList}
        />

        {/* Handover Controls */}
        {conversationDetails && (
          <HandoverControls
            user={user}
            conversationDetails={conversationDetails}
            onCodeGenerated={(code) => {
              // Optionally send code as a system message
            }}
          />
        )}

        {/* Message Input */}
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <TextInput
            style={[
              styles.textInput,
              { color: colors.text, borderColor: colors.border },
            ]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
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
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageRow: {
    marginVertical: 4,
    flexDirection: "row",
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  otherMessageRow: {
    justifyContent: "flex-start",
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
