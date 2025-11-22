import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, apiClient } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../../api/apiClient";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import {
  ImageIcon,
  Loader2,
  Trash2,
  Check,
  X,
  Send,
  Inbox,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Calendar,
  MapPin,
  User,
  MessageSquare,
  Camera,
  Eye,
  Tag,
  ShieldCheck,
  Copy,
  RotateCcw,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const localApiClient = {
  async getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  },
  async respondToClaim(claimId, approved) {
    const token = await this.getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/api/claims/${claimId}/respond`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to respond to claim.");
    }
    return response.json();
  },
  async markAsRecovered(itemId) {
    const token = await this.getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/api/items/${itemId}/recover`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to mark item as recovered.");
    }
    return response.json();
  },
};

const StatusBadge = ({ status }) => {
  let colorClass = "";
  let text = "";
  let Icon = null;

  switch (status?.toLowerCase()) {
    case "approved":
      colorClass =
        "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-800";
      text = "Active";
      Icon = CheckCircle;
      break;
    case "pending":
      colorClass =
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      text = "Under Review";
      Icon = Clock;
      break;
    case "rejected":
      colorClass =
        "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-800";
      text = "Rejected";
      Icon = XCircle;
      break;
    case "recovered":
      colorClass =
        "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      text = "Recovered";
      Icon = Package;
      break;
    case "pending handover":
      colorClass =
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800";
      text = "Pending Handover";
      Icon = AlertCircle;
      break;
    case "pending_return":
      colorClass =
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800";
      text = "Pending Return";
      Icon = AlertCircle;
      break;
    default:
      colorClass =
        "bg-neutral-100 text-neutral-700 dark:bg-neutral-500/10 dark:text-gray-400 border-neutral-200 dark:border-neutral-800";
      text = "Unknown";
      Icon = AlertCircle;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${colorClass}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {text}
    </span>
  );
};

const MyPostPreviewModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-[#2a2a2a] border-b border-neutral-200 dark:border-[#3a3a3a] p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
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
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-white break-words">
                {item.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Image */}
            <div className="w-full h-80 flex items-center justify-center bg-neutral-100 dark:bg-zinc-800 rounded-xl p-4 overflow-hidden">
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

            {/* Info Grid */}
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

          {/* AI Tags */}
          {item.ai_tags && item.ai_tags.length > 0 && (
            <div className="bg-neutral-50 dark:bg-[#1a1a1a] rounded-xl p-5 mb-6">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                AI Generated Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {item.ai_tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Moderation Status */}
          <div className="bg-neutral-50 dark:bg-[#1a1a1a] rounded-xl p-5">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
              Post Status
            </p>
            <StatusBadge status={item.moderation_status} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ClaimCard = ({ claim, onRespond, item, onStartHandover, navigate }) => {
  const isApproved = claim.status === "approved";
  const isPending = claim.status === "pending";

  return (
    <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-[#1a1a1a] dark:to-[#1f1f1f] rounded-xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-800 dark:text-white">
                {claim.claimant.full_name || claim.claimant.email}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Submitted {new Date(claim.created_at).toLocaleDateString()}
              </p>
              {isApproved && (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Approved
                </span>
              )}
            </div>
            {isPending && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => onRespond(claim.id, true)}
                  className="p-2 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-500/20 transition-colors group"
                  title="Approve Claim"
                >
                  <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={() => onRespond(claim.id, false)}
                  className="p-2 bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors group"
                  title="Reject Claim"
                >
                  <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            )}
          </div>
          <div className="mt-3 p-3 bg-white dark:bg-[#2a2a2a] rounded-lg border-l-4 border-primary-500">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Verification Details
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 italic">
              "{claim.verification_message}"
            </p>
          </div>
          {isApproved && item.status?.toLowerCase() === "pending handover" && (
            <button
              onClick={() =>
                navigate(`/dashboard/handover/${item.id}?role=finder`)
              }
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify Handover Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const PostCard = ({
  post,
  onDelete,
  onMarkRecovered,
  hasClaims,
  onClick,
  onStartHandover,
  onVerifyHandover,
}) => {
  const isLost = post.status?.toLowerCase() === "lost";
  const canRecover =
    post.status?.toLowerCase() === "pending handover" ||
    (post.status === "Lost" && post.moderation_status === "approved");
  const isPendingHandover = post.status?.toLowerCase() === "pending handover";
  const isPendingRecovery = post.status?.toLowerCase() === "pending recovery";
  const isFoundItem =
    post.status?.toLowerCase() === "found" || isPendingHandover;

  return (
    <div
      onClick={() => onClick(post)}
      className="group relative bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm overflow-visible flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
    >
      {/* Image section */}
      <div className="relative w-full h-52 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-zinc-800 dark:to-zinc-900 p-3 rounded-t-xl overflow-hidden">
        {/* Action buttons - positioned at top right of image */}
        <div className="absolute top-2 right-2 z-30 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(post);
            }}
            className="p-2 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-200 hover:scale-110 shadow-lg"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(post.id);
            }}
            className="p-2 bg-white/95 dark:bg-[#2a2a2a]/95 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-110 shadow-lg"
            title="Delete Post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {hasClaims && (
          <div className="absolute top-2 left-2 z-30 px-2.5 py-1 bg-primary-600 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
            <MessageSquare className="w-3.5 h-3.5" />
            Has Claims
          </div>
        )}

        {post.image_url ? (
          <LazyLoadImage
            src={post.image_url}
            alt={post.title}
            effect="blur"
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Camera className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-2" />
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              No Image
            </p>
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute bottom-2 right-2 z-20">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-md ${
              isLost
                ? "bg-red-100/90 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                : "bg-green-100/90 text-green-700 dark:bg-green-500/20 dark:text-green-400"
            }`}
          >
            {post.status}
          </span>
        </div>
      </div>

      {/* Content section */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-white truncate mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {post.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          <MapPin className="w-3 h-3" />
          <span className="truncate">
            {post.location || "Unknown location"}
          </span>
        </div>

        <p className="text-sm text-neutral-600 dark:text-gray-400 mb-3 line-clamp-2 flex-grow">
          {post.description}
        </p>

        {/* Footer */}
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(post.created_at).toLocaleDateString()}
            </span>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {post.category}
            </span>
          </div>

          <StatusBadge status={post.moderation_status} />

          {/* --- Handover / Recover Buttons --- */}
          {isPendingHandover && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVerifyHandover(post.id);
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg border-2 border-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify Handover Code
            </button>
          )}

          {isPendingRecovery && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartHandover(post.id);
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg border-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 text-sm font-semibold text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Generate Handover Code
            </button>
          )}

          {canRecover && !isPendingHandover && !isPendingRecovery && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRecovered(post.id);
              }}
              className="w-full mt-4 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
            >
              Mark as Recovered
            </button>
          )}
          {/* --- End Handover / Recover --- */}
        </div>
      </div>
    </div>
  );
};

const PostCardSkeleton = () => (
  <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
    <Skeleton height={208} />
    <div className="p-4 flex flex-col flex-grow">
      <Skeleton height={24} width="80%" />
      <Skeleton height={16} width="60%" className="mt-2" />
      <Skeleton count={2} className="mt-2" />
      <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex justify-between mb-3">
          <Skeleton width={80} height={16} />
          <Skeleton width={60} height={20} borderRadius={12} />
        </div>
        <Skeleton height={28} borderRadius={12} />
      </div>
    </div>
  </div>
);

const ClaimCardSkeleton = () => (
  <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-[#1a1a1a] dark:to-[#1f1f1f] rounded-xl p-5 border border-neutral-200 dark:border-neutral-700">
    <div className="flex items-start gap-4">
      <Skeleton circle width={48} height={48} />
      <div className="flex-1">
        <Skeleton height={20} width="40%" />
        <Skeleton height={16} width="30%" className="mt-1" />
        <div className="mt-3 p-3 bg-white dark:bg-[#2a2a2a] rounded-lg">
          <Skeleton count={2} />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton width={32} height={32} borderRadius={8} />
        <Skeleton width={32} height={32} borderRadius={8} />
      </div>
    </div>
  </div>
);

function MyPostsPage({ user }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [claims, setClaims] = useState({});
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("myPosts");
  const [postStatusFilter, setPostStatusFilter] = useState("active");
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [handoverCodes, setHandoverCodes] = useState({});
  const [generatingCode, setGeneratingCode] = useState({});

  const fetchClaims = async (foundItems) => {
    if (foundItems.length === 0) return;
    try {
      const token = await localApiClient.getAccessToken();
      const claimsPromises = foundItems.map((item) =>
        fetch(`${API_BASE_URL}/api/claims/item/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json())
      );
      const claimsResults = await Promise.all(claimsPromises);
      const newClaims = {};
      foundItems.forEach((item, index) => {
        newClaims[item.id] = claimsResults[index];
      });
      setClaims(newClaims);
    } catch (err) {
      console.error("Error fetching claims:", err);
      toast.error("Could not load incoming claims.");
    }
  };

  const fetchPosts = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setError("User not logged in or ID not available.");
      return;
    }
    setLoading(true);
    setError(null);

    // Fetch ALL posts without filtering - we'll filter on client side
    let query = supabase
      .from("items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    try {
      const { data, error } = await query;
      if (error) throw error;
      const fetchedPosts = data || [];
      setPosts(fetchedPosts); // Store ALL posts

      const foundItems = fetchedPosts.filter((p) => p.status === "Found");
      if (foundItems.length > 0) {
        await fetchClaims(foundItems);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts.");
      toast.error("Failed to load your posts.");
    } finally {
      setLoading(false);
    }
  }, [user]); // Removed postStatusFilter dependency - we fetch all posts now

  const fetchMyClaims = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("claims")
        .select("*, item:items(*)")
        .eq("claimant_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("📥 Fetched claims:", data);
      console.log("📊 Total claims:", data?.length || 0);

      // Keep all claims including recovered ones (they'll show recovered badge)
      console.log("📥 Fetched claims:", data);
      console.log("📊 Total claims:", data?.length || 0);

      setMyClaims(data || []);
    } catch (err) {
      console.error("❌ Error fetching my claims:", err);
      toast.error("Failed to load your claims.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "myPosts") {
      fetchPosts();
    } else if (activeTab === "myClaims") {
      fetchMyClaims();
    }
  }, [fetchPosts, fetchMyClaims, activeTab]);

  const handleDeletePost = async (postId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    )
      return;

    const toastId = toast.loading("Deleting post...");
    try {
      const { error } = await supabase.from("items").delete().eq("id", postId);
      if (error) throw error;
      toast.success("Post deleted successfully!", { id: toastId });
      setPosts((current) => current.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete post.", { id: toastId });
    }
  };

  const handleRespondToClaim = async (claimId, isApproved) => {
    const toastId = toast.loading(
      `${isApproved ? "Approving" : "Rejecting"} claim...`
    );
    try {
      await localApiClient.respondToClaim(claimId, isApproved);
      toast.success(`Claim has been ${isApproved ? "approved" : "rejected"}.`, {
        id: toastId,
      });
      fetchPosts(); // Refetch to update UI
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  const handleMarkAsRecovered = async (itemId) => {
    if (
      !window.confirm("Confirm that this item has been returned to its owner?")
    )
      return;

    const toastId = toast.loading("Marking as recovered...");
    try {
      await localApiClient.markAsRecovered(itemId);
      toast.success("Item marked as recovered!", { id: toastId });
      fetchPosts(); // Refetch to update UI
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  const handleStartHandover = (itemId) => {
    navigate(`/dashboard/handover/${itemId}?role=claimant`);
  };

  const handleVerifyHandover = (itemId) => {
    navigate(`/dashboard/handover/${itemId}?role=finder`);
  };

  const handleGenerateHandoverCode = async (itemId) => {
    setGeneratingCode((prev) => ({ ...prev, [itemId]: true }));
    const toastId = toast.loading("Generating handover code...");

    try {
      const token = await localApiClient.getAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/api/handover/items/${itemId}/start-handover`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate handover code");
      }

      const data = await response.json();
      setHandoverCodes((prev) => ({ ...prev, [itemId]: data.code }));

      toast.success(
        `Handover code generated: ${data.code}\n\nShow this code to the finder when you meet.`,
        { id: toastId, duration: 6000 }
      );
    } catch (error) {
      console.error("Error generating handover code:", error);
      toast.error(error.message || "Failed to generate handover code", {
        id: toastId,
      });
    } finally {
      setGeneratingCode((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleCancelClaim = async (claimId) => {
    const toastId = toast.loading("Canceling claim...");
    try {
      const token = await localApiClient.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/claims/${claimId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to cancel claim");
      }

      toast.success("Claim canceled successfully", { id: toastId });
      // Remove the claim from the list
      setMyClaims((prev) => prev.filter((c) => c.id !== claimId));
    } catch (error) {
      console.error("Error canceling claim:", error);
      toast.error(error.message || "Failed to cancel claim", { id: toastId });
    }
  };

  // Calculate stats from ALL posts (not filtered)
  // This ensures stats always show correct totals regardless of active filter
  const [allPosts, setAllPosts] = useState([]);

  // Store all posts separately for stats calculation
  useEffect(() => {
    if (activeTab === "myPosts" && posts.length > 0) {
      // When we fetch posts, store them for stats
      setAllPosts(posts);
    }
  }, [posts, activeTab]);

  // Calculate stats from all posts, not just filtered ones
  const statsSource = allPosts.length > 0 ? allPosts : posts;
  const activeCount = statsSource.filter(
    (p) =>
      (p.moderation_status === "approved" ||
        p.status?.toLowerCase() === "pending handover" ||
        p.status?.toLowerCase() === "pending recovery") &&
      p.status?.toLowerCase() !== "recovered"
  ).length;
  const pendingCount = statsSource.filter(
    (p) => p.moderation_status === "pending"
  ).length;
  const resolvedCount = statsSource.filter(
    (p) =>
      ["recovered", "rejected"].includes(p.moderation_status) ||
      p.status?.toLowerCase() === "recovered"
  ).length;
  const claimsCount = Object.values(claims).reduce(
    (acc, claimList) => acc + (claimList?.length || 0),
    0
  );
  const myClaimsCount = myClaims.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Skeleton height={40} width={200} className="mb-8" />

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} height={80} borderRadius={12} />
            ))}
          </div>

          {/* Tabs skeleton */}
          <Skeleton height={48} className="mb-6" />

          {/* Filter pills skeleton */}
          <Skeleton height={44} width={300} className="mb-6" />

          {/* Grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center p-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Active
                </p>
                <p className="text-2xl font-bold text-neutral-800 dark:text-white mt-1">
                  {activeCount}
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Pending
                </p>
                <p className="text-2xl font-bold text-neutral-800 dark:text-white mt-1">
                  {pendingCount}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Resolved
                </p>
                <p className="text-2xl font-bold text-neutral-800 dark:text-white mt-1">
                  {resolvedCount}
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Claims
                </p>
                <p className="text-2xl font-bold text-neutral-800 dark:text-white mt-1">
                  {claimsCount}
                </p>
              </div>
              <div className="p-2 bg-primary-100 dark:bg-primary-500/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab("myPosts")}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 rounded-tl-xl relative
                ${
                  activeTab === "myPosts"
                    ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                My Posts
              </span>
              {activeTab === "myPosts" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("myClaims")}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative
                ${
                  activeTab === "myClaims"
                    ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                My Claims
                {myClaimsCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                    {myClaimsCount}
                  </span>
                )}
              </span>
              {activeTab === "myClaims" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("claims")}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 rounded-tr-xl rounded-br-xl relative
                ${
                  activeTab === "claims"
                    ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
            >
              <span className="flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Received Claims
                {claimsCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                    {claimsCount}
                  </span>
                )}
              </span>
              {activeTab === "claims" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
              )}
            </button>
          </div>
        </div>

        {activeTab === "myPosts" ? (
          <>
            {/* Filter Pills */}
            <div className="inline-flex p-1 space-x-1 bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-lg mb-6">
              {[
                { value: "active", label: "Active", icon: CheckCircle },
                { value: "pending", label: "Pending", icon: Clock },
                { value: "resolved", label: "Resolved", icon: Package },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setPostStatusFilter(tab.value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2
                      ${
                        postStatusFilter === tab.value
                          ? "bg-primary-600 text-white shadow-sm"
                          : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Posts Grid */}
            {(() => {
              // Client-side filtering based on postStatusFilter
              const filteredPosts = posts.filter((p) => {
                if (postStatusFilter === "active") {
                  return (
                    (p.moderation_status === "approved" ||
                      p.status?.toLowerCase() === "pending handover" ||
                      p.status?.toLowerCase() === "pending recovery") &&
                    p.status?.toLowerCase() !== "recovered"
                  );
                } else if (postStatusFilter === "pending") {
                  return p.moderation_status === "pending";
                } else if (postStatusFilter === "resolved") {
                  return (
                    ["recovered", "rejected"].includes(p.moderation_status) ||
                    p.status?.toLowerCase() === "recovered"
                  );
                }
                return true;
              });

              return filteredPosts.length === 0 ? (
                <div className="text-center p-16 bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl">
                  <Inbox className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-500 dark:text-gray-400 text-lg font-medium mb-2">
                    No {postStatusFilter} posts
                  </p>
                  <p className="text-neutral-400 dark:text-neutral-500 text-sm">
                    Your {postStatusFilter} posts will appear here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onClick={setSelectedItem}
                      onDelete={handleDeletePost}
                      onMarkRecovered={handleMarkAsRecovered}
                      onStartHandover={handleStartHandover}
                      onVerifyHandover={handleVerifyHandover}
                      hasClaims={claims[post.id]?.length > 0}
                    />
                  ))}
                </div>
              );
            })()}
          </>
        ) : activeTab === "myClaims" ? (
          <>
            {myClaims.length === 0 ? (
              <div className="text-center p-16 bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl">
                <Send className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-500 dark:text-gray-400 text-lg font-medium mb-2">
                  No claims submitted
                </p>
                <p className="text-neutral-400 dark:text-neutral-500 text-sm">
                  Claims you make on found items will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="group relative bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    {/* Status badge overlay on image */}
                    <div className="absolute top-3 right-3 z-10">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${
                          claim.item?.status?.toLowerCase() === "recovered"
                            ? "bg-blue-100/90 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                            : claim.status === "approved"
                            ? "bg-green-100/90 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-800"
                            : claim.status === "rejected"
                            ? "bg-red-100/90 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-800"
                            : "bg-yellow-100/90 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                        }`}
                      >
                        {claim.item?.status?.toLowerCase() === "recovered" ? (
                          <>
                            <Package className="w-3.5 h-3.5" />
                            Recovered
                          </>
                        ) : (
                          <>
                            {claim.status === "approved" && (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            {claim.status === "rejected" && (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {claim.status === "pending" && (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            {claim.status.charAt(0).toUpperCase() +
                              claim.status.slice(1)}
                          </>
                        )}
                      </span>
                    </div>

                    {/* Image section */}
                    <div className="relative w-full h-52 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-zinc-800 dark:to-zinc-900 p-3">
                      {claim.item?.image_url ? (
                        <LazyLoadImage
                          src={claim.item.image_url}
                          alt={claim.item.title}
                          effect="blur"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <Camera className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-2" />
                          <p className="text-xs text-neutral-400 dark:text-neutral-500">
                            No Image
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Content section */}
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-neutral-800 dark:text-white truncate mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {claim.item?.title || "Unknown Item"}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {claim.item?.location || "Unknown location"}
                        </span>
                      </div>

                      <p className="text-sm text-neutral-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {claim.verification_message}
                      </p>

                      {/* Footer */}
                      <div className="mt-auto space-y-3">
                        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(claim.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {claim.item?.category || "N/A"}
                          </span>
                        </div>

                        {/* Action buttons */}
                        {claim.status === "pending" && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to cancel this claim?"
                                )
                              ) {
                                handleCancelClaim(claim.id);
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors font-medium border border-red-200 dark:border-red-800"
                          >
                            <X className="w-4 h-4" />
                            Cancel Claim
                          </button>
                        )}

                        {claim.status === "approved" &&
                          claim.item?.status?.toLowerCase() !== "recovered" && (
                            <>
                              {claim.item?.status?.toLowerCase() ===
                              "pending recovery" ? (
                                // Lost item: Finder (claimant) verifies code
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/dashboard/handover/${claim.item.id}?role=finder`
                                    )
                                  }
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                  Verify Handover Code
                                </button>
                              ) : (
                                // Found item: Claimant generates code
                                <button
                                  onClick={() =>
                                    handleGenerateHandoverCode(claim.item.id)
                                  }
                                  disabled={generatingCode[claim.item.id]}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                                >
                                  {generatingCode[claim.item.id] ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Generating...
                                    </>
                                  ) : handoverCodes[claim.item.id] ? (
                                    <>
                                      <Copy className="w-4 h-4" />
                                      Code: {handoverCodes[claim.item.id]}
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="w-4 h-4" />
                                      Generate Code
                                    </>
                                  )}
                                </button>
                              )}
                            </>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {posts
              .filter((p) => p.status === "Found" && claims[p.id]?.length > 0)
              .map((post) => (
                <div
                  key={`claim-item-${post.id}`}
                  className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="p-6 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:bg-gradient-to-r dark:from-[#2a2a2a] dark:to-[#2e2e2e] border-b border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-4">
                      {post.image_url ? (
                        <LazyLoadImage
                          src={post.image_url}
                          alt={post.title}
                          effect="blur"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                          <Camera className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {post.location || "N/A"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400">
                        {claims[post.id]?.length || 0} Claim
                        {claims[post.id]?.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {claims[post.id]?.map((claim) => (
                      <ClaimCard
                        key={claim.id}
                        claim={claim}
                        onRespond={handleRespondToClaim}
                        item={post}
                        onStartHandover={handleStartHandover}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedItem && (
        <MyPostPreviewModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

export default MyPostsPage;
