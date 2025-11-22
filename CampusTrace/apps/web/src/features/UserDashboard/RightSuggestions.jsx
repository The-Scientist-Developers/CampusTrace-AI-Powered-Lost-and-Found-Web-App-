import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, ArrowRight, User, ChevronRight } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { getAccessToken, API_BASE_URL, supabase } from "../../api/apiClient";
import { useTheme } from "../../contexts/ThemeContext";

const THEME_COLORS = {
  blue: { primary: "#1877F2" },
  purple: { primary: "#A855F7" },
  pink: { primary: "#EC4899" },
  green: { primary: "#22C55E" },
};

// Defined outside to prevent re-render issues
const RankBadge = ({ rank }) => {
  const styles = {
    1: { color: "#EAB308", bg: "rgba(234, 179, 8, 0.1)" }, // Gold
    2: { color: "#94A3B8", bg: "rgba(148, 163, 184, 0.1)" }, // Silver
    3: { color: "#B45309", bg: "rgba(180, 83, 9, 0.1)" }, // Bronze
  };

  const style = styles[rank];

  if (style) {
    return (
      <div
        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {rank}
      </div>
    );
  }

  return (
    <div className="w-6 h-6 flex items-center justify-center text-xs font-medium text-gray-400">
      {rank}
    </div>
  );
};

const RightSuggestions = ({ profile, isOpen = true, onToggle }) => {
  const { theme, colorMode } = useTheme();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === "dark";
  const primaryColor =
    THEME_COLORS[colorMode]?.primary || THEME_COLORS.blue.primary;

  // Centralized colors for consistent theming
  const colors = {
    bg: isDark ? "#1a1a1a" : "#FFFFFF",
    border: isDark ? "#3a3a3a" : "#E5E5E5",
    textPrimary: isDark ? "#FFFFFF" : "#171717",
    textSecondary: isDark ? "#A3A3A3" : "#737373",
    textMuted: isDark ? "#525252" : "#A3A3A3",
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await fetch(
          `${API_BASE_URL}/api/items/leaderboard?limit=5`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();
        setLeaderboard(data);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Set up real-time subscription for profile updates (affects leaderboard)
    if (!profile?.university_id) return;

    const setupRealtime = async () => {
      const channel = supabase
        .channel("leaderboard-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
            filter: `university_id=eq.${profile.university_id}`,
          },
          () => {
            // Refetch leaderboard when any profile in the university updates
            console.log("Profile updated, refreshing leaderboard...");
            fetchLeaderboard();
          }
        )
        .subscribe();

      return channel;
    };

    let channel;
    setupRealtime().then((ch) => {
      channel = ch;
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [profile]);

  return (
    <aside
      className="hidden lg:flex fixed right-0 top-0 bottom-0 w-80 flex-col pt-6 pb-4 transition-all duration-300 ease-in-out"
      style={{
        backgroundColor: colors.bg,
        borderLeft: `1px solid ${colors.border}`,
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
      }}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -left-3 top-6 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 z-50 shadow-lg"
        style={{
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          color: colors.textSecondary,
        }}
        title="Hide suggestions"
      >
        <ChevronRight size={14} />
      </button>
      {/* Header Area: Profile Summary */}
      {profile && (
        <div className="px-6 pb-6">
          <div className="flex items-center gap-4">
            {/* Clean Avatar */}
            <div className="relative flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || "User"}
                  className="w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-gray-800"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {profile.full_name?.[0] || "U"}
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <h2
                className="font-semibold text-base leading-tight truncate"
                style={{ color: colors.textPrimary }}
              >
                {profile.full_name || "Welcome"}
              </h2>
              <Link
                to="/dashboard/profile"
                className="text-xs mt-1 hover:underline truncate"
                style={{ color: primaryColor }}
              >
                View your profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Divider */}
      <div
        className="w-full h-[1px]"
        style={{ backgroundColor: colors.border }}
      />

      {/* Leaderboard Section */}
      <div className="flex-1 px-6 py-6 overflow-y-auto scrollbar-none">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: colors.textSecondary }}
          >
            Top Contributors
          </h3>
          <Trophy size={14} style={{ color: colors.textSecondary }} />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton circle width={32} height={32} />
                <div className="flex-1">
                  <Skeleton height={12} width="70%" />
                  <Skeleton height={10} width="40%" />
                </div>
              </div>
            ))}
          </div>
        ) : leaderboard.length > 0 ? (
          <ul className="space-y-1">
            {leaderboard.map((user, index) => (
              <li
                key={user.user_id}
                className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-neutral-800/50 group"
              >
                <RankBadge rank={index + 1} />

                <div className="flex-shrink-0">
                  <img
                    src={
                      user.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.full_name || "User"
                      )}`
                    }
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full object-cover bg-gray-100"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: colors.textPrimary }}
                  >
                    {user.full_name || "Anonymous"}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: colors.textSecondary }}
                  >
                    {user.recovered_count || 0} items recovered
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              No heroes yet.
            </p>
          </div>
        )}

        {leaderboard.length > 0 && (
          <Link
            to="/dashboard/leaderboard"
            className="flex items-center gap-2 text-xs font-medium mt-4 hover:underline transition-opacity hover:opacity-80"
            style={{ color: colors.textPrimary }}
          >
            See all rankings <ArrowRight size={12} />
          </Link>
        )}
      </div>

      {/* Divider */}
      <div
        className="w-full h-[1px]"
        style={{ backgroundColor: colors.border }}
      />

      {/* Simple Footer */}
      <div className="px-6 py-4">
        <div
          className="flex flex-wrap gap-x-4 gap-y-2 text-[11px]"
          style={{ color: colors.textMuted }}
        >
          <Link
            to="/about"
            className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
          >
            About
          </Link>
          <Link
            to="/learn-more"
            className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
          >
            Help Center
          </Link>
          <Link
            to="/dashboard/settings"
            className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
          >
            Privacy & Terms
          </Link>
        </div>
        <div
          className="mt-2 text-[10px]"
          style={{ color: colors.textMuted, opacity: 0.7 }}
        >
          © {new Date().getFullYear()} CampusTrace Inc.
        </div>
      </div>
    </aside>
  );
};

export default RightSuggestions;
