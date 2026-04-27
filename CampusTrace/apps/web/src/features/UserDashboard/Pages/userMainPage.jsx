import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
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

// --- Animated count-up hook ---
const useCountUp = (target, duration = 800) => {
  const [count, setCount] = useState(0);
  const frame = useRef(null);
  useEffect(() => {
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) {
        frame.current = requestAnimationFrame(animate);
      }
    };
    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);
  return count;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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
    "pending handover": {
      bg: "bg-cyan-100 dark:bg-cyan-500/20",
      text: "text-cyan-800 dark:text-cyan-400",
      label: "Pending Handover",
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

// --- Stat Card ---
const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
  gradient,
  onClick,
  isActive,
}) => {
  const animatedValue = useCountUp(value);
  return (
    <button
      onClick={onClick}
      className={`flex-1 bg-white dark:bg-[#2a2a2a] rounded-2xl p-5 flex flex-col items-center border ${
        isActive ? "border-2" : "border-neutral-200 dark:border-[#3a3a3a]"
      }`}
      style={{
        ...(isActive ? { borderColor: gradient[0] } : {}),
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
        style={{
          background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        }}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
      <p className="text-3xl font-bold text-neutral-800 dark:text-white mb-1 tabular-nums">
        {animatedValue}
      </p>
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      {isActive && (
        <div
          className="mt-2 w-8 h-0.5 rounded-full"
          style={{ backgroundColor: gradient[0] }}
        />
      )}
    </button>
  );
};

// --- Image Placeholder (from RN layout) ---
const ItemImage = ({ imageUrl, className }) => (
  <div
    className={`bg-neutral-100 dark:bg-neutral-800 overflow-hidden ${className}`}
  >
    {imageUrl ? (
      <img
        src={imageUrl}
        alt="item"
        className="w-full h-full object-cover"
        loading="lazy"
      />
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
    <ItemImage
      imageUrl={item.thumbnail_url || item.image_url}
      className="w-full aspect-square"
    />
    <div className="p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold text-neutral-800 dark:text-white line-clamp-2 flex-1">
          {item.title}
        </h3>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
            item.status === "Lost"
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          {item.status}
        </span>
      </div>
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
  // Get match score and determine color
  const matchScore = item.match_score || 0;
  const getMatchColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-gray-500";
  };
  const getMatchTextColor = (score) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  };
  const getMatchBgColor = (score) => {
    if (score >= 80)
      return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    if (score >= 60)
      return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    return "bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700";
  };

  return (
    <button
      onClick={onPress}
      className="w-[55vw] sm:w-56 bg-white dark:bg-[#2a2a2a] rounded-2xl border border-neutral-200 dark:border-[#3a3a3a] overflow-hidden flex-shrink-0 snap-start shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
    >
      <div className="relative">
        <ItemImage
          imageUrl={item.thumbnail_url || item.image_url}
          className="w-full aspect-square"
        />
        {/* Match Score Badge Overlay */}
        {matchScore > 0 && (
          <div
            className={`absolute top-2 right-2 px-2 py-1 rounded-full ${getMatchColor(matchScore)} shadow-md`}
          >
            <span className="text-xs font-bold text-white">{matchScore}%</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-neutral-800 dark:text-white truncate flex-1">
            {item.title}
          </h3>
          <span
            className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold flex-shrink-0 ${
              item.status === "Lost"
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {item.status}
          </span>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mb-2">
          {item.location || "Campus"}
        </p>
        {/* XAI Explanation Box */}
        {item.match_explanation && (
          <div
            className={`p-2 rounded-lg border ${getMatchBgColor(matchScore)}`}
          >
            <div className="flex items-start gap-1.5">
              <svg
                className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${getMatchTextColor(matchScore)}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-snug">
                {item.match_explanation}
              </p>
            </div>
          </div>
        )}
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
      className="flex items-center gap-3 p-4 w-full text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors duration-150 border-l-[3px]"
      style={{ borderLeftColor: statusColor }}
    >
      <div className="relative flex-shrink-0">
        <ItemImage
          imageUrl={item.thumbnail_url || item.image_url}
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
  const [showLost, setShowLost] = useState(true);
  const [showFound, setShowFound] = useState(true);

  const primaryColor = "#1877F2";
  const lostColor = "#EF4444";
  const foundColor = "#10B981";
  const axisColor = theme === "light" ? "#555555" : "#a3a3a3";
  const gridColor = theme === "light" ? "#E3E3E3" : "#3a3a3a";

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm border border-neutral-200 dark:border-[#3a3a3a] mt-2 overflow-hidden">
        <div className="px-5 pt-5 pb-4 flex items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-700/50">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: type === "area" ? "#EF4444" : "#1877F2" }}
          />
          <h3 className="text-base font-bold text-neutral-800 dark:text-white">
            {title}
          </h3>
        </div>
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-neutral-400">No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm border border-neutral-200 dark:border-[#3a3a3a] mt-2 overflow-hidden">
      <div className="px-5 pt-5 pb-4 flex items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-700/50">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: type === "area" ? "#EF4444" : "#1877F2" }}
        />
        <h3 className="text-base font-bold text-neutral-800 dark:text-white">
          {title}
        </h3>
      </div>
      <div className="p-5">
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
                    <stop
                      offset="95%"
                      stopColor={lostColor}
                      stopOpacity={0.2}
                    />
                  </linearGradient>
                  <linearGradient id="colorFound" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={foundColor}
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="95%"
                      stopColor={foundColor}
                      stopOpacity={0.2}
                    />
                  </linearGradient>
                </defs>
                {showLost && (
                  <Area
                    type="monotone"
                    dataKey="Lost"
                    strokeWidth={2.5}
                    stroke={lostColor}
                    fill="url(#colorLost)"
                    name="Lost"
                    animationDuration={800}
                  />
                )}
                {showFound && (
                  <Area
                    type="monotone"
                    dataKey="Found"
                    strokeWidth={2.5}
                    stroke={foundColor}
                    fill="url(#colorFound)"
                    name="Found"
                    animationDuration={800}
                  />
                )}
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
          <div className="flex justify-center items-center gap-3 mt-4">
            <button
              onClick={() => setShowLost(!showLost)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-150 ${
                showLost ? "" : "opacity-40"
              }`}
              style={
                showLost
                  ? {
                      backgroundColor: lostColor + "20",
                      borderColor: lostColor + "60",
                    }
                  : { borderColor: "#d1d5db" }
              }
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: lostColor }}
              ></div>
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Lost
              </span>
            </button>
            <button
              onClick={() => setShowFound(!showFound)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-150 ${
                showFound ? "" : "opacity-40"
              }`}
              style={
                showFound
                  ? {
                      backgroundColor: foundColor + "20",
                      borderColor: foundColor + "60",
                    }
                  : { borderColor: "#d1d5db" }
              }
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: foundColor }}
              ></div>
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Found
              </span>
            </button>
          </div>
        )}
      </div>
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
// Cache for dashboard data to prevent refetching on tab switch
const dashboardCache = {
  data: null,
  timestamp: null,
  userId: null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

export default function UserMainPage({ user }) {
  const [myRecentPosts, setMyRecentPosts] = useState([]);
  const [communityActivity, setCommunityActivity] = useState([]);
  const [possibleMatches, setPossibleMatches] = useState([]);
  const [myLostItem, setMyLostItem] = useState(null);
  const [myLostItemsList, setMyLostItemsList] = useState([]);
  const [currentLostItemIndex, setCurrentLostItemIndex] = useState(0);
  const [isSearchingMatches, setIsSearchingMatches] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme, colorMode } = useTheme();
  const themeColors = getThemeColors(colorMode);
  const primaryColor = themeColors.primary;
  const hasFetched = useRef(false);

  const [activeStatFilter, setActiveStatFilter] = useState(null);
  const [showAllFeed, setShowAllFeed] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedFilter, setFeedFilter] = useState("all");

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

  // Check if cache is valid
  const isCacheValid = () => {
    if (!dashboardCache.data || !dashboardCache.timestamp) return false;
    if (dashboardCache.userId !== user?.id) return false;
    const now = Date.now();
    return now - dashboardCache.timestamp < dashboardCache.CACHE_DURATION;
  };

  // Apply cached data to state
  const applyCachedData = (data) => {
    const activeRecentPosts = (data.myRecentPosts || []).filter(
      (item) => item.status?.toLowerCase() !== "recovered",
    );
    const activeCommunityActivity = (data.recentActivity || []).filter(
      (item) => item.status?.toLowerCase() !== "recovered",
    );
    const activeMatches = (data.aiMatches || []).filter(
      (item) => item.status?.toLowerCase() !== "recovered",
    );

    setMyRecentPosts(activeRecentPosts);
    setCommunityActivity(activeCommunityActivity);
    setPossibleMatches(activeMatches);

    setMyLostItemsList(data.userLostItems || []);
    if (data.userLostItems && data.userLostItems.length > 0) {
      setMyLostItem(data.userLostItems[0]);
      setCurrentLostItemIndex(0);
    } else {
      setMyLostItem(null);
      setCurrentLostItemIndex(0);
    }

    const lostCount = data.userStats?.lost || 0;
    const foundCount = data.userStats?.found || 0;
    const recoveredCount = data.userStats?.recovered || 0;

    setStats({
      totalItems:
        data.userStats?.total || lostCount + foundCount + recoveredCount,
      lostItems: lostCount,
      foundItems: foundCount,
      recoveredItems: recoveredCount,
    });
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Use cache if valid to avoid refetching on tab switch
    if (isCacheValid() && hasFetched.current) {
      console.log("📦 Using cached dashboard data");
      applyCachedData(dashboardCache.data);
      setLoading(false);
      return;
    }

    hasFetched.current = true;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Authentication required");

      // Optimized: Single API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(
        `${API_BASE_URL}/api/items/dashboard-summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Fallback to old method if endpoint doesn't exist
        if (response.status === 404) {
          await fetchDashboardDataFallback();
          return;
        }
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();

      // Cache the response data
      dashboardCache.data = data;
      dashboardCache.timestamp = Date.now();
      dashboardCache.userId = user?.id;
      console.log("💾 Dashboard data cached");

      // Set data from consolidated endpoint - filter out recovered items
      applyCachedData(data);

      // Set pre-calculated chart data from backend
      if (data.chartData) {
        setChartData(data.chartData);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out. Please check your connection.");
      } else {
        console.error("Error loading dashboard:", err);
        setError(err.message || "Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchesForItem = async (item, index) => {
    if (!item) return;
    setIsSearchingMatches(true);
    setCurrentLostItemIndex(index);
    setMyLostItem(item);
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/items/find-matches/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const matches = await response.json();
      if (response.ok) {
        setPossibleMatches(matches);
      }
    } catch (e) {
      console.error("Error fetching matches:", e);
    } finally {
      setIsSearchingMatches(false);
    }
  };

  const handleNextLostItem = () => {
    if (myLostItemsList.length <= 1) return;
    const nextIndex = (currentLostItemIndex + 1) % myLostItemsList.length;
    fetchMatchesForItem(myLostItemsList[nextIndex], nextIndex);
  };

  const handlePrevLostItem = () => {
    if (myLostItemsList.length <= 1) return;
    const prevIndex = (currentLostItemIndex - 1 + myLostItemsList.length) % myLostItemsList.length;
    fetchMatchesForItem(myLostItemsList[prevIndex], prevIndex);
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
      (day) => weeklyData[day] || { name: day, Lost: 0, Found: 0 },
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

  // Optimized fallback with parallel queries
  const fetchDashboardDataFallback = async () => {
    try {
      // Fetch profile first to get university_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("User profile not found.");

      // Fetch all data in parallel
      const [allItemsResult, activePostsResult, communityResult] =
        await Promise.all([
          supabase
            .from("items")
            .select("id, status, moderation_status, category, created_at")
            .eq("user_id", user.id),
          supabase
            .from("items")
            .select("*")
            .eq("user_id", user.id)
            .or(
              "moderation_status.in.(approved,pending,pending_return),status.eq.pending handover",
            )
            .order("created_at", { ascending: false })
            .limit(4),
          profile.university_id
            ? supabase
                .from("items")
                .select("*, profiles(id, full_name, email)")
                .eq("university_id", profile.university_id)
                .eq("moderation_status", "approved")
                .order("created_at", { ascending: false })
                .limit(5)
            : Promise.resolve({ data: [] }),
        ]);

      const allMyItems = allItemsResult.data || [];
      const activePosts = (activePostsResult.data || []).filter(
        (item) => item.status?.toLowerCase() !== "recovered",
      );
      const communityData = (communityResult.data || []).filter(
        (item) => item.status?.toLowerCase() !== "recovered",
      );

      setMyRecentPosts(activePosts);
      setCommunityActivity(communityData);

      // Calculate stats
      const lostCount = allMyItems.filter(
        (item) => item.status === "Lost",
      ).length;
      const foundCount = allMyItems.filter(
        (item) => item.status === "Found",
      ).length;
      const recoveredCount = allMyItems.filter(
        (item) => item.moderation_status === "recovered",
      ).length;

      setStats({
        totalItems: allMyItems.length,
        lostItems: lostCount,
        foundItems: foundCount,
        recoveredItems: recoveredCount,
      });

      processChartData(allMyItems);

      // Find latest lost item
      const latestLostItem = activePosts.find(
        (item) =>
          item.status === "Lost" &&
          item.moderation_status !== "recovered" &&
          item.moderation_status !== "rejected",
      );

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
    }
  };

  const fetchMatches = async (itemId) => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch(
        `${API_BASE_URL}/api/items/find-matches/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } },
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
    dashboardCache.data = null;
    dashboardCache.timestamp = null;
    setRefreshing(true);
    fetchDashboardData().finally(() => setRefreshing(false));
  };

  const filteredFeed =
    feedFilter === "all"
      ? communityActivity
      : communityActivity.filter((item) => item.status === feedFilter);

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
      {/* Plain Colorful Welcome Card */}
      <div className="p-4 md:p-6">
        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ backgroundColor: themeColors.dark }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white/80 text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5">
                {getGreeting()}
              </p>
              <h2 className="text-2xl font-bold text-white mb-1.5">
                {user?.user_metadata?.full_name
                  ? `${user.user_metadata.full_name.split(" ")[0]}! 👋`
                  : "Welcome back! 👋"}
              </h2>
              <p className="text-white/90 text-sm">
                {stats.lostItems > 0
                  ? `You have ${stats.lostItems} active lost item${
                      stats.lostItems > 1 ? "s" : ""
                    }`
                  : "Everything looks good today!"}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center disabled:opacity-50"
              title="Refresh dashboard"
            >
              <svg
                className={`w-4 h-4 text-white ${refreshing || loading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="px-4 md:px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span
              className="w-[3px] h-5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
              Quick Overview
            </h3>
          </div>
          {activeStatFilter && (
            <button
              onClick={() => setActiveStatFilter(null)}
              className="text-xs font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            icon={Package}
            label="Total Items"
            value={stats.totalItems}
            color={primaryColor}
            gradient={[themeColors.primary, themeColors.light]}
            onClick={() =>
              setActiveStatFilter(activeStatFilter === "total" ? null : "total")
            }
            isActive={activeStatFilter === "total"}
          />
          <StatCard
            icon={AlertCircle}
            label="Lost"
            value={stats.lostItems}
            color="#EF4444"
            gradient={["#EF4444", "#F87171"]}
            onClick={() =>
              setActiveStatFilter(activeStatFilter === "lost" ? null : "lost")
            }
            isActive={activeStatFilter === "lost"}
          />
          <StatCard
            icon={CheckCircle}
            label="Found"
            value={stats.foundItems}
            color="#10B981"
            gradient={["#10B981", "#34D399"]}
            onClick={() =>
              setActiveStatFilter(activeStatFilter === "found" ? null : "found")
            }
            isActive={activeStatFilter === "found"}
          />
          <StatCard
            icon={Activity}
            label="Recovered"
            value={stats.recoveredItems}
            color="#F59E0B"
            gradient={["#F59E0B", "#FCD34D"]}
            onClick={() =>
              setActiveStatFilter(
                activeStatFilter === "recovered" ? null : "recovered",
              )
            }
            isActive={activeStatFilter === "recovered"}
          />
        </div>
      </div>

      {/* Charts Section with Modern Styling */}
      {(chartData.weekly.length > 0 || chartData.categories.length > 0) && (
        <div className="px-4 md:px-6 mb-6">
          <button
            onClick={() => setChartsOpen(!chartsOpen)}
            className="flex items-center justify-between w-full mb-4 group"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="w-[3px] h-5 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
                Activity Insights
              </h3>
            </div>
            <div
              className={`w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center transition-transform duration-200 ${
                chartsOpen ? "rotate-90" : "-rotate-90"
              }`}
            >
              <ChevronRight className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            </div>
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{
              maxHeight: chartsOpen ? "9999px" : "0px",
              opacity: chartsOpen ? 1 : 0,
            }}
          >
            {chartData.weekly.length > 0 && (
              <ChartCard
                title="This Week"
                data={chartData.weekly}
                type="area"
              />
            )}
            {chartData.categories.length > 0 && (
              <ChartCard
                title="Top Categories"
                data={chartData.categories}
                type="bar"
              />
            )}
          </div>
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
              {/* Your Lost Item Card with Modern Gradient */}
              <div
                className="rounded-xl p-4 mb-4 border border-red-200 dark:border-red-900/30 relative"
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
                      Your Lost Item {myLostItemsList.length > 1 ? `(${currentLostItemIndex + 1}/${myLostItemsList.length})` : ''}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {timeAgo(myLostItem.created_at)}
                    </span>
                    {myLostItemsList.length > 1 && (
                      <div className="flex items-center gap-1 bg-white/50 dark:bg-black/20 rounded-full p-0.5">
                        <button 
                          onClick={handlePrevLostItem}
                          disabled={isSearchingMatches}
                          className="p-1 rounded-full hover:bg-white dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                          <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                        </button>
                        <button 
                          onClick={handleNextLostItem}
                          disabled={isSearchingMatches}
                          className="p-1 rounded-full hover:bg-white dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                          <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <ItemImage
                    imageUrl={myLostItem.thumbnail_url || myLostItem.image_url}
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
              {isSearchingMatches ? (
                <div className="flex flex-col items-center justify-center p-8 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100 dark:border-neutral-800">
                  <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mb-3"></div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Searching for matches...</p>
                </div>
              ) : possibleMatches.length > 0 ? (
                <div>
                  <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">
                    {possibleMatches.length} Possible Match
                    {possibleMatches.length !== 1 ? "es" : ""}
                  </h4>
                  <div className="flex gap-3 overflow-x-auto snap-x py-2 pb-4 scrollbar-hide">
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
          <div className="flex items-center gap-2.5">
            <span
              className="w-[3px] h-5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
              My Active Posts
            </h3>
          </div>
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
          <div className="flex gap-3 overflow-x-auto snap-x py-2 pb-4 scrollbar-hide">
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
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2.5">
            <span
              className="w-[3px] h-5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
              Community Feed
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              Live
            </span>
          </div>
        </div>

        {communityActivity.length > 0 && (
          <div className="flex gap-2 mb-4">
            {["all", "Lost", "Found"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFeedFilter(f);
                  setShowAllFeed(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  feedFilter === f
                    ? "text-white shadow-sm"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
                style={
                  feedFilter === f
                    ? {
                        background:
                          f === "all"
                            ? primaryColor
                            : f === "Lost"
                              ? "#EF4444"
                              : "#10B981",
                      }
                    : {}
                }
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        )}

        {filteredFeed.length > 0 ? (
          <>
            <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl border border-neutral-200 dark:border-[#3a3a3a] shadow-sm overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-700">
              {(showAllFeed ? filteredFeed : filteredFeed.slice(0, 3)).map(
                (item) => (
                  <ActivityItem
                    key={item.id}
                    item={item}
                    onPress={() =>
                      navigate("/dashboard/browse-all", {
                        state: { itemId: item.id },
                      })
                    }
                  />
                ),
              )}
            </div>
            {filteredFeed.length > 3 && (
              <button
                onClick={() => setShowAllFeed(!showAllFeed)}
                className="mt-3 w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150"
              >
                {showAllFeed
                  ? "Show less"
                  : `Show ${filteredFeed.length - 3} more`}
              </button>
            )}
          </>
        ) : (
          <EmptyState
            icon={Activity}
            title={
              feedFilter === "all"
                ? "No recent activity"
                : `No ${feedFilter} items`
            }
            description="Check back later for updates"
          />
        )}
      </div>
    </div>
  );
}
