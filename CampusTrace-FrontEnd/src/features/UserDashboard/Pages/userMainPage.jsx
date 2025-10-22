import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  EyeOff,
  Plus,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase, getAccessToken } from "../../../api/apiClient.js";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// --- (Existing Components: StatusBadge, Skeletons - no changes needed) ---

const StatusBadge = ({ status }) => {
  let colorClass = "";
  let text = "";

  switch (status?.toLowerCase()) {
    case "approved":
      colorClass =
        "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
      text = "Active";
      break;
    case "pending":
      colorClass =
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400";
      text = "Pending";
      break;
    case "rejected":
      colorClass =
        "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400";
      text = "Rejected";
      break;
    case "recovered":
      colorClass =
        "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
      text = "Recovered";
      break;
    case "pending_return":
      colorClass =
        "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400";
      text = "Pending Return";
      break;
    default:
      colorClass =
        "bg-neutral-100 text-neutral-800 dark:bg-zinc-500/20 dark:text-gray-400";
      text = "Unknown";
  }

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {text}
    </span>
  );
};

const MatchCardSkeleton = () => (
  <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-lg p-4">
    <Skeleton height={128} className="rounded-md" />
    <Skeleton height={24} width="80%" className="mt-4" />
    <Skeleton height={22} width="30%" className="mt-2" />
  </div>
);

