import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Calendar, Loader2 } from "lucide-react";
import { apiClient } from "../api/apiClient";
import { toast } from "react-hot-toast";

const ThankYouNotes = ({ userId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await apiClient.get(
          `/api/handover/user/${userId}/thank-you-notes`
        );
        setNotes(response.notes || []);
      } catch (err) {
        console.error("Error fetching thank you notes:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchNotes();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return null; // Silently fail for this feature
  }

  if (notes.length === 0) {
    return (
      <div className="text-center p-8 sm:p-12 bg-white dark:bg-[#2a2a2a] border-2 border-dashed border-neutral-200 dark:border-[#3a3a3a] rounded-xl">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
        <p className="text-neutral-500 dark:text-neutral-400">
          No thank you notes yet
        </p>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
          Help return items to earn gratitude from the community!
        </p>
      </div>
    );
  }

  return (
    <div className="thank-you-notes">
      {/* Section Header */}
      <h2 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-white mb-4 flex items-center gap-2">
        <Heart className="w-6 h-6 text-red-500" />
        Community Thank Yous
        <span className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-xs px-2 py-1 rounded-full font-normal">
          {notes.length}
        </span>
      </h2>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 border border-pink-200 dark:border-pink-800 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            {/* Note Message */}
            <div className="note-message mb-3 flex items-start gap-2">
              <MessageCircle className="w-4 h-4 text-pink-400 dark:text-pink-500 flex-shrink-0 mt-1" />
              <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                "{note.message}"
              </p>
            </div>

            {/* Note Metadata */}
            <div className="note-meta text-sm text-gray-600 dark:text-gray-400 space-y-1 border-t border-pink-200 dark:border-pink-800 pt-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">For returning:</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium truncate">
                  {note.item_title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold">From:</span>
                <span className="truncate">{note.claimant_name}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                <Calendar className="w-3 h-3" />
                {new Date(note.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThankYouNotes;
