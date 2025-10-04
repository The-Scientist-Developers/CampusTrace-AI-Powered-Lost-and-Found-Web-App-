import React, { useState, useEffect } from "react";
import { LogOut, ArrowRight, Search, EyeOff, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../api/apiClient";

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

const MatchCard = ({ item }) => {
  const isLost = item.status === "Lost";
  const badgeClass = isLost
    ? "bg-red-900/50 text-red-400"
    : "bg-green-900/50 text-green-400";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 transition-colors hover:bg-neutral-800 cursor-pointer">
      <div className="w-full h-32 bg-neutral-800 border border-neutral-700 rounded-md mb-4 flex items-center justify-center">
        {/* You can later use <img src={item.image_url} /> here */}
        <p className="text-neutral-500 text-sm">Image</p>
      </div>
      <h3 className="font-semibold text-neutral-100">{item.item_name}</h3>
      <span
        className={`text-xs font-medium px-2.5 py-0.5 rounded-full mt-2 inline-block ${badgeClass}`}
      >
        {item.status}
      </span>
    </div>
  );
};

const ActivityItem = ({ item }) => {
  return (
    <a
      href="#"
      className="flex items-center gap-4 py-3 hover:bg-neutral-800/50 -mx-4 px-4 rounded-lg transition-colors"
    >
      <div className="w-12 h-12 bg-neutral-800 rounded-md flex-shrink-0 flex items-center justify-center">
        {item.category}
        {item.category === "book" && <BookIcon />}
      </div>
      <div className="flex-grow">
        <p className="font-medium text-neutral-100">{item.item_name}</p>
        <p className="text-sm text-neutral-400">{timeAgo(item.created_at)}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-neutral-500" />
    </a>
  );
};

const EmptyState = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
}) => (
  <div className="text-center bg-neutral-900/50 border border-neutral-800 rounded-lg p-12">
    <Icon className="mx-auto h-12 w-12 text-neutral-600" />
    <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
    <p className="mt-2 text-sm text-neutral-400">{description}</p>
    <button
      onClick={onButtonClick}
      className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-md hover:bg-indigo-700 transition-colors"
    >
      <Plus className="w-4 h-4" />
      {buttonText}
    </button>
  </div>
);

export default function UserMainPage() {
  const [matches, setMatches] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [matchesResponse, activityResponse] = await Promise.all([
          supabase.from("items").select("*").limit(4),
          supabase
            .from("items")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        if (matchesResponse.error) throw matchesResponse.error;
        if (activityResponse.error) throw activityResponse.error;

        setMatches(matchesResponse.data);
        setActivity(activityResponse.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-neutral-400">Loading dashboard...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400">
        Failed to load dashboard data: {error}
      </div>
    );
  }

  return (
    <div className="text-white">
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">
          Suggested Matches
        </h2>
        {matches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {matches.map((item) => (
              <MatchCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No Matches Yet"
            description="When you post a lost item, our AI will automatically find potential matches and show them here."
            buttonText="Post a Lost Item"
            onButtonClick={() => navigate("/dashboard/post-new")}
          />
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
        {activity.length > 0 ? (
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-4 divide-y divide-neutral-800">
            {activity.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={EyeOff}
            title="No Recent Activity"
            description="When you post a lost or found item, it will show up here for you to manage."
            buttonText="Post Your First Item"
            onButtonClick={() => alert("Navigate to New Post Page")}
          />
        )}
      </section>
    </div>
  );
}
