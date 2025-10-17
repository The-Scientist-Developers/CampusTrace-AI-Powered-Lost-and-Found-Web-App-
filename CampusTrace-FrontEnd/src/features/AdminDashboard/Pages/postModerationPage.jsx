import React, { useState, useEffect } from "react";
import { supabase } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import {
  Loader2,
  Check,
  X,
  Clock,
  Filter,
  Image as ImageIconPlaceholder,
} from "lucide-react";

const StatusBadge = ({ status }) => {
  const styles = {
    pending:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30",
    approved:
      "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400 border border-green-500/30",
    rejected:
      "bg-neutral-200 text-neutral-800 dark:bg-zinc-700/50 dark:text-zinc-400 border border-neutral-300 dark:border-zinc-700/80",
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

const PostDetailsModal = ({ post, onClose, onUpdateStatus }) => {
  if (!post) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-4">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">
            Post Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-500 dark:text-zinc-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            {post.image_url ? (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-auto object-cover rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700"
              />
            ) : (
              <div className="w-full h-48 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex flex-col items-center justify-center text-neutral-500 text-sm">
                <ImageIconPlaceholder className="w-10 h-10 mb-2" />
                No Image Available
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-neutral-500 text-xs uppercase tracking-wider">
                Title
              </p>
              <p className="text-neutral-900 dark:text-white text-lg font-semibold">
                {post.title}
              </p>
            </div>
            <div>
              <p className="text-neutral-500 text-xs uppercase tracking-wider">
                Description
              </p>
              <p className="text-neutral-700 dark:text-neutral-300 text-sm whitespace-pre-wrap">
                {post.description || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-neutral-500 text-xs uppercase tracking-wider">
                Author
              </p>
              <p className="text-neutral-700 dark:text-neutral-300 text-sm">
                {post.profiles?.full_name || post.profiles?.email || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-neutral-500 text-xs uppercase tracking-wider">
                Status
              </p>
              <StatusBadge status={post.moderation_status} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => {
              onUpdateStatus(post.id, "approved");
              onClose();
            }}
            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Approve
          </button>
          <button
            onClick={() => {
              onUpdateStatus(post.id, "rejected");
              onClose();
            }}
            className="px-4 py-2 bg-neutral-600 dark:bg-zinc-700 text-white text-sm font-semibold rounded-md hover:bg-neutral-700 dark:hover:bg-zinc-600 transition flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PostModerationPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("pending"); // Default to pending
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
        if (!adminUniversityId) throw new Error("Admin university not found.");

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

      toast.success(`Post has been ${newStatus}.`);

      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId)
      );

      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(null);
      }
    } catch (err) {
      console.error("Error updating post status:", err);
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8 text-neutral-500 dark:text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        Loading Posts...
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-800 dark:text-white">
          Post Moderation
        </h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500 dark:text-zinc-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-select w-full sm:w-auto"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="All">All Statuses</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-neutral-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 dark:bg-zinc-800/50">
              <tr>
                <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-zinc-400">
                  Post
                </th>
                <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-zinc-400">
                  Author
                </th>
                <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-zinc-400">
                  Status
                </th>
                <th className="p-4 text-sm font-semibold text-neutral-600 dark:text-zinc-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-zinc-800">
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-neutral-50 dark:hover:bg-zinc-800/40 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-center justify-center cursor-pointer flex-shrink-0"
                        onClick={() => setSelectedPost(post)}
                      >
                        {post.image_url ? (
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <ImageIconPlaceholder className="w-6 h-6 text-neutral-400 dark:text-neutral-600" />
                        )}
                      </div>
                      <div className="font-medium text-neutral-800 dark:text-white">
                        {post.title}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-neutral-600 dark:text-neutral-400">
                    {post.profiles?.email || "N/A"}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={post.moderation_status} />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUpdateStatus(post.id, "approved")}
                        className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-md hover:bg-green-200 dark:bg-green-500/20 dark:text-green-300 dark:hover:bg-green-500/30 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(post.id, "rejected")}
                        className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-md hover:bg-neutral-200 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {posts.length === 0 && !loading && (
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-sm p-8 text-center text-neutral-500 flex flex-col items-center gap-4">
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
