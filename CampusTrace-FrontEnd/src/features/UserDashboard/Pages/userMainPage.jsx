import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  EyeOff,
  Plus,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Package,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
  MapPin,
  Camera,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase, getAccessToken } from "../../../api/apiClient.js";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";

// --- StatusBadge Component ---
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
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${colorClass}`}
    >
      {text}
    </span>
  );
};

// --- Statistics Card Component ---
const StatCard = ({ icon: Icon, title, value, color = "primary" }) => {
  const colorClasses = {
    primary:
      "bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400",
    green:
      "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    red: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  };
  return (
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-neutral-800 dark:text-white">
          {value}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {title}
        </p>
      </div>
    </div>
  );
};

// --- Skeleton Components ---
const MatchCardSkeleton = () => (
  <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl p-5 shadow-sm">
    <Skeleton height={180} className="rounded-lg" />
    <div className="mt-4 space-y-2">
      <Skeleton height={24} width="85%" />
      <Skeleton height={20} width="40%" />
    </div>
  </div>
);

const ActivityItemSkeleton = () => (
  <div className="flex items-center gap-4 p-4">
    <Skeleton width={56} height={56} className="rounded-lg flex-shrink-0" />
    <div className="flex-grow min-w-0 space-y-2">
      <Skeleton height={20} width="75%" />
      <Skeleton height={16} width="45%" />
    </div>
    <Skeleton width={24} height={24} />
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-16">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl p-6"
        >
          <Skeleton height={100} />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton height={300} className="rounded-xl" />
      <Skeleton height={300} className="rounded-xl" />
    </div>
    <section>
      <Skeleton height={32} width={450} className="mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <MatchCardSkeleton key={i} />
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

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [stats, setStats] = useState({
    totalItems: 0,
    lostItems: 0,
    foundItems: 0,
    recoveredItems: 0,
  });
  const [chartData, setChartData] = useState({
    weekly: [],
    categories: [],
    statusDistribution: [],
  });

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

        // --- CORRECTED DATA FETCHING ---
        const { data: allMyItems, error: allMyItemsError } = await supabase
          .from("items")
          .select("*")
          .eq("user_id", user.id);
        if (allMyItemsError) throw allMyItemsError;

        // --- THIS IS THE FIXED QUERY ---
        const { data: myActivePosts, error: myActivePostsError } =
          await supabase
            .from("items")
            .select("*")
            .eq("user_id", user.id)
            .not("moderation_status", "in", "(recovered,rejected)") // Correct syntax
            .order("created_at", { ascending: false })
            .limit(4);
        if (myActivePostsError) throw myActivePostsError;

        const { data: communityActivityData, error: communityError } =
          await supabase
            .from("items")
            .select("*, profiles(id, full_name, email)")
            .eq("university_id", userUniversityId)
            .eq("moderation_status", "approved")
            .order("created_at", { ascending: false });
        if (communityError) throw communityError;

        setMyRecentPosts(myActivePosts || []);
        setCommunityActivity(communityActivityData || []);

        // --- ACCURATE CALCULATIONS ---
        setStats({
          totalItems: allMyItems.length,
          lostItems: allMyItems.filter((item) => item.status === "Lost").length,
          foundItems: allMyItems.filter((item) => item.status === "Found")
            .length,
          recoveredItems: allMyItems.filter(
            (item) => item.moderation_status === "recovered"
          ).length,
        });

        processChartData(allMyItems);

        const latestLostItem = allMyItems
          .filter((item) => item.status === "Lost")
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

        if (latestLostItem) {
          const token = await getAccessToken();
          if (!token) throw new Error("Not authenticated to find matches.");
          const response = await fetch(
            `http://localhost:8000/api/items/find-matches/${latestLostItem.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!response.ok)
            throw new Error("Failed to fetch matches from backend.");
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

  const processChartData = (items) => {
    const weeklyData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString("en", { weekday: "short" });
      const dayItems = items.filter(
        (item) =>
          new Date(item.created_at).toDateString() === date.toDateString()
      );
      weeklyData.push({
        day: dayName,
        lost: dayItems.filter((item) => item.status === "Lost").length,
        found: dayItems.filter((item) => item.status === "Found").length,
      });
    }

    const categoryCount = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    const categories = Object.entries(categoryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const statusDistribution = [
      {
        name: "Lost",
        value: items.filter((item) => item.status === "Lost").length,
        color: "#ef4444",
      },
      {
        name: "Found",
        value: items.filter((item) => item.status === "Found").length,
        color: "#10b981",
      },
    ];

    setChartData({ weekly: weeklyData, categories, statusDistribution });
  };

  const totalItems = communityActivity.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedActivity = communityActivity.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <DashboardSkeleton />;
  if (error)
    return (
      <div className="text-center p-8">
        <p className="text-red-500">{error}</p>
      </div>
    );

  return (
    <div className="space-y-16">
      <section>
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-neutral-800 dark:text-white mb-2">
            My Dashboard
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Your personal activity summary and statistics.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Package}
            title="Your Total Posts"
            value={stats.totalItems}
            color="primary"
          />
          <StatCard
            icon={AlertCircle}
            title="Your Lost Items"
            value={stats.lostItems}
            color="red"
          />
          <StatCard
            icon={CheckCircle}
            title="Your Found Items"
            value={stats.foundItems}
            color="green"
          />
          <StatCard
            icon={Activity}
            title="Your Recovered Items"
            value={stats.recoveredItems}
            color="blue"
          />
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-6">
              Your Weekly Activity
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData.weekly}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  strokeDashoffset="5"
                  className="stroke-neutral-200 dark:stroke-neutral-700"
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="lost"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#fca5a5"
                  name="Lost"
                />
                <Area
                  type="monotone"
                  dataKey="found"
                  stackId="1"
                  stroke="#10b981"
                  fill="#86efac"
                  name="Found"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-6">
              Your Top Categories
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.categories} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  strokeDashoffset="5"
                  className="stroke-neutral-200 dark:stroke-neutral-700"
                />
                <XAxis
                  type="number"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-neutral-800 dark:text-white mb-2">
            Possible Matches For Your Latest Lost Item
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            AI-powered matching to help you find your lost items faster
          </p>
        </div>
        {possibleMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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

      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-neutral-800 dark:text-white mb-2">
              My Recent Active Posts
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Track your currently lost and found items.
            </p>
          </div>
          {myRecentPosts.length > 0 && (
            <Link
              to="/dashboard/my-posts"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1 group"
            >
              View all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
        {myRecentPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
            title="You Have No Active Posts"
            description="Post a lost or found item to see it here."
            buttonText="Post a New Item"
            onButtonClick={() => navigate("/dashboard/post-new")}
          />
        )}
      </section>

      <section>
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-neutral-800 dark:text-white mb-2">
            Recent Community Activity
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Latest items posted by your campus community
          </p>
        </div>
        {communityActivity.length > 0 ? (
          <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-neutral-200 dark:divide-[#3a3a3a]">
              {paginatedActivity.map((item) => (
                <ActivityItem key={`activity-${item.id}`} item={item} />
              ))}
            </div>
            <div className="px-6 py-4 bg-neutral-50 dark:bg-[#1a1a1a] border-t border-neutral-200 dark:border-[#3a3a3a]">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Items per page:
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-[#2a2a2a] text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {currentPage === 1
                      ? 1
                      : (currentPage - 1) * itemsPerPage + 1}
                    –{Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                    {totalItems}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {currentPage}
                      </span>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        / {totalPages}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-neutral-500 p-12 bg-white dark:bg-[#2a2a2a]/50 rounded-2xl border border-neutral-200 dark:border-[#3a3a3a]">
            No community activity to show.
          </div>
        )}
      </section>
    </div>
  );
}

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
      className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-[1.02] cursor-pointer group flex flex-col relative"
    >
      {showScore && item.match_score && (
        <div className="absolute top-3 left-3 z-10 bg-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
          {item.match_score}% Match
        </div>
      )}
      <div className="aspect-[4/3] bg-neutral-100 dark:bg-[#1a1a1a] relative overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-12 h-12 text-neutral-300 dark:text-neutral-600" />
          </div>
        )}
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <h3 className="font-semibold text-lg text-neutral-800 dark:text-white line-clamp-2 mb-3">
          {item.title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusBadgeClass}`}
          >
            {item.status}
          </span>
          {item.moderation_status && (
            <StatusBadge status={item.moderation_status} />
          )}
        </div>
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
      className="flex items-center gap-4 p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group"
    >
      <div className="w-14 h-14 bg-neutral-100 dark:bg-[#1a1a1a] rounded-lg flex-shrink-0 relative overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-neutral-400 flex items-center justify-center h-full font-medium">
            {item.category?.substring(0, 3).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-semibold text-base text-neutral-800 dark:text-white line-clamp-1 mb-1">
          {item.title}
        </p>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadgeClass}`}
          >
            {item.status}
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {item.category}
          </span>
          <span className="text-sm text-neutral-400 dark:text-neutral-500">
            •
          </span>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {timeAgo(item.created_at)}
          </p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:translate-x-1 transition-transform" />
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
  <div className="bg-white dark:bg-[#2a2a2a]/50 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-16">
    <div className="text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
      </div>
      <h3 className="text-xl font-semibold text-neutral-800 dark:text-white mb-3">
        {title}
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-8">
        {description}
      </p>
      {buttonText && onButtonClick && (
        <button
          onClick={onButtonClick}
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-primary-600 text-white font-semibold text-sm rounded-lg hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          {buttonText}
        </button>
      )}
    </div>
  </div>
);
