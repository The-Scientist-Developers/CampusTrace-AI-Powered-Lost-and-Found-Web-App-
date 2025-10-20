// import React, { useState, useEffect, useCallback } from "react";
// import { supabase } from "../../../api/apiClient";
// import { toast } from "react-hot-toast";
// import {
//   ImageIcon,
//   Loader2,
//   Trash2,
//   Check,
//   X,
//   Send,
//   Inbox,
// } from "lucide-react";

// // API client for claim actions
// const apiClient = {
//   async getAccessToken() {
//     const { data } = await supabase.auth.getSession();
//     return data?.session?.access_token || null;
//   },
//   async respondToClaim(claimId, approved) {
//     const token = await this.getAccessToken();
//     const response = await fetch(
//       `http://localhost:8000/api/claims/${claimId}/respond`,
//       {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ approved }),
//       }
//     );
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.detail || "Failed to respond to claim.");
//     }
//     return response.json();
//   },
//   async markAsRecovered(itemId) {
//     const token = await this.getAccessToken();
//     const response = await fetch(
//       `http://localhost:8000/api/items/${itemId}/recover`,
//       {
//         method: "PUT",
//         headers: { Authorization: `Bearer ${token}` },
//       }
//     );
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.detail || "Failed to mark item as recovered.");
//     }
//     return response.json();
//   },
// };

// const StatusBadge = ({ status }) => {
//   let colorClass = "";
//   let text = "";

//   switch (status?.toLowerCase()) {
//     case "approved":
//       colorClass =
//         "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
//       text = "Active";
//       break;
//     case "pending":
//       colorClass =
//         "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400";
//       text = "Pending Review";
//       break;
//     case "rejected":
//       colorClass =
//         "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400";
//       text = "Rejected";
//       break;
//     case "recovered":
//       colorClass =
//         "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
//       text = "Recovered";
//       break;
//     case "pending_return":
//       colorClass =
//         "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400";
//       text = "Pending Return";
//       break;
//     default:
//       colorClass =
//         "bg-neutral-100 text-neutral-800 dark:bg-zinc-500/20 dark:text-zinc-400";
//       text = "Unknown";
//   }

//   return (
//     <span
//       className={`px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}
//     >
//       {text}
//     </span>
//   );
// };

// // Component to display an incoming claim
// const ClaimCard = ({ claim, onRespond }) => (
//   <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700/50">
//     <div className="flex items-start gap-3">
//       <div className="flex-1">
//         <p className="text-sm font-semibold text-neutral-800 dark:text-white">
//           Claim by: {claim.claimant.full_name || claim.claimant.email}
//         </p>
//         <blockquote className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 border-l-2 border-primary-500 pl-3 italic">
//           "{claim.verification_message}"
//         </blockquote>
//       </div>
//       <div className="flex gap-2 flex-shrink-0">
//         <button
//           onClick={() => onRespond(claim.id, true)}
//           className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
//           title="Approve Claim"
//         >
//           <Check className="w-4 h-4" />
//         </button>
//         <button
//           onClick={() => onRespond(claim.id, false)}
//           className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
//           title="Reject Claim"
//         >
//           <X className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   </div>
// );

// export default function MyPostsPage({ user }) {
//   const [posts, setPosts] = useState([]);
//   const [claims, setClaims] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("myPosts");
//   const [postStatusFilter, setPostStatusFilter] = useState("active");
//   const [error, setError] = useState(null);

//   const fetchClaims = async (foundItems) => {
//     if (foundItems.length === 0) return;
//     try {
//       const token = await apiClient.getAccessToken();
//       const claimsPromises = foundItems.map((item) =>
//         fetch(`http://localhost:8000/api/claims/item/${item.id}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         }).then((res) => res.json())
//       );
//       const claimsResults = await Promise.all(claimsPromises);
//       const newClaims = {};
//       foundItems.forEach((item, index) => {
//         newClaims[item.id] = claimsResults[index];
//       });
//       setClaims(newClaims);
//     } catch (err) {
//       console.error("Error fetching claims:", err);
//       toast.error("Could not load incoming claims.");
//     }
//   };

//   const fetchPosts = useCallback(async () => {
//     if (!user?.id) {
//       setLoading(false);
//       setError("User not logged in or ID not available.");
//       return;
//     }
//     setLoading(true);
//     setError(null);

//     let query = supabase
//       .from("items")
//       .select("*")
//       .eq("user_id", user.id)
//       .order("created_at", { ascending: false });

