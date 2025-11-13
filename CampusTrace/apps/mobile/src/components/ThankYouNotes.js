import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Heart, MessageCircle, Calendar } from "lucide-react-native";
import { apiClient } from "../utils/apiClient";

const ThankYouNotes = ({ userId, colors }) => {
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return null; // Silently fail
  }

  if (notes.length === 0) {
    return (
      <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
        <MessageCircle size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No thank you notes yet
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
          Help return items to earn gratitude from the community!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notes.map((note, index) => (
        <View
          key={note.id || index}
          style={[
            styles.noteCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header with heart icon */}
          <View style={styles.noteHeader}>
            <View
              style={[
                styles.heartIcon,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Heart size={20} color={colors.primary} fill={colors.primary} />
            </View>
            <Text style={[styles.itemTitle, { color: colors.text }]}>
              {note.item_title}
            </Text>
          </View>

          {/* Thank you message */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            "{note.message}"
          </Text>

          {/* Footer with user and date */}
          <View style={styles.noteFooter}>
            <Text style={[styles.fromText, { color: colors.textTertiary }]}>
              From {note.claimant_name}
            </Text>
            <View style={styles.dateContainer}>
              <Calendar size={12} color={colors.textTertiary} />
              <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                {new Date(note.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  centerContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  noteCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heartIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fromText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 12,
  },
});

export default ThankYouNotes;
