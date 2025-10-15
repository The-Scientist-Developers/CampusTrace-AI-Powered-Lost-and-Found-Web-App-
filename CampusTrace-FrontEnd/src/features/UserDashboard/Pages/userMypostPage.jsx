import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { Image as ImageIcon, Loader2, Trash2 } from "lucide-react";

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

export default function MyPostsPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setError("User not logged in or ID not available.");
      toast.error("Please log in to view your posts.");
      return;
    }

    setLoading(true);
    setError(null);
    let query = supabase
      .from("items")
      .select(
        `
        id, 
        title, 
        description,
        location,
        image_url, 
        moderation_status, 
        created_at,
        category
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (activeTab === "active") {
      query = query.eq("moderation_status", "approved");
    } else if (activeTab === "pending") {
      query = query.eq("moderation_status", "pending");
    } else if (activeTab === "resolved") {
      query = query.or(
        "moderation_status.eq.recovered,moderation_status.eq.rejected"
      );
    }

    try {
      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts.");
      toast.error("Failed to load your posts.");
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDeletePost = async (postId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId)
      );

      const { error } = await supabase.from("items").delete().eq("id", postId);

      if (error) {
        toast.error("Failed to delete post.");
        fetchPosts();
        throw error;
      }

      toast.success("Post deleted successfully!");
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] p-8 text-neutral-500 dark:text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        Loading your posts...
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-neutral-800 dark:text-white mb-8">
        My Posts
      </h1>

      <div className="border-b border-neutral-200 dark:border-zinc-700 mb-6">
        <div className="flex -mb-px">
          {["active", "pending", "resolved"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-colors duration-200 border-b-2
              ${
                activeTab === tab
                  ? "text-primary-600 border-primary-600"
                  : "text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200 border-transparent"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm text-neutral-500 dark:text-zinc-400">
          <p className="text-lg">No {activeTab} posts found.</p>
          <p className="mt-2 text-sm">
            When you create a post, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col h-full"
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
                <div className="text-xs text-neutral-500 dark:text-zinc-500 space-y-1 mb-4 border-t border-neutral-200 dark:border-neutral-800 pt-3 mt-auto">
                  <p>
                    <strong>Type:</strong> {post.category}
                  </p>
                  <p>
                    <strong>Location:</strong> {post.location || "N/A"}
                  </p>
                  <p>
                    <strong>Posted:</strong>{" "}
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-auto">
                  <StatusBadge status={post.moderation_status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
