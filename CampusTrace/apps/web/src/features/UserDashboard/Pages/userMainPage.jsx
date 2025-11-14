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

// --- Enhanced Stat Card with Gradient (Matching Mobile) ---
const StatCard = ({ icon: Icon, label, value, color, gradient }) => {
  return (
    <div className="flex-1 bg-white dark:bg-[#2a2a2a] rounded-2xl p-5 flex flex-col items-center border border-neutral-200 dark:border-[#3a3a3a] shadow-sm hover:shadow-md transition-shadow duration-200">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        }}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
      <p className="text-3xl font-bold text-neutral-800 dark:text-white mb-1">
        {value}
      </p>
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
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

// --- Enhanced Item Card with Modern Styling ---
const ItemCard = ({ item, onPress }) => (
  <button
    onClick={onPress}
    className="w-[70vw] sm:w-64 bg-white dark:bg-[#2a2a2a] rounded-2xl border border-neutral-200 dark:border-[#3a3a3a] overflow-hidden flex-shrink-0 snap-start shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
  >
    <div className="relative">
      <ItemImage imageUrl={item.image_url} className="w-full aspect-square" />
      <div className="absolute top-3 left-3">
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg ${
            item.status === "Lost"
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          {item.status}
        </span>
      </div>
    </div>
    <div className="p-4">
      <h3 className="text-sm font-bold text-neutral-800 dark:text-white mb-2 h-10 line-clamp-2">
        {item.title}
      </h3>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <Tag className="w-3 h-3" />
          <span>{item.category}</span>
        </div>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          {timeAgo(item.created_at)}
        </span>
      </div>
    </div>
  </button>
);

// --- Enhanced Match Card with Modern Styling ---
const MatchCard = ({ item, onPress }) => {
  const matchPercentage = item.match_score ? Math.round(item.match_score) : 0;
  const matchColor =
    matchPercentage >= 80
      ? "#10B981"
      : matchPercentage >= 60
      ? "#F59E0B"
      : "#6B7280";

  return (
    <button
      onClick={onPress}
      className="w-[50vw] sm:w-48 bg-white dark:bg-[#2a2a2a] rounded-2xl border border-neutral-200 dark:border-[#3a3a3a] overflow-hidden flex-shrink-0 snap-start shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
    >
      <div className="p-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: matchColor }}
          >
            {matchPercentage}%
          </div>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Match
          </span>
        </div>
      </div>
      <ItemImage imageUrl={item.image_url} className="w-full aspect-square" />
      <div className="p-3">
        <h3 className="text-sm font-bold text-neutral-800 dark:text-white mb-1 truncate">
          {item.title}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
          {item.location || "Campus"}
        </p>
      </div>
    </button>
  );
};

// --- Enhanced Activity Item with Modern Styling ---
const ActivityItem = ({ item, onPress }) => {
  const statusIcon = item.status === "Lost" ? AlertCircle : CheckCircle;
  const statusColor = item.status === "Lost" ? "#EF4444" : "#10B981";
  const StatusIcon = statusIcon;
  const posterName =
    item.profiles?.full_name ||
    (item.profiles?.email ? item.profiles.email.split("@")[0] : "Anonymous");

  return (
    <button
      onClick={onPress}
      className="flex items-center gap-3 p-4 w-full text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors duration-150"
    >
      <div className="relative flex-shrink-0">
        <ItemImage
          imageUrl={item.image_url}
          className="w-14 h-14 rounded-xl shadow-sm"
        />
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-[#2a2a2a] flex items-center justify-center"
          style={{ backgroundColor: statusColor }}
        >
          <StatusIcon className="w-3 h-3 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-bold text-neutral-800 dark:text-white truncate">
            {item.title}
          </h4>
          <StatusIcon
            className="w-4 h-4 flex-shrink-0 ml-2"
            style={{ color: statusColor }}
          />
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
          {posterName}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {timeAgo(item.created_at)}
          </span>
          <span
            className="px-2 py-0.5 rounded-md text-xs font-medium"
            style={{
              backgroundColor: statusColor + "15",
              color: statusColor,
            }}
          >
            {item.category}
          </span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
    </button>
  );
};

// --- Enhanced Empty State with Modern Styling ---
const EmptyState = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
}) => {
  const { theme } = useTheme();
  const primaryColor = theme === "light" ? "#1877F2" : "#38bdf8";

  return (
    <div className="text-center p-10 bg-white dark:bg-[#2a2a2a] rounded-2xl border border-neutral-200 dark:border-[#3a3a3a] shadow-sm">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
        }}
      >
        <Icon className="w-9 h-9" style={{ color: primaryColor }} />
      </div>
      <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5 max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {buttonText && (
        <button
          onClick={onButtonClick}
          className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}DD)`,
          }}
        >
          <Plus className="w-4 h-4" />
          {buttonText}
        </button>
      )}
    </div>
  );
};

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
    <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-5 shadow-sm border border-neutral-200 dark:border-[#3a3a3a] mt-2">
      <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-6">
        {title}
      </h3>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === "area" ? (
            <AreaChart
              data={data}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
                stroke={axisColor}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
              />
              <YAxis
                tick={{ fill: axisColor, fontSize: 11 }}
                stroke={axisColor}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: gridColor }}
              />
              <defs>
                <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lostColor} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={lostColor} stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="colorFound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={foundColor} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={foundColor} stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="Lost"
                stackId="1"
                strokeWidth={2.5}
                stroke={lostColor}
                fill="url(#colorLost)"
                name="Lost"
                animationDuration={800}
              />
              <Area
                type="monotone"
                dataKey="Found"
                stackId="1"
                strokeWidth={2.5}
                stroke={foundColor}
                fill="url(#colorFound)"
                name="Found"
                animationDuration={800}
              />
            </AreaChart>
          ) : (
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1877F2" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: axisColor, fontSize: 11 }}
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: gridColor, opacity: 0.3 }}
              />
              <Bar
                dataKey="count"
                fill="url(#barGradient)"
                radius={[0, 8, 8, 0]}
                name="Items"
                barSize={28}
                animationDuration={800}
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

// ==================== Theme Color Helper ====================
const getThemeColors = (colorMode) => {
  const colorMap = {
    default: { primary: "#1877F2", light: "#60A5FA", dark: "#1565D8" },
    blue: { primary: "#3B82F6", light: "#60A5FA", dark: "#2563EB" },
    purple: { primary: "#A855F7", light: "#C084FC", dark: "#9333EA" },
    pink: { primary: "#EC4899", light: "#F472B6", dark: "#DB2777" },
    green: { primary: "#22C55E", light: "#4ADE80", dark: "#16A34A" },
  };
  return colorMap[colorMode] || colorMap.default;
};

// ==================== Main Page Component ====================
export default function UserMainPage({ user }) {
  const [myRecentPosts, setMyRecentPosts] = useState([]);
  const [communityActivity, setCommunityActivity] = useState([]);
  const [possibleMatches, setPossibleMatches] = useState([]);
  const [myLostItem, setMyLostItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme, colorMode } = useTheme();
  const themeColors = getThemeColors(colorMode);
  const primaryColor = themeColors.primary;

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
      // Use new consolidated dashboard-summary endpoint
      const token = await getAccessToken();
      if (!token) throw new Error("Authentication required");

      const response = await fetch(`${API_BASE_URL}/api/dashboard-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data = await response.json();

      // Set data from consolidated endpoint
      setMyRecentPosts(data.myRecentPosts || []);
      setCommunityActivity(data.recentActivity || []);
      setPossibleMatches(data.aiMatches || []);

      // Calculate stats from summary
      const allItemsCount =
        (data.userStats?.found || 0) + (data.userStats?.lost || 0);
      setStats({
        totalItems: allItemsCount,
        lostItems: data.userStats?.lost || 0,
        foundItems: data.userStats?.found || 0,
        recoveredItems: data.userStats?.recovered || 0,
      });

      // Generate chart data (use all posts for accurate charts)
      await generateChartData(data.allMyPosts || []);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = async (posts) => {
    // Generate weekly activity data
    const weeklyData = {};
    posts.forEach((item) => {
      const date = new Date(item.created_at);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      if (!weeklyData[dayName]) {
        weeklyData[dayName] = { name: dayName, Lost: 0, Found: 0 };
      }
      if (item.status === "Lost") weeklyData[dayName].Lost++;
      else weeklyData[dayName].Found++;
    });

    const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyArray = daysOrder.map(
      (day) => weeklyData[day] || { name: day, Lost: 0, Found: 0 }
    );

    // Generate category data
    const categoryCount = {};
    posts.forEach((item) => {
      const cat = item.category || "Other";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const categoriesArray = Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setChartData({
      weekly: weeklyArray,
      categories: categoriesArray,
    });
  };

  const fetchDashboardDataOld = async () => {
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

  // This is the main content, now matching the RN layout with modern design
  return (
    <div className="bg-neutral-50 dark:bg-[#1a1a1a] min-h-screen pb-6">
      {/* Modern Welcome Card with Theme-Responsive Gradient */}
      <div className="p-4 md:p-6">
        <div
          className="rounded-2xl p-6 shadow-lg relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.dark})`,
          }}
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome back! 👋
            </h2>
            <p className="text-white/90 text-sm font-medium">
              {stats.lostItems > 0
                ? `You have ${stats.lostItems} active lost item${
                    stats.lostItems > 1 ? "s" : ""
                  }`
                : "Everything looks good today!"}
            </p>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
            <Package className="w-20 h-20 text-white" />
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="px-4 md:px-6 mb-6">
        <h3 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">
          Quick Overview
        </h3>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <StatCard
            icon={Package}
            label="Total Items"
            value={stats.totalItems}
            color={primaryColor}
            gradient={[themeColors.primary, themeColors.light]}
          />
          <StatCard
            icon={AlertCircle}
            label="Lost"
            value={stats.lostItems}
            color="#EF4444"
            gradient={["#EF4444", "#F87171"]}
          />
          <StatCard
            icon={CheckCircle}
            label="Found"
            value={stats.foundItems}
            color="#10B981"
            gradient={["#10B981", "#34D399"]}
          />
          <StatCard
            icon={Activity}
            label="Recovered"
            value={stats.recoveredItems}
            color="#F59E0B"
            gradient={["#F59E0B", "#FCD34D"]}
          />
        </div>
      </div>

      {/* Charts Section with Modern Styling */}
      {(chartData.weekly.length > 0 || chartData.categories.length > 0) && (
        <div className="px-4 md:px-6 mb-6">
          <h3 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">
            Activity Insights
          </h3>
          {chartData.weekly.length > 0 && (
            <ChartCard title="This Week" data={chartData.weekly} type="area" />
          )}
          {chartData.categories.length > 0 && (
            <ChartCard
              title="Top Categories"
              data={chartData.categories}
              type="bar"
            />
          )}
        </div>
      )}

      {/* AI-Powered Matches with Theme-Responsive Header */}
      <div className="px-4 md:px-6 mb-6">
        <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-5 border border-neutral-200 dark:border-[#3a3a3a] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.light})`,
              }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white">
                Smart Matching
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                AI-powered suggestions
              </p>
            </div>
          </div>

          {myLostItem ? (
            <div>
              {/* Your Latest Lost Item Card with Modern Gradient */}
              <div
                className="rounded-xl p-4 mb-4 border border-red-200 dark:border-red-900/30"
                style={{
                  background:
                    theme === "light"
                      ? "linear-gradient(135deg, #FEF2F2, #FEE2E2)"
                      : "rgba(239, 68, 68, 0.1)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <h4 className="text-sm font-bold text-red-600 dark:text-red-400">
                      Your Lost Item
                    </h4>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {timeAgo(myLostItem.created_at)}
                  </span>
                </div>
                <div className="flex gap-3">
                  <ItemImage
                    imageUrl={myLostItem.image_url}
                    className="w-20 h-20 rounded-xl flex-shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-base font-bold text-neutral-800 dark:text-white truncate">
                      {myLostItem.title}
                    </h5>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1">
                      {myLostItem.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-neutral-800 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 shadow-sm">
                        <Tag className="w-3 h-3" />
                        {myLostItem.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Matches List */}
              {possibleMatches.length > 0 ? (
                <div>
                  <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">
                    {possibleMatches.length} Possible Match
                    {possibleMatches.length !== 1 ? "es" : ""}
                  </h4>
                  <div className="flex gap-3 overflow-x-auto snap-x py-2 -mx-5 px-5 scrollbar-hide">
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
                  title="Searching for matches..."
                  description="We'll notify you when we find something"
                />
              )}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No active lost items"
              description="Report a lost item to enable smart matching"
              buttonText="Report Lost Item"
              onButtonClick={() => navigate("/dashboard/post-new")}
            />
          )}
        </div>
      </div>

      {/* My Active Posts with Modern Styling */}
      <div className="px-4 md:px-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
            My Active Posts
          </h3>
          {myRecentPosts.length > 0 && (
            <Link
              to="/dashboard/my-posts"
              className="flex items-center gap-1 text-sm font-semibold hover:opacity-80 transition-opacity"
              style={{ color: primaryColor }}
            >
              See all
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        {myRecentPosts.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto snap-x py-2 -mx-4 px-4 md:-mx-6 md:px-6 scrollbar-hide">
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
            icon={Plus}
            title="No active posts yet"
            description="Start by reporting a lost or found item"
            buttonText="Create Post"
            onButtonClick={() => navigate("/dashboard/post-new")}
          />
        )}
      </div>

      {/* Community Feed with Modern Styling */}
      <div className="px-4 md:px-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
            Community Feed
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              Live
            </span>
          </div>
        </div>
        {communityActivity.length > 0 ? (
          <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl border border-neutral-200 dark:border-[#3a3a3a] shadow-sm overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-700">
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
            icon={Activity}
            title="No recent activity"
            description="Check back later for updates"
          />
        )}
      </div>
    </div>
  );
}
