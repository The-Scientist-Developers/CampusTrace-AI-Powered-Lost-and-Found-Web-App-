import React, { useState, useEffect } from "react";
import { supabase, getAccessToken } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { Award, Loader2, Shield, Star, Trophy } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const LeaderboardRowSkeleton = () => (
  <div className="flex items-center gap-4 p-4">
    <Skeleton width={32} height={32} />
    <Skeleton circle width={48} height={48} />
    <div className="flex-grow">
      <Skeleton height={20} width="40%" />
      <Skeleton height={16} width="20%" className="mt-1" />
    </div>
    <Skeleton height={28} width={80} />
  </div>
);

const LeaderboardPageSkeleton = () => (
  <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <Skeleton height={40} width={300} />
    <Skeleton height={20} width={400} className="mt-2 mb-8" />
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm">
      {[...Array(5)].map((_, i) => (
        <LeaderboardRowSkeleton key={i} />
      ))}
    </div>
  </div>
);

const LeaderboardRow = ({ user, rank }) => {
  const rankColor = {
    1: "text-yellow-400",
    2: "text-gray-400",
    3: "text-yellow-600",
  };

  const RankIcon = ({ rank }) => {
    if (rank === 1) return <Trophy className={`w-6 h-6 ${rankColor[rank]}`} />;
    if (rank === 2) return <Award className={`w-6 h-6 ${rankColor[rank]}`} />;
    if (rank === 3) return <Star className={`w-6 h-6 ${rankColor[rank]}`} />;
    return (
      <span className="font-semibold text-neutral-400 dark:text-neutral-500 w-6 text-center">
        {rank}
      </span>
    );
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors">
      <div className="w-8 text-center">
        <RankIcon rank={rank} />
      </div>
      <img
        src={
          user.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.full_name
          )}&background=eef2ff&color=4338ca`
        }
        alt={user.full_name}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="flex-grow">
        <p className="font-semibold text-neutral-800 dark:text-white">
          {user.full_name}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Rank {rank}
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg text-primary-600 dark:text-primary-400">
          {user.recovered_count}
        </p>
        <p className="text-xs text-neutral-500">Items Returned</p>
      </div>
    </div>
  );
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error("Authentication required.");

        const response = await fetch(
          "http://localhost:8000/api/items/leaderboard",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Failed to fetch leaderboard.");
        }

        const data = await response.json();
        setLeaderboard(data);
      } catch (error) {
        toast.error(error.message);
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return <LeaderboardPageSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="text-center mb-12">
        <Trophy className="mx-auto h-12 w-12 text-primary-600 mb-4" />
        <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-800 dark:text-white">
          Community Leaderboard
        </h1>
        <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
          Top users who have helped return the most items on campus.
        </p>
      </div>

      <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm divide-y divide-neutral-200 dark:divide-[#3a3a3a]">
        {leaderboard.length > 0 ? (
          leaderboard.map((user, index) => (
            <LeaderboardRow key={user.user_id} user={user} rank={index + 1} />
          ))
        ) : (
          <div className="p-12 text-center text-neutral-500">
            <p>
              The leaderboard is currently empty. Be the first to return an
              item!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
