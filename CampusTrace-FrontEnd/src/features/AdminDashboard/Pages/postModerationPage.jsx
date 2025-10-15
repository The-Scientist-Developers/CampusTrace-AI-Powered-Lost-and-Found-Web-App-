// import React, { useState, useEffect } from "react";
// import { apiClient, supabase } from "../../../api/apiClient"; // Adjust this import path to your apiClient file
// import {
//   Settings as SettingsIcon,
//   Check,
//   X,
//   Clock,
//   Filter,
//   Eye,
//   Image as ImageIconPlaceholder,
// } from "lucide-react";

// // --- Helper: A reusable component for the status badges ---
// const StatusBadge = ({ status }) => {
//   const styles = {
//     pending: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
//     approved: "bg-green-500/20 text-green-400 border border-green-500/30",
//     rejected: "bg-zinc-700/50 text-zinc-400 border border-zinc-700/80",
//   };
//   return (
//     <span
//       className={`px-2.5 py-1 text-xs font-medium rounded-full inline-block ${
//         styles[status.toLowerCase()] || styles["rejected"]
//       }`}
//     >
//       {status}
//     </span>
//   );
// };

// // --- Modal Component for Post Details ---
// const PostDetailsModal = ({ post, onClose, onUpdateStatus }) => {
//   if (!post) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fadeIn">
//       <div
//         className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
//         onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the modal
//       >
//         <div className="flex justify-between items-center pb-4 border-b border-neutral-800 mb-4">
//           <h2 className="text-2xl font-bold text-white">Post Details</h2>
//           <button
//             onClick={onClose}
//             className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
//           >
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           {/* Image Section */}
//           <div>
//             {post.image_url ? (
//               <img
//                 src={post.image_url}
//                 alt={post.title}
//                 className="w-full h-auto object-cover rounded-lg shadow-md border border-neutral-700"
//               />
//             ) : (
//               <div className="w-full h-48 bg-neutral-800 rounded-lg flex flex-col items-center justify-center text-neutral-500 text-sm">
//                 <ImageIconPlaceholder className="w-10 h-10 mb-2" />
//                 No Image Available
//               </div>
//             )}
//           </div>

//           {/* Details Section */}
//           <div className="space-y-4">
//             <div>
//               <p className="text-neutral-500 text-xs uppercase tracking-wider">
//                 Title
//               </p>
//               <p className="text-white text-lg font-semibold">{post.title}</p>
//             </div>
//             <div>
//               <p className="text-neutral-500 text-xs uppercase tracking-wider">
//                 Description
//               </p>
//               <p className="text-neutral-300 text-sm whitespace-pre-wrap">
//                 {post.description || "N/A"}
//               </p>
//             </div>
//             <div>
//               <p className="text-neutral-500 text-xs uppercase tracking-wider">
//                 Author
//               </p>
//               <p className="text-neutral-300 text-sm">
//                 {post.profiles?.full_name || post.profiles?.email || "N/A"}
//               </p>
//             </div>
//             <div>
//               <p className="text-neutral-500 text-xs uppercase tracking-wider">
//                 Status
//               </p>
//               <StatusBadge status={post.moderation_status} />
//             </div>
//           </div>
//         </div>

//         {/* Moderation Actions in Modal */}
//         <div className="flex gap-3 justify-end pt-4 border-t border-neutral-800">
//           <button
//             onClick={() => {
//               onUpdateStatus(post.id, "approved");
//               onClose();
//             }}
//             className="px-4 py-2 bg-green-600/80 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition flex items-center gap-2"
//           >
//             <Check className="w-4 h-4" /> Approve
//           </button>
//           <button
//             onClick={() => {
//               onUpdateStatus(post.id, "rejected");
//               onClose();
//             }}
//             className="px-4 py-2 bg-zinc-700 text-white text-sm font-semibold rounded-md hover:bg-zinc-600 transition flex items-center gap-2"
//           >
//             <X className="w-4 h-4" /> Reject
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- Main Post Moderation Component ---
// export default function PostModerationPage({ user }) {
//   // <-- Pass 'user' prop
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [filter, setFilter] = useState("All");
//   const [selectedPost, setSelectedPost] = useState(null);

//   useEffect(() => {
//     // Check if user object exists before fetching data
//     if (!user?.id) {
//       setLoading(false); // Stop loading if no user
//       return;
//     }

//     const fetchPostsForModeration = async () => {
//       setLoading(true);
//       try {
//         // Get the admin's own university_id first
//         const { data: profile, error: profileError } = await supabase
//           .from("profiles")
//           .select("university_id")
//           .eq("id", user.id) // Use the passed user ID
//           .single();

//         if (profileError) throw profileError;

//         const adminUniversityId = profile?.university_id;
//         if (!adminUniversityId) {
//           throw new Error("Admin university not found.");
//         }

//         // Fetch posts for moderation, filtered by the admin's university
//         let query = supabase
//           .from("items")
//           .select(
//             "id,title,description,category,location,image_url,ai_tags,moderation_status,profiles(id,full_name,email)"
//           )
//           .eq("university_id", adminUniversityId)
//           .order("created_at", { ascending: false });

//         // Apply status filter if selected
//         if (filter !== "All") {
//           query = query.eq("moderation_status", filter);
//         }

//         const { data, error } = await query;
//         if (error) throw error;

