import React, { useState, useEffect } from "react";
import { getAccessToken } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { Award, Shield, Star, Trophy } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { API_BASE_URL } from "../../../api/apiClient";
import { useTheme } from "../../../contexts/ThemeContext";

// Theme color helper
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
  const [isAnimated, setIsAnimated] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), rank * 50);
    return () => clearTimeout(timer);
  }, [rank]);

  const getRankBadge = () => {
    if (rank === 1) {
      return (
        <div className="relative transform -rotate-12">
          <Trophy className="w-6 h-6 md:w-7 md:h-7 text-yellow-400 fill-yellow-400" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <Award className="w-6 h-6 md:w-7 md:h-7 text-gray-400 fill-gray-400" />
      );
    }
    if (rank === 3) {
      return (
        <Star className="w-6 h-6 md:w-7 md:h-7 text-yellow-600 fill-yellow-600" />
      );
    }
    return (
      <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <span className="font-bold text-sm md:text-base text-neutral-600 dark:text-neutral-400">
          {rank}
        </span>
      </div>
    );
  };

  const getRowStyle = () => {
    if (rank === 1)
      return "bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/10 border-l-4 border-yellow-400";
    if (rank === 2)
      return "bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/10 border-l-4 border-gray-400";
    if (rank === 3)
      return "bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/10 border-l-4 border-yellow-600";
    return "";
  };

  return (
    <div
      className={`flex items-center gap-3 md:gap-4 p-4 md:p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-all duration-300 ${getRowStyle()} ${
        isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${rank * 50}ms` }}
    >
      <div className="w-8 md:w-10 flex justify-center flex-shrink-0">
        {getRankBadge()}
      </div>

      <div className="relative flex-shrink-0">
        <img
          src={
            user.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.full_name
            )}&background=eef2ff&color=4338ca`
          }
          alt={user.full_name}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-3 border-white dark:border-neutral-700 shadow-md"
        />
        {rank <= 3 && (
          <div
            className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold text-white border-2 border-white dark:border-neutral-800 ${
              rank === 1
                ? "bg-yellow-400"
                : rank === 2
                ? "bg-gray-400"
                : "bg-yellow-600"
            }`}
          >
            TOP {rank}
          </div>
        )}
      </div>

      <div className="flex-grow min-w-0">
        <p className="font-bold text-base md:text-lg text-neutral-800 dark:text-white truncate">
          {user.full_name}
        </p>
        <div className="flex items-center gap-1.5 md:gap-2 mt-1">
          <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-500 flex-shrink-0" />
          <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 truncate">
            {user.recovered_count} items reunited
          </p>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-600 dark:text-primary-400" />
          <span className="font-bold text-lg md:text-xl text-primary-600 dark:text-primary-400">
            {user.recovered_count}
          </span>
        </div>
        <p className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Points
        </p>
      </div>
    </div>
  );
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { colorMode } = useTheme();
  const themeColors = getThemeColors(colorMode);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error("Authentication required.");

        const response = await fetch(`${API_BASE_URL}/api/items/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

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
    <div className="max-w-5xl mx-auto py-6 md:py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      {/* Enhanced Header - Theme-Responsive */}
      <div className="text-center mb-8 md:mb-12">
        <div
          className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-full mb-4 md:mb-6 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.dark})`,
          }}
        >
          <Trophy
            className="w-8 h-8 md:w-10 md:h-10 text-white"
            strokeWidth={2.5}
          />
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-800 dark:text-white mb-3 md:mb-4">
          🏆 Leaderboard
        </h1>
        <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto px-4">
          Top heroes who reunited items with their owners
        </p>
      </div>

      {/* Leaderboard Card - Mobile Optimized */}
      <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-2xl shadow-lg overflow-hidden">
        {leaderboard.length > 0 ? (
          <div className="divide-y divide-neutral-200 dark:divide-[#3a3a3a]">
            {leaderboard.map((user, index) => (
              <LeaderboardRow key={user.user_id} user={user} rank={index + 1} />
            ))}
          </div>
        ) : (
          <div className="p-12 md:p-16 text-center">
            <div
              className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl mb-4 mx-auto"
              style={{
                background: "linear-gradient(135deg, #E5E7EB15, #E5E7EB05)",
              }}
            >
              <Trophy className="w-10 h-10 md:w-12 md:h-12 text-neutral-300 dark:text-neutral-600" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              No Heroes Yet
            </h3>
            <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400">
              Be the first to return an item and claim the top spot!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
