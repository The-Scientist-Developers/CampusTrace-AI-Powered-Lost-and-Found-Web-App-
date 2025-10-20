// import React, { useState, useEffect } from "react";
// import { ArrowRight, EyeOff, Plus, HelpCircle } from "lucide-react";
// import { useNavigate, Link } from "react-router-dom";
// import { supabase } from "../../../api/apiClient";

// export default function UserMainPage({ user }) {
//   const [myRecentPosts, setMyRecentPosts] = useState([]);
//   const [communityActivity, setCommunityActivity] = useState([]);
//   const [possibleMatches, setPossibleMatches] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!user) {
//       setLoading(false);
//       return;
//     }

//     const fetchDashboardData = async () => {
//       try {
//         const { data: profile, error: profileError } = await supabase
//           .from("profiles")
//           .select("university_id")
//           .eq("id", user.id)
//           .single();
//         if (profileError || !profile)
//           throw new Error("Could not find user profile.");
//         const userUniversityId = profile.university_id;

//         const [myPostsRes, communityActivityRes] = await Promise.all([
//           supabase
//             .from("items")
//             .select("*")
//             .eq("user_id", user.id)
//             .order("created_at", { ascending: false })
//             .limit(5),
//           supabase
//             .from("items")
//             .select("*")
//             .eq("university_id", userUniversityId)
//             .eq("moderation_status", "approved")
//             .order("created_at", { ascending: false })
//             .limit(10),
//         ]);

//         if (myPostsRes.error) throw myPostsRes.error;
//         if (communityActivityRes.error) throw communityActivityRes.error;

//         setMyRecentPosts(myPostsRes.data || []);
//         setCommunityActivity(communityActivityRes.data || []);

//         const latestLostItem = myPostsRes.data.find(
//           (item) => item.status === "Lost"
//         );
//         if (latestLostItem) {
//           const {
//             data: { session },
//           } = await supabase.auth.getSession();
//           const token = session?.access_token;
//           if (!token) throw new Error("Not authenticated to find matches.");

//           const response = await fetch(
//             `http://localhost:8000/api/items/find-matches/${latestLostItem.id}`,
//             {
//               headers: {
//                 Authorization: `Bearer ${token}`,
//               },
//             }
//           );
//           if (!response.ok) {
//             throw new Error("Failed to fetch matches from backend.");
//           }
//           const matches = await response.json();
//           setPossibleMatches(matches);
//         }
//       } catch (err) {
//         console.error("Error fetching dashboard data:", err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDashboardData();
//   }, [user]);

//   if (loading)
//     return (
//       <div className="text-center text-neutral-500 dark:text-neutral-400">
//         Loading dashboard...
//       </div>
//     );
//   if (error)
//     return (
//       <div className="text-center text-red-500">
//         Failed to load dashboard data: {error}
//       </div>
//     );

//   return (
//     <div className="space-y-12">
//       <section>
//         <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">
//           Possible Matches For Your Latest Lost Item
//         </h2>
//         {possibleMatches.length > 0 ? (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {possibleMatches.map((item) => (
//               <MatchCard key={`match-${item.id}`} item={item} />
//             ))}
//           </div>
//         ) : (
//           <div className="text-center bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-lg p-12">
//             <HelpCircle className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
//             <h3 className="mt-4 text-lg font-semibold text-neutral-800 dark:text-white">
//               No High-Confidence Matches Found
//             </h3>
//             <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
//               Post a 'Lost' item, and our system will search for matches for
//               you.
//             </p>
//           </div>
//         )}
//       </section>

//       <section>
//         <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">
//           My Recent Posts
//         </h2>
//         {myRecentPosts.length > 0 ? (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {myRecentPosts.map((item) => (
//               <MatchCard
//                 key={`my-post-${item.id}`}
//                 item={item}
//                 showScore={false}
//               />
//             ))}
//           </div>
//         ) : (
//           <EmptyState
//             icon={EyeOff}
//             title="You Haven't Posted Any Items Yet"
//             description="Post a lost or found item to see it here."
//             buttonText="Post a New Item"
//             onButtonClick={() => navigate("/dashboard/post-new")}
//           />
//         )}
//       </section>
//       <section>
//         <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">
//           Recent Community Activity
//         </h2>
//         {communityActivity.length > 0 ? (
//           <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 divide-y divide-neutral-200 dark:divide-neutral-800">
//             {communityActivity.map((item) => (
//               <ActivityItem key={`activity-${item.id}`} item={item} />
//             ))}
//           </div>
//         ) : (
//           <div className="text-center text-neutral-500 p-8 bg-white dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
//             No community activity to show.
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }

// const timeAgo = (date) => {
//   const seconds = Math.floor((new Date() - new Date(date)) / 1000);
//   let interval = seconds / 31536000;
//   if (interval > 1) return `${Math.floor(interval)} years ago`;
//   interval = seconds / 86400;
//   if (interval > 1) return `${Math.floor(interval)} days ago`;
//   interval = seconds / 3600;
//   if (interval > 1) return `${Math.floor(interval)} hours ago`;
//   return `${Math.floor(seconds / 60)} minutes ago`;
// };

