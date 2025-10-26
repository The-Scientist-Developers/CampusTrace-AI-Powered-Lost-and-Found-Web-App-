import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/apiClient";
import {
  Users,
  Clock,
  FileCheck,
  Percent,
  Activity,
  MessageSquare,
  UserCheck,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Calendar,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// --- Enhanced Stat Card with Trend ---
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  percentage,
  loading,
}) => {
  // Map color to actual Tailwind classes
  const colorClasses = {
    indigo: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-600 dark:text-indigo-400",
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
    },
    green: {
      bg: "bg-green-500/10",
      text: "text-green-600 dark:text-green-400",
    },
    sky: {
      bg: "bg-sky-500/10",
      text: "text-sky-600 dark:text-sky-400",
    },
  };

  const colors = colorClasses[color] || colorClasses.indigo;

  return (
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
          <div>
            {loading ? (
              <>
                <Skeleton width={60} height={32} />
                <Skeleton width={120} height={20} className="mt-1" />
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-neutral-800 dark:text-white">
                  {value}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {title}
                </p>
              </>
            )}
          </div>
        </div>
        {!loading && trend && (
          <div
            className={`flex items-center gap-1 ${
              trend === "up" ? "text-green-500" : "text-red-500"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span className="text-sm font-semibold">{percentage}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Activity Item Enhanced ---
const ActivityItem = ({ text, time, icon: Icon, type }) => {
  const typeColors = {
    post: "text-blue-500",
    user: "text-green-500",
    moderation: "text-amber-500",
    alert: "text-red-500",
  };

  return (
    <li className="flex gap-4 pb-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 rounded-lg p-2 transition-colors">
      <div className="relative">
        <div className="h-full w-px bg-neutral-200 dark:bg-neutral-700 absolute left-1/2 -translate-x-1/2"></div>
        <div
          className={`relative z-10 p-1.5 bg-white dark:bg-[#2a2a2a] rounded-full border-2 border-neutral-200 dark:border-neutral-700`}
        >
          <Icon
            className={`w-4 h-4 ${typeColors[type] || "text-neutral-500"}`}
          />
        </div>
      </div>
      <div className="flex-1">
        <p className="text-neutral-800 dark:text-neutral-200 text-sm">{text}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-500">{time}</p>
      </div>
    </li>
  );
};

// --- Skeleton Components ---
const ChartSkeleton = ({ height = 300 }) => (
  <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] p-6 rounded-xl shadow-sm">
    <Skeleton height={24} width={200} className="mb-6" />
    <Skeleton height={height} />
  </div>
);

const AdminMainPageSkeleton = () => (
  <div className="p-4 sm:p-6 lg:p-8 space-y-8">
    <Skeleton height={40} width={300} />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center gap-4">
            <Skeleton circle width={48} height={48} />
            <div>
              <Skeleton height={32} width={60} />
              <Skeleton height={20} width={120} className="mt-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <ChartSkeleton height={300} />
      </div>
      <ChartSkeleton height={300} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ChartSkeleton height={250} />
      <ChartSkeleton height={250} />
    </div>
  </div>
);

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#2a2a2a] p-3 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700">
        <p className="text-sm font-semibold text-neutral-800 dark:text-white">
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminMainPage({ user }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    awaitingModeration: 0,
    activePosts: 0,
    recoveryRate: 0,
    totalUsersChange: 0,
    moderationChange: 0,
    activePostsChange: 0,
    recoveryRateChange: 0,
  });
  const [weeklyPosts, setWeeklyPosts] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [postStatusDistribution, setPostStatusDistribution] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [hourlyActivity, setHourlyActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdminData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError("User not available to fetch admin data.");
      return;
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const adminUniversityId = profile.university_id;
      if (!adminUniversityId) {
        throw new Error("Admin university not found.");
      }

      // Fetch all data in parallel
      const [
        userCountRes,
        moderationCountRes,
        approvedPostsRes,
        recoveredPostsRes,
        rejectedPostsRes,
        weeklyPostsRes,
        activityRes,
        userGrowthRes,
        hourlyPostsRes,
      ] = await Promise.all([
        // Basic counts
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("university_id", adminUniversityId),
        supabase
          .from("items")
          .select("id", { count: "exact" })
          .eq("moderation_status", "pending")
          .eq("university_id", adminUniversityId),
        supabase
          .from("items")
          .select("id", { count: "exact" })
          .eq("moderation_status", "approved")
          .eq("university_id", adminUniversityId),
        supabase
          .from("items")
          .select("id", { count: "exact" })
          .eq("moderation_status", "recovered")
          .eq("university_id", adminUniversityId),
        supabase
          .from("items")
          .select("id", { count: "exact" })
          .eq("moderation_status", "rejected")
          .eq("university_id", adminUniversityId),
        // Weekly posts
        supabase
          .from("items")
          .select("created_at")
          .gte(
            "created_at",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          )
          .eq("university_id", adminUniversityId),
        // Recent activity
        supabase
          .from("items")
          .select("id, title, created_at, moderation_status")
          .order("created_at", { ascending: false })
          .limit(10)
          .eq("university_id", adminUniversityId),
        // User growth (last 30 days)
        supabase
          .from("profiles")
          .select("created_at")
          .gte(
            "created_at",
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          )
          .eq("university_id", adminUniversityId),
        // Hourly activity (last 24 hours)
        supabase
          .from("items")
          .select("created_at")
          .gte(
            "created_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          )
          .eq("university_id", adminUniversityId),
      ]);

      // Check for errors
      const results = [
        userCountRes,
        moderationCountRes,
        approvedPostsRes,
        recoveredPostsRes,
        rejectedPostsRes,
        weeklyPostsRes,
        activityRes,
        userGrowthRes,
        hourlyPostsRes,
      ];
      for (const res of results) {
        if (res.error) throw res.error;
      }

      // Calculate stats
      const approvedCount = approvedPostsRes.count || 0;
      const recoveredCount = recoveredPostsRes.count || 0;
      const rejectedCount = rejectedPostsRes.count || 0;
      const pendingCount = moderationCountRes.count || 0;
      const totalResolvedPosts = approvedCount + recoveredCount;
      const recoveryRate =
        totalResolvedPosts > 0
          ? Math.round((recoveredCount / totalResolvedPosts) * 100)
          : 0;

      // Calculate trend percentages (mock data for demo)
      setStats({
        totalUsers: userCountRes.count || 0,
        awaitingModeration: pendingCount,
        activePosts: approvedCount,
        recoveryRate: `${recoveryRate}%`,
        totalUsersChange: 12,
        moderationChange: -5,
        activePostsChange: 8,
        recoveryRateChange: 3,
      });

      // Process weekly posts
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const postsPerDay = Array(7)
        .fill(0)
        .map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            name: days[date.getDay()],
            posts: 0,
            date: date.toISOString().split("T")[0],
          };
        });

      weeklyPostsRes.data.forEach((post) => {
        const dayName = days[new Date(post.created_at).getDay()];
        const dayEntry = postsPerDay.find((d) => d.name === dayName);
        if (dayEntry) dayEntry.posts++;
      });
      setWeeklyPosts(postsPerDay);

      // Process user growth data
      const growthData = Array(30)
        .fill(0)
        .map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return {
            day: date.getDate(),
            users: 0,
          };
        });

      userGrowthRes.data.forEach((user) => {
        const day = new Date(user.created_at).getDate();
        const entry = growthData.find((d) => d.day === day);
        if (entry) entry.users++;
      });

      // Calculate cumulative growth
      let cumulative = 0;
      growthData.forEach((d) => {
        cumulative += d.users;
        d.cumulative = cumulative;
      });
      setUserGrowth(growthData);

      // Process hourly activity
      const hours = Array(24)
        .fill(0)
        .map((_, i) => ({
          hour: `${i}:00`,
          activity: 0,
        }));

      hourlyPostsRes.data.forEach((post) => {
        const hour = new Date(post.created_at).getHours();
        hours[hour].activity++;
      });
      setHourlyActivity(hours);

      // Post status distribution
      const distribution = [
        { name: "Approved", value: approvedCount, color: "#10b981" },
        { name: "Pending", value: pendingCount, color: "#f59e0b" },
        { name: "Recovered", value: recoveredCount, color: "#3b82f6" },
        { name: "Rejected", value: rejectedCount, color: "#ef4444" },
      ];
      setPostStatusDistribution(distribution);

      // Process recent activity with types
      const activities = activityRes.data.map((item) => ({
        id: item.id,
        text: `New post: "${item.title}"`,
        time: new Date(item.created_at).toLocaleString(),
        type: item.moderation_status === "pending" ? "moderation" : "post",
        icon:
          item.moderation_status === "pending" ? AlertCircle : MessageSquare,
      }));
      setRecentActivity(activities);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError("Failed to load admin overview data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAdminData();

    // Set up real-time subscriptions
    const itemsSubscription = supabase
      .channel("admin:items")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        () => {
          fetchAdminData();
        }
      )
      .subscribe();

    const profilesSubscription = supabase
      .channel("admin:profiles")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        () => {
          fetchAdminData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(itemsSubscription);
      supabase.removeChannel(profilesSubscription);
    };
  }, [user, fetchAdminData]);

  if (loading) return <AdminMainPageSkeleton />;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const COLORS = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#8b5cf6",
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-neutral-800 dark:text-white">
          Admin Overview
        </h1>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Activity className="w-4 h-4 text-green-500 animate-pulse" />
          <span>Live Updates Active</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="indigo"
          trend="up"
          percentage={stats.totalUsersChange}
          loading={loading}
        />
        <StatCard
          title="Awaiting Moderation"
          value={stats.awaitingModeration}
          icon={Clock}
          color="amber"
          trend="down"
          percentage={Math.abs(stats.moderationChange)}
          loading={loading}
        />
        <StatCard
          title="Active Posts"
          value={stats.activePosts}
          icon={FileCheck}
          color="green"
          trend="up"
          percentage={stats.activePostsChange}
          loading={loading}
        />
        <StatCard
          title="Recovery Rate"
          value={stats.recoveryRate}
          icon={Percent}
          color="sky"
          trend="up"
          percentage={stats.recoveryRateChange}
          loading={loading}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Posts Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white">
              Weekly Post Activity
            </h2>
            <BarChart3 className="w-5 h-5 text-neutral-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyPosts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                stroke="currentColor"
                className="text-neutral-500 dark:text-neutral-400"
                fontSize={12}
              />
              <YAxis
                stroke="currentColor"
                className="text-neutral-500 dark:text-neutral-400"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="posts" radius={[8, 8, 0, 0]}>
                {weeklyPosts.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Post Status Distribution */}
        <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white">
              Post Status
            </h2>
            <PieChart className="w-5 h-5 text-neutral-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RePieChart>
              <Pie
                data={postStatusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {postStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RePieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {postStatusDistribution.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {item.name}
                  </span>
                </div>
                <span className="font-semibold text-neutral-800 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hourly Activity Heatmap */}
        <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white">
              24-Hour Activity Pattern
            </h2>
            <Calendar className="w-5 h-5 text-neutral-400" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="hour"
                stroke="currentColor"
                className="text-neutral-500 dark:text-neutral-400"
                fontSize={10}
                interval={2}
              />
              <YAxis
                stroke="currentColor"
                className="text-neutral-500 dark:text-neutral-400"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="activity"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: "#8b5cf6", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white">
              User Growth (30 days)
            </h2>
            <TrendingUp className="w-5 h-5 text-neutral-400" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="day"
                stroke="currentColor"
                className="text-neutral-500 dark:text-neutral-400"
                fontSize={10}
                interval={4}
              />
              <YAxis
                stroke="currentColor"
                className="text-neutral-500 dark:text-neutral-400"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white">
            Recent Activity
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Auto-refresh</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>
        {recentActivity.length > 0 ? (
          <ul className="space-y-2 max-h-[400px] overflow-y-auto">
            {recentActivity.map((activity) => (
              <ActivityItem
                key={activity.id}
                text={activity.text}
                time={activity.time}
                icon={activity.icon}
                type={activity.type}
              />
            ))}
          </ul>
        ) : (
          <p className="text-neutral-500 dark:text-neutral-500 text-sm text-center py-8">
            No recent activity
          </p>
        )}
      </div>
    </div>
  );
}