//         setPosts(data || []);
//       } catch (err) {
//         console.error("Error fetching posts for moderation:", err);
//         setError("Failed to load post data. " + (err?.message || err));
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPostsForModeration();
//   }, [filter, user?.id]); // Re-run effect if filter or user ID changes

//   const handleUpdateStatus = async (postId, newStatus) => {
//     try {
//       // This is the only call you need. It updates Supabase directly.
//       const { data, error } = await supabase
//         .from("items")
//         .update({ moderation_status: newStatus })
//         .eq("id", postId)
//         .select()
//         .single();

//       if (error) throw error;

//       // Update the UI with the new status
//       setPosts((currentPosts) =>
//         currentPosts.map((post) =>
//           post.id === postId
//             ? { ...post, moderation_status: data.moderation_status }
//             : post
//         )
//       );

//       // Also update the modal if it's open
//       if (selectedPost && selectedPost.id === postId) {
//         setSelectedPost((prev) => ({
//           ...prev,
//           moderation_status: data.moderation_status,
//         }));
//       }
//     } catch (err) {
//       console.error("Error updating post status:", err);
//       // Use toast for user feedback instead of alert
//       toast.error(`Failed to update status: ${err.message}`);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-full p-8 text-zinc-400">
//         <SettingsIcon className="w-8 h-8 animate-spin mr-3" />
//         Loading Post Moderation...
//       </div>
//     );
//   }

//   if (error) {
//     return <div className="p-8 text-center text-red">{error}</div>;
//   }

//   return (
//     <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fadeIn">
//       {/* Header with Filter */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
//           Post Moderation
//         </h1>
//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-zinc-400" />
//           <select
//             value={filter}
//             onChange={(e) => setFilter(e.target.value)}
//             className="bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red focus:border-red transition w-full sm:w-auto"
//           >
//             <option value="All">All Statuses</option>
//             <option value="pending">Pending</option>
//             <option value="approved">Approved</option>
//             <option value="rejected">Rejected</option>
//           </select>
//         </div>
//       </div>

//       {/* Desktop Table View */}
//       <div className="hidden lg:block bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left">
//             <thead className="bg-neutral-800/50">
//               <tr>
//                 <th className="p-4 text-sm font-semibold text-neutral-400">
//                   Post ID
//                 </th>
//                 <th className="p-4 text-sm font-semibold text-neutral-400">
//                   Image
//                 </th>
//                 <th className="p-4 text-sm font-semibold text-neutral-400">
//                   Title
//                 </th>
//                 <th className="p-4 text-sm font-semibold text-neutral-400">
//                   Author
//                 </th>
//                 <th className="p-4 text-sm font-semibold text-neutral-400">
//                   Status
//                 </th>
//                 <th className="p-4 text-sm font-semibold text-neutral-400 text-right">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-neutral-800">
//               {posts.map((post) => (
//                 <tr
//                   key={post.id}
//                   className="hover:bg-neutral-800/40 transition-colors group"
//                 >
//                   <td className="p-4 text-neutral-400 font-mono text-xs">
//                     {post.id}
//                   </td>
//                   <td className="p-4">
//                     <div
//                       className="w-12 h-12 bg-neutral-800 rounded-md flex items-center justify-center cursor-pointer"
//                       onClick={() => setSelectedPost(post)}
//                     >
//                       {post.image_url ? (
//                         <img
//                           src={post.image_url}
//                           alt={post.title}
//                           className="w-full h-full object-cover rounded-md"
//                         />
//                       ) : (
//                         <ImageIconPlaceholder className="w-6 h-6 text-neutral-600" />
//                       )}
//                     </div>
//                   </td>
//                   <td className="p-4 font-medium text-white">{post.title}</td>
//                   <td className="p-4 text-neutral-400">
//                     {post.profiles?.email || "N/A"}
//                   </td>
//                   <td className="p-4">
//                     <StatusBadge status={post.moderation_status} />
//                   </td>
//                   <td className="p-4 text-right">
//                     <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                       <button
//                         onClick={() => handleUpdateStatus(post.id, "approved")}
//                         className="px-3 py-1 bg-green-600/80 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition"
//                       >
//                         <Check className="w-3 h-3 inline-block mr-1" /> Approve
//                       </button>
//                       <button
//                         onClick={() => handleUpdateStatus(post.id, "rejected")}
//                         className="px-3 py-1 bg-zinc-700 text-white text-xs font-semibold rounded-md hover:bg-zinc-600 transition"
//                       >
//                         <X className="w-3 h-3 inline-block mr-1" /> Reject
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Mobile Card View */}
//       <div className="lg:hidden space-y-4">
//         {posts.map((post) => (
//           <div
//             key={post.id}
//             className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg p-4 space-y-4"
//           >
//             <div className="flex gap-4">
//               <div
//                 className="w-20 h-20 bg-neutral-800 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer"
//                 onClick={() => setSelectedPost(post)}
//               >
//                 {post.image_url ? (
//                   <img
//                     src={post.image_url}
//                     alt={post.title}
//                     className="w-full h-full object-cover rounded-md"
//                   />
//                 ) : (
//                   <ImageIconPlaceholder className="w-8 h-8 text-neutral-600" />
//                 )}
//               </div>
//               <div className="flex-grow">
//                 <h3 className="font-semibold text-white text-base line-clamp-2 mb-2">
//                   {post.title}
//                 </h3>
//                 <div className="flex justify-between items-center text-sm">
//                   <span className="text-neutral-400">Status</span>
//                   <StatusBadge status={post.moderation_status} />
//                 </div>
//               </div>
//             </div>
//             <div className="flex gap-2 pt-3 border-t border-neutral-800">
//               <button
//                 onClick={() => handleUpdateStatus(post.id, "approved")}
//                 className="flex-1 px-3 py-2 bg-green-600/80 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition flex items-center justify-center gap-1"
//               >
//                 <Check className="w-4 h-4" /> Approve
//               </button>
//               <button
//                 onClick={() => handleUpdateStatus(post.id, "rejected")}
//                 className="flex-1 px-3 py-2 bg-zinc-700 text-white text-sm font-semibold rounded-md hover:bg-zinc-600 transition flex items-center justify-center gap-1"
//               >
//                 <X className="w-4 h-4" /> Reject
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Empty State */}
//       {posts.length === 0 && !loading && (
//         <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg p-8 text-center text-neutral-500 flex flex-col items-center gap-4">
//           <Clock className="w-8 h-8" />
//           <p>No posts with status "{filter}" found.</p>
//         </div>
//       )}

