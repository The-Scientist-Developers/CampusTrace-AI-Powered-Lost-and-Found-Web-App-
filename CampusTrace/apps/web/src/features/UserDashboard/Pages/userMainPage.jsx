import React, { useState, useEffect, useCallback } from "react";
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
  Activity,
  Camera,
  Sparkles,
  Tag,
  Clock,
  Heart,
  Send,
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
import { useTheme } from "../../../contexts/ThemeContext";
import { API_BASE_URL } from "../../../api/apiClient.js";

// ==================== Helper Functions ====================
const timeAgo = (dateString) => {
  if (!dateString) return "unknown time";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "invalid date";
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
};

// --- Status Badge (from RN layout) ---
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

// --- Stat Card (Styled like RN layout) ---
const StatCard = ({ icon: Icon, label, value, color }) => {
  return (
    <div className="flex-1 bg-white dark:bg-[#2a2a2a] rounded-xl p-4 items-center border border-neutral-200 dark:border-[#3a3a3a]">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2`}
        style={{ backgroundColor: color + "15" }}
      >
        <Icon className="w-6 h-6" style={{ color: color }} />
      </div>
      <p className="text-3xl font-bold text-neutral-800 dark:text-white">
        {value}
      </p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
  );
};

// --- Image Placeholder (from RN layout) ---
const ItemImage = ({ imageUrl, className }) => (
  <div
    className={`bg-neutral-100 dark:bg-neutral-800 overflow-hidden ${className}`}
  >
    {imageUrl ? (
      <img src={imageUrl} alt="item" className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full flex items-center justify-center">
        <Camera className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
      </div>
    )}
  </div>
);

// --- Item Card (Styled like RN layout) ---
const ItemCard = ({ item, onPress }) => (
  <button
    onClick={onPress}
    className="w-[70vw] sm:w-64 bg-white dark:bg-[#2a2a2a] rounded-xl border border-neutral-200 dark:border-[#3a3a3a] overflow-hidden flex-shrink-0 snap-start"
  >
    <ItemImage imageUrl={item.image_url} className="w-full aspect-square" />
    <div className="p-3">
      <h3 className="text-sm font-semibold text-neutral-800 dark:text-white mb-2 h-10 line-clamp-2">
        {item.title}
      </h3>
      <div className="flex justify-between items-center">
        <StatusBadge status={item.moderation_status} />
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            item.status === "Lost"
              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          }`}
        >
          {item.status}
        </span>
      </div>
    </div>
  </button>
);

// --- Match Card (Styled like RN layout) ---
const MatchCard = ({ item, onPress }) => (
  <button
    onClick={onPress}
    className="w-[70vw] sm:w-64 bg-white dark:bg-[#2a2a2a] rounded-xl border border-neutral-200 dark:border-[#3a3a3a] overflow-hidden flex-shrink-0 snap-start relative"
  >
    {item.match_score && (
      <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
        {Math.round(item.match_score)}% Match
      </div>
    )}
    <ItemImage imageUrl={item.image_url} className="w-full aspect-square" />
    <div className="p-3">
      <h3 className="text-sm font-semibold text-neutral-800 dark:text-white mb-2 truncate">
        {item.title}
      </h3>
      <div className="flex justify-between items-center">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {item.category}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
          Found
        </span>
      </div>
    </div>
  </button>
);

// --- Activity Item (Styled like RN layout) ---
const ActivityItem = ({ item, onPress }) => {
  const statusColor =
    item.status === "Lost" ? "text-red-500" : "text-green-500";
  const posterName =
    item.profiles?.full_name ||
    (item.profiles?.email ? item.profiles.email.split("@")[0] : "Anonymous");

  return (
    <button
      onClick={onPress}
      className="flex items-center gap-3 p-3 w-full text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
    >
      <ItemImage
        imageUrl={item.image_url}
        className="w-12 h-12 rounded-lg flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-neutral-800 dark:text-white truncate">
          {item.title}
        </h4>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
          {posterName}
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
          {timeAgo(item.created_at)}
          {" · "}
          <span className={statusColor}>{item.status}</span>
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
    </button>
  );
};

// --- Empty State (Styled like RN layout) ---
const EmptyState = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
}) => (
  <div className="text-center p-8 bg-white dark:bg-[#2a2a2a] rounded-xl border border-neutral-200 dark:border-[#3a3a3a] my-3">
    <div className="w-14 h-14 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon className="w-7 h-7 text-neutral-400 dark:text-neutral-500" />
    </div>
    <h3 className="text-base font-semibold text-neutral-800 dark:text-white mb-1">
      {title}
    </h3>
    {description && (
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 max-w-xs mx-auto">
        {description}
      </p>
    )}
    {buttonText && (
      <button
        onClick={onButtonClick}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {buttonText}
      </button>
    )}
  </div>
);

