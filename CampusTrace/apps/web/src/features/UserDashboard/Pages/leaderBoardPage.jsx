import React, { useState, useEffect } from "react";
import { getAccessToken, API_BASE_URL } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { Award, Shield, Star, Trophy, Crown, Zap, Medal } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
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

// --- Skeletons ---
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
  <div className="max-w-4xl mx-auto py-8 px-4">
    <div className="flex justify-center gap-4 mb-12 items-end h-48">
      <Skeleton height={120} width={80} />
      <Skeleton height={160} width={100} />
      <Skeleton height={100} width={80} />
    </div>
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm">
      {[...Array(5)].map((_, i) => (
        <LeaderboardRowSkeleton key={i} />
      ))}
    </div>
  </div>
);

// --- Sub-Component: Podium Item ---
const PodiumItem = ({ user, rank, themeColors }) => {
  const isWinner = rank === 1;

  const getBadgeConfig = () => {
    if (rank === 1)
      return {
        color: "text-yellow-400",
        bg: "bg-yellow-400",
        border: "border-yellow-400",
        height: "h-40 md:h-48",
        scale: "scale-110",
        shadow: "shadow-yellow-400/50",
      };
    if (rank === 2)
      return {
        color: "text-gray-300",
        bg: "bg-gray-300",
        border: "border-gray-300",
        height: "h-32 md:h-36",
        scale: "scale-100",
        shadow: "shadow-gray-400/50",
      };
    if (rank === 3)
      return {
        color: "text-amber-600",
        bg: "bg-amber-600",
        border: "border-amber-600",
        height: "h-24 md:h-28",
        scale: "scale-95",
        shadow: "shadow-amber-600/50",
      };
  };

  const config = getBadgeConfig();

  return (
    <div
      className={`flex flex-col items-center justify-end ${config.scale} z-${
        10 - rank
      } transition-transform hover:-translate-y-2 duration-300`}
    >
      {/* Avatar Section */}
      <div className="relative mb-3 md:mb-4">
        {isWinner && (
          <Crown
            className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-400 animate-bounce"
            fill="currentColor"
          />
        )}

        <div
          className={`relative rounded-full p-1 md:p-1.5 bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 shadow-xl ${config.border} border-2`}
        >
          <img
            src={
              user.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.full_name
              )}&background=random`
            }
            alt={user.full_name}
            className={`w-16 h-16 md:w-24 md:h-24 rounded-full object-cover border-2 border-white dark:border-neutral-800`}
          />

          {/* Rank Badge */}
          <div
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm border-2 border-white dark:border-neutral-800 ${config.bg}`}
          >
            {rank}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="text-center">
        <p
          className={`font-bold text-sm md:text-base text-neutral-800 dark:text-white truncate max-w-[100px] ${
            isWinner ? "text-lg" : ""
          }`}
        >
          {user.full_name.split(" ")[0]}
        </p>
        <div className="flex items-center justify-center gap-1 mt-1 bg-white/50 dark:bg-neutral-800/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
          <Zap className="w-3 h-3 md:w-4 md:h-4 text-amber-500 fill-amber-500" />
          <span className="font-bold text-xs md:text-sm text-neutral-600 dark:text-neutral-300">
            {user.recovered_count}
          </span>
        </div>
      </div>

      {/* Podium Step (Visual Base) */}
      <div
        className={`w-20 md:w-28 mt-3 rounded-t-lg bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 opacity-80 ${config.height}`}
      ></div>
    </div>
  );
};

// --- Sub-Component: List Row (Rank 4+) ---
const LeaderboardRow = ({ user, rank, themeColors }) => {
  const [isAnimated, setIsAnimated] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), (rank - 3) * 50);
    return () => clearTimeout(timer);
  }, [rank]);

  return (
    <div
      className={`flex items-center gap-3 md:gap-4 p-4 md:p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 transition-all duration-500 transform ${
        isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Rank Number */}
      <div className="w-8 md:w-10 flex justify-center flex-shrink-0">
        <span className="font-bold text-sm md:text-base text-neutral-400 dark:text-neutral-500">
          #{rank}
        </span>
      </div>

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={
            user.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.full_name
            )}&background=eef2ff&color=4338ca`
          }
          alt={user.full_name}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover bg-neutral-100"
        />
      </div>

      {/* Name & Title */}
      <div className="flex-grow min-w-0">
        <p className="font-bold text-sm md:text-base text-neutral-800 dark:text-white truncate">
          {user.full_name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Shield className="w-3 h-3 text-primary-500" />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            Campus Scout
          </p>
        </div>
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ backgroundColor: `${themeColors.primary}15` }} // 10% opacity
        >
          <span
            className="font-bold text-sm md:text-base"
            style={{ color: themeColors.primary }}
          >
            {user.recovered_count}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: themeColors.primary }}
          >
            pts
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
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

        const response = await fetch(
          `${API_BASE_URL}/api/items/leaderboard?limit=20`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch leaderboard.");

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

  const topThree = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-10 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-800 dark:text-white mb-3 tracking-tight">
          Campus Heroes{" "}
          <Trophy
            className="inline-block w-8 h-8 md:w-10 md:h-10 text-yellow-500 mb-2"
            fill="currentColor"
          />
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base">
          Celebrating the top contributors keeping our campus safe
        </p>
      </div>

      {/* Podium Section (Top 3) */}
      {topThree.length > 0 && (
        <div className="flex justify-center items-end gap-4 md:gap-8 mb-10 min-h-[280px]">
          {/* Rank 2 */}
          {topThree[1] && (
            <PodiumItem user={topThree[1]} rank={2} themeColors={themeColors} />
          )}

          {/* Rank 1 */}
          {topThree[0] && (
            <PodiumItem user={topThree[0]} rank={1} themeColors={themeColors} />
          )}

          {/* Rank 3 */}
          {topThree[2] && (
            <PodiumItem user={topThree[2]} rank={3} themeColors={themeColors} />
          )}
        </div>
      )}

      {/* List Section (Rest of users) */}
      <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-2xl shadow-sm overflow-hidden">
        {restOfList.length > 0 && (
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Honorable Mentions
            </h3>
          </div>
        )}

        {leaderboard.length > 0 ? (
          <div>
            {restOfList.map((user, index) => (
              <LeaderboardRow
                key={user.user_id}
                user={user}
                rank={index + 4}
                themeColors={themeColors}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Trophy className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
            <h3 className="font-bold text-neutral-700 dark:text-neutral-300">
              Be the first hero!
            </h3>
            <p className="text-sm text-neutral-500">
              Return a lost item to claim the top spot.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
