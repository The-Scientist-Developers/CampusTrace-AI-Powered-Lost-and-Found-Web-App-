import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  RefreshControl,
  FlatList,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Crown,
  Medal,
  Zap,
  Trophy,
  ShieldCheck,
  Sparkles,
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

const { width } = Dimensions.get("window");
const BRAND_COLOR = "#1877F2";

const LeaderboardScreen = () => {
  const { colors } = useTheme();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Logic unchanged
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      if (!refreshing) setLoading(true);
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

  // Split data for UI layout (Top 3 vs Rest)
  const topThree = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

  // Helper to render the Podium Header
  const renderHeader = () => (
    <View>
      {/* Title Section */}
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <Trophy
            size={28}
            color={colors.primary}
            fill={colors.primary + "20"}
          />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Campus Heroes
          </Text>
        </View>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Top contributors recovering lost items
        </Text>
      </View>

      {/* Podium Section */}
      {topThree.length > 0 && (
        <View style={styles.podiumContainer}>
          {/* Rank 2 (Left) */}
          {topThree[1] && (
            <PodiumItem
              user={topThree[1]}
              rank={2}
              colors={colors}
              delay={200}
            />
          )}

          {/* Rank 1 (Center - Winner) */}
          {topThree[0] && (
            <PodiumItem
              user={topThree[0]}
              rank={1}
              colors={colors}
              delay={0}
              isWinner
            />
          )}

          {/* Rank 3 (Right) */}
          {topThree[2] && (
            <PodiumItem
              user={topThree[2]}
              rank={3}
              colors={colors}
              delay={400}
            />
          )}
        </View>
      )}

      {/* Divider for list */}
      {restOfList.length > 0 && (
        <View style={styles.listHeaderLabel}>
          <Text style={[styles.listLabelText, { color: colors.textSecondary }]}>
            Honorable Mentions
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <LinearGradient
        colors={[colors.primary + "10", "transparent"]}
        style={styles.backgroundGradient}
      />

      <FlatList
        data={restOfList}
        keyExtractor={(item) =>
          item.user_id?.toString() || Math.random().toString()
        }
        renderItem={({ item, index }) => (
          <LeaderboardRow
            user={item}
            rank={index + 4} // Offset by 3 since top 3 are in header
            colors={colors}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !loading && topThree.length === 0 ? (
            <View style={styles.emptyState}>
              <ShieldCheck size={64} color={colors.border} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                Be the First Hero
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtext,
                  { color: colors.textSecondary },
                ]}
              >
                Return a lost item to claim the throne!
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

// --- Sub-Component: Podium Item (Rank 1, 2, 3) ---
const PodiumItem = ({ user, rank, colors, isWinner, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 40,
      friction: 6,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const getBadgeColor = () => {
    if (rank === 1) return "#FFD700"; // Gold
    if (rank === 2) return "#C0C0C0"; // Silver
    if (rank === 3) return "#CD7F32"; // Bronze
    return colors.primary;
  };

  const size = isWinner ? 88 : 64;
  const badgeColor = getBadgeColor();

  return (
    <Animated.View
      style={[
        styles.podiumItem,
        {
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
            { scale: anim },
          ],
          opacity: anim,
        },
      ]}
    >
      <View style={styles.podiumAvatarContainer}>
        {isWinner && (
          <View style={styles.crownWrapper}>
            <Crown size={24} color="#FFD700" fill="#FFD700" />
          </View>
        )}

        {/* Avatar Circle with Rank Border */}
        <View
          style={[
            styles.avatarWrapper,
            {
              width: size + 6,
              height: size + 6,
              borderRadius: (size + 6) / 2,
              borderColor: badgeColor,
              borderWidth: isWinner ? 3 : 2,
              shadowColor: badgeColor,
              shadowOpacity: isWinner ? 0.5 : 0.2,
              shadowRadius: 8,
              elevation: 5,
            },
          ]}
        >
          <Image
            source={{
              uri:
                user.avatar_url ||
                `https://ui-avatars.com/api/?name=${user.full_name}&background=random`,
            }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />

          {/* Rank Badge Circle */}
          <View style={[styles.rankBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        </View>
      </View>

      <View style={styles.podiumInfo}>
        <Text
          style={[
            styles.podiumName,
            { color: colors.text, fontWeight: isWinner ? "700" : "600" },
          ]}
          numberOfLines={1}
        >
          {user.full_name?.split(" ")[0] || "User"}
        </Text>
        <View style={styles.podiumScore}>
          <Zap
            size={12}
            color={colors.warning || "#F59E0B"}
            fill={colors.warning || "#F59E0B"}
          />
          <Text
            style={[styles.podiumScoreText, { color: colors.textSecondary }]}
          >
            {user.recovered_count}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// --- Sub-Component: Regular List Item (Rank 4+) ---
const LeaderboardRow = ({ user, rank, colors }) => {
  return (
    <View
      style={[
        styles.leaderboardRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.listRank, { color: colors.textTertiary }]}>
          {rank}
        </Text>
        <Image
          source={{
            uri:
              user.avatar_url ||
              `https://ui-avatars.com/api/?name=${user.full_name}&background=random`,
          }}
          style={styles.listAvatar}
        />
        <View style={styles.listNameContainer}>
          <Text
            style={[styles.listName, { color: colors.text }]}
            numberOfLines={1}
          >
            {user.full_name}
          </Text>
          <Text style={[styles.listSubtitle, { color: colors.textSecondary }]}>
            Campus Scout
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.listScoreContainer,
          { backgroundColor: colors.primary + "10" },
        ]}
      >
        <Text style={[styles.listScore, { color: colors.primary }]}>
          {user.recovered_count}
        </Text>
        <Text style={[styles.listScoreLabel, { color: colors.primary }]}>
          pts
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  listContent: {
    paddingBottom: 20,
  },

  // Header Styles
  headerContent: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
  },

  // Podium Styles
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 40,
    paddingHorizontal: 20,
    height: 160, // Fixed height for alignment
  },
  podiumItem: {
    alignItems: "center",
    width: width * 0.28, // 3 columns roughly
    justifyContent: "flex-end",
  },
  podiumAvatarContainer: {
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  avatarWrapper: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  crownWrapper: {
    position: "absolute",
    top: -28,
    zIndex: 10,
  },
  rankBadge: {
    position: "absolute",
    bottom: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  rankText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  podiumInfo: {
    alignItems: "center",
  },
  podiumName: {
    fontSize: 14,
    marginBottom: 2,
    textAlign: "center",
  },
  podiumScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  podiumScoreText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // List Styles
  listHeaderLabel: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  listLabelText: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    ...getShadow("sm"),
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  listRank: {
    fontSize: 14,
    fontWeight: "600",
    width: 20,
    textAlign: "center",
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
  },
  listNameContainer: {
    flex: 1,
  },
  listName: {
    fontSize: 15,
    fontWeight: "600",
  },
  listSubtitle: {
    fontSize: 12,
  },
  listScoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 60,
  },
  listScore: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  listScoreLabel: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 10,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default LeaderboardScreen;