// --- Chart Tooltip (from web) ---
const CustomTooltip = ({ active, payload, label }) => {
  const { theme } = useTheme();

  if (active && payload && payload.length) {
    return (
      <div
        className={`p-3 rounded-lg shadow-lg border ${
          theme === "light"
            ? "bg-white border-neutral-200"
            : "bg-[#2a2a2a] border-[#3a3a3a]"
        }`}
      >
        <p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">
          {label}
        </p>
        {payload.map((entry, index) => (
          <p
            key={`item-${index}`}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Chart Card (Styled like RN layout, uses recharts) ---
const ChartCard = ({ title, data, type = "area" }) => {
  const { theme } = useTheme();

  const primaryColor = "#1877F2";
  const lostColor = "#EF4444";
  const foundColor = "#10B981";
  const axisColor = theme === "light" ? "#555555" : "#a3a3a3";
  const gridColor = theme === "light" ? "#E3E3E3" : "#3a3a3a";

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-[#3a3a3a] mt-2">
        <h3 className="text-base font-semibold text-neutral-800 dark:text-white mb-4">
          {title}
        </h3>
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-neutral-400">No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-[#3a3a3a] mt-2">
      <h3 className="text-base font-semibold text-neutral-800 dark:text-white mb-6">
        {title}
      </h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === "area" ? (
            <AreaChart
              data={data}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="day"
                tick={{ fill: axisColor, fontSize: 10 }}
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: axisColor, fontSize: 10 }}
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lostColor} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={lostColor} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorFound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={foundColor} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={foundColor} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="lost"
                stackId="1"
                strokeWidth={2}
                stroke={lostColor}
                fill="url(#colorLost)"
                name="Lost"
              />
              <Area
                type="monotone"
                dataKey="found"
                stackId="1"
                strokeWidth={2}
                stroke={foundColor}
                fill="url(#colorFound)"
                name="Found"
              />
            </AreaChart>
          ) : (
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                type="number"
                tick={{ fill: axisColor, fontSize: 10 }}
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: axisColor, fontSize: 10 }}
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill={primaryColor}
                radius={[0, 4, 4, 0]}
                name="Count"
                barSize={20}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      {type === "area" && (
        <div className="flex justify-center items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: lostColor }}
            ></div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Lost
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: foundColor }}
            ></div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Found
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Skeleton Components (Using react-loading-skeleton) ---
const DashboardSkeleton = () => (
  <div className="space-y-6 p-4">
    <div className="w-3/4">
      <Skeleton height={32} />
    </div>
    <div className="flex gap-4">
      <div className="flex-1">
        <Skeleton height={128} borderRadius={12} />
      </div>
      <div className="flex-1">
        <Skeleton height={128} borderRadius={12} />
      </div>
    </div>
    <div className="flex gap-4">
      <div className="flex-1">
        <Skeleton height={128} borderRadius={12} />
      </div>
      <div className="flex-1">
        <Skeleton height={128} borderRadius={12} />
      </div>
    </div>
    <div>
      <Skeleton height={300} borderRadius={12} />
    </div>
    <div>
      <Skeleton height={300} borderRadius={12} />
    </div>
  </div>
);

// ==================== Main Page Component ====================
export default function UserMainPage({ user }) {
  const [myRecentPosts, setMyRecentPosts] = useState([]);
  const [communityActivity, setCommunityActivity] = useState([]);
  const [possibleMatches, setPossibleMatches] = useState([]);
  const [myLostItem, setMyLostItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme(); // Kept useTheme import
  const primaryColor = theme === "light" ? "#1877F2" : "#38bdf8"; // Using brand colors

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
    setLoading(true);
    setError(null);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error("User profile not found.");

      const { data: allMyItems = [], error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id);

      if (itemsError) throw itemsError;

      const { data: activePosts = [] } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .in("moderation_status", ["approved", "pending", "pending_return"])
        .order("created_at", { ascending: false })
        .limit(4);

      if (profile.university_id) {
        const { data: communityData = [] } = await supabase
          .from("items")
          .select("*, profiles(id, full_name, email)")
          .eq("university_id", profile.university_id)
          .eq("moderation_status", "approved")
          .order("created_at", { ascending: false })
          .limit(50); // Fetch 50, but we will slice 5 for the UI
        setCommunityActivity(communityData);
      } else {
        setCommunityActivity([]);
      }

      setMyRecentPosts(activePosts);

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

      const latestLostItem = allMyItems
        .filter(
          (item) =>
            item.status === "Lost" &&
            item.moderation_status !== "recovered" &&
            item.moderation_status !== "rejected"
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (latestLostItem) {
        setMyLostItem(latestLostItem);
        await fetchMatches(latestLostItem.id);
      } else {
        setMyLostItem(null);
        setPossibleMatches([]);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Failed to load dashboard data.");
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
      if (!response.ok) throw new Error("Failed to fetch matches");
      const matches = await response.json();
      setPossibleMatches(Array.isArray(matches) ? matches.slice(0, 4) : []);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setPossibleMatches([]);
    }
  };

  const processChartData = (items) => {
    const weeklyData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString("en", { weekday: "short" });
      const dayItems = items.filter((item) => {
        const itemDate = new Date(item.created_at);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === date.getTime();
      });
      weeklyData.push({
        day: dayName,
        lost: dayItems.filter((item) => item.status === "Lost").length,
        found: dayItems.filter((item) => item.status === "Found").length,
      });
    }

    const categoryCount = {};
    items.forEach((item) => {
      if (item.category && typeof item.category === "string") {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      }
    });
    const categories = Object.entries(categoryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    setChartData({ weekly: weeklyData, categories });
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  // This is the main loading state
  if (loading) {
    return (
      <div className="h-screen bg-white dark:bg-[#1a1a1a]">
        <DashboardSkeleton />
      </div>
    );
  }

  // This is the error state
  if (error) {
    return (
      <div className="h-screen bg-white dark:bg-[#1a1a1a]">
        <div className="p-4">
          <div className="text-center p-12 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-500/30">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 font-medium">
              Could not load dashboard data.
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
              Error: {error}
            </p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // This is the main content, now matching the RN layout
  return (
    <div className="bg-neutral-50 dark:bg-[#1a1a1a]">
      {/* Welcome Section */}
      <div className="p-4 bg-white dark:bg-[#242424]">
        <h2 className="text-base text-neutral-500 dark:text-neutral-400">
          Welcome back!
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="p-4 bg-white dark:bg-[#242424] border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex gap-3">
          <StatCard
            icon={Package}
            label="Total Items"
            value={stats.totalItems}
            color={primaryColor}
          />
          <StatCard
            icon={AlertCircle}
            label="Lost Items"
            value={stats.lostItems}
            color="#EF4444"
          />
        </div>
        <div className="flex gap-3 mt-3">
          <StatCard
            icon={CheckCircle}
            label="Found Items"
            value={stats.foundItems}
            color="#10B981"
          />
          <StatCard
            icon={Activity}
            label="Recovered"
            value={stats.recoveredItems}
            color="#3B82F6"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="p-4 bg-white dark:bg-[#242424] mt-2">
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
          Your Activity
        </h3>
        <ChartCard
          title="Weekly Activity"
          data={chartData.weekly}
          type="area"
        />
        <ChartCard
          title="Top Categories"
          data={chartData.categories}
          type="bar"
        />
      </div>

      {/* AI-Powered Matches */}
      <div className="p-4 bg-white dark:bg-[#242424] mt-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
            AI-Powered Matches
          </h3>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          Smart matching for your lost items
        </p>

        {myLostItem ? (
          <div>
            {/* Your Latest Lost Item Card */}
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
              <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
                Your Latest Lost Item
              </h4>
              <div className="flex gap-3">
                <ItemImage
                  imageUrl={myLostItem.image_url}
                  className="w-20 h-20 rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-base font-bold text-neutral-800 dark:text-white truncate">
                    {myLostItem.title}
                  </h5>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                    {myLostItem.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded-full text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      <Tag className="w-3 h-3" />
                      {myLostItem.category}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                      <AlertCircle className="w-3 h-3" />
                      Lost
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Matches List */}
            {possibleMatches.length > 0 ? (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                  Possible Matches Found ({possibleMatches.length})
                </h4>
                <div className="flex gap-3 overflow-x-auto snap-x py-2 -mx-4 px-4">
                  {possibleMatches.map((item) => (
                    <MatchCard
                      key={item.id}
                      item={item}
                      onPress={() =>
                        navigate("/dashboard/browse-all", {
                          state: { itemId: item.id },
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={HelpCircle}
                title="No matches found yet"
                description="Our AI is continuously searching. We'll show potential matches here."
              />
            )}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No active lost items"
            description="If you lose something, post it here to enable AI-powered matching."
            buttonText="Post Lost Item"
            onButtonClick={() => navigate("/dashboard/post-new")}
          />
        )}
      </div>

      {/* My Recent Posts */}
      <div className="p-4 bg-white dark:bg-[#242424] mt-2">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
            My Recent Posts
          </h3>
          {myRecentPosts.length > 0 && (
            <Link
              to="/dashboard/my-posts"
              className="text-sm font-semibold"
              style={{ color: primaryColor }}
            >
              View all
            </Link>
          )}
        </div>
        {myRecentPosts.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto snap-x py-2 -mx-4 px-4">
            {myRecentPosts.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onPress={() =>
                  navigate("/dashboard/browse-all", {
                    state: { itemId: item.id },
                  })
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={EyeOff}
            title="No active posts"
            description="Items you post will appear here. Start by reporting a lost or found item."
            buttonText="Post New Item"
            onButtonClick={() => navigate("/dashboard/post-new")}
          />
        )}
      </div>

      {/* Recent Activity */}
      <div className="p-4 bg-white dark:bg-[#242424] mt-2 pb-6">
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-2">
          Recent Community Activity
        </h3>
        {communityActivity.length > 0 ? (
          <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-700 border-t border-b border-neutral-100 dark:border-neutral-700">
            {communityActivity.slice(0, 5).map((item) => (
              <ActivityItem
                key={item.id}
                item={item}
                onPress={() =>
                  navigate("/dashboard/browse-all", {
                    state: { itemId: item.id },
                  })
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title="No recent activity"
            description="Approved posts from others on your campus will show up here."
          />
        )}
      </div>
    </div>
  );
}