const ActivityItemSkeleton = () => (
  <div className="flex items-center gap-4 py-3">
    <Skeleton width={48} height={48} className="rounded-md flex-shrink-0" />
    <div className="flex-grow min-w-0">
      <Skeleton height={20} width="70%" />
      <Skeleton height={16} width="50%" className="mt-1.5" />
    </div>
    <Skeleton width={20} height={20} />
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-12">
    <section>
      <Skeleton height={28} width={400} className="mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </section>
    <section>
      <Skeleton height={28} width={250} className="mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </section>
    <section>
      <Skeleton height={28} width={300} className="mb-4" />
      <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-lg p-4 divide-y divide-neutral-200 dark:divide-[#3a3a3a]">
        {[...Array(5)].map((_, i) => (
          <ActivityItemSkeleton key={i} />
        ))}
      </div>
    </section>
  </div>
);

export default function UserMainPage({ user }) {
  const [myRecentPosts, setMyRecentPosts] = useState([]);
  const [communityActivity, setCommunityActivity] = useState([]);
  const [possibleMatches, setPossibleMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- NEW: Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("university_id")
          .eq("id", user.id)
          .single();
        if (profileError || !profile)
          throw new Error("Could not find user profile.");
        const userUniversityId = profile.university_id;

        const [myPostsRes, communityActivityRes] = await Promise.all([
          supabase
            .from("items")
            .select("*")
            .eq("user_id", user.id)
            .not("moderation_status", "eq", "recovered")
            .order("created_at", { ascending: false })
            .limit(4), // Show 4 of my recent posts
          supabase
            .from("items")
            .select("*, profiles(id, full_name, email)", { count: "exact" }) // Fetch total count
            .eq("university_id", userUniversityId)
            .eq("moderation_status", "approved")
            .order("created_at", { ascending: false }),
        ]);

        if (myPostsRes.error) throw myPostsRes.error;
        if (communityActivityRes.error) throw communityActivityRes.error;

        setMyRecentPosts(myPostsRes.data || []);
        setCommunityActivity(communityActivityRes.data || []);

        const latestLostItem = (myPostsRes.data || []).find(
          (item) => item.status === "Lost"
        );
        if (latestLostItem) {
          const token = await getAccessToken();
          if (!token) throw new Error("Not authenticated to find matches.");

          const response = await fetch(
            `http://localhost:8000/api/items/find-matches/${latestLostItem.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!response.ok) {
            throw new Error("Failed to fetch matches from backend.");
          }
          const matches = await response.json();
          setPossibleMatches(matches);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // --- NEW: Pagination Logic ---
  const totalItems = communityActivity.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedActivity = communityActivity.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <DashboardSkeleton />;
  }
  if (error)
    return (
      <div className="text-center text-red-500">
        Failed to load dashboard data: {error}
      </div>
    );

  return (
    <div className="space-y-12">
      {/* Possible Matches Section */}
      <section>
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">
          Possible Matches For Your Latest Lost Item
        </h2>
        {possibleMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {possibleMatches.map((item) => (
              <MatchCard key={`match-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={HelpCircle}
            title="No High-Confidence Matches Found"
            description="Post a 'Lost' item, and our system will search for matches for you."
          />
        )}
      </section>

      {/* My Recent Posts Section */}
      <section>
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">
          My Recent Posts
        </h2>
        {myRecentPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myRecentPosts.map((item) => (
              <MatchCard
                key={`my-post-${item.id}`}
                item={item}
                showScore={false}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={EyeOff}
            title="You Haven't Posted Any Items Yet"
            description="Post a lost or found item to see it here."
            buttonText="Post a New Item"
            onButtonClick={() => navigate("/dashboard/post-new")}
          />
        )}
      </section>

      {/* Recent Community Activity Section - UPDATED */}
      <section>
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">
          Recent Community Activity
        </h2>
        {communityActivity.length > 0 ? (
          <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm">
            <div className="divide-y divide-neutral-200 dark:divide-[#3a3a3a]">
              {paginatedActivity.map((item) => (
                <ActivityItem key={`activity-${item.id}`} item={item} />
              ))}
            </div>
            {/* --- NEW: Pagination Controls --- */}
            <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-neutral-200 dark:border-[#3a3a3a]">
              <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <span>Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page
                  }}
                  className="form-select text-sm py-1 pl-2 pr-8 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#2a2a2a]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md disabled:opacity-50 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md disabled:opacity-50 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-neutral-500 p-8 bg-white dark:bg-[#2a2a2a]/50 rounded-lg border border-neutral-200 dark:border-[#3a3a3a]">
            No community activity to show.
          </div>
        )}
      </section>
    </div>
  );
}

// --- (Existing Components: timeAgo, MatchCard, ActivityItem, EmptyState - no changes needed) ---
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)} years ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)} days ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)} hours ago`;
  return `${Math.floor(seconds / 60)} minutes ago`;
};

const MatchCard = ({ item, showScore = true }) => {
  const isLost = item.status === "Lost";
  const statusBadgeClass = isLost
    ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
    : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400";

  return (
    <Link
      to="/dashboard/browse-all"
      state={{ itemId: item.id }}
      className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-lg p-4 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer group flex flex-col"
    >
      {showScore && item.match_score && (
        <div className="absolute top-2 left-2 z-10 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          {item.match_score}% Match
        </div>
      )}
      <div className="w-full h-32 bg-neutral-100 dark:bg-[#2a2a2a] rounded-md mb-4 flex items-center justify-center relative overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <p className="text-neutral-500 text-sm">No Image</p>
        )}
      </div>
      <div className="flex-grow">
        <h3 className="font-semibold text-neutral-800 dark:text-white truncate">
          {item.title}
        </h3>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full inline-block ${statusBadgeClass}`}
        >
          {item.status}
        </span>
        {item.moderation_status && (
          <StatusBadge status={item.moderation_status} />
        )}
      </div>
    </Link>
  );
};

const ActivityItem = ({ item }) => {
  const statusBadgeClass =
    item.status === "Lost"
      ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
      : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400";
  return (
    <Link
      to="/dashboard/browse-all"
      state={{ itemId: item.id }}
      className="flex items-center gap-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 -mx-4 px-4 rounded-lg transition-colors"
    >
      <div className="w-12 h-12 bg-neutral-100 dark:bg-[#2a2a2a] rounded-md flex-shrink-0 relative overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-neutral-500 flex items-center justify-center h-full">
            {item.category}
          </span>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-medium text-neutral-800 dark:text-white truncate">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadgeClass}`}
          >
            {item.status}
          </span>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {timeAgo(item.created_at)}
          </p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
    </Link>
  );
};

const EmptyState = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
}) => (
  <div className="text-center bg-white dark:bg-[#2a2a2a]/50 border border-neutral-200 dark:border-[#3a3a3a] rounded-lg p-12">
    <Icon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
    <h3 className="mt-4 text-lg font-semibold text-neutral-800 dark:text-white">
      {title}
    </h3>
    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
      {description}
    </p>
    {buttonText && onButtonClick && (
      <button
        onClick={onButtonClick}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold text-sm rounded-md hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {buttonText}
      </button>
    )}
  </div>
);
