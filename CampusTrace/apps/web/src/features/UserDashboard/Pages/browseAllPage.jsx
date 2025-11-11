import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../api/apiClient";
import { API_BASE_URL } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Search,
  Camera,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Mail,
  X,
  ChevronDown,
  Send,
  MapPin,
  Calendar,
  User,
  MessageCircle,
  Phone,
  Facebook,
  Link2,
  Clock,
} from "lucide-react";

// ==================== Helper Functions ====================

const BRAND_COLOR = "#1877F2"; // Use your app's brand color

// Get Supabase access token
async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

// API client for claims
const apiClient = {
  async submitClaim(itemId, verificationMessage) {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}/api/claims/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        item_id: itemId,
        verification_message: verificationMessage,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to submit claim.");
    }
    return response.json();
  },
};

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Parse contact info helper
const parseContactInfo = (contactInfo) => {
  if (!contactInfo) return [];

  const contacts = [];
  const info = contactInfo.toLowerCase();

  const phonePattern = /(\+?\d{1,4}[\s-]?)?(\(?\d{1,4}\)?[\s-]?)?[\d\s-]{5,}/g;
  const phoneMatches = contactInfo.match(phonePattern);
  if (phoneMatches) {
    phoneMatches.forEach((phone) => {
      contacts.push({
        type: "phone",
        value: phone.trim(),
        icon: Phone,
        link: `tel:${phone.replace(/\D/g, "")}`,
        label: "Call",
      });
    });
  }

  if (info.includes("facebook") || info.includes("fb")) {
    const fbMatch = contactInfo.match(/(?:facebook|fb)[:\s]*([^\s,]+)/i);
    if (fbMatch) {
      contacts.push({
        type: "facebook",
        value: fbMatch[1],
        icon: Facebook,
        link: `https.facebook.com/${fbMatch[1]}`,
        label: "Facebook",
      });
    }
  }

  if (info.includes("messenger")) {
    const messengerMatch = contactInfo.match(/messenger[:\s]*([^\s,]+)/i);
    if (messengerMatch) {
      contacts.push({
        type: "messenger",
        value: messengerMatch[1],
        icon: MessageCircle,
        link: `https.m.me/${messengerMatch[1]}`,
        label: "Messenger",
      });
    }
  }

  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = contactInfo.match(emailPattern);
  if (emailMatches) {
    emailMatches.forEach((email) => {
      contacts.push({
        type: "email",
        value: email,
        icon: Mail,
        link: `mailto:${email}`,
        label: "Email",
      });
    });
  }

  if (contacts.length === 0 && contactInfo) {
    contacts.push({
      type: "text",
      value: contactInfo,
      icon: Link2,
      link: null,
      label: "Contact Info",
    });
  }

  return contacts;
};

// Format date helpers
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

