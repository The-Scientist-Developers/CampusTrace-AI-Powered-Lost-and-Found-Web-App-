import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-lg bg-${color}-500/10`}>
      <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
    </div>
    <div>
      <p className="text-3xl font-bold text-neutral-800 dark:text-white">
        {value}
      </p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
    </div>
  </div>
);

const ActivityItem = ({ text, time, icon: Icon }) => (
  <li className="flex gap-4 pb-4">
    <div className="relative">
      <div className="h-full w-px bg-neutral-200 dark:bg-neutral-700"></div>
      <div className="absolute left-1/2 top-1 -translate-x-1/2 p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
        <Icon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
      </div>
    </div>
    <div>
      <p className="text-neutral-800 dark:text-neutral-200 text-sm">{text}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-500">{time}</p>
    </div>
  </li>
);

export default function AdminMainPage({ user }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    awaitingModeration: 0,
    activePosts: 0,
    recoveryRate: 0,
  });
  const [weeklyPosts, setWeeklyPosts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError("User not available to fetch admin data.");
      return;
    }

    const fetchAdminData = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("university_id")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        const adminUniversityId = profile.university_id;
        if (!adminUniversityId) {
          throw new Error(
            "Admin university not found. Please ensure the admin profile has a university ID."
          );
        }

        const [
          userCountRes,
          moderationCountRes,
          approvedPostsRes,
          recoveredPostsRes,
          weeklyPostsRes,
          activityRes,
        ] = await Promise.all([
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
            .select("created_at")
            .gte(
              "created_at",
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            )
            .eq("university_id", adminUniversityId),
          supabase
            .from("items")
            .select("title, created_at")
            .order("created_at", { ascending: false })
            .limit(5)
            .eq("university_id", adminUniversityId),
        ]);

        const results = [
          userCountRes,
          moderationCountRes,
          approvedPostsRes,
          recoveredPostsRes,
          weeklyPostsRes,
          activityRes,
        ];
        for (const res of results) {
          if (res.error) throw res.error;
        }

        const approvedCount = approvedPostsRes.count || 0;
        const recoveredCount = recoveredPostsRes.count || 0;
        const totalResolvedPosts = approvedCount + recoveredCount;
        const recoveryRate =
          totalResolvedPosts > 0
            ? Math.round((recoveredCount / totalResolvedPosts) * 100)
            : 0;

        setStats({
          totalUsers: userCountRes.count || 0,
          awaitingModeration: moderationCountRes.count || 0,
          activePosts: approvedCount,
          recoveryRate: `${recoveryRate}%`,
        });

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const postsPerDay = Array(7)
          .fill(0)
          .map((_, i) => ({
            name: days[(new Date().getDay() - 6 + i + 7) % 7],
            posts: 0,
          }));

        weeklyPostsRes.data.forEach((post) => {
          const dayName = days[new Date(post.created_at).getDay()];
          const dayEntry = postsPerDay.find((d) => d.name === dayName);
          if (dayEntry) dayEntry.posts++;
        });
        setWeeklyPosts(postsPerDay);
        setRecentActivity(activityRes.data || []);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError("Failed to load admin overview data. " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8 text-neutral-500 dark:text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        Loading Admin Overview...
      </div>
    );
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      <h1 className="text-4xl font-bold text-neutral-800 dark:text-white">
        Admin Overview
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Posts Awaiting Moderation"
          value={stats.awaitingModeration}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Total Active Posts"
          value={stats.activePosts}
          icon={FileCheck}
          color="green"
        />
        <StatCard
          title="Recovery Rate"
          value={stats.recoveryRate}
          icon={Percent}
          color="sky"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-6">
            Posts Per Week
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={weeklyPosts}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <XAxis
                dataKey="name"
                stroke="currentColor"
                className="text-neutral-500"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="currentColor"
                className="text-neutral-500"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(156, 163, 175, 0.1)" }}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "#374151" }}
              />
              <Bar dataKey="posts" radius={[4, 4, 0, 0]}>
                {weeklyPosts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={"#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-6">
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
            <ul className="space-y-4">
              {recentActivity.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  text={`New post: "${activity.title}"`}
                  time={new Date(activity.created_at).toLocaleString()}
                  icon={MessageSquare}
                />
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 dark:text-neutral-500 text-sm">
              No recent activity for this university.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
