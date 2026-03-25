import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Image,
  Keyboard,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Send,
  Sparkles,
  Bot,
  User,
  Zap,
} from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { apiClient, API_BASE_URL } from "../../utils/apiClient";
import { getSupabaseClient } from "@campustrace/core";

const BRAND_COLOR = "#1877F2";

const SUGGESTED_QUESTIONS = [
  "How do I report a lost item?",
  "How do I claim an item?",
  "What is smart AI matching?",
  "How do I contact the finder?",
];

// ─── Bot Bubble ──────────────────────────────────────────────────────────────
const BotBubble = ({ message, colors }) => (
  <View style={styles.botRow}>
    <LinearGradient
      colors={["#6366F1", "#A855F7"]}
      style={styles.botAvatar}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Bot size={16} color="white" />
    </LinearGradient>

    <View style={{ flex: 1 }}>
      <View
        style={[
          styles.botBubble,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.bubbleText, { color: colors.text }]}>
          {message.text}
        </Text>

        {/* Relevant items */}
        {message.items && message.items.length > 0 && (
          <View
            style={[styles.itemsContainer, { borderTopColor: colors.border }]}
          >
            <Text style={[styles.itemsLabel, { color: colors.textSecondary }]}>
              Related Items:
            </Text>
            {message.items.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.relatedItem,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                {item.thumbnail_url ? (
                  <Image
                    source={{ uri: item.thumbnail_url }}
                    style={styles.relatedItemImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.relatedItemImagePlaceholder,
                      { backgroundColor: colors.border },
                    ]}
                  />
                )}
                <View style={styles.relatedItemInfo}>
                  <Text
                    style={[styles.relatedItemTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.relatedItemMeta,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.status} • {item.category}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  </View>
);

// ─── User Bubble ─────────────────────────────────────────────────────────────
const UserBubble = ({ message }) => (
  <View style={styles.userRow}>
    <LinearGradient
      colors={[BRAND_COLOR, "#4F46E5"]}
      style={styles.userBubble}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.userBubbleText}>{message.text}</Text>
    </LinearGradient>
    <View style={[styles.userAvatar, { backgroundColor: "#10B981" }]}>
      <User size={16} color="white" />
    </View>
  </View>
);

// ─── Typing Indicator ────────────────────────────────────────────────────────
const TypingIndicator = ({ colors }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ).start();

    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);
  }, []);

  return (
    <View style={styles.botRow}>
      <LinearGradient
        colors={["#6366F1", "#A855F7"]}
        style={styles.botAvatar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Bot size={16} color="white" />
      </LinearGradient>
      <View
        style={[
          styles.botBubble,
          styles.typingBubble,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.typingDot,
              {
                backgroundColor: colors.textSecondary,
                transform: [{ translateY: dot }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// ─── Suggested Question Chip ─────────────────────────────────────────────────
const SuggestedChip = ({ question, onPress, colors }) => (
  <TouchableOpacity
    style={[
      styles.chip,
      { backgroundColor: colors.card, borderColor: BRAND_COLOR + "40" },
    ]}
    onPress={() => onPress(question)}
    activeOpacity={0.7}
  >
    <Zap size={12} color={BRAND_COLOR} />
    <Text style={[styles.chipText, { color: BRAND_COLOR }]}>{question}</Text>
  </TouchableOpacity>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ChatbotScreen({ navigation }) {
  const { colors } = useTheme();

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: "Hi! I'm your CampusTrace AI assistant. I can help you with questions about lost & found, how to claim items, or anything about the platform. What would you like to know?",
      isBot: true,
      items: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const flatListRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useCallback(
    async (text) => {
      const messageText = (text || input).trim();
      if (!messageText || isLoading) return;

      Keyboard.dismiss();
      setInput("");

      const userMsg = {
        id: Date.now().toString(),
        text: messageText,
        isBot: false,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const newHistory = [
        ...conversationHistory,
        { role: "user", content: messageText },
      ];

      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) throw new Error("Not authenticated");

        const response = await fetch(`${API_BASE_URL}/api/chatbot/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: messageText,
            conversation_history: newHistory.slice(-6),
          }),
        });

        if (!response.ok) throw new Error("Failed to get response");

        const data = await response.json();

        const botMsg = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          isBot: true,
          items: data.relevant_items || [],
        };

        setMessages((prev) => [...prev, botMsg]);
        setConversationHistory([
          ...newHistory,
          { role: "assistant", content: data.response },
        ]);
      } catch (error) {
        console.error("Chatbot error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: "Sorry, I encountered an error. Please check your connection and try again.",
            isBot: true,
            items: [],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, conversationHistory],
  );

  const renderItem = useCallback(
    ({ item }) =>
      item.isBot ? (
        <BotBubble message={item} colors={colors} />
      ) : (
        <UserBubble message={item} />
      ),
    [colors],
  );

  const showSuggestions = messages.length <= 1;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#A855F7"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.headerIconContainer}>
            <Sparkles size={20} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>CampusTrace AI</Text>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Always here to help</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isLoading ? <TypingIndicator colors={colors} /> : null
          }
        />

        {/* Suggested Questions */}
        {showSuggestions && (
          <View style={styles.suggestionsContainer}>
            <Text
              style={[styles.suggestionsLabel, { color: colors.textSecondary }]}
            >
              Try asking:
            </Text>
            <View style={styles.chipsRow}>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <SuggestedChip
                  key={idx}
                  question={q}
                  onPress={sendMessage}
                  colors={colors}
                />
              ))}
            </View>
          </View>
        )}

        {/* Input Bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { opacity: !input.trim() || isLoading ? 0.4 : 1 },
            ]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#6366F1", "#A855F7"]}
              style={styles.sendGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Send size={18} color="white" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  onlineText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
  },

  // Messages list
  messagesList: {
    padding: 16,
    paddingBottom: 8,
    gap: 16,
  },

  // Bot bubble
  botRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 12,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  botBubble: {
    flex: 1,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    maxWidth: "85%",
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // User bubble
  userRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 12,
  },
  userBubble: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: "75%",
  },
  userBubbleText: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Typing indicator
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // Related items in bot message
  itemsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  itemsLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  relatedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  relatedItemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  relatedItemImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  relatedItemInfo: {
    flex: 1,
  },
  relatedItemTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  relatedItemMeta: {
    fontSize: 11,
    marginTop: 2,
  },

  // Suggestions
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  suggestionsLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 8 : 12,
    borderTopWidth: 0.5,
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendButton: {
    flexShrink: 0,
  },
  sendGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
