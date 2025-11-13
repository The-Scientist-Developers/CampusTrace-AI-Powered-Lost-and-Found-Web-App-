import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Trophy, Award, Star } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { supabase, getAccessToken, API_BASE_URL } from "../../api/apiClient";
import { useTheme } from "../../contexts/ThemeContext";

const THEME_COLORS = {
  blue: { primary: "#1877F2" },
  purple: { primary: "#A855F7" },
  pink: { primary: "#EC4899" },
  green: { primary: "#22C55E" },
};

const RightSuggestions = ({ profile }) => {
  const { theme, colorMode } = useTheme();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === "dark";
  const primaryColor =
    THEME_COLORS[colorMode]?.primary || THEME_COLORS.blue.primary;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/items/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch leaderboard");

        const data = await res.json();
        setLeaderboard(data.slice(0, 5));
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const RankIcon = ({ rank }) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Award className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Star className="w-5 h-5 text-yellow-600" />;
    return (
      <span className="font-semibold text-neutral-400 dark:text-neutral-500 w-5 text-center">
        {rank}
      </span>
    );
  };

  return (
    <aside
      className={`hidden lg:flex fixed right-0 top-0 bottom-0 w-80 flex-col p-6 pt-8 overflow-y-auto ${
        isDark ? "bg-[#1a1a1a]" : "bg-white"
      }`}
    >
      {/* Profile Section */}
      {profile && (
        <div
          className={`p-4 rounded-xl mb-6 ${
            isDark ? "bg-[#262626]" : "bg-neutral-50"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <User size={24} color="#ffffff" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p
                className="font-semibold truncate"
                style={{ color: isDark ? "#fff" : "#000" }}
              >
                {profile.full_name || "User"}
              </p>
              <p
                className="text-sm truncate"
                style={{ color: isDark ? "#a8a8a8" : "#737373" }}
              >
                @{profile.email?.split("@")[0]}
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/profile"
            className="text-sm font-semibold hover:underline"
            style={{ color: primaryColor }}
          >
            View Profile
          </Link>
        </div>
      )}

      {/* Leaderboard Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-sm font-semibold"
            style={{ color: isDark ? "#a8a8a8" : "#737373" }}
          >
            Top Heroes
          </h3>
          <Trophy size={16} style={{ color: primaryColor }} />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton circle width={40} height={40} />
                <div className="flex-1">
                  <Skeleton height={14} width="60%" />
                  <Skeleton height={12} width="40%" className="mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : leaderboard.length > 0 ? (
          <ul className="space-y-3">
            {leaderboard.map((user, index) => (
              <li
                key={user.user_id}
                className="flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 p-2 rounded-lg transition"
              >
                <div className="w-5 flex justify-center">
                  <RankIcon rank={index + 1} />
                </div>

                <img
                  src={
                    user.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.full_name
                    )}&background=eef2ff&color=4338ca`
                  }
                  alt={user.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: isDark ? "#fff" : "#000" }}
                  >
                    {user.full_name || "Anonymous"}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: isDark ? "#a8a8a8" : "#737373" }}
                  >
                    {user.recovered_count || 0} items returned
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p
            className="text-sm text-center py-4"
            style={{ color: isDark ? "#a8a8a8" : "#737373" }}
          >
            No contributors yet. Be the first!
          </p>
        )}

        {/* View Full Leaderboard */}
        {leaderboard.length > 0 && (
          <Link
            to="/dashboard/leaderboard"
            className="block text-sm font-semibold text-center mt-4 hover:underline"
            style={{ color: primaryColor }}
          >
            View Full Leaderboard
          </Link>
        )}
      </div>

      {/* Footer */}
      <div
        className="mt-auto pt-6 border-t"
        style={{ borderColor: isDark ? "#262626" : "#dbdbdb" }}
      >
        <div
          className="flex flex-wrap gap-2 text-xs mb-3"
          style={{ color: isDark ? "#737373" : "#a8a8a8" }}
        >
          <Link to="/about" className="hover:underline">
            About
          </Link>
          <span>·</span>
          <Link to="/learn-more" className="hover:underline">
            Help
          </Link>
          <span>·</span>
          <Link to="/dashboard/settings" className="hover:underline">
            Settings
          </Link>
        </div>
        <p
          className="text-xs"
          style={{ color: isDark ? "#737373" : "#a8a8a8" }}
        >
          © {new Date().getFullYear()} CampusTrace. All rights reserved.
        </p>
      </div>
    </aside>
  );
};

export default RightSuggestions;