// ==================== Component: Filters Modal ====================
const FiltersModal = ({ visible, onClose, filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const categories = [
    "Electronics",
    "Documents",
    "Clothing",
    "Accessories",
    "Other",
  ];

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({
      status: "All",
      categories: [],
      sortBy: "newest",
      dateFilter: "",
    });
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#2a2a2a] w-full max-h-[80vh] rounded-t-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-[#3a3a3a]">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-white">
            Filters
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Status Filter */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-neutral-800 dark:text-white mb-3">
              Status
            </h3>
            {["All", "Lost", "Found"].map((status) => (
              <label
                key={status}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                onClick={() => setLocalFilters({ ...localFilters, status })}
              >
                <input
                  type="radio"
                  name="status"
                  value={status}
                  checked={localFilters.status === status}
                  onChange={() => {}}
                  className="form-radio w-5 h-5 text-primary-600 dark:bg-neutral-700 dark:border-neutral-600"
                  style={{
                    backgroundColor:
                      localFilters.status === status ? BRAND_COLOR : "",
                  }}
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {status}
                </span>
              </label>
            ))}
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-neutral-800 dark:text-white mb-3">
              Categories
            </h3>
            {categories.map((category) => (
              <label
                key={category}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                onClick={() => {
                  const cats = localFilters.categories || [];
                  const newCats = cats.includes(category)
                    ? cats.filter((c) => c !== category)
                    : [...cats, category];
                  setLocalFilters({ ...localFilters, categories: newCats });
                }}
              >
                <input
                  type="checkbox"
                  checked={(localFilters.categories || []).includes(category)}
                  onChange={() => {}}
                  className="form-checkbox w-5 h-5 text-primary-600 dark:bg-neutral-700 dark:border-neutral-600 rounded"
                  style={{
                    backgroundColor: (localFilters.categories || []).includes(
                      category
                    )
                      ? BRAND_COLOR
                      : "",
                  }}
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {category}
                </span>
              </label>
            ))}
          </div>

          {/* Sort By */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-neutral-800 dark:text-white mb-3">
              Sort By
            </h3>
            {[
              { value: "newest", label: "Newest First" },
              { value: "oldest", label: "Oldest First" },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                onClick={() =>
                  setLocalFilters({ ...localFilters, sortBy: option.value })
                }
              >
                <input
                  type="radio"
                  name="sortBy"
                  value={option.value}
                  checked={localFilters.sortBy === option.value}
                  onChange={() => {}}
                  className="form-radio w-5 h-5 text-primary-600 dark:bg-neutral-700 dark:border-neutral-600"
                  style={{
                    backgroundColor:
                      localFilters.sortBy === option.value ? BRAND_COLOR : "",
                  }}
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center p-5 border-t border-neutral-200 dark:border-[#3a3a3a] gap-3">
          <button
            className="flex-1 px-4 py-3 text-sm font-medium text-center text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            className="flex-1 px-4 py-3 text-sm font-medium text-center text-white rounded-lg"
            style={{ backgroundColor: BRAND_COLOR }}
            onClick={handleApply}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== Component: Item Details Modal ====================
const ItemDetailsModal = ({ item, onClose, onClaim, user }) => {
  const navigate = useNavigate();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  if (!item) return null;

  const posterName =
    item.profiles?.full_name ||
    (item.profiles?.email ? item.profiles.email.split("@")[0] : "Anonymous");
  const contactMethods = parseContactInfo(item.contact_info);
  const isFoundItem = item.status?.toLowerCase() === "found";
  const isMyOwnItem = item.profiles?.id === user?.id;
  const showActionButtons = !isMyOwnItem;

  const handleStartConversation = async () => {
    setIsCreatingChat(true);
    const toastId = toast.loading("Opening chat...");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Authentication required.");

      const formData = new FormData();
      formData.append("item_id", item.id);

      const response = await fetch(`${API_BASE_URL}/api/conversations/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to start conversation.");
      }

      const { conversation_id } = await response.json();
      toast.dismiss(toastId);
      navigate(`/dashboard/messages/${conversation_id}`);
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleContactPress = (contact) => {
    if (contact.link) {
      window.open(contact.link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a1a] w-full h-full md:w-[900px] md:h-auto md:max-h-[92vh] md:rounded-2xl flex flex-col md:flex-row shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side - Image (Desktop) / Top (Mobile) */}
        <div className="w-full md:w-[55%] bg-neutral-100 dark:bg-zinc-900 flex items-center justify-center relative flex-shrink-0 h-[45vh] md:h-auto">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center">
              <Camera className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
              <p className="text-neutral-500 text-sm">No Image Available</p>
            </div>
          )}
          {/* Close button on image for desktop */}
          <button
            onClick={onClose}
            className="hidden md:block absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side - Details (Desktop) / Bottom (Mobile) */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 flex items-start justify-between p-5 border-b border-neutral-200 dark:border-[#3a3a3a]">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    item.status?.toLowerCase() === "lost"
                      ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                      : "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                  }`}
                >
                  {item.status}
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {item.category}
                </span>
              </div>
              <h2 className="text-xl font-bold text-neutral-800 dark:text-white">
                {item.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Poster Card */}
            <div className="p-5 border-b border-neutral-200 dark:border-[#3a3a3a]">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                    Posted by
                  </p>
                  <p className="font-semibold text-neutral-800 dark:text-white">
                    {posterName}
                  </p>
                  {item.profiles?.email && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                      {item.profiles.email}
                    </p>
                  )}
                </div>
              </div>
              {contactMethods.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {contactMethods.map((contact, index) => {
                    const Icon = contact.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleContactPress(contact)}
                        disabled={!contact.link}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50 transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        {contact.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Details and description */}
            <div className="p-5 space-y-4">
              {/* Details Grid */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      Location
                    </p>
                    <p className="font-medium text-neutral-800 dark:text-white">
                      {item.location || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      Date Posted
                    </p>
                    <p className="font-medium text-neutral-800 dark:text-white">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      Time Posted
                    </p>
                    <p className="font-medium text-neutral-800 dark:text-white">
                      {formatTime(item.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3 font-semibold">
                  Description
                </p>
                <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed text-sm">
                  {item.description || "No description provided."}
                </p>
              </div>

              {/* Action Buttons */}
              {showActionButtons && (
                <div className="space-y-3 pt-2">
                  {isFoundItem && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClaim(item);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md"
                      style={{ backgroundColor: BRAND_COLOR }}
                    >
                      <Send className="w-5 h-5" />
                      Claim This Item
                    </button>
                  )}
                  <button
                    onClick={handleStartConversation}
                    disabled={isCreatingChat}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-neutral-800 text-white font-semibold rounded-xl hover:bg-neutral-900 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 transition-colors disabled:opacity-50 shadow-md"
                  >
                    {isCreatingChat ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <MessageCircle className="w-5 h-5" />
                    )}
                    Message Poster
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Component: Claim Modal ====================
const ClaimModal = ({ item, onClose, onSubmit }) => {
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!verificationMessage.trim()) {
      toast.error("Please provide a verification detail.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting claim...");
    try {
      await onSubmit(item.id, verificationMessage);
      toast.success("Claim submitted! The finder has been notified.", {
        id: toastId,
      });
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to submit claim.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-2xl shadow-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">
          Claim Item: {item.title}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
          To verify ownership, please describe a unique detail only you would
          know.
        </p>
        <form onSubmit={handleSubmit}>
          <textarea
            value={verificationMessage}
            onChange={(e) => setVerificationMessage(e.target.value)}
            className="form-textarea w-full h-32 dark:bg-[#1a1a1a] dark:border-neutral-700 dark:text-white rounded-lg text-sm p-3"
            placeholder="Enter your secret detail here..."
            required
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: BRAND_COLOR }}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== Component: Marketplace Grid Item ====================
const MarketplaceItem = ({ item, onClick }) => {
  const isLost = item.status?.toLowerCase() === "lost";
  const statusColor = isLost ? "#EF4444" : "#10B981";
  const statusBgColor = isLost ? "#FEE2E2" : "#D1FAE5";
  const statusColorDark = isLost ? "#F87171" : "#34D399";
  const statusBgColorDark = isLost
    ? "rgba(239, 68, 68, 0.1)"
    : "rgba(16, 185, 129, 0.1)";

  return (
    <div
      className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md cursor-pointer"
      onClick={() => onClick(item)}
    >
      {/* Image - Fixed height on desktop like FB Marketplace */}
      <div className="w-full h-52 md:h-56 bg-neutral-100 dark:bg-zinc-800 relative flex-shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-10 h-10 md:w-8 md:h-8 text-neutral-300 dark:text-neutral-600" />
          </div>
        )}
        {/* Status Badge on Image */}
        <div
          className="absolute top-2 left-2 px-2 py-1 rounded-md"
          style={{
            backgroundColor: statusColor,
          }}
        >
          <span className="text-xs font-semibold text-white">
            {item.status}
          </span>
        </div>
      </div>

      {/* Content - Compact and fixed */}
      <div className="p-3 flex flex-col gap-1.5">
        <h3
          className="text-sm font-semibold text-neutral-800 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400"
          title={item.title}
        >
          {item.title}
        </h3>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 self-start">
          {item.category}
        </span>
        <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate" title={item.location}>
            {item.location || "Unknown"}
          </span>
        </div>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          {getTimeAgo(item.created_at)}
        </span>
      </div>
    </div>
  );
};

// ==================== Skeleton Loader ====================
const MarketplaceItemSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <Skeleton className="w-full !aspect-square" />
      <div className="p-3 flex flex-col flex-grow">
        <Skeleton height={20} width="80%" />
        <Skeleton height={18} width="50%" className="mt-2" />
        <Skeleton height={16} width="70%" className="mt-1" />
        <div className="mt-auto pt-2">
          <Skeleton width={60} height={16} />
        </div>
      </div>
    </div>
  );
};

// ==================== Main Component: BrowseAllPage ====================
export default function BrowseAllPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    status: "All",
    categories: [],
    sortBy: "newest",
    dateFilter: "",
  });

  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Check for item ID in location state (e.g., from a notification)
  useEffect(() => {
    const itemIdFromState = location.state?.itemId;
    if (itemIdFromState) {
      const fetchItem = async () => {
        const { data } = await supabase
          .from("items")
          .select(`*, profiles(id, full_name, email)`)
          .eq("id", itemIdFromState)
          .single();
        if (data) setSelectedItem(data);
      };
      fetchItem();
    }
  }, [location.state]);

  // Main data fetching function
  const fetchPosts = useCallback(
    async (isSearchReset = false, pageOverride = null) => {
      if (!user?.id) {
        setLoading(false);
        setError("User not available.");
        return;
      }
      setLoading(true);
      if (isSearchReset) setSearchTerm("");
      setError(null);
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("university_id")
          .eq("id", user.id)
          .single();
        if (!profile) throw new Error("Could not find user profile.");

        let query = supabase
          .from("items")
          .select(`*, profiles(id, full_name, email)`, { count: "exact" })
          .eq("university_id", profile.university_id)
          .eq("moderation_status", "approved");

        // Apply filters
        if (filters.status !== "All")
          query = query.eq("status", filters.status);
        if (filters.categories.length > 0)
          query = query.in("category", filters.categories);
        if (filters.dateFilter)
          query = query.gte("created_at", filters.dateFilter);
        if (debouncedSearchTerm)
          query = query.or(
            `title.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%,ai_tags.cs.{${debouncedSearchTerm}}`
          );

        // Pagination
        const page = pageOverride !== null ? pageOverride : currentPage;
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);

        // Sorting
        query = query.order("created_at", {
          ascending: filters.sortBy === "oldest",
        });

        const { data, error, count } = await query;
        if (error) throw error;
        setPosts(data || []);
        setTotalPosts(count || 0);
      } catch (err) {
        setError("Failed to load posts.");
        toast.error("Failed to load posts.");
      } finally {
        setLoading(false);
      }
    },
    [user, debouncedSearchTerm, filters, currentPage, itemsPerPage]
  );

  // Fetch posts when filters, search, user, or page changes
  useEffect(() => {
    if (!imagePreview) {
      fetchPosts();
    }
  }, [fetchPosts, imagePreview]);

  // Reset page to 1 when filters change (but not page itself)
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, debouncedSearchTerm, itemsPerPage]);

  const clearImageSearch = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSearchTerm("");
    setCurrentPage(1);
    fetchPosts(true, 1);
  };

  const handleImageSearch = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    setSearchTerm("");
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsImageSearching(true);
    setLoading(true); // Show loading skeleton

    const toastId = toast.loading("Searching for similar items...");

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Authentication required.");

      const formData = new FormData();
      formData.append("image_file", file);

      const response = await fetch(`${API_BASE_URL}/api/items/image-search`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Image search failed.");
      }

      const data = await response.json();
      const results = data.results || data || [];

      if (results.length === 0) {
        toast("No similar items found. Try a different image.", {
          id: toastId,
          icon: "🔍",
        });
        setPosts([]);
        setTotalPosts(0);
      } else {
        toast.success(`Found ${results.length} similar items!`, {
          id: toastId,
        });
        setPosts(results);
        setTotalPosts(results.length);
      }
      setCurrentPage(1);
    } catch (error) {
      toast.error(error.message || "Failed to search by image.", {
        id: toastId,
      });
      clearImageSearch(); // Revert to text search on error
    } finally {
      setIsImageSearching(false);
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Wrapper for filter changes to clear image search
  const handleFilterChange = (newFilters) => {
    if (imagePreview) {
      clearImageSearch();
    }
    setFilters(newFilters);
  };

  const totalPages = Math.ceil(totalPosts / itemsPerPage);
  const rowOptions = [10, 20, 40];

  const renderGrid = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(itemsPerPage)].map((_, i) => (
            <MarketplaceItemSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-12 bg-white dark:bg-[#2a2a2a] rounded-xl border border-neutral-200 dark:border-[#3a3a3a]">
          <p className="text-red-600">{error}</p>
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-20 px-4 bg-white dark:bg-[#2a2a2a] rounded-xl border border-neutral-200 dark:border-[#3a3a3a]">
          <div className="flex justify-center mb-4">
            {imagePreview ? (
              <Camera className="w-16 h-16 text-neutral-400 dark:text-neutral-500" />
            ) : (
              <Search className="w-16 h-16 text-neutral-400 dark:text-neutral-500" />
            )}
          </div>
          <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
            No items found
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            {searchTerm || imagePreview
              ? "Try different search criteria"
              : "Lost and found items will appear here"}
          </p>
          {(searchTerm || imagePreview) && (
            <button
              onClick={clearImageSearch}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
              style={{ backgroundColor: BRAND_COLOR }}
            >
              Clear Search
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {posts.map((post) => (
          <MarketplaceItem
            key={post.id}
            item={post}
            onClick={setSelectedItem}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a] pb-32">
      <div className="max-w-screen-xl mx-auto py-6 px-4">
        {/* Enhanced Search Bar */}
        <div className="sticky top-0 z-20 bg-neutral-50 dark:bg-[#1a1a1a] py-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 z-10" />
              <input
                type="text"
                placeholder={
                  imagePreview ? "Image search active" : "Search by text..."
                }
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (imagePreview) clearImageSearch();
                }}
                disabled={imagePreview}
                className="form-input w-full pl-10 pr-10 py-2.5 rounded-lg text-sm dark:bg-[#2a2a2a] dark:border-neutral-700 dark:text-white"
              />
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                onChange={handleImageSearch}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {isImageSearching ? (
                  <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
                ) : imagePreview ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={imagePreview}
                      alt="Search preview"
                      className="w-7 h-7 object-cover rounded-md border dark:border-neutral-700"
                    />
                    <button
                      onClick={clearImageSearch}
                      className="p-1"
                      title="Clear image search"
                    >
                      <X className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current.click()}
                    disabled={isImageSearching}
                    className="p-1 text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400"
                    title="Search by image"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="p-2.5 rounded-lg bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 relative"
            >
              <Filter className="w-5 h-5" />
              {(filters.categories?.length > 0 || filters.status !== "All") && (
                <span
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{ backgroundColor: BRAND_COLOR }}
                ></span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.status !== "All" || filters.categories?.length > 0) && (
          <div className="flex-nowrap overflow-x-auto whitespace-nowrap py-2 space-x-2">
            {filters.status !== "All" && (
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: BRAND_COLOR }}
                onClick={() =>
                  handleFilterChange({ ...filters, status: "All" })
                }
              >
                {filters.status}
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {filters.categories?.map((cat) => (
              <button
                key={cat}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: BRAND_COLOR }}
                onClick={() =>
                  handleFilterChange({
                    ...filters,
                    categories: filters.categories.filter((c) => c !== cat),
                  })
                }
              >
                {cat}
                <X className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        )}

        {/* Results count & Row options */}
        <div className="flex items-center justify-between py-3">
          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {imagePreview ? "Image search: " : ""}
            {totalPosts} item{totalPosts !== 1 ? "s" : ""} found
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Rows:
            </span>
            {rowOptions.map((opt) => (
              <button
                key={opt}
                className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  itemsPerPage === opt
                    ? "text-white"
                    : "text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                }`}
                style={
                  itemsPerPage === opt ? { backgroundColor: BRAND_COLOR } : {}
                }
                onClick={() => {
                  setItemsPerPage(opt);
                  setCurrentPage(1);
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="pb-4">{renderGrid()}</div>

        {/* Pagination Controls - Inline on desktop */}
        {totalPosts > itemsPerPage && !loading && (
          <div className="hidden md:flex items-center justify-center gap-2 py-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 rounded-b-lg">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md transition-colors"
              style={{
                backgroundColor:
                  currentPage === 1 ? "transparent" : "transparent",
              }}
            >
              <ChevronLeft
                className="w-5 h-5"
                style={{
                  color: currentPage === 1 ? "#A1A1AA" : BRAND_COLOR,
                }}
              />
            </button>

            <span className="text-sm font-medium text-neutral-900 dark:text-white mx-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md transition-colors"
              style={{
                backgroundColor:
                  currentPage === totalPages ? "transparent" : "transparent",
              }}
            >
              <ChevronRight
                className="w-5 h-5"
                style={{
                  color: currentPage === totalPages ? "#A1A1AA" : BRAND_COLOR,
                }}
              />
            </button>
          </div>
        )}
      </div>

      {/* Pagination Controls - Fixed at bottom on mobile only */}
      {totalPosts > itemsPerPage && !loading && (
        <div className="md:hidden fixed bottom-14 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 z-40">
          <div className="flex items-center justify-center gap-2 py-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md transition-colors"
              style={{
                backgroundColor:
                  currentPage === 1 ? "transparent" : "transparent",
              }}
            >
              <ChevronLeft
                className="w-5 h-5"
                style={{
                  color: currentPage === 1 ? "#A1A1AA" : BRAND_COLOR,
                }}
              />
            </button>

            <span className="text-sm font-medium text-neutral-900 dark:text-white mx-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md transition-colors"
              style={{
                backgroundColor:
                  currentPage === totalPages ? "transparent" : "transparent",
              }}
            >
              <ChevronRight
                className="w-5 h-5"
                style={{
                  color: currentPage === totalPages ? "#A1A1AA" : BRAND_COLOR,
                }}
              />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <FiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={handleFilterChange}
      />
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onClaim={() => setIsClaiming(true)}
          user={user}
        />
      )}
      {isClaiming && selectedItem && (
        <ClaimModal
          item={selectedItem}
          onClose={() => setIsClaiming(false)}
          onSubmit={apiClient.submitClaim}
        />
      )}
    </div>
  );
}
