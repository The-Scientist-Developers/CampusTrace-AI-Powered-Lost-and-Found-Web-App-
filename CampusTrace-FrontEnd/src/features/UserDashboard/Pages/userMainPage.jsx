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
  Activity,
  Camera,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase, getAccessToken } from "../../../api/apiClient.js";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// Fix for mobile access - use your computer's IP when in development
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://your-api-domain.com" // Replace with your production API URL
    : `http://${window.location.hostname}:8000`; // This will work on both desktop and mobile

// --- StatusBadge Component ---
const StatusBadge = ({ status }) => {
  const statusConfig = {
    approved: {
      bg: "bg-green-100 dark:bg-green-500/20",
      text: "text-green-800 dark:text-green-400",
      label: "Active",
    },
    pending: {
      bg: "bg-yellow-100 dark:bg-yellow-500/20",
      text: "text-yellow-800 dark:text-yellow-400",
      label: "Pending",
    },
    rejected: {
      bg: "bg-red-100 dark:bg-red-500/20",
      text: "text-red-800 dark:text-red-400",
      label: "Rejected",
    },
    recovered: {
      bg: "bg-blue-100 dark:bg-blue-500/20",
      text: "text-blue-800 dark:text-blue-400",
      label: "Recovered",
    },
    pending_return: {
      bg: "bg-cyan-100 dark:bg-cyan-500/20",
      text: "text-cyan-800 dark:text-cyan-400",
      label: "Pending Return",
    },
  };

  const config = statusConfig[status?.toLowerCase()] || {
    bg: "bg-neutral-100 dark:bg-zinc-500/20",
    text: "text-neutral-800 dark:text-gray-400",
    label: "Unknown",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

// --- Statistics Card Component ---
const StatCard = ({ icon: Icon, title, value, trend, color = "primary" }) => {
  const colors = {
    primary: "from-neutral-500 to-neutral-600",
    green: "from-green-500 to-green-600",
    red: "from-red-500 to-rose-600",
    blue: "from-blue-500 to-cyan-600",
  };

  const iconColors = {
    primary: "text-neutral-600 dark:text-neutral-400",
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
    blue: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div className="relative bg-white dark:bg-[#2a2a2a] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-neutral-200 dark:border-[#3a3a3a]">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-5 rounded-2xl`}
      />
      <div className="relative">
        <div
          className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${colors[color]} bg-opacity-10 mb-4`}
        >
          <Icon className={`w-6 h-6 ${iconColors[color]}`} />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {title}
          </h3>
          <p className="text-3xl font-bold text-neutral-800 dark:text-white">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400">
                {trend}% this week
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Loading Skeletons ---
const CardSkeleton = () => (
  <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-[#3a3a3a]">
    <Skeleton height={120} className="rounded-xl mb-4" />
    <Skeleton height={24} width="70%" className="mb-2" />
    <Skeleton height={20} width="40%" />
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton height={300} className="rounded-2xl" />
      <Skeleton height={300} className="rounded-2xl" />
    </div>
  </div>
);

// --- Main Dashboard Component ---
export default function UserMainPage({ user }) {
  const [myRecentPosts, setMyRecentPosts] = useState([]);
  const [communityActivity, setCommunityActivity] = useState([]);
  const [possibleMatches, setPossibleMatches] = useState([]);
  const [myLostItem, setMyLostItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [stats, setStats] = useState({
    totalItems: 0,
    lostItems: 0,
    foundItems: 0,
    recoveredItems: 0,
  });

  const [chartData, setChartData] = useState({
    weekly: [],
    categories: [],
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch all user's items
      const { data: allMyItems = [], error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id);

      if (itemsError) throw itemsError;

      // Fetch active posts
      const { data: activePosts = [] } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .not("moderation_status", "in", "(recovered,rejected)")
        .order("created_at", { ascending: false })
        .limit(4);

      // Fetch community activity
      const { data: communityData = [] } = await supabase
        .from("items")
        .select("*, profiles(id, full_name, email)")
        .eq("university_id", profile.university_id)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false });

      setMyRecentPosts(activePosts);
      setCommunityActivity(communityData);

      // Calculate stats
      const lostCount = allMyItems.filter(
        (item) => item.status === "Lost"
      ).length;
      const foundCount = allMyItems.filter(
        (item) => item.status === "Found"
      ).length;
      const recoveredCount = allMyItems.filter(
        (item) => item.moderation_status === "recovered"
      ).length;

      setStats({
        totalItems: allMyItems.length,
        lostItems: lostCount,
        foundItems: foundCount,
        recoveredItems: recoveredCount,
      });

      processChartData(allMyItems);

      // Get latest lost item and matches
      const latestLostItem = allMyItems
        .filter(
          (item) =>
            item.status === "Lost" && item.moderation_status !== "recovered"
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (latestLostItem) {
        setMyLostItem(latestLostItem);
        await fetchMatches(latestLostItem.id);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async (itemId) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/api/items/find-matches/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const matches = await response.json();
        setPossibleMatches(matches.slice(0, 4)); // Limit to 4 matches
      }
    } catch (err) {
      console.error("Error fetching matches:", err);
    }
  };

  const processChartData = (items) => {
    // Weekly data
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

    // Categories
    const categoryCount = {};
    items.forEach((item) => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    });

    const categories = Object.entries(categoryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    setChartData({ weekly: weeklyData, categories });
  };

  const totalPages = Math.ceil(communityActivity.length / itemsPerPage);
  const paginatedActivity = communityActivity.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <DashboardSkeleton />;
  if (error)
    return (
      <div className="text-center p-12 bg-red-50 dark:bg-red-900/20 rounded-2xl">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Stats Section */}
      <section>
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-700 to-neutral-900 bg-clip-text text-transparent dark:from-white dark:to-neutral-400">
            Welcome back!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Here's your activity overview
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Package}
            title="Total Posts"
            value={stats.totalItems}
            color="primary"
          />
          <StatCard
            icon={AlertCircle}
            title="Lost Items"
            value={stats.lostItems}
            color="red"
          />
          <StatCard
            icon={CheckCircle}
            title="Found Items"
            value={stats.foundItems}
            color="green"
          />
          <StatCard
            icon={Activity}
            title="Recovered"
            value={stats.recoveredItems}
            color="blue"
          />
        </div>
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Weekly Activity" data={chartData.weekly} />
        <ChartCard
          title="Top Categories"
          data={chartData.categories}
          type="bar"
        />
      </section>

      {/* Possible Matches Section - IMPROVED */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-neutral-500" />
            AI-Powered Matches
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Smart matching for your lost items
          </p>
        </div>

        {myLostItem ? (
          <div className="space-y-6">
            {/* Display the lost item */}
            <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-900/20 dark:to-neutral-800/20 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-4">
                YOUR LOST ITEM
              </h3>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-white dark:bg-[#2a2a2a] flex-shrink-0">
                  {myLostItem.image_url ? (
                    <img
                      src={myLostItem.image_url}
                      alt={myLostItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-neutral-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">
                    {myLostItem.title}
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-3">
                    {myLostItem.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white dark:bg-[#2a2a2a] rounded-full text-sm font-medium">
                      {myLostItem.category}
                    </span>
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-medium">
                      Lost
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Display matches */}
            {possibleMatches.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-4">
                  POSSIBLE MATCHES ({possibleMatches.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {possibleMatches.map((item) => (
                    <MatchCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={HelpCircle}
                title="No matches found yet"
                description="We're continuously searching for matches. Check back later!"
              />
            )}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No lost items"
            description="Post a lost item to see AI-powered matches here"
            buttonText="Post Lost Item"
            onButtonClick={() => navigate("/dashboard/post-new")}
          />
        )}
      </section>

      {/* Recent Posts Section */}
      <section>
        <SectionHeader
          title="My Recent Posts"
          description="Your active lost and found items"
          linkText={myRecentPosts.length > 0 ? "View all" : null}
          linkTo="/dashboard/my-posts"
        />
        {myRecentPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {myRecentPosts.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={EyeOff}
            title="No active posts"
            description="Your posted items will appear here"
            buttonText="Post New Item"
            onButtonClick={() => navigate("/dashboard/post-new")}
          />
        )}
      </section>

      {/* Community Activity Section */}
      <section>
        <SectionHeader
          title="Community Activity"
          description="Latest items from your campus"
        />
        {communityActivity.length > 0 ? (
          <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-sm border border-neutral-200 dark:border-[#3a3a3a] overflow-hidden">
            <div className="divide-y divide-neutral-200 dark:divide-[#3a3a3a]">
              {paginatedActivity.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={communityActivity.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        ) : (
          <EmptyState
            icon={Activity}
            title="No community activity"
            description="Community posts will appear here"
          />
        )}
      </section>
    </div>
  );
}

// --- Helper Components ---
const SectionHeader = ({ title, description, linkText, linkTo }) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">
        {title}
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 mt-1">
        {description}
      </p>
    </div>
    {linkText && (
      <Link
        to={linkTo}
        className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 group"
      >
        {linkText}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    )}
  </div>
);

const ChartCard = ({ title, data, type = "area" }) => (
  <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-[#3a3a3a]">
    <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-6">
      {title}
    </h3>
    <ResponsiveContainer width="100%" height={250}>
      {type === "area" ? (
        <AreaChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-neutral-200 dark:stroke-neutral-700"
          />
          <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} />
          <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />
          <Area
            type="monotone"
            dataKey="lost"
            stackId="1"
            stroke="#ef4444"
            fill="#fca5a5"
          />
          <Area
            type="monotone"
            dataKey="found"
            stackId="1"
            stroke="#10b981"
            fill="#86efac"
          />
        </AreaChart>
      ) : (
        <BarChart data={data} layout="vertical">
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-neutral-200 dark:stroke-neutral-700"
          />
          <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 12 }} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: "#6b7280", fontSize: 12 }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />
          <Bar dataKey="value" fill="#6b7280" radius={[0, 4, 4, 0]} />
        </BarChart>
      )}
    </ResponsiveContainer>
  </div>
);

const MatchCard = ({ item }) => (
  <Link
    to="/dashboard/browse-all"
    state={{ itemId: item.id }}
    className="group bg-white dark:bg-[#2a2a2a] rounded-xl border border-neutral-200 dark:border-[#3a3a3a] overflow-hidden hover:shadow-lg transition-all duration-200"
  >
    {item.match_score && (
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center py-2 text-sm font-semibold">
        {item.match_score}% Match
      </div>
    )}
    <div className="aspect-square bg-neutral-100 dark:bg-[#1a1a1a] relative overflow-hidden">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Camera className="w-8 h-8 text-neutral-300" />
        </div>
      )}
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-neutral-800 dark:text-white line-clamp-1 mb-2">
        {item.title}
      </h3>
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">{item.category}</span>
        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
          Found
        </span>
      </div>
    </div>
  </Link>
);

const ItemCard = ({ item }) => (
  <Link
    to="/dashboard/browse-all"
    state={{ itemId: item.id }}
    className="group bg-white dark:bg-[#2a2a2a] rounded-xl border border-neutral-200 dark:border-[#3a3a3a] overflow-hidden hover:shadow-lg transition-all duration-200"
  >
    <div className="aspect-square bg-neutral-100 dark:bg-[#1a1a1a] relative overflow-hidden">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Camera className="w-8 h-8 text-neutral-300" />
        </div>
      )}
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-neutral-800 dark:text-white line-clamp-2 mb-3">
        {item.title}
      </h3>
      <div className="flex items-center justify-between">
        <StatusBadge status={item.moderation_status} />
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.status === "Lost"
              ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          }`}
        >
          {item.status}
        </span>
      </div>
    </div>
  </Link>
);

const ActivityItem = ({ item }) => (
  <Link
    to="/dashboard/browse-all"
    state={{ itemId: item.id }}
    className="flex items-center gap-4 p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
  >
    <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-[#1a1a1a] overflow-hidden flex-shrink-0">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-xs font-medium text-neutral-400">
            {item.category?.substring(0, 3).toUpperCase()}
          </span>
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-neutral-800 dark:text-white line-clamp-1">
        {item.title}
      </p>
      <div className="flex items-center gap-3 mt-1">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            item.status === "Lost"
              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          }`}
        >
          {item.status}
        </span>
        <span className="text-sm text-neutral-500">{item.category}</span>
        <span className="text-sm text-neutral-400">
          • {timeAgo(item.created_at)}
        </span>
      </div>
    </div>
    <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
  </Link>
);

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => (
  <div className="px-6 py-4 bg-neutral-50 dark:bg-[#1a1a1a] flex items-center justify-between">
    <span className="text-sm text-neutral-600 dark:text-neutral-400">
      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
      {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
    </span>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="px-3 py-1 text-sm font-medium">
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  </div>
);

const EmptyState = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
}) => (
  <div className="bg-neutral-50 dark:bg-[#2a2a2a]/50 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-12">
    <div className="text-center max-w-sm mx-auto">
      <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        {description}
      </p>
      {buttonText && (
        <button
          onClick={onButtonClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {buttonText}
        </button>
      )}
    </div>
  </div>
);

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
    { label: "s", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count}${interval.label} ago`;
  }
  return "just now";
};
