import React, { useState, useEffect, useCallback } from "react";
import { getAccessToken, API_BASE_URL } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import {
  Loader2,
  RotateCcw,
  Trash2,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg max-w-sm w-full border border-neutral-200 dark:border-[#3a3a3a]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-[#3a3a3a]">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            {title}
          </h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-neutral-700 dark:text-neutral-300">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-neutral-200 dark:border-[#3a3a3a] justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Restore
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const RestoreCard = ({ item, type, onRestore, isRestoring }) => {
  const getTypeIcon = () => {
    switch (type) {
      case "deleted_post":
        return <Trash2 className="w-5 h-5" />;
      case "marked_claimed":
        return <CheckCircle2 className="w-5 h-5" />;
      case "recovered_item":
        return <RotateCcw className="w-5 h-5" />;
      case "deleted_chat":
        return <MessageCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "deleted_post":
        return "Deleted Post";
      case "marked_claimed":
        return "Marked as Claimed";
      case "recovered_item":
        return "Marked as Recovered";
      case "deleted_chat":
        return "Deleted Chat";
      default:
        return "Unknown";
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case "deleted_post":
        return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400";
      case "marked_claimed":
        return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
      case "recovered_item":
        return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
      case "deleted_chat":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-500/20 dark:text-neutral-400";
    }
  };

  return (
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-lg shadow-sm p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg ${getTypeColor()}`}>
            {getTypeIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-neutral-900 dark:text-white truncate text-sm">
                {item.title || "N/A"}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getTypeColor()}`}>
                {getTypeLabel()}
              </span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
              {item.description || "No description"}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              {item.user_info?.full_name && (
                <span>By: {item.user_info.full_name}</span>
              )}
              {item.created_at && (
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => onRestore(item.id, type)}
          disabled={isRestoring}
          className="flex-shrink-0 px-4 py-2 bg-primary-600 text-white font-medium text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 whitespace-nowrap"
        >
          {isRestoring ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Restoring...
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              Restore
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const RestoreCardSkeleton = () => (
  <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-lg shadow-sm p-4 animate-pulse">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 flex-1">
        <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-40 mb-2" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2" />
          <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded w-32" />
        </div>
      </div>
      <div className="h-10 w-28 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex-shrink-0" />
    </div>
  </div>
);

export default function AdminRestorePage({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, itemId: null, itemType: null, itemTitle: null });

  const fetchRestoableItems = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/admin/restorable-items?page=${page}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch restorable items.");
      const data = await response.json();
      setItems(data.items || []);
      setCurrentPage(data.pagination.current_page);
      setTotalPages(data.pagination.total_pages);
      setTotalItems(data.pagination.total_items);
    } catch (err) {
      console.error("Error fetching restorable items:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestoableItems(1);
  }, [fetchRestoableItems]);

  const handleRestore = async (itemId, type) => {
    const item = items.find(i => i.id === itemId);
    setConfirmModal({
      isOpen: true,
      itemId,
      itemType: type,
      itemTitle: item?.title || "item"
    });
  };

  const confirmRestore = async () => {
    const { itemId, itemType } = confirmModal;
    setIsRestoring(true);
    
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/admin/restore-item/${itemId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ item_type: itemType }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to restore item.");
      }

      toast.success("Item restored successfully!");
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setTotalItems((prev) => prev - 1);
      setConfirmModal({ isOpen: false, itemId: null, itemType: null, itemTitle: null });
    } catch (err) {
      console.error("Error restoring item:", err);
      toast.error(err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const cancelRestore = () => {
    setConfirmModal({ isOpen: false, itemId: null, itemType: null, itemTitle: null });
  };

  const filteredItems = items.filter((item) => {
    const matchesFilter = filterType === "all" || item.type === filterType;
    const matchesSearch =
      (item.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-primary-600" />
            Restore Items
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage deleted posts and items marked as claimed or recovered
          </p>
        </div>
        <button
          onClick={() => fetchRestoableItems(1)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm flex-shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">Deleted Posts</p>
          <p className="text-2xl font-bold text-red-900 dark:text-red-300 mt-1">
            {items.filter((i) => i.type === "deleted_post").length}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Recovered Items</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">
            {items.filter((i) => i.type === "recovered_item").length}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg p-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">Deleted Conversation</p>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300 mt-1">
            {items.filter((i) => i.type === "deleted_chat").length}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-lg p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-neutral-50 dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Types</option>
          <option value="deleted_post">Deleted Posts</option>
          <option value="recovered_item">Recovered Items</option>
          <option value="deleted_chat">Deleted Chats</option>
        </select>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <RestoreCardSkeleton key={i} />
            ))}
          </>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-3" />
            <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
            <button
              onClick={() => fetchRestoableItems(currentPage)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-[#2a2a2a] border-2 border-dashed border-neutral-200 dark:border-[#3a3a3a] rounded-lg">
            <RotateCcw className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400 text-lg font-medium">
              {items.length === 0 ? "No items to restore" : "No items match your filters"}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <RestoreCard
              key={item.id}
              item={item}
              type={item.type}
              onRestore={handleRestore}
              isRestoring={isRestoring}
            />
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Restore Item"
        message={`Are you sure you want to restore "${confirmModal.itemTitle}"? This action will revert the item to its original state.`}
        onConfirm={confirmRestore}
        onCancel={cancelRestore}
        isLoading={isRestoring}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-lg p-4">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Page {currentPage} of {totalPages} • {totalItems} items total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchRestoableItems(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => fetchRestoableItems(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}