//       {/* Renders the Modal when a post is selected */}
//       <PostDetailsModal
//         post={selectedPost}
//         onClose={() => setSelectedPost(null)}
//         onUpdateStatus={handleUpdateStatus}
//       />
//     </div>
//   );
// }




// import React, { useState, useEffect } from "react";
// import { supabase } from "../../../api/apiClient"; // Adjust this import path to your apiClient file
// import {
//   Settings as SettingsIcon,
//   Check,
//   X,
//   Clock,
//   Filter,
//   Eye,
//   Image as ImageIconPlaceholder,
// } from "lucide-react";
// import { useTheme } from "../../../contexts/ThemeContext";

// // --- Helper: A reusable component for the status badges ---
// const StatusBadge = ({ status }) => {
//   const styles = {
//     pending: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
//     approved: "bg-green-500/20 text-green-400 border border-green-500/30",
//     rejected: "bg-zinc-200/50 text-zinc-600 border border-zinc-300/80 dark:bg-zinc-700/50 dark:text-zinc-400 dark:border-zinc-700/80",
//   };
//   return (
//     <span
//       className={`px-2.5 py-1 text-xs font-medium rounded-full inline-block ${
//         styles[status.toLowerCase()] || styles["rejected"]
//       }`}
//     >
//       {status}
//     </span>
//   );
// };

// // --- Modal Component for Post Details ---
// const PostDetailsModal = ({ post, onClose, onUpdateStatus }) => {
//   if (!post) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fadeIn">
//       <div
//         className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
//         onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the modal
//       >
//         <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-4">
//           <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Post Details</h2>
//           <button
//             onClick={onClose}
//             className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-zinc-800 text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
//           >
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           {/* Image Section */}
//           <div>
//             {post.image_url ? (
//               <img
//                 src={post.image_url}
//                 alt={post.title}
//                 className="w-full h-auto object-cover rounded-lg shadow-md border border-neutral-300 dark:border-neutral-700"
//               />
//             ) : (
//               <div className="w-full h-48 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex flex-col items-center justify-center text-neutral-600 dark:text-neutral-500 text-sm">
//                 <ImageIconPlaceholder className="w-10 h-10 mb-2" />
//                 No Image Available
//               </div>
//             )}
//           </div>

//           {/* Details Section */}
//           <div className="space-y-4">
//             <div>
//               <p className="text-neutral-600 dark:text-neutral-500 text-xs uppercase tracking-wider">
//                 Title
//               </p>
//               <p className="text-neutral-900 dark:text-white text-lg font-semibold">{post.title}</p>
//             </div>
//             <div>
//               <p className="text-neutral-600 dark:text-neutral-500 text-xs uppercase tracking-wider">
//                 Description
//               </p>
//               <p className="text-neutral-700 dark:text-neutral-300 text-sm whitespace-pre-wrap">
//                 {post.description || "N/A"}
//               </p>
//             </div>
//             <div>
//               <p className="text-neutral-600 dark:text-neutral-500 text-xs uppercase tracking-wider">
//                 Author
//               </p>
//               <p className="text-neutral-700 dark:text-neutral-300 text-sm">
//                 {post.profiles?.full_name || post.profiles?.email || "N/A"}
//               </p>
//             </div>
//             <div>
//               <p className="text-neutral-600 dark:text-neutral-500 text-xs uppercase tracking-wider">
//                 Status
//               </p>
//               <StatusBadge status={post.moderation_status} />
//             </div>
//           </div>
//         </div>

//         {/* Moderation Actions in Modal */}
//         <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
//           <button
//             onClick={() => {
//               onUpdateStatus(post.id, "approved");
//               onClose();
//             }}
//             className="px-4 py-2 bg-green-600/80 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition flex items-center gap-2"
//           >
//             <Check className="w-4 h-4" /> Approve
//           </button>
//           <button
//             onClick={() => {
//               onUpdateStatus(post.id, "rejected");
//               onClose();
//             }}
//             className="px-4 py-2 bg-neutral-200 dark:bg-zinc-700 text-neutral-900 dark:text-white text-sm font-semibold rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-600 transition flex items-center gap-2"
//           >
//             <X className="w-4 h-4" /> Reject
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- Main Post Moderation Component ---
// export default function PostModerationPage({ user }) {
//   const { theme } = useTheme();
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [filter, setFilter] = useState("All");
//   const [selectedPost, setSelectedPost] = useState(null);

//   useEffect(() => {
//     if (!user?.id) {
//       setLoading(false);
//       return;
//     }