//     if (postStatusFilter === "active") {
//       query = query.in("moderation_status", ["approved", "pending_return"]);
//     } else if (postStatusFilter === "pending") {
//       query = query.eq("moderation_status", "pending");
//     } else if (postStatusFilter === "resolved") {
//       query = query.in("moderation_status", ["recovered", "rejected"]);
//     }

//     try {
//       const { data, error } = await query;
//       if (error) throw error;
//       const fetchedPosts = data || [];
//       setPosts(fetchedPosts);

//       const foundItems = fetchedPosts.filter((p) => p.status === "Found");
//       if (foundItems.length > 0) {
//         await fetchClaims(foundItems);
//       }
//     } catch (err) {
//       console.error("Error fetching posts:", err);
//       setError("Failed to load posts.");
//       toast.error("Failed to load your posts.");
//     } finally {
//       setLoading(false);
//     }
//   }, [user, postStatusFilter]);

//   useEffect(() => {
//     if (activeTab === "myPosts") {
//       fetchPosts();
//     }
//   }, [fetchPosts, activeTab]);

//   const handleDeletePost = async (postId) => {
//     if (!window.confirm("Are you sure? This cannot be undone.")) return;
//     try {
//       const { error } = await supabase.from("items").delete().eq("id", postId);
//       if (error) throw error;
//       toast.success("Post deleted successfully!");
//       setPosts((current) => current.filter((p) => p.id !== postId));
//     } catch (err) {
//       console.error("Error deleting post:", err);
//       toast.error("Failed to delete post.");
//     }
//   };

//   const handleRespondToClaim = async (claimId, isApproved) => {
//     try {
//       await apiClient.respondToClaim(claimId, isApproved);
//       toast.success(`Claim has been ${isApproved ? "approved" : "rejected"}.`);
//       fetchPosts(); // Refetch to update UI
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   const handleMarkAsRecovered = async (itemId) => {
//     if (!window.confirm("Confirm that this item has been returned?")) return;
//     try {
//       await apiClient.markAsRecovered(itemId);
//       toast.success("Item marked as recovered!");
//       fetchPosts(); // Refetch to update UI
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-[300px]">
//         <Loader2 className="w-8 h-8 animate-spin" />
//       </div>
//     );
//   }

//   if (error) {
//     return <div className="p-8 text-center text-red-500">{error}</div>;
//   }

//   return (
//     <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
//       <h1 className="text-4xl font-bold text-neutral-800 dark:text-white mb-8">
//         My Posts
//       </h1>

//       <div className="border-b border-neutral-200 dark:border-zinc-700 mb-6">
//         <div className="flex -mb-px">
//           <button
//             onClick={() => setActiveTab("myPosts")}
//             className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors duration-200 border-b-2
//               ${
//                 activeTab === "myPosts"
//                   ? "text-primary-600 border-primary-600"
//                   : "text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200 border-transparent"
//               }`}
//           >
//             My Posts
//           </button>
//           <button
//             onClick={() => setActiveTab("claims")}
//             className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors duration-200 border-b-2
//               ${
//                 activeTab === "claims"
//                   ? "text-primary-600 border-primary-600"
//                   : "text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200 border-transparent"
//               }`}
//           >
//             Claims on My Found Items
//           </button>
//         </div>
//       </div>

//       {activeTab === "myPosts" ? (
//         <>
//           <div className="flex space-x-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1 mb-6 max-w-sm">
//             {["active", "pending", "resolved"].map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setPostStatusFilter(tab)}
//                 className={`w-full rounded-md py-2.5 text-sm font-medium leading-5
//                   ${
//                     postStatusFilter === tab
//                       ? "bg-white dark:bg-neutral-900 shadow text-primary-600"
//                       : "text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50"
//                   }`}
//               >
//                 {tab.charAt(0).toUpperCase() + tab.slice(1)}
//               </button>
//             ))}
//           </div>
//           {posts.length === 0 ? (
//             <div className="text-center p-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
//               <p className="text-neutral-500 dark:text-zinc-400">
//                 No {postStatusFilter} posts found.
//               </p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//               {posts.map((post) => (
//                 <div
//                   key={post.id}
//                   className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full"
//                 >
//                   <button
//                     onClick={() => handleDeletePost(post.id)}
//                     className="absolute top-3 right-3 z-10 p-1.5 bg-white/50 dark:bg-black/50 text-neutral-600 dark:text-zinc-300 rounded-full
//                                opacity-0 group-hover:opacity-100 transition-opacity
//                                hover:bg-red-500/80 hover:text-white"
//                     title="Delete Post"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </button>

//                   <div className="w-full h-48 flex items-center justify-center bg-neutral-100 dark:bg-zinc-800 p-2">
//                     {post.image_url ? (
//                       <img
//                         src={post.image_url}
//                         alt={post.title}
//                         className="max-w-full max-h-full object-contain rounded-lg"
//                       />
//                     ) : (
//                       <ImageIcon className="w-16 h-16 text-neutral-300 dark:text-zinc-500" />
//                     )}
//                   </div>
//                   <div className="p-4 flex flex-col flex-grow">
//                     <h3 className="text-lg font-semibold text-neutral-800 dark:text-white truncate mb-1">
//                       {post.title}
//                     </h3>
//                     <p className="text-sm text-neutral-500 dark:text-zinc-400 mb-2 line-clamp-2 flex-grow">
//                       {post.description}
//                     </p>
//                     <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800">
//                       <StatusBadge status={post.moderation_status} />
//                     </div>
//                     {(post.moderation_status === "pending_return" ||
//                       (post.status === "Lost" &&
//                         post.moderation_status === "approved")) && (
//                       <button
//                         onClick={() => handleMarkAsRecovered(post.id)}
//                         className="w-full mt-4 py-2 bg-blue-600 text-white font-semibold rounded-md text-sm hover:bg-blue-700 transition-colors"
//                       >
//                         Mark as Recovered
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </>
//       ) : (
//         <div className="space-y-8">
//           {posts
//             .filter((p) => p.status === "Found" && claims[p.id]?.length > 0)
//             .map((post) => (
//               <div
//                 key={`claim-item-${post.id}`}
//                 className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-4 sm:p-6"
//               >
//                 <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">
//                   Claims for:{" "}
//                   <span className="text-primary-600">{post.title}</span>
//                 </h3>
//                 <div className="space-y-3">
//                   {claims[post.id].map((claim) => (
//                     <ClaimCard
//                       key={claim.id}
//                       claim={claim}
//                       onRespond={handleRespondToClaim}
//                     />
//                   ))}
//                 </div>
//               </div>
//             ))}
//           {posts.filter((p) => p.status === "Found" && claims[p.id]?.length > 0)
//             .length === 0 && (
//             <div className="text-center p-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
//               <Inbox className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
//               <p className="mt-4 text-neutral-500 dark:text-neutral-400">
//                 No pending claims on your found items.
//               </p>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import {
  ImageIcon,
  Loader2,
  Trash2,
  Check,
  X,
  Send,
  Inbox,
} from "lucide-react";

