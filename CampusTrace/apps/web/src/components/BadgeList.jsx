import React from "react";
import { Award, Calendar } from "lucide-react";

const BadgeList = ({ badges, isOwnProfile = false }) => {
  if (!badges || badges.length === 0) {
    return (
      <div className="text-center p-8 sm:p-12 bg-white dark:bg-[#2a2a2a] border-2 border-dashed border-neutral-200 dark:border-[#3a3a3a] rounded-xl">
        <Award className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
        <p className="text-neutral-500 dark:text-neutral-400">
          {isOwnProfile
            ? "No badges earned yet. Keep being active in the community!"
            : "This user hasn't earned any badges yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="badge-list">
      <h2 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-white mb-4 flex items-center gap-2">
        <Award className="w-6 h-6 text-yellow-500" />
        Badges Earned
        <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
          ({badges.length})
        </span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm p-4 flex flex-col items-center hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all group"
            title={badge.badge_description}
          >
            {/* Badge Icon */}
            <div className="badge-icon mb-3 transform group-hover:scale-110 transition-transform">
              {badge.badge_icon_url ? (
                <img
                  src={badge.badge_icon_url}
                  alt={badge.badge_name}
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentElement.innerHTML = `
                      <div class="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <span class="text-3xl">🏆</span>
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🏆</span>
                </div>
              )}
            </div>

            {/* Badge Name */}
            <h4 className="badge-name text-sm font-semibold text-center mb-1 text-neutral-800 dark:text-white">
              {badge.badge_name}
            </h4>

            {/* Badge Description */}
            <p className="badge-description text-xs text-neutral-600 dark:text-neutral-400 text-center mb-2 line-clamp-2">
              {badge.badge_description}
            </p>

            {/* Earned Date */}
            <div className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(badge.earned_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeList;
