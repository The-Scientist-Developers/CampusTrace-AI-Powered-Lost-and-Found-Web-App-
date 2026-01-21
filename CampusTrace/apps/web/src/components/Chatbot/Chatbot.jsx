import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  X,
  MessageCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { API_BASE_URL, supabase } from "../../api/apiClient";
import { useTheme } from "../../contexts/ThemeContext";

// Theme colors matching the logo - no gradients
const THEME_COLORS = {
  light: "#1877F2",
  dark: "#38bdf8",
};

const ChatMessage = ({ message, isBot, primaryColor }) => {
  return (
    <div className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: isBot ? primaryColor : "#10b981" }}
      >
        {isBot ? (
          <Bot className="w-4 h-4 text-white" />
        ) : (
          <User className="w-4 h-4 text-white" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isBot
            ? "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
            : "text-white"
        }`}
        style={!isBot ? { backgroundColor: primaryColor } : {}}
      >
        <p
          className={`text-sm leading-relaxed ${isBot ? "text-neutral-700 dark:text-neutral-200" : "text-white"}`}
        >
          {message.text}
        </p>
        {/* Show relevant items if any */}
        {isBot && message.items && message.items.length > 0 && (
          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-600">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
              Related Items:
            </p>
            <div className="space-y-2">
              {message.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
                >
                  {item.thumbnail_url && (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-800 dark:text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {item.status} • {item.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SuggestedQuestion = ({ question, onClick, primaryColor }) => (
  <button
    onClick={() => onClick(question)}
    className="px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
    style={{ color: primaryColor }}
  >
    {question}
  </button>
);

const Chatbot = () => {
  const { theme } = useTheme();
  const primaryColor = THEME_COLORS[theme] || THEME_COLORS.light;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your CampusTrace assistant. I can answer questions about how to use the platform. What would you like to know?",
      isBot: true,
      items: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const suggestedQuestions = [
    "How do I report a lost item?",
    "How do I claim an item?",
    "What is smart matching?",
    "How to contact finder?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isBot: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Update conversation history
    const newHistory = [
      ...conversationHistory,
      { role: "user", content: messageText },
    ];

    try {
      // Get token from Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/api/chatbot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageText,
          conversation_history: newHistory.slice(-6), // Last 6 messages
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        text: data.response,
        isBot: true,
        items: data.relevant_items || [],
      };

      setMessages((prev) => [...prev, botMessage]);
      setConversationHistory([
        ...newHistory,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Sorry, I encountered an error. Please try again.",
          isBot: true,
          items: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating Button - Solid color */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 ${
          isOpen ? "scale-0" : "scale-100"
        }`}
        style={{ backgroundColor: primaryColor }}
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-[380px] h-[550px] bg-neutral-50 dark:bg-neutral-900 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      >
        {/* Header - Solid color */}
        <div
          className="p-4 flex items-center justify-between"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">CampusTrace AI</h3>
              <p className="text-white/70 text-xs">Always here to help</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isBot={message.isBot}
              primaryColor={primaryColor}
            />
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    style={{ color: primaryColor }}
                  />
                  <span className="text-sm text-neutral-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              Try asking:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <SuggestedQuestion
                  key={idx}
                  question={q}
                  onClick={sendMessage}
                  primaryColor={primaryColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-neutral-200 dark:border-neutral-700"
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Chatbot;