// --- 1. SKELETON IMPORTS ---
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// --- (No changes to apiClient or StatusBadge) ---
const apiClient = {
  async getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  },
  async respondToClaim(claimId, approved) {
    const token = await this.getAccessToken();
    const response = await fetch(
      `http://localhost:8000/api/claims/${claimId}/respond`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to respond to claim.");
    }
    return response.json();
  },
  async markAsRecovered(itemId) {
    const token = await this.getAccessToken();
    const response = await fetch(
      `http://localhost:8000/api/items/${itemId}/recover`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to mark item as recovered.");
    }
    return response.json();
  },
};

const StatusBadge = ({ status }) => {
  let colorClass = "";
  let text = "";

  switch (status?.toLowerCase()) {
    case "approved":
      colorClass =
        "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
      text = "Active";
      break;
    case "pending":
      colorClass =
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400";
      text = "Pending Review";
      break;
    case "rejected":
      colorClass =
        "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400";
      text = "Rejected";
      break;
    case "recovered":
      colorClass =
        "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
      text = "Recovered";
      break;
    case "pending_return":
      colorClass =
        "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400";
      text = "Pending Return";
      break;
    default:
      colorClass =
        "bg-neutral-100 text-neutral-800 dark:bg-zinc-500/20 dark:text-zinc-400";
      text = "Unknown";
  }

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}
    >
      {text}
    </span>
  );
};

// --- (No changes to ClaimCard) ---
const ClaimCard = ({ claim, onRespond }) => (
  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700/50">
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-neutral-800 dark:text-white">
          Claim by: {claim.claimant.full_name || claim.claimant.email}
        </p>
        <blockquote className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 border-l-2 border-primary-500 pl-3 italic">
          "{claim.verification_message}"
        </blockquote>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onRespond(claim.id, true)}
          className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
          title="Approve Claim"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={() => onRespond(claim.id, false)}
          className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
          title="Reject Claim"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

// --- 2. ADD SKELETON COMPONENTS ---

