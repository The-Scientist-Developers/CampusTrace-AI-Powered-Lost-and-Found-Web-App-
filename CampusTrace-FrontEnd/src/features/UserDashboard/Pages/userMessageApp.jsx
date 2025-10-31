import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../api/apiClient";
import { API_BASE_URL } from "../../../api/apiClient";
import { useParams, useNavigate } from "react-router-dom";
import {
  Send,
  Loader2,
  ArrowLeft,
  MessageSquare,
  Search,
  X, // Keep X for search clear
  Trash2, // Import Trash icon
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { getAccessToken } from "../../../api/apiClient"; // Import helper

// --- Confirmation Modal Component ---
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const MessagesPage = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { conversationId } = useParams();
  const navigate = useNavigate();

  // State for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [convoToDelete, setConvoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete operation

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        // Added try...catch for better error isolation
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

        if (error) throw error; // Throw error to be caught below

        setConversations(data || []);
      } catch (error) {
        toast.error("Failed to fetch conversations.");
        console.error("Fetch Conversations Error:", error);
        setConversations([]); // Ensure empty array on error
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      // Only fetch if user ID exists
      fetchConversations();
    } else {
      console.warn("MessagesPage: User ID not available, skipping fetch.");
      setLoading(false); // Ensure loading stops if no user
      setConversations([]);
    }
  }, [user?.id]); // Depend only on user.id

  const selectedConvo = conversations.find(
    (c) => c.id.toString() === conversationId
  );

  // Filter conversations based on search
  const filteredConversations = conversations
    .filter((convo) => convo.finder && convo.claimant && convo.item) // Ensure item also exists
    .filter((convo) => {
      if (!searchQuery) return true;
      const otherUser =
        convo.finder.id === user.id ? convo.claimant : convo.finder;
      // Ensure properties exist before calling toLowerCase
      const nameMatch = otherUser.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const itemMatch = convo.item.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      return nameMatch || itemMatch;
    });

  const handleDeleteClick = (convo, event) => {
    event.stopPropagation(); // Prevent navigating to the convo
    setConvoToDelete(convo);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!convoToDelete) return;
    setIsDeleting(true); // Set deleting state for modal button
    const toastId = toast.loading("Deleting conversation...");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Authentication required.");

      // Make DELETE request to backend
      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${convoToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to delete conversation.");
      }

      toast.success("Conversation deleted.", { id: toastId });
      // Remove conversation from state visually
      setConversations((prev) => prev.filter((c) => c.id !== convoToDelete.id));
      // If the currently viewed conversation was deleted, navigate back to the main messages page
      if (conversationId === convoToDelete.id.toString()) {
        navigate("/dashboard/messages", { replace: true }); // Use replace to avoid history entry
      }
      setShowConfirmModal(false); // Close modal on success
      setConvoToDelete(null); // Clear convo to delete
    } catch (error) {
      toast.error(error.message, { id: toastId });
      console.error("Delete error:", error);
      setShowConfirmModal(false); // Close modal on error too
      setConvoToDelete(null);
    } finally {
      setIsDeleting(false); // Reset deleting state
    }
  };

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
              {" "}
              {/* Keep AnimatePresence for add/remove animations */}
              {filteredConversations.map((convo) => {
                // Defensive check for otherUser existence
                const otherUser =
                  convo.finder?.id === user.id ? convo.claimant : convo.finder;
                if (!otherUser) return null; // Skip rendering if other user data is missing

                return (
                  <motion.div
                    key={convo.id}
                    layout // Add layout animation for smoother removal
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }} // Animate height out
                    transition={{ duration: 0.2 }}
                    whileHover={{ x: 4 }}
                    onClick={() => navigate(`/dashboard/messages/${convo.id}`)}
                    className={`flex items-center p-4 gap-3 cursor-pointer border-b border-neutral-100 dark:border-[#2a2a2a] transition-all relative group ${
                      // Keep relative and group
                      convo.id.toString() === conversationId
                        ? "bg-primary-50 dark:bg-primary-500/10 border-l-4 border-l-primary-600"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    <img
                      src={
                        otherUser.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          otherUser.full_name || "?"
                        )}&background=6366f1&color=fff` // Handle potentially missing name
                      }
                      alt={otherUser.full_name || "User"}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 pr-10">
                      {" "}
                      {/* Added pr-10 to prevent overlap with delete button */}
                      <p className="font-semibold text-neutral-900 dark:text-white truncate">
                        {otherUser.full_name || "Unknown User"}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                        Regarding: {convo.item?.title || "Unknown Item"}{" "}
                        {/* Defensive check */}
                      </p>
                      {convo.item?.status && ( // Defensive check
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
                    {/* Delete Button - Positioned absolutely but always visible */}
                    <button
                      onClick={(e) => handleDeleteClick(convo, e)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 p-2 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex-shrink-0" // Removed opacity classes
                      title="Delete Conversation"
                      aria-label="Delete Conversation"
                      disabled={isDeleting && convoToDelete?.id === convo.id} // Disable button during its own deletion
                    >
                      {isDeleting && convoToDelete?.id === convo.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
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
          // Placeholder when no conversation is selected
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-500/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Select a conversation
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-sm">
              Choose a conversation from the list to start messaging or view
              past chats.
            </p>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Delete Conversation?"
        message={`Are you sure you want to delete this conversation${
          convoToDelete?.item?.title
            ? ` regarding "${convoToDelete.item.title}"`
            : ""
        }? This also removes all messages. This action cannot be undone.`} // Updated message
        isDeleting={isDeleting} // Pass deleting state
      />
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

  // Add null check for user prop
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-2 text-neutral-500 dark:text-neutral-400">
          Loading user...
        </span>
      </div>
    );
  }

  // Defensive check for conversation structure
  if (
    !conversation ||
    !conversation.finder ||
    !conversation.claimant ||
    !conversation.item
  ) {
    console.error(
      "ChatWindow: Invalid conversation prop received:",
      conversation
    );
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-red-500">
        Error: Could not load conversation details.
      </div>
    );
  }

  useEffect(() => {
    const fetchMessages = async () => {
      setMessages([]); // Clear messages initially
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []); // Ensure data is an array
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages.");
      }
    };

    fetchMessages();
  }, [conversation.id]); // Refetch messages when conversation ID changes

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
          // Ensure payload.new exists before adding
          if (payload.new) {
            setMessages((currentMessages) => [...currentMessages, payload.new]);
          }
        }
      )
      .subscribe((status, err) => {
        // Add error handling for subscription
        if (err) {
          console.error(
            `Subscription error for messages_${conversation.id}:`,
            err
          );
          toast.error("Real-time connection error.");
        } else {
          console.log(
            `Subscribed to messages_${conversation.id} status: ${status}`
          );
        }
      });

    // Cleanup function
    return () => {
      console.log(`Unsubscribing from messages_${conversation.id}`);
      supabase
        .removeChannel(channel)
        .catch((err) => console.error("Error removing channel:", err));
    };
  }, [conversation.id]); // Re-subscribe if conversation ID changes

  useEffect(() => {
    // Scroll to bottom when messages change or component mounts with messages
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || sending) return;

    setSending(true);
    const messageToSend = newMessage;
    setNewMessage(""); // Clear input optimistically

    try {
      // Wrap in try...catch
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content: messageToSend,
      });

      if (error) throw error; // Throw error to be caught below
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message.");
      setNewMessage(messageToSend); // Restore message on failure
    } finally {
      setSending(false);
      inputRef.current?.focus(); // Refocus input
    }
  };

  const otherUser =
    conversation.finder?.id === user.id // Defensive checks
      ? conversation.claimant
      : conversation.finder;

  // Handle case where other user might be null (though filtered earlier)
  if (!otherUser)
    return (
      <div className="p-4 text-center text-neutral-500">
        Could not identify the other user.
      </div>
    );

  // Format time helper
  const formatTime = (timestamp) => {
    if (!timestamp) return ""; // Handle null timestamp
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // Use 24-hour format for consistency
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return "--:--"; // Fallback
    }
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
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                otherUser.full_name || "?"
              )}&background=6366f1&color=fff`
            }
            alt={otherUser.full_name || "User"}
            className="w-10 h-10 rounded-full object-cover"
          />

          <div className="flex-1 min-w-0">
            <p className="font-bold text-neutral-900 dark:text-white truncate">
              {otherUser.full_name || "Unknown User"}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              Regarding: {conversation.item?.title || "Unknown Item"}
            </p>
          </div>
        </div>

        {/* Item Info Bar */}
        {conversation.item?.status && ( // Check if item status exists
          <div className="mt-3 p-2 bg-primary-50 dark:bg-primary-500/10 rounded-lg flex items-center gap-2">
            <span className="text-lg">
              {conversation.item.status === "lost" ? "🔍" : "📦"}
            </span>
            <p className="text-sm font-medium text-primary-700 dark:text-primary-400 truncate">
              {conversation.item.status === "lost" ? "Lost" : "Found"} Item:{" "}
              {conversation.item.title || "Unknown Item"}
            </p>
          </div>
        )}
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
                layout // Add layout animation
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`flex ${
                  msg.sender_id === user.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`group max-w-[80%] sm:max-w-[70%] lg:max-w-[60%] px-4 py-2.5 rounded-2xl shadow-sm ${
                    // Added shadow-sm
                    msg.sender_id === user.id
                      ? "bg-primary-600 text-white rounded-br-lg" // Adjusted rounding
                      : "bg-white dark:bg-[#2a2a2a] text-neutral-900 dark:text-white rounded-bl-lg border border-neutral-200 dark:border-[#3a3a3a]" // Adjusted rounding
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <p
                    className={`text-[11px] mt-1.5 text-right ${
                      // Smaller timestamp, aligned right
                      msg.sender_id === user.id
                        ? "text-primary-100/80" // Slightly faded timestamp
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
        <div ref={messagesEndRef} /> {/* For scrolling */}
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
            aria-label="Message input"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
            aria-label="Send message"
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
