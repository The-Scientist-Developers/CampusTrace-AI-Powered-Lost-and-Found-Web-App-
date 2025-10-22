import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../../api/apiClient";
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
  Instagram,
  Twitter,
  Link2,
  Tag,
  Clock,
} from "lucide-react";

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

const apiClient = {
  async submitClaim(itemId, verificationMessage) {
    const token = await getAccessToken();
    const response = await fetch("http://localhost:8000/api/claims/create", {
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

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Helper function to parse contact info and generate links
const parseContactInfo = (contactInfo) => {
  if (!contactInfo) return [];

  const contacts = [];
  const info = contactInfo.toLowerCase();

  // Phone number patterns
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

  // Facebook
  if (info.includes("facebook") || info.includes("fb")) {
    const fbMatch = contactInfo.match(/(?:facebook|fb)[:\s]*([^\s,]+)/i);
    if (fbMatch) {
      contacts.push({
        type: "facebook",
        value: fbMatch[1],
        icon: Facebook,
        link: `https://facebook.com/${fbMatch[1]}`,
        label: "Facebook",
      });
    }
  }

  // Messenger
  if (info.includes("messenger")) {
    const messengerMatch = contactInfo.match(/messenger[:\s]*([^\s,]+)/i);
    if (messengerMatch) {
      contacts.push({
        type: "messenger",
        value: messengerMatch[1],
        icon: MessageCircle,
        link: `https://m.me/${messengerMatch[1]}`,
        label: "Messenger",
      });
    }
  }

  // Email
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

  // If no specific patterns matched, return the raw text
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
      console.error("Claim Submission Error:", {
        errorMessage: error.message,
        stack: error.stack,
        itemId: item.id,
        timestamp: new Date().toISOString(),
      });
      toast.error(`Submission failed: ${error.message}`, { id: toastId });
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
        className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">
            Claim Item: {item.title}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            To verify ownership, please describe a unique detail only you would
            know (e.g., a specific scratch, the lock screen image, an item
            inside the bag).
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={verificationMessage}
            onChange={(e) => setVerificationMessage(e.target.value)}
            className="form-textarea w-full dark:bg-[#1a1a1a] dark:border-neutral-700 dark:text-white rounded-lg"
            rows="5"
            placeholder="Enter your secret detail here..."
            required
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50 hover:bg-primary-700 transition-colors"
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

const ItemDetailsModal = ({ item, onClose, onClaim, user }) => {
  if (!item) return null;

  const posterName =
    item.profiles?.full_name ||
    (item.profiles?.email ? item.profiles.email.split("@")[0] : "Anonymous");

  const posterEmail = item.profiles?.email;
  const contactMethods = parseContactInfo(item.contact_info);

  const isFoundItem = item.status?.toLowerCase() === "found";
  const isMyOwnItem = item.profiles?.id === user?.id;
  const showClaimButton = isFoundItem && !isMyOwnItem;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#2a2a2a] border-b border-neutral-200 dark:border-[#3a3a3a] p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
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
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">
                {item.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Poster Profile Section */}
          <div className="bg-neutral-50 dark:bg-[#1a1a1a] rounded-xl p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                  Posted by
                </p>
                <p className="font-semibold text-neutral-800 dark:text-white">
                  {posterName}
                </p>
                {posterEmail && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {posterEmail}
                  </p>
                )}

                {/* Contact Methods */}
                {contactMethods.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {contactMethods.map((contact, index) => {
                      const Icon = contact.icon;
                      return contact.link ? (
                        <a
                          key={index}
                          href={contact.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                        >
                          <Icon className="w-4 h-4" />
                          {contact.label}
                        </a>
                      ) : (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-600 dark:text-neutral-400"
                        >
                          <Icon className="w-4 h-4" />
                          {contact.value}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Image Section */}
            <div className="w-full h-80 flex items-center justify-center bg-neutral-100 dark:bg-zinc-800 rounded-xl p-4">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <Camera className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-500 text-sm">No Image Available</p>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-[#1a1a1a] rounded-lg">
                <MapPin className="w-5 h-5 text-neutral-500" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Location
                  </p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {item.location || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-[#1a1a1a] rounded-lg">
                <Calendar className="w-5 h-5 text-neutral-500" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Date Posted
                  </p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-[#1a1a1a] rounded-lg">
                <Clock className="w-5 h-5 text-neutral-500" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Time Posted
                  </p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {new Date(item.created_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-neutral-50 dark:bg-[#1a1a1a] rounded-xl p-5 mb-6">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
              Description
            </p>
            <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {item.description || "No description provided."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {showClaimButton ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClaim(item);
                }}
                className="flex-1 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Claim This Item
              </button>
            ) : null}

            {posterEmail && !isMyOwnItem && (
              <a
                href={`mailto:${posterEmail}`}
                className="flex-1 px-6 py-3 bg-neutral-800 text-white font-semibold rounded-lg hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Email Poster
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ItemCard = ({ item, onClick }) => {
  const isLost = item.status?.toLowerCase() === "lost";
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + "...";
  };

  return (
    <div
      className="group bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
      onClick={() => onClick(item)}
    >
      <div className="relative w-full h-52 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-zinc-800 dark:to-zinc-900 p-3">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-12 h-12 text-neutral-300 dark:text-neutral-600" />
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${
              isLost
                ? "bg-red-100/90 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                : "bg-green-100/90 text-green-700 dark:bg-green-500/20 dark:text-green-400"
            }`}
          >
            {item.status}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {truncateText(item.title, 25)}
          </h3>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <MapPin className="w-3 h-3" />
            <span>{truncateText(item.location || "Unknown", 20)}</span>
          </div>
        </div>

        <p className="text-sm text-neutral-600 dark:text-gray-400 mb-3 line-clamp-2 flex-grow">
          {item.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {new Date(item.created_at).toLocaleDateString()}
          </span>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            {item.category}
          </span>
        </div>
      </div>
    </div>
  );
};

const FilterSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="border-b border-neutral-200 dark:border-[#3a3a3a] last:border-b-0 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left group"
      >
        <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {title}
        </h3>
        <ChevronDown
          className={`w-5 h-5 text-neutral-500 dark:text-gray-400 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 mt-4" : "max-h-0"
        }`}
      >
        <div className="space-y-2">{children}</div>
      </div>
    </div>
  );
};

const ItemCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <Skeleton height={208} />
      <div className="p-4 flex flex-col flex-grow">
        <Skeleton height={24} width="80%" />
        <Skeleton height={16} width="60%" className="mt-2" />
        <Skeleton count={2} className="mt-3" />
        <div className="mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex justify-between">
            <Skeleton width={80} height={16} />
            <Skeleton width={60} height={20} borderRadius={12} />
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const postsPerPage = 12;

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

  const fetchPosts = useCallback(
    async (isSearchReset = false) => {
      if (!user?.id) {
        setLoading(false);
        setError("User not available.");
        return;
      }
      setLoading(true);
      if (isSearchReset) {
        setSearchTerm("");
      }
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
        if (statusFilter !== "All") query = query.eq("status", statusFilter);
        if (categoryFilters.length > 0)
          query = query.in("category", categoryFilters);
        if (dateFilter) query = query.gte("created_at", dateFilter);
        if (debouncedSearchTerm)
          query = query.or(
            `title.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%,ai_tags.cs.{${debouncedSearchTerm}}`
          );
        const from = (currentPage - 1) * postsPerPage;
        const to = from + postsPerPage - 1;
        const isAscending = sortBy === "oldest";
        query = query
          .range(from, to)
          .order("created_at", { ascending: isAscending });
        const { data, error, count } = await query;
        if (error) throw error;
        setPosts(data || []);
        setTotalPosts(count || 0);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Failed to load posts.");
        toast.error("Failed to load posts.");
      } finally {
        setLoading(false);
      }
    },
    [
      user,
      debouncedSearchTerm,
      statusFilter,
      categoryFilters,
      dateFilter,
      sortBy,
      currentPage,
    ]
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  const handleImageSearch = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImageSearching(true);
    setLoading(true);
    setError(null);
    toast.loading("Analyzing image and searching...");

    const formData = new FormData();
    formData.append("image_file", file);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(
        "http://localhost:8000/api/items/image-search",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Image search failed.");
      }
      const results = await response.json();
      setPosts(results);
      setTotalPosts(results.length);
      setCurrentPage(1);
      toast.success(`Found ${results.length} potential matches!`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsImageSearching(false);
      setLoading(false);
      toast.dismiss();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCategoryChange = (category) => {
    setCategoryFilters((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a]">
      <div className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-800 dark:text-white mb-2">
            Browse All Items
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Find lost items or help return found items to their owners
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-neutral-800 dark:text-white mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary-600" />
                Filters
              </h2>

              <FilterSection title="Status">
                {["All", "Lost", "Found"].map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={statusFilter === status}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="form-radio text-primary-600 dark:bg-[#2a2a2a] dark:border-neutral-700"
                    />
                    <span className="text-sm font-medium">{status}</span>
                  </label>
                ))}
              </FilterSection>

              <FilterSection title="Category">
                {[
                  "Electronics",
                  "Documents",
                  "Clothing",
                  "Accessories",
                  "Other",
                ].map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={categoryFilters.includes(cat)}
                      onChange={() => handleCategoryChange(cat)}
                      className="form-checkbox text-primary-600 dark:bg-[#2a2a2a] dark:border-neutral-700"
                    />
                    <span className="text-sm font-medium">{cat}</span>
                  </label>
                ))}
              </FilterSection>

              <FilterSection title="Date Posted After">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="form-input w-full text-sm dark:bg-[#1a1a1a] dark:border-neutral-700 dark:text-white"
                />
              </FilterSection>

              <FilterSection title="Sort By">
                {[
                  { value: "newest", label: "Newest First" },
                  { value: "oldest", label: "Oldest First" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <input
                      type="radio"
                      name="sortBy"
                      value={option.value}
                      checked={sortBy === option.value}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="form-radio text-primary-600 dark:bg-[#2a2a2a] dark:border-neutral-700"
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </FilterSection>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search by text or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input w-full pl-12 pr-12 py-3 dark:bg-[#1a1a1a] dark:border-neutral-700 dark:text-white rounded-lg"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept="image/*"
                  onChange={handleImageSearch}
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={isImageSearching}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg disabled:opacity-50 transition-colors"
                  title="Search by image"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div>
                {isImageSearching && (
                  <div className="flex items-center gap-3 mb-6 p-4 bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                    <p className="text-primary-700 dark:text-primary-300 font-medium">
                      Analyzing image and finding visual matches...
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(postsPerPage)].map((_, i) => (
                    <ItemCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="text-center p-12 bg-white dark:bg-[#2a2a2a] rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center p-12 bg-white dark:bg-[#2a2a2a] rounded-xl border border-neutral-200 dark:border-[#3a3a3a]">
                <Camera className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                  No items found matching your criteria.
                </p>
                {(isImageSearching || debouncedSearchTerm) && (
                  <button
                    onClick={() => fetchPosts(true)}
                    className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
                  >
                    Reset Search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <ItemCard
                      key={post.id}
                      item={post}
                      onClick={setSelectedItem}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-8">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#2a2a2a] border border-neutral-300 dark:border-neutral-700 rounded-lg disabled:opacity-50 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors font-medium"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#2a2a2a] border border-neutral-300 dark:border-neutral-700 rounded-lg disabled:opacity-50 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors font-medium"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        <ItemDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onClaim={() => setIsClaiming(true)}
          user={user}
        />
        {isClaiming && selectedItem && (
          <ClaimModal
            item={selectedItem}
            onClose={() => setIsClaiming(false)}
            onSubmit={apiClient.submitClaim}
          />
        )}
      </div>
    </div>
  );
}
