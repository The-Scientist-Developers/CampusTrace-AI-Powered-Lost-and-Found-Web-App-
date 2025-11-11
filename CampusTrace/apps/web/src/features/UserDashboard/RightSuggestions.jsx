import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, TrendingUp, Trophy, Award, Star } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../api/apiClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to get access token
const getAccessToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
};

// Color mode definitions
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

  const primaryColor =
    THEME_COLORS[colorMode]?.primary || THEME_COLORS.blue.primary;
  const isDark = theme === "dark";

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/items/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Get top 5 for the sidebar
        setLeaderboard(data.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      className="hidden lg:flex fixed right-0 top-0 bottom-0 w-80 flex-col p-6 pt-8 overflow-y-auto"
      style={{
        backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
      }}
    >
      {/* User Profile Card */}
      {profile && (
        <div
          className="p-4 rounded-xl mb-6"
          style={{
            backgroundColor: isDark ? "#262626" : "#fafafa",
          }}
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
                style={{ color: isDark ? "#ffffff" : "#000000" }}
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

      {/* Top Contributors - Leaderboard */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-sm font-semibold"
            style={{ color: isDark ? "#a8a8a8" : "#737373" }}
          >
            Top Contributors
          </h3>
          <Trophy size={16} style={{ color: primaryColor }} />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full animate-pulse"
                  style={{ backgroundColor: isDark ? "#262626" : "#e5e5e5" }}
                />
                <div className="flex-1">
                  <div
                    className="h-4 w-24 rounded animate-pulse mb-1"
                    style={{ backgroundColor: isDark ? "#262626" : "#e5e5e5" }}
                  />
                  <div
                    className="h-3 w-32 rounded animate-pulse"
                    style={{ backgroundColor: isDark ? "#262626" : "#e5e5e5" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {leaderboard.map((user, index) => {
              const rank = index + 1;
              const getRankIcon = () => {
                if (rank === 1) return <Trophy size={18} color="#FFD700" />;
                if (rank === 2) return <Award size={18} color="#C0C0C0" />;
                if (rank === 3) return <Star size={18} color="#CD7F32" />;
                return (
                  <span
                    className="text-sm font-semibold w-5 text-center"
                    style={{ color: isDark ? "#737373" : "#a8a8a8" }}
                  >
                    {rank}
                  </span>
                );
              };

              return (
                <li key={user.user_id} className="flex items-center gap-3">
                  <div className="w-6 flex justify-center">{getRankIcon()}</div>
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: primaryColor + "40" }}
                    >
                      <User size={18} style={{ color: primaryColor }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: isDark ? "#ffffff" : "#000000" }}
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
              );
            })}
          </ul>
        )}

        {leaderboard.length === 0 && !loading && (
          <p
            className="text-sm text-center py-4"
            style={{ color: isDark ? "#a8a8a8" : "#737373" }}
          >
            No contributors yet. Be the first!
          </p>
        )}

        {/* View All Link */}
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

      {/* Footer Links */}
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