// const MatchCard = ({ item, showScore = true }) => {
//   const badgeClass =
//     item.status === "Lost"
//       ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
//       : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400";
//   return (
//     <Link
//       to="/dashboard/browse-all"
//       state={{ itemId: item.id }}
//       className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer group"
//     >
//       {showScore && item.match_score && (
//         <div className="absolute top-2 left-2 z-10 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
//           {item.match_score}% Match
//         </div>
//       )}
//       <div className="w-full h-32 bg-neutral-100 dark:bg-neutral-800 rounded-md mb-4 flex items-center justify-center relative overflow-hidden">
//         {item.image_url ? (
//           <img
//             src={item.image_url}
//             alt={item.title}
//             className="w-full h-full object-cover"
//           />
//         ) : (
//           <p className="text-neutral-500 text-sm">No Image</p>
//         )}
//       </div>
//       <h3 className="font-semibold text-neutral-800 dark:text-white truncate">
//         {item.title}
//       </h3>
//       <span
//         className={`text-xs font-medium px-2.5 py-0.5 rounded-full mt-2 inline-block ${badgeClass}`}
//       >
//         {item.status}
//       </span>
//     </Link>
//   );
// };

// const ActivityItem = ({ item }) => {
//   const statusBadgeClass =
//     item.status === "Lost"
//       ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
//       : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400";
//   return (
//     <Link
//       to="/dashboard/browse-all"
//       state={{ itemId: item.id }}
//       className="flex items-center gap-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 -mx-4 px-4 rounded-lg transition-colors"
//     >
//       <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-md flex-shrink-0 relative overflow-hidden">
//         {item.image_url ? (
//           <img
//             src={item.image_url}
//             alt={item.title}
//             className="w-full h-full object-cover"
//           />
//         ) : (
//           <span className="text-xs text-neutral-500 flex items-center justify-center h-full">
//             {item.category}
//           </span>
//         )}
//       </div>
//       <div className="flex-grow min-w-0">
//         <p className="font-medium text-neutral-800 dark:text-white truncate">
//           {item.title}
//         </p>
//         <div className="flex items-center gap-2 mt-1">
//           <span
//             className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadgeClass}`}
//           >
//             {item.status}
//           </span>
//           <p className="text-sm text-neutral-500 dark:text-neutral-400">
//             {timeAgo(item.created_at)}
//           </p>
//         </div>
//       </div>
//       <ArrowRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
//     </Link>
//   );
// };

// const EmptyState = ({
//   icon: Icon,
//   title,
//   description,
//   buttonText,
//   onButtonClick,
// }) => (
//   <div className="text-center bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-lg p-12">
//     <Icon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
//     <h3 className="mt-4 text-lg font-semibold text-neutral-800 dark:text-white">
//       {title}
//     </h3>
//     <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
//       {description}
//     </p>
//     <button
//       onClick={onButtonClick}
//       className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold text-sm rounded-md hover:bg-primary-700 transition-colors"
//     >
//       <Plus className="w-4 h-4" />
//       {buttonText}
//     </button>
//   </div>
// );


import React, { useState, useEffect } from "react";
import { ArrowRight, EyeOff, Plus, HelpCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../../api/apiClient";

// --- 1. SKELETON IMPORTS ---
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// --- 2. SKELETON COMPONENTS ---

const MatchCardSkeleton = () => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
    <Skeleton height={128} className="rounded-md" /> {/* h-32 */}
    <Skeleton height={24} width="80%" className="mt-4" />
    <Skeleton height={22} width="30%" className="mt-2" />
  </div>
);

