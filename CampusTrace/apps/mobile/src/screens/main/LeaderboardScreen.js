import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
  FlatList,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Trophy,
  Award,
  Star,
  User,
  Crown,
  Medal,
  Zap,
  TrendingUp,
} from "lucide-react-native";
import { apiClient } from "@campustrace/core";
import SimpleLoadingScreen from "../../components/SimpleLoadingScreen";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Spacing,
  BorderRadius,
  Typography,
  getShadow,
} from "../../constants/designSystem";

const BRAND_COLOR = "#1877F2";

const LeaderboardScreen = () => {
  const { colors, fontSizes } = useTheme();

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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Standardized Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Leaderboard
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Top heroes who reunited items with their owners
        </Text>
      </View>

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item, index }) => (
          <LeaderboardRow user={item} rank={index + 1} colors={colors} />
        )}
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View
            style={[styles.emptyState, { backgroundColor: colors.background }]}
          >
            <Trophy size={64} color={colors.border} />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              No data yet
            </Text>
            <Text
              style={[
                styles.emptyStateSubtext,
                { color: colors.textSecondary },
              ]}
            >
              Be the first to return an item!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const LeaderboardRow = ({ user, rank, colors }) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: rank * 50, // Stagger animation
      useNativeDriver: true,
    }).start();
  }, []);

  const getRankIcon = () => {
    if (rank === 1)
      return (
        <View style={styles.crownContainer}>
          <Crown size={28} color="#FFD700" fill="#FFD700" strokeWidth={2} />
        </View>
      );
    if (rank === 2)
      return (
        <View style={styles.medalContainer}>
          <Medal size={26} color="#C0C0C0" fill="#C0C0C0" strokeWidth={2} />
        </View>
      );
    if (rank === 3)
      return (
        <View style={styles.medalContainer}>
          <Medal size={26} color="#CD7F32" fill="#CD7F32" strokeWidth={2} />
        </View>
      );
    return (
      <View style={styles.rankBadge}>
        <Text style={[styles.rankNumber, { color: colors?.text || "#000000" }]}>
          {rank}
        </Text>
      </View>
    );
  };

  const getRankStyle = () => {
    if (rank === 1) return styles.topRankGold;
    if (rank === 2) return styles.topRankSilver;
    if (rank === 3) return styles.topRankBronze;
    return {};
  };

  const getRankBorder = () => {
    if (rank === 1) return { borderLeftColor: "#FFD700", borderLeftWidth: 4 };
    if (rank === 2) return { borderLeftColor: "#C0C0C0", borderLeftWidth: 4 };
    if (rank === 3) return { borderLeftColor: "#CD7F32", borderLeftWidth: 4 };
    return {};
  };

  return (
    <Animated.View
      style={[
        styles.leaderboardRow,
        getRankStyle(),
        getRankBorder(),
        {
          backgroundColor: colors?.card || "#FFFFFF",
          borderColor: colors?.border || "#E5E7EB",
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.rankContainer}>{getRankIcon()}</View>

      <View style={styles.avatarContainer}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: colors?.primary || BRAND_COLOR },
            ]}
          >
            <User size={24} color="#FFFFFF" />
          </View>
        )}
        {rank <= 3 && (
          <View
            style={[
              styles.topBadge,
              {
                backgroundColor:
                  rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : "#CD7F32",
              },
            ]}
          >
            <Text style={styles.topBadgeText}>TOP {rank}</Text>
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <Text
          style={[styles.userName, { color: colors?.text || "#000000" }]}
          numberOfLines={1}
        >
          {user.full_name || "Anonymous"}
        </Text>
        <View style={styles.statsRow}>
          <Zap
            size={14}
            color={colors?.warning || "#F59E0B"}
            fill={colors?.warning || "#F59E0B"}
          />
          <Text
            style={[
              styles.rankLabel,
              { color: colors?.textSecondary || "#8E8E93" },
            ]}
          >
            {user.recovered_count || 0} items returned
          </Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <View
          style={[
            styles.scoreBadge,
            { backgroundColor: colors?.primary + "15" || BRAND_COLOR + "15" },
          ]}
        >
          <TrendingUp size={16} color={colors?.primary || BRAND_COLOR} />
          <Text
            style={[
              styles.scoreValue,
              { color: colors?.primary || BRAND_COLOR },
            ]}
          >
            {user.recovered_count || 0}
          </Text>
        </View>
        <Text
          style={[
            styles.scoreLabel,
            { color: colors?.textSecondary || "#8E8E93" },
          ]}
        >
          Points
        </Text>
      </View>
    </Animated.View>
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
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#606770",
  },
  // Enhanced Header
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DBDBDB",
    ...getShadow("sm"),
  },
  headerTitle: {
    ...Typography.h2,
    color: "#000000",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: "#6B7280",
    marginTop: Spacing.xs,
    fontWeight: "400",
    lineHeight: 20,
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
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    ...getShadow("sm"),
  },
  topRankGold: {
    backgroundColor: "#FFFBF0",
    ...getShadow("md"),
  },
  topRankSilver: {
    backgroundColor: "#F8F9FA",
    ...getShadow("md"),
  },
  topRankBronze: {
    backgroundColor: "#FFF5F0",
    ...getShadow("md"),
  },
  rankContainer: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  rankNumber: {
    ...Typography.h5,
    color: "#6B7280",
  },
  crownContainer: {
    transform: [{ rotate: "-15deg" }],
  },
  medalContainer: {
    // Medal styling
  },
  avatarContainer: {
    position: "relative",
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: BRAND_COLOR,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  topBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  topBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.body,
    fontWeight: "600",
    color: "#000000",
    marginBottom: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  rankLabel: {
    ...Typography.caption,
    color: "#8E8E93",
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  scoreValue: {
    ...Typography.h5,
    color: BRAND_COLOR,
  },
  scoreLabel: {
    ...Typography.caption,
    color: "#8E8E93",
  },
});

export default LeaderboardScreen;
