import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Filter, MapPin, Calendar, User } from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";

const BrowseScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All"); // All, Lost, Found
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [filter, user]);

  const getCurrentUser = async () => {
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error("Error getting user:", error);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      if (!user?.id) {
        setItems([]);
        return;
      }

      // Fetch user's university_id (same as web app)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error("Could not find user profile.");

      // Build query - EXACT same as web app
      let query = supabase
        .from("items")
        .select("*, profiles(id, full_name, email)")
        .eq("university_id", profile.university_id)
        .eq("moderation_status", "approved");

      // Apply status filter (same as web app)
      if (filter !== "All") {
        query = query.eq("status", filter);
      }

      // Order by created_at descending (newest first)
      query = query.order("created_at", { ascending: false }).limit(50);

      const { data, error } = await query;

      if (error) throw error;

      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const filteredItems = items.filter((item) =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877F2" />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse All</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            // Cycle through filters
            if (filter === "All") setFilter("Lost");
            else if (filter === "Lost") setFilter("Found");
            else setFilter("All");
          }}
        >
          <Filter size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterChips}>
        <TouchableOpacity
          style={[styles.chip, filter === "All" && styles.chipActive]}
          onPress={() => setFilter("All")}
        >
          <Text
            style={[styles.chipText, filter === "All" && styles.chipTextActive]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, filter === "Lost" && styles.chipActive]}
          onPress={() => setFilter("Lost")}
        >
          <Text
            style={[
              styles.chipText,
              filter === "Lost" && styles.chipTextActive,
            ]}
          >
            Lost
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, filter === "Found" && styles.chipActive]}
          onPress={() => setFilter("Found")}
        >
          <Text
            style={[
              styles.chipText,
              filter === "Found" && styles.chipTextActive,
            ]}
          >
            Found
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <ScrollView
        style={styles.feed}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={64} color="#DFE0E4" />
            <Text style={styles.emptyStateText}>No items found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery
                ? "Try a different search term"
                : "Lost and found items will appear here"}
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => <FeedItem key={item.id} item={item} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const FeedItem = ({ item }) => {
  const posterName =
    item.profiles?.full_name ||
    (item.profiles?.email ? item.profiles.email.split("@")[0] : "Anonymous");

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const statusColor = item.status === "Lost" ? "#EF4444" : "#10B981";

  return (
    <View style={styles.feedItem}>
      {/* Header */}
      <View style={styles.feedItemHeader}>
        <View style={styles.feedItemUser}>
          <View style={styles.avatar}>
            {item.profiles?.avatar_url ? (
              <Image
                source={{ uri: item.profiles.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <User size={20} color="#FFFFFF" />
            )}
          </View>
          <View>
            <Text style={styles.userName}>{posterName}</Text>
            <View style={styles.locationRow}>
              <MapPin size={12} color="#8E8E93" />
              <Text style={styles.location}>
                {item.location || "Unknown location"}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.status}
          </Text>
        </View>
      </View>

      {/* Image */}
      {item.image_url && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Content */}
      <View style={styles.feedItemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDescription} numberOfLines={3}>
          {item.description}
        </Text>
        <View style={styles.metaRow}>
          <Calendar size={14} color="#8E8E93" />
          <Text style={styles.metaText}>
            {item.created_at ? getTimeAgo(item.created_at) : "Recently"}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#606770",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#000000",
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
  },
  filterChips: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F0F2F5",
  },
  chipActive: {
    backgroundColor: "#1877F2",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  feed: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
  },
  feedItem: {
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  feedItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  feedItemUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1877F2",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: "#8E8E93",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  moreButton: {
    fontSize: 20,
    color: "#000000",
    fontWeight: "bold",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F0F2F5",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  feedItemContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  divider: {
    height: 0.5,
    backgroundColor: "#DBDBDB",
  },
});

export default BrowseScreen;
