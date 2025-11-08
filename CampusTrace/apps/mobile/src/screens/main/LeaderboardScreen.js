import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
  FlatList, // Use FlatList for better performance
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trophy, Award, Star, User } from "lucide-react-native";
import { apiClient, BRAND_COLOR } from "@campustrace/core"; // This will work after you fix packages/core/src/index.js
import SimpleLoadingScreen from "../../components/SimpleLoadingScreen";

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      if (!refreshing) setLoading(true);

      // Use apiClient to fetch leaderboard
      const data = await apiClient.getLeaderboard();
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  if (loading && !refreshing) {
    return <SimpleLoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>
          Top users who helped return the most items
        </Text>
      </View>

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item, index }) => (
          <LeaderboardRow user={item} rank={index + 1} />
        )}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Trophy size={64} color="#DFE0E4" />
            <Text style={styles.emptyStateText}>No data yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Be the first to return an item!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const LeaderboardRow = ({ user, rank }) => {
  const getRankIcon = () => {
    if (rank === 1)
      return <Trophy size={24} color="#FFD700" strokeWidth={2.5} />;
    if (rank === 2)
      return <Award size={24} color="#C0C0C0" strokeWidth={2.5} />;
    if (rank === 3) return <Star size={24} color="#CD7F32" strokeWidth={2.5} />;
    return <Text style={styles.rankNumber}>{rank}</Text>;
  };

  const getRankStyle = () => {
    if (rank === 1) return styles.topRankGold;
    if (rank === 2) return styles.topRankSilver;
    if (rank === 3) return styles.topRankBronze;
    return {};
  };

  return (
    <View style={[styles.leaderboardRow, getRankStyle()]}>
      <View style={styles.rankContainer}>{getRankIcon()}</View>

      <View style={styles.avatarContainer}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User size={24} color="#FFFFFF" />
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.full_name || "Anonymous"}</Text>
        <Text style={styles.rankLabel}>Rank {rank}</Text>
      </View>

      <View style={styles.scoreContainer}>
        <Text style={styles.scoreValue}>{user.recovered_count || 0}</Text>
        <Text style={styles.scoreLabel}>Returned</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Changed to white to match other pages
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#606770",
  },
  // Header
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
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    flexGrow: 1,
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
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0", // Lighter border
  },
  topRankGold: {
    backgroundColor: "#FFFBF0",
  },
  topRankSilver: {
    backgroundColor: "#F8F8F8",
  },
  topRankBronze: {
    backgroundColor: "#FFF5F0",
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8E8E93",
  },
  avatarContainer: {
    marginLeft: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  rankLabel: {
    fontSize: 13,
    color: "#8E8E93",
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: BRAND_COLOR,
  },
  scoreLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
});

export default LeaderboardScreen;
