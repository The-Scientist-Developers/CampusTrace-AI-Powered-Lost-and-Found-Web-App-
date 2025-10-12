// In CampusTrace-FrontEnd/src/features/UserDashboard/Pages/userMainPage.jsx

import React, { useState, useEffect } from "react";
import {
  LogOut,
  ArrowRight,
  Search,
  EyeOff,
  Plus,
  HelpCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../api/apiClient";

export default function UserMainPage({ user }) {
  const [myRecentPosts, setMyRecentPosts] = useState([]);
  const [communityActivity, setCommunityActivity] = useState([]);
  const [possibleMatches, setPossibleMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

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

        if (profileError || !profile) {
          throw new Error(
            "Could not find user profile to determine university."
          );
        }
        const userUniversityId = profile.university_id;

        const [myLostItemsRes, myFoundItemsRes, communityActivityRes] =
          await Promise.all([
            supabase
              .from("items")
              .select("*")
              .eq("user_id", user.id)
              .eq("status", "Lost") // Corrected from 'category'
              .order("created_at", { ascending: false })
              .limit(5),
            supabase
              .from("items")
              .select("*")
              .eq("user_id", user.id)
              .eq("status", "Found") // Corrected from 'category'
              .order("created_at", { ascending: false })
              .limit(5),
            supabase
              .from("items")
              .select("*")
              .eq("university_id", userUniversityId)
              .order("created_at", { ascending: false })
              .limit(10),
          ]);

        if (myLostItemsRes.error) throw myLostItemsRes.error;
        if (communityActivityRes.error) throw communityActivityRes.error;

        const userLostItems = myLostItemsRes.data || [];
        const userFoundItems = myFoundItemsRes.data || [];
        const merged = [...userLostItems, ...userFoundItems]
          .filter(Boolean)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setMyRecentPosts(merged);
        setCommunityActivity(communityActivityRes.data || []);

        if (userLostItems.length > 0) {
          const lostItemCategories = [
            ...new Set(userLostItems.map((item) => item.category)),
          ];

          const { data: matchesData, error: matchesError } = await supabase
            .from("items")
            .select("*")
            .eq("university_id", userUniversityId)
            .eq("status", "Found") // Corrected from 'category'
            .not("user_id", "eq", user.id)
            .in("category", lostItemCategories)
            .limit(4);

          if (matchesError) throw matchesError;
          setPossibleMatches(matchesData || []);
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
    <div className="text-white space-y-12">
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">
          Possible Matches For Your Lost Items
        </h2>
        {possibleMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {possibleMatches.map((item) => (
              <MatchCard key={`match-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center bg-neutral-900/50 border border-neutral-800 rounded-lg p-12">
            <HelpCircle className="mx-auto h-12 w-12 text-neutral-600" />
            <h3 className="mt-4 text-lg font-semibold text-white">
              No Matches Found Yet
            </h3>
            <p className="mt-2 text-sm text-neutral-400">
              When a "Found" item that matches the category of one of your
              "Lost" items is posted, it will appear here.
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">My Recent Posts</h2>
        {myRecentPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myRecentPosts.map((item) => (
              <MatchCard key={`my-post-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={EyeOff}
            title="You Haven't Posted Any Lost Items Yet"
            description="Post a lost item, and our system will start looking for matches for you."
            buttonText="Post a Lost Item"
            onButtonClick={() => navigate("/dashboard/post-new")}
          />
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">
          Recent Community Activity (Lost & Found)
        </h2>
        {communityActivity.length > 0 ? (
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-4 divide-y divide-neutral-800">
            {communityActivity.map((item) => (
              <ActivityItem key={`activity-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center text-neutral-500 p-8 bg-neutral-900/50 rounded-lg">
            No community activity to show right now.
          </div>
        )}
      </section>
    </div>
  );
}

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
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 transition-transform hover:scale-105 cursor-pointer">
      <div className="w-full h-32 bg-neutral-800 border border-neutral-700 rounded-md mb-4 flex items-center justify-center relative overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <p className="text-neutral-500 text-sm">No Image</p>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs font-medium px-2 py-1 truncate opacity-0 hover:opacity-100 transition-opacity">
          {item.title}
        </div>
      </div>
      <h3 className="font-semibold text-neutral-100 truncate">{item.title}</h3>
      <span
        className={`text-xs font-medium px-2.5 py-0.5 rounded-full mt-2 inline-block ${badgeClass}`}
      >
        {item.status}
      </span>
    </div>
  );
};

const ActivityItem = ({ item }) => {
  const isLost = item.status === "Lost";
  const statusBadgeClass = isLost
    ? "bg-red-900/50 text-red-400"
    : "bg-green-900/50 text-green-400";

  return (
    <a
      href="#"
      className="flex items-center gap-4 py-3 hover:bg-neutral-800/50 -mx-4 px-4 rounded-lg transition-colors"
    >
      <div className="w-12 h-12 bg-neutral-800 rounded-md flex-shrink-0 flex items-center justify-center relative overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <span className="text-xs text-neutral-500">{item.category}</span>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs font-medium px-1 py-0.5 truncate opacity-0 hover:opacity-100 transition-opacity">
          {item.title}
        </div>
      </div>
      <div className="flex-grow">
        <p className="font-medium text-neutral-100 truncate">{item.title}</p>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadgeClass}`}
          >
            {item.status}
          </span>
          <p className="text-sm text-neutral-400">{timeAgo(item.created_at)}</p>
        </div>
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
    <p className="mt-2 text-sm text-neutral-400 max-w-md mx-auto">
      {description}
    </p>
    <button
      onClick={onButtonClick}
      className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-red text-white font-semibold text-sm rounded-md hover:bg-red/80 transition-colors"
    >
      <Plus className="w-4 h-4" />
      {buttonText}
    </button>
  </div>
);