//     const fetchPostsForModeration = async () => {
//       setLoading(true);
//       try {
//         const { data: profile, error: profileError } = await supabase
//           .from("profiles")
//           .select("university_id")
//           .eq("id", user.id)
//           .single();

//         if (profileError) throw profileError;
//         const adminUniversityId = profile?.university_id;
//         if (!adminUniversityId) {
//           throw new Error("Admin university not found.");
//         }

//         let query = supabase
//           .from("items")
//           .select(
//             "id,title,description,category,location,image_url,ai_tags,moderation_status,profiles(id,full_name,email)"
//           )
//           .eq("university_id", adminUniversityId)
//           .order("created_at", { ascending: false });

//         if (filter !== "All") {
//           query = query.eq("moderation_status", filter);
//         }

//         const { data, error } = await query;
//         if (error) throw error;
//         setPosts(data || []);
//       } catch (err) {
//         console.error("Error fetching posts for moderation:", err);
//         setError("Failed to load post data. " + (err?.message || err));
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPostsForModeration();
//   }, [filter, user?.id]);

//   const handleUpdateStatus = async (postId, newStatus) => {
//     try {
//       const { data, error } = await supabase
//         .from("items")
//         .update({ moderation_status: newStatus })
//         .eq("id", postId)
//         .select()
//         .single();
//       if (error) throw error;

//       setPosts((currentPosts) =>
//         currentPosts.map((post) =>
//           post.id === postId
//             ? { ...post, moderation_status: data.moderation_status }
//             : post
//         )
//       );

//       if (selectedPost && selectedPost.id === postId) {
//         setSelectedPost((prev) => ({
//           ...prev,
//           moderation_status: data.moderation_status,
//         }));
//       }
//     } catch (err) {
//       console.error("Error updating post status:", err);
//       toast.error(`Failed to update status: ${err.message}`);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-full p-8 text-neutral-600 dark:text-zinc-400">
//         <SettingsIcon className="w-8 h-8 animate-spin mr-3" />
//         Loading Post Moderation...
//       </div>
//     );
//   }

//   if (error) {
//     return <div className="p-8 text-center text-red-500">{error}</div>;
//   }

//   return (
//     <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fadeIn">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white">
//           Post Moderation
//         </h1>
//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-neutral-600 dark:text-zinc-400" />
//           <select
//             value={filter}
//             onChange={(e) => setFilter(e.target.value)}
//             className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-red focus:border-red transition w-full sm:w-auto"
//           >
//             <option value="All">All Statuses</option>
//             <option value="pending">Pending</option>
//             <option value="approved">Approved</option>
//             <option value="rejected">Rejected</option>
//           </select>
//         </div>
//       </div>

