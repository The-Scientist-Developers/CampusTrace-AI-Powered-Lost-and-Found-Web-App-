import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../api/apiClient";
import { useParams, useNavigate } from "react-router-dom";
import {
  Send,
  Loader2,
  ArrowLeft,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const MessagesPage = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { conversationId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
            id,
            item:items(id, title, image_url),
            finder:profiles!conversations_finder_id_fkey(id, full_name, avatar_url),
            claimant:profiles!conversations_claimant_id_fkey(id, full_name, avatar_url)
          `
        )
        .or(`finder_id.eq.${user.id},claimant_id.eq.${user.id}`);

      if (error) {
        toast.error("Failed to fetch conversations.");
        console.error(error);
      } else {
        setConversations(data);
      }
      setLoading(false);
    };

    fetchConversations();
  }, [user.id]);

  const selectedConvo = conversations.find(
    (c) => c.id.toString() === conversationId
  );

  // Filter conversations based on search
  const filteredConversations = conversations
    .filter((convo) => convo.finder && convo.claimant)
    .filter((convo) => {
      if (!searchQuery) return true;
      const otherUser =
        convo.finder.id === user.id ? convo.claimant : convo.finder;
      return (
        otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        convo.item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-neutral-50 dark:bg-[#0a0a0a]">
      {/* Sidebar with conversations */}
      <aside
        className={`w-full md:w-1/3 lg:w-96 bg-white dark:bg-[#1a1a1a] border-r border-neutral-200 dark:border-[#2a2a2a] flex flex-col ${
          conversationId && "hidden md:flex"
        }`}
      >
        <div className="p-4 border-b border-neutral-200 dark:border-[#2a2a2a] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Messages
            </h2>
            {filteredConversations.length > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 rounded-full">
                {filteredConversations.length}
              </span>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-10 py-2 bg-neutral-100 dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-lg text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {searchQuery ? "No conversations found" : "No messages yet"}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {filteredConversations.map((convo) => {
                const otherUser =
                  convo.finder.id === user.id ? convo.claimant : convo.finder;
                return (
                  <motion.div
                    key={convo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    whileHover={{ x: 4 }}
                    onClick={() => navigate(`/dashboard/messages/${convo.id}`)}
                    className={`p-4 flex gap-3 cursor-pointer border-b border-neutral-100 dark:border-[#2a2a2a] transition-all ${
                      convo.id.toString() === conversationId
                        ? "bg-primary-50 dark:bg-primary-500/10 border-l-4 border-l-primary-600"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    <img
                      src={
                        otherUser.avatar_url ||
                        `https://ui-avatars.com/api/?name=${otherUser.full_name}&background=6366f1&color=fff`
                      }
                      alt={otherUser.full_name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 dark:text-white truncate">
                        {otherUser.full_name}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                        Regarding: {convo.item.title}
                      </p>
                      {convo.item && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs">
                          <span className="text-lg">
                            {convo.item.status === "lost" ? "🔍" : "📦"}
                          </span>
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
                            {convo.item.status === "lost" ? "Lost" : "Found"}{" "}
                            Item
                          </span>
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </aside>

      {/* Main Chat Window */}
      <main
        className={`flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] ${
          !conversationId && "hidden md:flex"
        }`}
      >
        {conversationId && selectedConvo ? (
          <ChatWindow conversation={selectedConvo} user={user} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-500/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Select a conversation
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-sm">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

const ChatWindow = ({ conversation, user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (error) console.error("Error fetching messages:", error);
      else setMessages(data);
    };

    fetchMessages();
  }, [conversation.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages_${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((currentMessages) => [...currentMessages, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversation.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || sending) return;

    setSending(true);
    const messageToSend = newMessage;
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content: messageToSend,
    });

    if (error) {
      toast.error("Failed to send message.");
      setNewMessage(messageToSend);
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const otherUser =
    conversation.finder.id === user.id
      ? conversation.claimant
      : conversation.finder;

  // Format time helper
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <>
      <header className="px-4 py-3 border-b border-neutral-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/messages")}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <img
            src={
              otherUser.avatar_url ||
              `https://ui-avatars.com/api/?name=${otherUser.full_name}&background=6366f1&color=fff`
            }
            alt={otherUser.full_name}
            className="w-10 h-10 rounded-full object-cover"
          />

          <div className="flex-1">
            <p className="font-bold text-neutral-900 dark:text-white">
              {otherUser.full_name}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Regarding: {conversation.item.title}
            </p>
          </div>
        </div>

        {/* Item Info Bar */}
        <div className="mt-3 p-2 bg-primary-50 dark:bg-primary-500/10 rounded-lg flex items-center gap-2">
          <span className="text-lg">
            {conversation.item.status === "lost" ? "🔍" : "📦"}
          </span>
          <p className="text-sm font-medium text-primary-700 dark:text-primary-400">
            {conversation.item.status === "lost" ? "Lost" : "Found"} Item:{" "}
            {conversation.item.title}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-neutral-50 dark:bg-[#0a0a0a]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  msg.sender_id === user.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`group max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${
                    msg.sender_id === user.id
                      ? "bg-primary-600 text-white rounded-br-sm"
                      : "bg-white dark:bg-[#2a2a2a] text-neutral-900 dark:text-white rounded-bl-sm border border-neutral-200 dark:border-[#3a3a3a]"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender_id === user.id
                        ? "text-primary-100"
                        : "text-neutral-400 dark:text-neutral-500"
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 border-t border-neutral-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </footer>
    </>
  );
};

export default MessagesPage;