const ActivityItemSkeleton = () => (
  <div className="flex items-center gap-4 py-3">
    <Skeleton
      width={48}
      height={48}
      className="rounded-md flex-shrink-0"
    />{" "}
    {/* w-12 h-12 */}
    <div className="flex-grow min-w-0">
      <Skeleton height={20} width="70%" />
      <Skeleton height={16} width="50%" className="mt-1.5" />
    </div>
    <Skeleton width={20} height={20} /> {/* ArrowRight */}
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-12">
    <section>
      <Skeleton height={28} width={400} className="mb-4" /> {/* Section Title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </section>

    <section>
      <Skeleton height={28} width={250} className="mb-4" /> {/* Section Title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </section>

    <section>
      <Skeleton height={28} width={300} className="mb-4" /> {/* Section Title */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 divide-y divide-neutral-200 dark:divide-neutral-800">
        {[...Array(5)].map((_, i) => (
          <ActivityItemSkeleton key={i} />
        ))}
      </div>
    </section>
  </div>
);

export default function UserMainPage({ user }) {
  const [myRecentPosts, setMyRecentPosts] = useState([]);
  const [communityActivity, setCommunityActivity] = useState([]);
  const [possibleMatches, setPossibleMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // --- (No changes to your useEffect logic) ---
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
        if (profileError || !profile)
          throw new Error("Could not find user profile.");
        const userUniversityId = profile.university_id;

        const [myPostsRes, communityActivityRes] = await Promise.all([
          supabase
            .from("items")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("items")
            .select("*")
            .eq("university_id", userUniversityId)
            .eq("moderation_status", "approved")
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        if (myPostsRes.error) throw myPostsRes.error;
        if (communityActivityRes.error) throw communityActivityRes.error;

        setMyRecentPosts(myPostsRes.data || []);
        setCommunityActivity(communityActivityRes.data || []);

        const latestLostItem = myPostsRes.data.find(
          (item) => item.status === "Lost"
        );
        if (latestLostItem) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const token = session?.access_token;
          if (!token) throw new Error("Not authenticated to find matches.");

          const response = await fetch(
            `http://localhost:8000/api/items/find-matches/${latestLostItem.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!response.ok) {
            throw new Error("Failed to fetch matches from backend.");
          }
          const matches = await response.json();
          setPossibleMatches(matches);
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

  // --- 3. UPDATED LOADING CHECK ---
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error)
    return (
      <div className="text-center text-red-500">
        Failed to load dashboard data: {error}
      </div>
    );

  return (
    <div className="space-y-12">
      {/* --- (No changes to your JSX return) --- */}
      <section>
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">
          Possible Matches For Your Latest Lost Item
        </h2>
        {possibleMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {possibleMatches.map((item) => (
              <MatchCard key={`match-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-lg p-12">
            <HelpCircle className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
            <h3 className="mt-4 text-lg font-semibold text-neutral-800 dark:text-white">
              No High-Confidence Matches Found
            </h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Post a 'Lost' item, and our system will search for matches for
              you.
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">
          My Recent Posts
        </h2>
        {myRecentPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myRecentPosts.map((item) => (
              <MatchCard
                key={`my-post-${item.id}`}
                item={item}
                showScore={false}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={EyeOff}
            title="You Haven't Posted Any Items Yet"
            description="Post a lost or found item to see it here."
            buttonText="Post a New Item"
            onButtonClick={() => navigate("/dashboard/post-new")}
          />
        )}
      </section>
      <section>
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">
          Recent Community Activity
        </h2>
        {communityActivity.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 divide-y divide-neutral-200 dark:divide-neutral-800">
            {communityActivity.map((item) => (
              <ActivityItem key={`activity-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center text-neutral-500 p-8 bg-white dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
            No community activity to show.
          </div>
        )}
      </section>
    </div>
  );
}

// --- (No changes to your helper components) ---
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)} years ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)} days ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)} hours ago`;
  return `${Math.floor(seconds / 60)} minutes ago`;
};

const MatchCard = ({ item, showScore = true }) => {
  const badgeClass =
    item.status === "Lost"
      ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
      : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400";
  return (
    <Link
      to="/dashboard/browse-all"
      state={{ itemId: item.id }}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer group"
    >
      {showScore && item.match_score && (
        <div className="absolute top-2 left-2 z-10 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          {item.match_score}% Match
        </div>
      )}
      <div className="w-full h-32 bg-neutral-100 dark:bg-neutral-800 rounded-md mb-4 flex items-center justify-center relative overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <p className="text-neutral-500 text-sm">No Image</p>
        )}
      </div>
      <h3 className="font-semibold text-neutral-800 dark:text-white truncate">
        {item.title}
      </h3>
      <span
        className={`text-xs font-medium px-2.5 py-0.5 rounded-full mt-2 inline-block ${badgeClass}`}
      >
        {item.status}
      </span>
    </Link>
  );
};

const ActivityItem = ({ item }) => {
  const statusBadgeClass =
    item.status === "Lost"
      ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
      : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400";
  return (
    <Link
      to="/dashboard/browse-all"
      state={{ itemId: item.id }}
      className="flex items-center gap-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 -mx-4 px-4 rounded-lg transition-colors"
    >
      <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-md flex-shrink-0 relative overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-neutral-500 flex items-center justify-center h-full">
            {item.category}
          </span>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-medium text-neutral-800 dark:text-white truncate">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadgeClass}`}
          >
            {item.status}
          </span>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {timeAgo(item.created_at)}
          </p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
    </Link>
  );
};

const EmptyState = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
}) => (
  <div className="text-center bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-lg p-12">
    <Icon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
    <h3 className="mt-4 text-lg font-semibold text-neutral-800 dark:text-white">
      {title}
    </h3>
    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
      {description}
    </p>
    <button
      onClick={onButtonClick}
      className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold text-sm rounded-md hover:bg-primary-700 transition-colors"
    >
      <Plus className="w-4 h-4" />
      {buttonText}
    </button>
  </div>
);