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
  Tag,
  Clock,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase, getAccessToken } from "../../../api/apiClient.js"; //
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
  Cell, // Import Cell for BarChart colors
} from "recharts";
import { useTheme } from "../../../contexts/ThemeContext"; // Import useTheme

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
    primary: "from-primary-500 to-primary-600", // Adjusted to use primary theme color
    green: "from-green-500 to-green-600",
    red: "from-red-500 to-rose-600",
    blue: "from-blue-500 to-cyan-600",
  };

  const iconColors = {
    primary: "text-primary-600 dark:text-primary-400", // Adjusted icon color
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

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }) => {
  const { theme } = useTheme(); // Get current theme

  if (active && payload && payload.length) {
    return (
      <div
        className={`p-3 rounded-lg shadow-lg border ${
          theme === "light"
            ? "bg-white border-neutral-200" // Use light theme colors
            : "bg-[#2a2a2a] border-[#3a3a3a]" // Use dark theme colors
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

// --- Chart Card Component ---
const ChartCard = ({ title, data, type = "area" }) => {
  const { theme } = useTheme(); // Get current theme

  // Define colors based on theme
  const primaryColor = "#674CC4"; //
  const lostColor = "#ef4444"; // Red
  const foundColor = "#22c55e"; // Tailwind green-500
  const axisColor = theme === "light" ? "#555555" : "#a3a3a3"; // light.subtle or neutral-400
  const gridColor = theme === "light" ? "#E3E3E3" : "#3a3a3a"; // light.border or dark.border

  return (
    <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-[#3a3a3a]">
      <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-6">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        {type === "area" ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="day"
              tick={{ fill: axisColor, fontSize: 12 }}
              stroke={axisColor}
            />
            <YAxis
              tick={{ fill: axisColor, fontSize: 12 }}
              stroke={axisColor}
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
              stroke={lostColor}
              fillOpacity={1}
              fill="url(#colorLost)"
              name="Lost"
            />
            <Area
              type="monotone"
              dataKey="found"
              stackId="1"
              stroke={foundColor}
              fillOpacity={1}
              fill="url(#colorFound)"
              name="Found"
            />
          </AreaChart>
        ) : (
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              type="number"
              tick={{ fill: axisColor, fontSize: 12 }}
              stroke={axisColor}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: axisColor, fontSize: 12 }}
              stroke={axisColor}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill={primaryColor}
              radius={[0, 4, 4, 0]}
              name="Count"
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

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
    setLoading(true); // Ensure loading starts
    setError(null); // Clear previous errors
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error("User profile not found."); // Add check

      // Fetch all user's items
      const { data: allMyItems = [], error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id);

      if (itemsError) throw itemsError;

      // Fetch active posts (Ensure statuses are correct)
      const { data: activePosts = [] } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .in("moderation_status", ["approved", "pending", "pending_return"]) // Include relevant statuses
        .order("created_at", { ascending: false })
        .limit(4);

      // Fetch community activity (Ensure university_id exists)
      if (profile.university_id) {
        const { data: communityData = [] } = await supabase
          .from("items")
          .select("*, profiles(id, full_name, email)")
          .eq("university_id", profile.university_id)
          .eq("moderation_status", "approved") // Only show approved items in community feed
          .order("created_at", { ascending: false })
          .limit(50); // Limit community fetch for performance
        setCommunityActivity(communityData);
      } else {
        setCommunityActivity([]); // Set empty if no university_id
        console.warn(
          "User profile does not have a university_id, community activity cannot be fetched."
        );
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

      // Get latest lost item and matches (ensure correct statuses)
      const latestLostItem = allMyItems
        .filter(
          (item) =>
            item.status === "Lost" &&
            item.moderation_status !== "recovered" &&
            item.moderation_status !== "rejected" // Don't show matches for rejected items
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (latestLostItem) {
        setMyLostItem(latestLostItem);
        await fetchMatches(latestLostItem.id);
      } else {
        setMyLostItem(null); // Clear if no lost item found
        setPossibleMatches([]); // Clear matches as well
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Failed to load dashboard data."); // Set more specific error
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async (itemId) => {
    try {
      const token = await getAccessToken(); // Ensure getAccessToken is correctly imported/defined
      if (!token) {
        console.warn("No access token found, cannot fetch matches.");
        return; // Don't proceed without token
      }

      const response = await fetch(
        `${API_BASE_URL}/api/items/find-matches/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        // Check response status
        const errorData = await response.json().catch(() => ({
          detail: "Failed to fetch matches, invalid server response.",
        }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const matches = await response.json();
      // Ensure matches is an array before slicing
      setPossibleMatches(Array.isArray(matches) ? matches.slice(0, 4) : []);
    } catch (err) {
      console.error("Error fetching matches:", err);
      // Optionally show a non-blocking toast
      // toast.error("Could not fetch item matches.");
      setPossibleMatches([]); // Set empty on error
    }
  };

  const processChartData = (items) => {
    // Weekly data
    const weeklyData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString("en", { weekday: "short" });
      const dayItems = items.filter((item) => {
        const itemDate = new Date(item.created_at);
        itemDate.setHours(0, 0, 0, 0); // Normalize item date
        return itemDate.getTime() === date.getTime();
      });
      weeklyData.push({
        day: dayName,
        lost: dayItems.filter((item) => item.status === "Lost").length,
        found: dayItems.filter((item) => item.status === "Found").length,
      });
    }

    // Categories
    const categoryCount = {};
    items.forEach((item) => {
      // Ensure category exists and is a string before counting
      if (item.category && typeof item.category === "string") {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      }
    });

    const categories = Object.entries(categoryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Limit to top 5

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
      <div className="text-center p-12 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-500/30">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400 font-medium">
          Could not load dashboard data.
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
          Error: {error}
        </p>
        <button
          onClick={fetchDashboardData} // Add a retry button
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto space-y-12 px-4 sm:px-6 lg:px-8 py-8">
      {" "}
      {/* Added padding */}
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
      </section>
      {/* Possible Matches Section - IMPROVED */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-500" />{" "}
            {/* Use theme color */}
            AI-Powered Matches
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Smart matching for your lost items
          </p>
        </div>

        {myLostItem ? (
          <div className="space-y-6">
            {/* Display the lost item */}
            <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-900/30 dark:to-neutral-800/30 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-4 uppercase tracking-wider">
                Your Latest Lost Item
              </h3>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-white dark:bg-[#2a2a2a] flex-shrink-0 border border-neutral-200 dark:border-neutral-700">
                  {myLostItem.image_url ? (
                    <img
                      src={myLostItem.image_url}
                      alt={myLostItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                      <Camera className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {" "}
                  {/* Ensure text wraps */}
                  <h4 className="text-xl font-bold text-neutral-800 dark:text-white mb-2 truncate">
                    {myLostItem.title}
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                    {myLostItem.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#2a2a2a] rounded-full text-xs font-medium border border-neutral-200 dark:border-neutral-700">
                      <Tag className="w-3 h-3 text-neutral-500" />
                      {myLostItem.category}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                      <AlertCircle className="w-3 h-3" />
                      Lost
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Display matches */}
            {possibleMatches.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wider">
                  Possible Matches Found ({possibleMatches.length})
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
                description="Our AI is continuously searching. We'll show potential matches here as soon as they're found."
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
      </section>
      {/* Recent Posts Section */}
      <section>
        <SectionHeader
          title="My Active Posts"
          description="Your current lost and found items"
          linkText={myRecentPosts.length > 0 ? "View all posts" : null}
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
            description="Items you post will appear here. Start by reporting a lost or found item."
            buttonText="Post New Item"
            onButtonClick={() => navigate("/dashboard/post-new")}
          />
        )}
      </section>
      {/* Community Activity Section */}
      <section>
        <SectionHeader
          title="Latest Community Activity"
          description={`Recent items reported at your campus`} // Updated description
        />
        {communityActivity.length > 0 ? (
          <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-sm border border-neutral-200 dark:border-[#3a3a3a] overflow-hidden">
            <div className="divide-y divide-neutral-200 dark:divide-[#3a3a3a]">
              {paginatedActivity.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
            {totalPages > 1 && ( // Only show pagination if needed
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={communityActivity.length}
                itemsPerPage={itemsPerPage}
              />
            )}
          </div>
        ) : (
          <EmptyState
            icon={Activity}
            title="No community activity yet"
            description="Approved posts from others on your campus will show up here."
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
      <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-1">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      )}
    </div>
    {linkText && linkTo && (
      <Link
        to={linkTo}
        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium flex items-center gap-1 transition-colors"
      >
        {linkText}
        <ArrowRight className="w-4 h-4" />
      </Link>
    )}
  </div>
);

const MatchCard = ({ item }) => (
  <Link
    to="/dashboard/browse-all" // Link to browse page
    state={{ itemId: item.id }} // Pass item ID to potentially highlight/scroll to it
    className="group bg-white dark:bg-[#2a2a2a] rounded-xl border border-neutral-200 dark:border-[#3a3a3a] overflow-hidden hover:shadow-lg transition-all duration-200 block relative" // Added block and relative
  >
    {item.match_score && (
      <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-primary-500 to-purple-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
        {item.match_score}% Match
      </div>
    )}
    <div className="aspect-square bg-neutral-100 dark:bg-[#1a1a1a] relative overflow-hidden">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" // Slightly subtler zoom
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Camera className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
        </div>
      )}
      {/* Subtle overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-black/20 transition-colors duration-300"></div>
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-neutral-800 dark:text-white line-clamp-1 mb-2">
        {item.title}
      </h3>
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {item.category}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" /> Found
        </span>
      </div>
    </div>
  </Link>
);

const ItemCard = ({ item }) => (
  <Link
    to="/dashboard/browse-all" // Link to browse page
    state={{ itemId: item.id }} // Pass item ID
    className="group bg-white dark:bg-[#2a2a2a] rounded-xl border border-neutral-200 dark:border-[#3a3a3a] overflow-hidden hover:shadow-lg transition-all duration-200 block" // Added block
  >
    <div className="aspect-square bg-neutral-100 dark:bg-[#1a1a1a] relative overflow-hidden">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Camera className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-black/20 transition-colors duration-300"></div>
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-neutral-800 dark:text-white line-clamp-2 mb-3 h-12">
        {" "}
        {/* Fixed height for title */}
        {item.title}
      </h3>
      <div className="flex items-center justify-between">
        <StatusBadge status={item.moderation_status} />
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            item.status === "Lost"
              ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          }`}
        >
          {item.status === "Lost" ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            <CheckCircle className="w-3 h-3" />
          )}
          {item.status}
        </span>
      </div>
    </div>
  </Link>
);

const ActivityItem = ({ item }) => (
  <Link
    to="/dashboard/browse-all" // Link to browse page
    state={{ itemId: item.id }} // Pass item ID
    className="flex items-center gap-4 p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group" // Added group
  >
    <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-[#1a1a1a] overflow-hidden flex-shrink-0 border border-neutral-200 dark:border-[#3a3a3a]">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {/* Display category initial or icon */}
          <Tag className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-neutral-800 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {item.title}
      </p>
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
        {" "}
        {/* Flex wrap for smaller screens */}
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
            item.status === "Lost"
              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          }`}
        >
          {item.status === "Lost" ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            <CheckCircle className="w-3 h-3" />
          )}
          {item.status}
        </span>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {item.category}
        </span>
        <span className="text-sm text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {timeAgo(item.created_at)}
        </span>
      </div>
    </div>
    <ArrowRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:translate-x-1 transition-transform flex-shrink-0" />
  </Link>
);

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => (
  <div className="px-6 py-4 bg-neutral-50 dark:bg-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-200 dark:border-[#3a3a3a]">
    <span className="text-sm text-neutral-600 dark:text-neutral-400 order-2 sm:order-1">
      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
      {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
    </span>
    <div className="flex items-center gap-2 order-1 sm:order-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-neutral-300 dark:border-neutral-600"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="px-3 py-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Page {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-neutral-300 dark:border-neutral-600"
        aria-label="Next page"
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
      <div className="w-14 h-14 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 rounded-full flex items-center justify-center mx-auto mb-5 border border-neutral-200 dark:border-neutral-700">
        <Icon className="w-7 h-7 text-neutral-400 dark:text-neutral-500" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
        {description}
      </p>
      {buttonText && (
        <button
          onClick={onButtonClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          {buttonText}
        </button>
      )}
    </div>
  </div>
);

// timeAgo function remains the same
const timeAgo = (dateString) => {
  if (!dateString) return "unknown time"; // Handle null or undefined dates

  const date = new Date(dateString);
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return "invalid date";
  }

  const seconds = Math.floor((new Date() - date) / 1000);

  // Define time intervals in seconds
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
      // Simple pluralization
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
};