const PostCardSkeleton = () => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
    <Skeleton height={192} /> {/* h-48 */}
    <div className="p-4 flex flex-col flex-grow">
      <Skeleton height={24} width="80%" /> {/* Title */}
      <Skeleton count={2} className="mt-2" /> {/* Description */}
      <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Skeleton height={22} width="35%" /> {/* StatusBadge */}
      </div>
    </div>
  </div>
);

const ClaimCardSkeleton = () => (
  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700/50">
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <Skeleton height={20} width="60%" />
        <Skeleton count={2} className="mt-2" />
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Skeleton circle width={28} height={28} />
        <Skeleton circle width={28} height={28} />
      </div>
    </div>
  </div>
);

const MyPostsPageSkeleton = ({ activeTab, postStatusFilter }) => (
  <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    {/* Title */}
    <Skeleton height={40} width={200} className="mb-8" />

    {/* Tabs */}
    <div className="border-b border-neutral-200 dark:border-zinc-700 mb-6">
      <div className="flex -mb-px">
        <div
          className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium border-b-2 ${
            activeTab === "myPosts"
              ? "text-primary-600 border-primary-600"
              : "text-neutral-500 dark:text-zinc-400 border-transparent"
          }`}
        >
          My Posts
        </div>
        <div
          className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium border-b-2 ${
            activeTab === "claims"
              ? "text-primary-600 border-primary-600"
              : "text-neutral-500 dark:text-zinc-400 border-transparent"
          }`}
        >
          Claims on My Found Items
        </div>
      </div>
    </div>

    {activeTab === "myPosts" ? (
      <>
        {/* Sub-filter */}
        <div className="flex space-x-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1 mb-6 max-w-sm">
          {["active", "pending", "resolved"].map((tab) => (
            <div
              key={tab}
              className={`w-full rounded-md py-2.5 text-sm font-medium leading-5 ${
                postStatusFilter === tab
                  ? "bg-white dark:bg-neutral-900 shadow"
                  : ""
              }`}
            >
              <Skeleton width="50%" height={20} className="mx-auto" />
            </div>
          ))}
        </div>
        {/* Post Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </>
    ) : (
      /* Claims Tab Skeleton */
      <div className="space-y-8">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-4 sm:p-6"
          >
            <Skeleton height={24} width="40%" className="mb-3" />
            <div className="space-y-3">
              <ClaimCardSkeleton />
              <ClaimCardSkeleton />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default function MyPostsPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [claims, setClaims] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("myPosts");
  const [postStatusFilter, setPostStatusFilter] = useState("active");
  const [error, setError] = useState(null);

  // --- (No changes to fetchClaims or fetchPosts) ---
  const fetchClaims = async (foundItems) => {
    if (foundItems.length === 0) return;
    try {
      const token = await apiClient.getAccessToken();
      const claimsPromises = foundItems.map((item) =>
        fetch(`http://localhost:8000/api/claims/item/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json())
      );
      const claimsResults = await Promise.all(claimsPromises);
      const newClaims = {};
      foundItems.forEach((item, index) => {
        newClaims[item.id] = claimsResults[index];
      });
      setClaims(newClaims);
    } catch (err) {
      console.error("Error fetching claims:", err);
      toast.error("Could not load incoming claims.");
    }
  };

  const fetchPosts = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setError("User not logged in or ID not available.");
      return;
    }
    setLoading(true);
    setError(null);

    let query = supabase
      .from("items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (postStatusFilter === "active") {
      query = query.in("moderation_status", ["approved", "pending_return"]);
    } else if (postStatusFilter === "pending") {
      query = query.eq("moderation_status", "pending");
    } else if (postStatusFilter === "resolved") {
      query = query.in("moderation_status", ["recovered", "rejected"]);
    }

    try {
      const { data, error } = await query;
      if (error) throw error;
      const fetchedPosts = data || [];
      setPosts(fetchedPosts);

      const foundItems = fetchedPosts.filter((p) => p.status === "Found");
      if (foundItems.length > 0) {
        await fetchClaims(foundItems);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts.");
      toast.error("Failed to load your posts.");
    } finally {
      setLoading(false);
    }
  }, [user, postStatusFilter]);

  useEffect(() => {
    if (activeTab === "myPosts") {
      fetchPosts();
    }
  }, [fetchPosts, activeTab]);

  // --- (No changes to event handlers: handleDeletePost, handleRespondToClaim, handleMarkAsRecovered) ---
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      const { error } = await supabase.from("items").delete().eq("id", postId);
      if (error) throw error;
      toast.success("Post deleted successfully!");
      setPosts((current) => current.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete post.");
    }
  };

  const handleRespondToClaim = async (claimId, isApproved) => {
    try {
      await apiClient.respondToClaim(claimId, isApproved);
      toast.success(`Claim has been ${isApproved ? "approved" : "rejected"}.`);
      fetchPosts(); // Refetch to update UI
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleMarkAsRecovered = async (itemId) => {
    if (!window.confirm("Confirm that this item has been returned?")) return;
    try {
      await apiClient.markAsRecovered(itemId);
      toast.success("Item marked as recovered!");
      fetchPosts(); // Refetch to update UI
    } catch (error) {
      toast.error(error.message);
    }
  };

  // --- 3. UPDATE LOADING STATE CHECK ---
  if (loading) {
    return (
      <MyPostsPageSkeleton
        activeTab={activeTab}
        postStatusFilter={postStatusFilter}
      />
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  // --- (No changes to final JSX return) ---
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-neutral-800 dark:text-white mb-8">
        My Posts
      </h1>

      <div className="border-b border-neutral-200 dark:border-zinc-700 mb-6">
        <div className="flex -mb-px">
          <button
            onClick={() => setActiveTab("myPosts")}
            className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors duration-200 border-b-2
              ${
                activeTab === "myPosts"
                  ? "text-primary-600 border-primary-600"
                  : "text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200 border-transparent"
              }`}
          >
            My Posts
          </button>
          <button
            onClick={() => setActiveTab("claims")}
            className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors duration-200 border-b-2
              ${
                activeTab === "claims"
                  ? "text-primary-600 border-primary-600"
                  : "text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200 border-transparent"
              }`}
          >
            Claims on My Found Items
          </button>
        </div>
      </div>

      {activeTab === "myPosts" ? (
        <>
          <div className="flex space-x-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1 mb-6 max-w-sm">
            {["active", "pending", "resolved"].map((tab) => (
              <button
                key={tab}
                onClick={() => setPostStatusFilter(tab)}
                className={`w-full rounded-md py-2.5 text-sm font-medium leading-5
                  ${
                    postStatusFilter === tab
                      ? "bg-white dark:bg-neutral-900 shadow text-primary-600"
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50"
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          {posts.length === 0 ? (
            <div className="text-center p-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <p className="text-neutral-500 dark:text-zinc-400">
                No {postStatusFilter} posts found.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full"
                >
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="absolute top-3 right-3 z-10 p-1.5 bg-white/50 dark:bg-black/50 text-neutral-600 dark:text-zinc-300 rounded-full
                          opacity-0 group-hover:opacity-100 transition-opacity
                          hover:bg-red-500/80 hover:text-white"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="w-full h-48 flex items-center justify-center bg-neutral-100 dark:bg-zinc-800 p-2">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    ) : (
                      <ImageIcon className="w-16 h-16 text-neutral-300 dark:text-zinc-500" />
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold text-neutral-800 dark:text-white truncate mb-1">
                      {post.title}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-zinc-400 mb-2 line-clamp-2 flex-grow">
                      {post.description}
                    </p>
                    <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800">
                      <StatusBadge status={post.moderation_status} />
                    </div>
                    {(post.moderation_status === "pending_return" ||
                      (post.status === "Lost" &&
                        post.moderation_status === "approved")) && (
                      <button
                        onClick={() => handleMarkAsRecovered(post.id)}
                        className="w-full mt-4 py-2 bg-blue-600 text-white font-semibold rounded-md text-sm hover:bg-blue-700 transition-colors"
                      >
                        Mark as Recovered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-8">
          {posts
            .filter((p) => p.status === "Found" && claims[p.id]?.length > 0)
            .map((post) => (
              <div
                key={`claim-item-${post.id}`}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-4 sm:p-6"
              >
                <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-3">
                  Claims for:{" "}
                  <span className="text-primary-600">{post.title}</span>
                </h3>
                <div className="space-y-3">
                  {claims[post.id].map((claim) => (
                    <ClaimCard
                      key={claim.id}
                      claim={claim}
                      onRespond={handleRespondToClaim}
                    />
                  ))}
                </div>
              </div>
            ))}
          {posts.filter((p) => p.status === "Found" && claims[p.id]?.length > 0)
            .length === 0 && (
            <div className="text-center p-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <Inbox className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
              <p className="mt-4 text-neutral-500 dark:text-neutral-400">
                No pending claims on your found items.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}