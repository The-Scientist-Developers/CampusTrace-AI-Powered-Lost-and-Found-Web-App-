import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import {
  Search,
  Camera,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const ItemCard = ({ item }) => {
  const isLost = item.status?.toLowerCase() === "lost";
  const badgeClass = isLost
    ? "bg-red/20 text-red"
    : "bg-green-500/20 text-green-400";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg overflow-hidden transition-transform hover:-translate-y-1">
      <div className="w-full h-48 flex items-center justify-center bg-zinc-800 p-4">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.item_name}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        ) : (
          <p className="text-neutral-600 text-sm">No Image</p>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate">
          {item.item_name}
        </h3>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full mt-2 inline-block ${badgeClass}`}
        >
          {item.status}
        </span>
      </div>
    </div>
  );
};

export default function BrowseAllPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [dateFilter, setDateFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const postsPerPage = 12;

  const fetchPosts = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setError("User information is not available.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile)
        throw new Error("Could not find user profile.");

      const userUniversityId = profile.university_id;

      let query = supabase
        .from("items")
        .select(`*, profiles(full_name, email)`, { count: "exact" })
        .eq("university_id", userUniversityId)
        .eq("moderation_status", "approved");

      if (statusFilter !== "All") {
        query = query.eq("status", statusFilter);
      }
      if (categoryFilters.length > 0) {
        query = query.in("category", categoryFilters);
      }
      if (dateFilter) {
        query = query.gte("created_at", dateFilter);
      }
      if (debouncedSearchTerm) {
        query = query.or(
          `item_name.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`
        );
      }

      const from = (currentPage - 1) * postsPerPage;
      const to = from + postsPerPage - 1;
      query = query.range(from, to).order("created_at", { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      setPosts(data || []);
      setTotalPosts(count || 0);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts.");
      toast.error("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, [
    user,
    debouncedSearchTerm,
    statusFilter,
    categoryFilters,
    dateFilter,
    currentPage,
  ]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCategoryChange = (category) => {
    setCategoryFilters((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  return (
    <div className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-white mb-8">Browse All Items</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg p-6 self-start">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Filter className="w-5 h-5 text-red" />
            Filters
          </h2>
          <div className="mb-6">
            <h3 className="font-semibold text-neutral-300 mb-3">Status</h3>
            <div className="space-y-2">
              {["All", "Lost", "Found"].map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-2 text-neutral-400 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={statusFilter === status}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-radio bg-neutral-700 border-neutral-600 text-red focus:ring-red"
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold text-neutral-300 mb-3">Category</h3>
            <div className="space-y-2">
              {[
                "Electronics",
                "Documents",
                "Clothing",
                "Accessories",
                "Other",
              ].map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 text-neutral-400 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={categoryFilters.includes(cat)}
                    onChange={() => handleCategoryChange(cat)}
                    className="form-checkbox bg-neutral-700 border-neutral-600 text-red focus:ring-red rounded"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-300 mb-3">Date</h3>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red focus:border-red"
            />
          </div>
        </aside>

        <div className="lg:col-span-3">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-red"
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              title="Image search coming soon!"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="w-10 h-10 animate-spin text-red" />
            </div>
          ) : error ? (
            <div className="text-center p-12 bg-neutral-900 rounded-xl text-red">
              {error}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center p-12 bg-neutral-900 rounded-xl text-neutral-500">
              No posts found matching your criteria.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <ItemCard key={post.id} item={post} />
                ))}
              </div>

              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white font-semibold text-sm rounded-md hover:bg-neutral-700 transition disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-neutral-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white font-semibold text-sm rounded-md hover:bg-neutral-700 transition disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