//       <div className="hidden lg:block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left">
//             <thead className="bg-neutral-100 dark:bg-neutral-800/50">
//               <tr>
//                 <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Post ID</th>
//                 <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Image</th>
//                 <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Title</th>
//                 <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Author</th>
//                 <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
//                 <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
//               {posts.map((post) => (
//                 <tr key={post.id} className="hover:bg-neutral-100 dark:hover:bg-neutral-800/40 transition-colors group">
//                   <td className="p-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">{post.id}</td>
//                   <td className="p-4">
//                     <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-center justify-center cursor-pointer" onClick={() => setSelectedPost(post)}>
//                       {post.image_url ? (
//                         <img src={post.image_url} alt={post.title} className="w-full h-full object-cover rounded-md" />
//                       ) : (
//                         <ImageIconPlaceholder className="w-6 h-6 text-neutral-600" />
//                       )}
//                     </div>
//                   </td>
//                   <td className="p-4 font-medium text-neutral-900 dark:text-white">{post.title}</td>
//                   <td className="p-4 text-neutral-600 dark:text-neutral-400">{post.profiles?.email || "N/A"}</td>
//                   <td className="p-4"><StatusBadge status={post.moderation_status} /></td>
//                   <td className="p-4 text-right">
//                     <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                       <button onClick={() => handleUpdateStatus(post.id, "approved")} className="px-3 py-1 bg-green-600/80 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition">
//                         <Check className="w-3 h-3 inline-block mr-1" /> Approve
//                       </button>
//                       <button onClick={() => handleUpdateStatus(post.id, "rejected")} className="px-3 py-1 bg-neutral-200 dark:bg-zinc-700 text-neutral-900 dark:text-white text-xs font-semibold rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-600 transition">
//                         <X className="w-3 h-3 inline-block mr-1" /> Reject
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <div className="lg:hidden space-y-4">
//         {posts.map((post) => (
//           <div key={post.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-4 space-y-4">
//             <div className="flex gap-4">
//               <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => setSelectedPost(post)}>
//                 {post.image_url ? (
//                   <img src={post.image_url} alt={post.title} className="w-full h-full object-cover rounded-md" />
//                 ) : (
//                   <ImageIconPlaceholder className="w-8 h-8 text-neutral-600" />
//                 )}
//               </div>
//               <div className="flex-grow">
//                 <h3 className="font-semibold text-neutral-900 dark:text-white text-base line-clamp-2 mb-2">{post.title}</h3>
//                 <div className="flex justify-between items-center text-sm">
//                   <span className="text-neutral-600 dark:text-neutral-400">Status</span>
//                   <StatusBadge status={post.moderation_status} />
//                 </div>
//               </div>
//             </div>
//             <div className="flex gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
//               <button onClick={() => handleUpdateStatus(post.id, "approved")} className="flex-1 px-3 py-2 bg-green-600/80 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition flex items-center justify-center gap-1">
//                 <Check className="w-4 h-4" /> Approve
//               </button>
//               <button onClick={() => handleUpdateStatus(post.id, "rejected")} className="flex-1 px-3 py-2 bg-neutral-200 dark:bg-zinc-700 text-neutral-900 dark:text-white text-sm font-semibold rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-600 transition flex items-center justify-center gap-1">
//                 <X className="w-4 h-4" /> Reject
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {posts.length === 0 && !loading && (
//         <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-8 text-center text-neutral-600 dark:text-neutral-500 flex flex-col items-center gap-4">
//           <Clock className="w-8 h-8" />
//           <p>No posts with status "{filter}" found.</p>
//         </div>
//       )}

//       <PostDetailsModal
//         post={selectedPost}
//         onClose={() => setSelectedPost(null)}
//         onUpdateStatus={handleUpdateStatus}
//       />
//     </div>
//   );
// }







// import React, { useState, useEffect } from "react";
// import { supabase } from "../../../api/apiClient";
// import {
//   Settings as SettingsIcon,
//   Check,
//   X,
//   Clock,
//   Filter,
//   Eye,
//   Image as ImageIconPlaceholder,
// } from "lucide-react";
// import { useTheme } from "../../../contexts/ThemeContext";

// // --- Helper: A reusable component for the status badges ---
// const StatusBadge = ({ status }) => {
//   const styles = {
//     pending: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
//     approved: "bg-green-500/20 text-green-400 border border-green-500/30",
//     rejected: "bg-zinc-200/50 text-zinc-600 border border-zinc-300/80 dark:bg-zinc-700/50 dark:text-zinc-400 dark:border-zinc-700/80",
//   };
//   return (
//     <span
//       className={`px-2.5 py-1 text-xs font-medium rounded-full inline-block ${
//         styles[status.toLowerCase()] || styles["rejected"]
//       }`}
//     >
//       {status}
//     </span>
//   );
// };

// // --- Modal Component for Post Details ---
// const PostDetailsModal = ({ post, onClose, onUpdateStatus }) => {
//   if (!post) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fadeIn">
//       <div
//         className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-4">
//           <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Post Details</h2>
//           <button
//             onClick={onClose}
//             className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-zinc-800 text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
//           >
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           {/* Image Section */}
//           <div>
//             {post.image_url ? (
//               <img
//                 src={post.image_url}
//                 alt={post.title}
//                 className="w-full h-auto object-cover rounded-lg shadow-md border border-neutral-300 dark:border-neutral-700"
//               />
//             ) : (
//               <div className="w-full h-48 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex flex-col items-center justify-center text-neutral-600 dark:text-neutral-500 text-sm">
//                 <ImageIconPlaceholder className="w-10 h-10 mb-2" />
//                 No Image Available
//               </div>
//             )}
//           </div>

//           {/* Details Section */}
//           <div className="space-y-4">
//             <div>
//               <p className="text-neutral-600 dark:text-neutral-500 text-xs uppercase tracking-wider">
//                 Title
//               </p>
//               <p className="text-neutral-900 dark:text-white text-lg font-semibold">{post.title}</p>
//             </div>
//             <div>
//               <p className="text-neutral-600 dark:text-neutral-500 text-xs uppercase tracking-wider">
//                 Description
//               </p>
//               <p className="text-neutral-700 dark:text-neutral-300 text-sm whitespace-pre-wrap">
//                 {post.description || "N/A"}
//               </p>
//             </div>
//             <div>
//               <p className="text-neutral-600 dark:text-neutral-500 text-xs uppercase tracking-wider">
//                 Author
//               </p>
//               <p className="text-neutral-700 dark:text-neutral-300 text-sm">
//                 {post.profiles?.full_name || post.profiles?.email || "N/A"}
//               </p>
//             </div>
//             <div>
//               <p className="text-neutral-600 dark:text-neutral-500 text-xs uppercase tracking-wider">
//                 Status
//               </p>
//               <StatusBadge status={post.moderation_status} />
//             </div>
//           </div>
//         </div>

//         {/* Moderation Actions in Modal */}
//         <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
//           <button
//             onClick={() => {
//               onUpdateStatus(post.id, "approved", post);
//               onClose();
//             }}
//             className="px-4 py-2 bg-green-600/80 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition flex items-center gap-2"
//           >
//             <Check className="w-4 h-4" /> Approve
//           </button>
//           <button
//             onClick={() => {
//               onUpdateStatus(post.id, "rejected", post);
//               onClose();
//             }}
//             className="px-4 py-2 bg-neutral-200 dark:bg-zinc-700 text-neutral-900 dark:text-white text-sm font-semibold rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-600 transition flex items-center gap-2"
//           >
//             <X className="w-4 h-4" /> Reject
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // --- Main Post Moderation Component ---
// export default function PostModerationPage({ user }) {
//   const { theme } = useTheme();
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [filter, setFilter] = useState("All");
//   const [selectedPost, setSelectedPost] = useState(null);

//   useEffect(() => {
//     if (!user?.id) {
//       setLoading(false);
//       return;
//     }

//     const fetchPostsForModeration = async () => {
//       setLoading(true);
//       try {
//         const { data: profile, error: profileError } = await supabase
//           .from("profiles")
//           .select("university_id")
//           .eq("id", user.id)
//           .single();

//         if (profileError) throw profileError;
//         const adminUniversityId = profile?.university_id;
//         if (!adminUniversityId) {
//           throw new Error("Admin university not found.");
//         }

//         let query = supabase
//           .from("items")
//           .select(
//             "id,title,description,category,location,image_url,ai_tags,moderation_status,user_id,profiles!items_user_id_fkey(id,full_name,email)"
//           )
//           .eq("university_id", adminUniversityId)
//           .order("created_at", { ascending: false });

//         if (filter !== "All") {
//           query = query.eq("moderation_status", filter);
//         }

//         const { data, error } = await query;
//         if (error) throw error;
//         setPosts(data || []);
//       } catch (err) {
//         console.error("Error fetching posts for moderation:", err);
//         setError("Failed to load post data. " + (err?.message || err));
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPostsForModeration();
//   }, [filter, user?.id]);

//   const handleUpdateStatus = async (postId, newStatus, postData) => {
//     console.log("🔍 DEBUG: handleUpdateStatus called with:", { postId, newStatus, postData });
    
//     try {
//       // Step 1: Update the post status
//       const { data: updatedPost, error: updateError } = await supabase
//         .from("items")
//         .update({ moderation_status: newStatus })
//         .eq("id", postId)
//         .select("id, title, user_id")
//         .single();

//       console.log("📝 Updated post data:", updatedPost);

//       if (updateError) throw updateError;

//       // Step 2: Create notification for the user
//       const userId = postData?.user_id || updatedPost?.user_id;
//       const postTitle = postData?.title || updatedPost?.title || "your post";

//       console.log("👤 User ID for notification:", userId);
//       console.log("📄 Post title:", postTitle);

//       if (!userId) {
//         console.error("⚠️ Warning: No user_id found for notification");
//         console.log("Post data received:", postData);
//         console.log("Updated post data:", updatedPost);
//         alert("Post updated but notification failed - no user ID");
//         // Still update the post status locally
//         setPosts((currentPosts) =>
//           currentPosts.map((post) =>
//             post.id === postId
//               ? { ...post, moderation_status: newStatus }
//               : post
//           )
//         );
//         return;
//       }

//       let notificationMessage = "";
//       let notificationType = "";

//       if (newStatus === "approved") {
//         notificationMessage = `Great news! Your post "${postTitle}" has been approved and is now visible to everyone.`;
//         notificationType = "approved";
//       } else if (newStatus === "rejected") {
//         notificationMessage = `Your post "${postTitle}" has been rejected and will not be visible. Please ensure your post follows our community guidelines.`;
//         notificationType = "rejected";
//       } else {
//         // For pending or other statuses
//         notificationMessage = `Your post "${postTitle}" status has been updated to ${newStatus}.`;
//         notificationType = "general";
//       }

//       const { data: notification, error: notificationError } = await supabase
//         .from("notifications")
//         .insert({
//           recipient_id: userId,
//           message: notificationMessage,
//           type: notificationType,
//           status: "unread",
//           link_to: "/dashboard/my-posts"
//         })
//         .select();

//       if (notificationError) {
//         console.error("❌ Error creating notification:", notificationError);
//         alert("Post updated but notification failed");
//       } else {
//         console.log("✅ Notification created successfully:", notification);
//       }

//       // Step 3: Update local state
//       setPosts((currentPosts) =>
//         currentPosts.map((post) =>
//           post.id === postId
//             ? { ...post, moderation_status: newStatus }
//             : post
//         )
//       );

//       if (selectedPost && selectedPost.id === postId) {
//         setSelectedPost((prev) => ({
//           ...prev,
//           moderation_status: newStatus,
//         }));
//       }

//       // Show success message
//       if (newStatus === "approved") {
//         console.log("✅ Post approved and user notified!");
//       } else if (newStatus === "rejected") {
//         console.log("✅ Post rejected and user notified");
//       } else {
//         console.log(`✅ Post status updated to ${newStatus}`);
//       }

//     } catch (err) {
//       console.error("❌ Error updating post status:", err);
//       alert(`Failed to update status: ${err.message}`);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-full p-8 text-neutral-600 dark:text-zinc-400">
//         <SettingsIcon className="w-8 h-8 animate-spin mr-3" />
//         Loading Post Moderation...
//       </div>
//     );
//   }

//   if (error) {
//     return <div className="p-8 text-center text-red-500">{error}</div>;
//   }

//   return (
//     <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fadeIn">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white">
//           Post Moderation
//         </h1>
//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-neutral-600 dark:text-zinc-400" />
//           <select
//             value={filter}
//             onChange={(e) => setFilter(e.target.value)}
//             className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-red focus:border-red transition w-full sm:w-auto"
//           >
//             <option value="All">All Statuses</option>
//             <option value="pending">Pending</option>
//             <option value="approved">Approved</option>
//             <option value="rejected">Rejected</option>
//           </select>
//         </div>
//       </div>

//       {/* Desktop Table View */}
//       <div className="hidden lg:block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left">
//             <thead className="bg-neutral-100 dark:bg-neutral-800/50">
//               <tr>
//                 <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Post ID</th>
//                 <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Image</th>
//                 <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Title</th>
//                 <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Author</th>
//                 <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
//                 <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
//               {posts.map((post) => (
//                 <tr key={post.id} className="hover:bg-neutral-100 dark:hover:bg-neutral-800/40 transition-colors group">
//                   <td className="p-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">{String(post.id).slice(0, 8)}...</td>
//                   <td className="p-4">
//                     <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-center justify-center cursor-pointer" onClick={() => setSelectedPost(post)}>
//                       {post.image_url ? (
//                         <img src={post.image_url} alt={post.title} className="w-full h-full object-cover rounded-md" />
//                       ) : (
//                         <ImageIconPlaceholder className="w-6 h-6 text-neutral-600" />
//                       )}
//                     </div>
//                   </td>
//                   <td className="p-4 font-medium text-neutral-900 dark:text-white">{post.title}</td>
//                   <td className="p-4 text-neutral-600 dark:text-neutral-400">{post.profiles?.email || "N/A"}</td>
//                   <td className="p-4"><StatusBadge status={post.moderation_status} /></td>
//                   <td className="p-4 text-right">
//                     <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                       <button 
//                         onClick={() => handleUpdateStatus(post.id, "approved", post)} 
//                         className="px-3 py-1 bg-green-600/80 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition"
//                         disabled={post.moderation_status === "approved"}
//                       >
//                         <Check className="w-3 h-3 inline-block mr-1" /> Approve
//                       </button>
//                       <button 
//                         onClick={() => handleUpdateStatus(post.id, "rejected", post)} 
//                         className="px-3 py-1 bg-neutral-200 dark:bg-zinc-700 text-neutral-900 dark:text-white text-xs font-semibold rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-600 transition"
//                         disabled={post.moderation_status === "rejected"}
//                       >
//                         <X className="w-3 h-3 inline-block mr-1" /> Reject
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Mobile Card View */}
//       <div className="lg:hidden space-y-4">
//         {posts.map((post) => (
//           <div key={post.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-4 space-y-4">
//             <div className="flex gap-4">
//               <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => setSelectedPost(post)}>
//                 {post.image_url ? (
//                   <img src={post.image_url} alt={post.title} className="w-full h-full object-cover rounded-md" />
//                 ) : (
//                   <ImageIconPlaceholder className="w-8 h-8 text-neutral-600" />
//                 )}
//               </div>
//               <div className="flex-grow">
//                 <h3 className="font-semibold text-neutral-900 dark:text-white text-base line-clamp-2 mb-2">{post.title}</h3>
//                 <div className="flex justify-between items-center text-sm">
//                   <span className="text-neutral-600 dark:text-neutral-400">Status</span>
//                   <StatusBadge status={post.moderation_status} />
//                 </div>
//               </div>
//             </div>
//             <div className="flex gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
//               <button 
//                 onClick={() => handleUpdateStatus(post.id, "approved", post)} 
//                 className="flex-1 px-3 py-2 bg-green-600/80 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition flex items-center justify-center gap-1"
//                 disabled={post.moderation_status === "approved"}
//               >
//                 <Check className="w-4 h-4" /> Approve
//               </button>
//               <button 
//                 onClick={() => handleUpdateStatus(post.id, "rejected", post)} 
//                 className="flex-1 px-3 py-2 bg-neutral-200 dark:bg-zinc-700 text-neutral-900 dark:text-white text-sm font-semibold rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-600 transition flex items-center justify-center gap-1"
//                 disabled={post.moderation_status === "rejected"}
//               >
//                 <X className="w-4 h-4" /> Reject
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {posts.length === 0 && !loading && (
//         <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-8 text-center text-neutral-600 dark:text-neutral-500 flex flex-col items-center gap-4">
//           <Clock className="w-8 h-8" />
//           <p>No posts with status "{filter}" found.</p>
//         </div>
//       )}

//       <PostDetailsModal
//         post={selectedPost}
//         onClose={() => setSelectedPost(null)}
//         onUpdateStatus={handleUpdateStatus}
//       />
//     </div>
//   );
// }
import React, { useState, useEffect } from "react";
import { supabase } from "../../../api/apiClient"; // Adjust this import path to your apiClient file
import {
  Settings as SettingsIcon,
  Check,
  X,
  Clock,
  Filter,
  Eye,
  Image as ImageIconPlaceholder,
} from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

// --- Helper: A reusable component for the status badges ---
const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    approved: "bg-green-500/20 text-green-400 border border-green-500/30",
    rejected: "bg-zinc-200/50 text-zinc-600 border border-zinc-300/80 dark:bg-zinc-700/50 dark:text-zinc-400 dark:border-zinc-700/80",
  };
  return (
    <span
      className={`px-2.5 py-1 text-xs font-medium rounded-full inline-block ${
        styles[status.toLowerCase()] || styles["rejected"]
      }`}
    >
      {status}
    </span>
  );
};

// --- Modal Component for Post Details ---
const PostDetailsModal = ({ post, onClose, onUpdateStatus }) => {
  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fadeIn">
      <div
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the modal
      >
        <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Post Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-zinc-800 text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Image Section */}
          <div>
            {post.image_url ? (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-auto object-cover rounded-lg shadow-md border border-neutral-300 dark:border-neutral-700"
              />
            ) : (
              <div className="w-full h-48 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex flex-col items-center justify-center text-neutral-600 dark:text-neutral-500 text-sm">
                <ImageIconPlaceholder className="w-10 h-10 mb-2" />
                No Image Available
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <div>
              <p className="text-neutral-600 dark:text-neutral-500 text-xs uppercase tracking-wider">
                Title
              </p>
              <p className="text-neutral-900 dark:text-white text-lg font-semibold">{post.title}</p>
            </div>
            <div>
              <p className="text-neutral-600 dark:text-neutral-500 text-xs uppercase tracking-wider">
                Description
              </p>
              <p className="text-neutral-700 dark:text-neutral-300 text-sm whitespace-pre-wrap">
                {post.description || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-neutral-600 dark:text-neutral-500 text-xs uppercase tracking-wider">
                Author
              </p>
              <p className="text-neutral-700 dark:text-neutral-300 text-sm">
                {post.profiles?.full_name || post.profiles?.email || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-neutral-600 dark:text-neutral-500 text-xs uppercase tracking-wider">
                Status
              </p>
              <StatusBadge status={post.moderation_status} />
            </div>
          </div>
        </div>

        {/* Moderation Actions in Modal */}
        <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => {
              onUpdateStatus(post.id, "approved");
              onClose();
            }}
            className="px-4 py-2 bg-green-600/80 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Approve
          </button>
          <button
            onClick={() => {
              onUpdateStatus(post.id, "rejected");
              onClose();
            }}
            className="px-4 py-2 bg-neutral-200 dark:bg-zinc-700 text-neutral-900 dark:text-white text-sm font-semibold rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-600 transition flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Reject
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Post Moderation Component ---
export default function PostModerationPage({ user }) {
  const { theme } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchPostsForModeration = async () => {
      setLoading(true);
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("university_id")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        const adminUniversityId = profile?.university_id;
        if (!adminUniversityId) {
          throw new Error("Admin university not found.");
        }

        let query = supabase
          .from("items")
          .select(
            "id,title,description,category,location,image_url,ai_tags,moderation_status,profiles(id,full_name,email)"
          )
          .eq("university_id", adminUniversityId)
          .order("created_at", { ascending: false });

        if (filter !== "All") {
          query = query.eq("moderation_status", filter);
        }

        const { data, error } = await query;
        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error("Error fetching posts for moderation:", err);
        setError("Failed to load post data. " + (err?.message || err));
      } finally {
        setLoading(false);
      }
    };

    fetchPostsForModeration();
  }, [filter, user?.id]);

  const handleUpdateStatus = async (postId, newStatus) => {
    try {
      const { data, error } = await supabase
        .from("items")
        .update({ moderation_status: newStatus })
        .eq("id", postId)
        .select()
        .single();
      if (error) throw error;

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? { ...post, moderation_status: data.moderation_status }
            : post
        )
      );

      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev) => ({
          ...prev,
          moderation_status: data.moderation_status,
        }));
      }
    } catch (err) {
      console.error("Error updating post status:", err);
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8 text-neutral-600 dark:text-zinc-400">
        <SettingsIcon className="w-8 h-8 animate-spin mr-3" />
        Loading Post Moderation...
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white">
          Post Moderation
        </h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-600 dark:text-zinc-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-red focus:border-red transition w-full sm:w-auto"
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="hidden lg:block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-100 dark:bg-neutral-800/50">
              <tr>
                <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Post ID</th>
                <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Image</th>
                <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Title</th>
                <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Author</th>
                <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
                <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-neutral-100 dark:hover:bg-neutral-800/40 transition-colors group">
                  <td className="p-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">{post.id}</td>
                  <td className="p-4">
                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-center justify-center cursor-pointer" onClick={() => setSelectedPost(post)}>
                      {post.image_url ? (
                        <img src={post.image_url} alt={post.title} className="w-full h-full object-cover rounded-md" />
                      ) : (
                        <ImageIconPlaceholder className="w-6 h-6 text-neutral-600" />
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-neutral-900 dark:text-white">{post.title}</td>
                  <td className="p-4 text-neutral-600 dark:text-neutral-400">{post.profiles?.email || "N/A"}</td>
                  <td className="p-4"><StatusBadge status={post.moderation_status} /></td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleUpdateStatus(post.id, "approved")} className="px-3 py-1 bg-green-600/80 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition">
                        <Check className="w-3 h-3 inline-block mr-1" /> Approve
                      </button>
                      <button onClick={() => handleUpdateStatus(post.id, "rejected")} className="px-3 py-1 bg-neutral-200 dark:bg-zinc-700 text-neutral-900 dark:text-white text-xs font-semibold rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-600 transition">
                        <X className="w-3 h-3 inline-block mr-1" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lg:hidden space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-4 space-y-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => setSelectedPost(post)}>
                {post.image_url ? (
                  <img src={post.image_url} alt={post.title} className="w-full h-full object-cover rounded-md" />
                ) : (
                  <ImageIconPlaceholder className="w-8 h-8 text-neutral-600" />
                )}
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-neutral-900 dark:text-white text-base line-clamp-2 mb-2">{post.title}</h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Status</span>
                  <StatusBadge status={post.moderation_status} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button onClick={() => handleUpdateStatus(post.id, "approved")} className="flex-1 px-3 py-2 bg-green-600/80 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition flex items-center justify-center gap-1">
                <Check className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => handleUpdateStatus(post.id, "rejected")} className="flex-1 px-3 py-2 bg-neutral-200 dark:bg-zinc-700 text-neutral-900 dark:text-white text-sm font-semibold rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-600 transition flex items-center justify-center gap-1">
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && !loading && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-8 text-center text-neutral-600 dark:text-neutral-500 flex flex-col items-center gap-4">
          <Clock className="w-8 h-8" />
          <p>No posts with status "{filter}" found.</p>
        </div>
      )}

      <PostDetailsModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}