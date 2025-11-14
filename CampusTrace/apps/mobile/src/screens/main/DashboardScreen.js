import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Image,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Feather,
  MaterialIcons,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  AntDesign,
  FontAwesome5,
} from "@expo/vector-icons";
// Import the new, correct chart library
import { BarChart, LineChart } from "react-native-gifted-charts";
import {
  getSupabaseClient,
  getAccessToken,
  API_BASE_URL,
} from "@campustrace/core";
import SimpleLoadingScreen from "../../components/SimpleLoadingScreen";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Spacing,
  BorderRadius,
  Typography,
  getShadow,
} from "../../constants/designSystem";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 24;
const HORIZONTAL_CARD_WIDTH = width * 0.42;

const DashboardScreen = ({ navigation }) => {
  const { colors, fontSizes } = useTheme();

  // Create styles with current theme colors
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    lostItems: 0,
    foundItems: 0,
    recoveredItems: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [myRecentPosts, setMyRecentPosts] = useState([]);
  const [possibleMatches, setPossibleMatches] = useState([]);
  const [myLostItem, setMyLostItem] = useState(null);
  const [chartData, setChartData] = useState({
    weekly: [],
    categories: [],
  });

  useEffect(() => {
    loadDashboardData();
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Use the new consolidated dashboard-summary endpoint
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Authentication required.");
      }

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard-summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data.");
        }

        const data = await response.json();

        // Set recent posts
        setMyRecentPosts(data.myRecentPosts || []);

        // Set recent activity
        setRecentActivity(data.recentActivity || []);

        // Set stats from the consolidated response
        setStats({
          totalItems:
            data.userStats.found +
            data.userStats.lost +
            data.userStats.recovered,
          lostItems: data.userStats.lost,
          foundItems: data.userStats.found,
          recoveredItems: data.userStats.recovered,
        });

        // Process chart data from recent posts
        processChartData(data.myRecentPosts);

        // Set AI matches
        setPossibleMatches(data.aiMatches || []);

        // Find the latest lost item for the "Your Lost Item" section
        const latestLostItem = data.myRecentPosts
          .filter(
            (item) =>
              item.status === "Lost" &&
              item.moderation_status !== "recovered" &&
              item.moderation_status !== "rejected"
          )
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

        setMyLostItem(latestLostItem || null);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          console.error(
            "Dashboard request timed out. Please check your connection."
          );
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const processChartData = useCallback((items) => {
    const weeklyData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString("en", { weekday: "short" });
      const dayItems = items.filter((item) => {
        const itemDate = new Date(item.created_at);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === date.getTime();
      });
      weeklyData.push({
        day: dayName,
        lost: dayItems.filter((item) => item.status === "Lost").length,
        found: dayItems.filter((item) => item.status === "Found").length,
      });
    }

    // Categories
    const categoryCount = {};
    items.forEach((item) => {
      if (item.category && typeof item.category === "string") {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      }
    });

    const categories = Object.entries(categoryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    setChartData({ weekly: weeklyData, categories });
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  const renderMyPostItem = useCallback(
    ({ item, index }) => (
      <AnimatedItemCard
        item={item}
        index={index}
        onPress={() => navigation.navigate("Browse", { itemId: item.id })}
        styles={styles}
        colors={colors}
      />
    ),
    [navigation, styles, colors]
  );

  const renderMatchItem = useCallback(
    ({ item, index }) => (
      <AnimatedMatchCard
        item={item}
        index={index}
        onPress={() => navigation.navigate("Browse", { itemId: item.id })}
        styles={styles}
        colors={colors}
      />
    ),
    [navigation, styles, colors]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Modern Header */}
      <LinearGradient
        colors={[colors.surface, colors.background]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Text>
            <Text style={[styles.appName, { color: colors.text }]}>
              Dashboard
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate("Notifications")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Feather name="bell" size={22} color={colors.primary} />
                <View style={styles.notificationDot} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate("Messages")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Feather
                  name="message-circle"
                  size={22}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {loading && !refreshing ? (
        <SimpleLoadingScreen />
      ) : (
        <Animated.ScrollView
          style={[
            styles.scrollView,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Card */}
          <LinearGradient
            colors={[colors.primary, colors.primary + "DD"]}
            style={styles.welcomeCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeGreeting}>Welcome back! 👋</Text>
              <Text style={styles.welcomeMessage}>
                {stats.lostItems > 0
                  ? `You have ${stats.lostItems} active lost item${
                      stats.lostItems > 1 ? "s" : ""
                    }`
                  : "Everything looks good today!"}
              </Text>
            </View>
            <View style={styles.welcomeIcon}>
              <FontAwesome5
                name="search-location"
                size={32}
                color="rgba(255,255,255,0.3)"
              />
            </View>
          </LinearGradient>

          {/* Quick Stats Grid */}
          <View style={styles.statsContainer}>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
              Quick Overview
            </Text>
            <View style={styles.statsGrid}>
              <EnhancedStatCard
                icon={MaterialCommunityIcons}
                iconName="package-variant"
                label="Total Items"
                value={stats.totalItems}
                color="#6366F1"
                gradient={["#6366F1", "#818CF8"]}
                styles={styles}
                colors={colors}
              />
              <EnhancedStatCard
                icon={MaterialIcons}
                iconName="error"
                label="Lost"
                value={stats.lostItems}
                color="#EF4444"
                gradient={["#EF4444", "#F87171"]}
                styles={styles}
                colors={colors}
              />
              <EnhancedStatCard
                icon={MaterialIcons}
                iconName="check-circle"
                label="Found"
                value={stats.foundItems}
                color="#10B981"
                gradient={["#10B981", "#34D399"]}
                styles={styles}
                colors={colors}
              />
              <EnhancedStatCard
                icon={MaterialCommunityIcons}
                iconName="hand-heart"
                label="Recovered"
                value={stats.recoveredItems}
                color="#F59E0B"
                gradient={["#F59E0B", "#FCD34D"]}
                styles={styles}
                colors={colors}
              />
            </View>
          </View>

          {/* Activity Charts */}
          {chartData.weekly.length > 0 && (
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>Activity Insights</Text>
              <ModernChartCard
                title="This Week"
                data={chartData.weekly}
                type="area"
                styles={styles}
                colors={colors}
              />
            </View>
          )}

          {/* AI Matches Section */}
          <View style={styles.aiSection}>
            <View style={styles.aiHeader}>
              <LinearGradient
                colors={["#6366F1", "#A855F7"]}
                style={styles.aiIconGradient}
              >
                <MaterialCommunityIcons
                  name="robot-excited"
                  size={24}
                  color="white"
                />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiTitle}>Smart Matching</Text>
                <Text style={styles.aiSubtitle}>AI-powered suggestions</Text>
              </View>
              <TouchableOpacity style={styles.aiSettingsButton}>
                <Feather
                  name="settings"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {myLostItem ? (
              <View>
                <ModernLostItemCard
                  item={myLostItem}
                  styles={styles}
                  colors={colors}
                  onPress={() =>
                    navigation.navigate("Browse", { itemId: myLostItem.id })
                  }
                />

                {possibleMatches.length > 0 ? (
                  <View style={styles.matchesContainer}>
                    <Text style={styles.matchesTitle}>
                      {possibleMatches.length} Possible Match
                      {possibleMatches.length !== 1 ? "es" : ""}
                    </Text>
                    <FlatList
                      data={possibleMatches}
                      renderItem={renderMatchItem}
                      keyExtractor={(item) => item.id.toString()}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.matchesList}
                    />
                  </View>
                ) : (
                  <ModernEmptyState
                    icon={MaterialCommunityIcons}
                    iconName="magnify-scan"
                    title="Searching for matches..."
                    description="We'll notify you when we find something"
                    colors={colors}
                    styles={styles}
                  />
                )}
              </View>
            ) : (
              <ModernEmptyState
                icon={MaterialIcons}
                iconName="search-off"
                title="No active lost items"
                description="Report a lost item to enable smart matching"
                buttonText="Report Lost Item"
                onButtonPress={() => navigation.navigate("PostItem")}
                colors={colors}
                styles={styles}
              />
            )}
          </View>

          {/* My Active Posts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Active Posts</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate("MyPosts")}
              >
                <Text style={styles.viewAllText}>See all</Text>
                <Feather name="arrow-right" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {myRecentPosts.length > 0 ? (
              <FlatList
                data={myRecentPosts.slice(0, 5)}
                renderItem={renderMyPostItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            ) : (
              <ModernEmptyState
                icon={Feather}
                iconName="plus-circle"
                title="No active posts yet"
                description="Start by reporting a lost or found item"
                buttonText="Create Post"
                onButtonPress={() => navigation.navigate("PostItem")}
                colors={colors}
                styles={styles}
              />
            )}
          </View>

          {/* Community Activity Feed */}
          <View style={[styles.section, { paddingBottom: 32 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Community Feed</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>

            {recentActivity.length > 0 ? (
              recentActivity
                .slice(0, 5)
                .map((item, index) => (
                  <ModernActivityItem
                    key={item.id}
                    item={item}
                    index={index}
                    onPress={() =>
                      navigation.navigate("Browse", { itemId: item.id })
                    }
                    styles={styles}
                    colors={colors}
                  />
                ))
            ) : (
              <ModernEmptyState
                icon={MaterialCommunityIcons}
                iconName="account-group"
                title="No recent activity"
                description="Check back later for updates"
                colors={colors}
                styles={styles}
              />
            )}
          </View>
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
};

// Enhanced Components with animations
const AnimatedItemCard = memo(({ item, index, onPress, styles, colors }) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={styles.modernItemCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.itemCardImageContainer}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.itemCardImage}
            />
          ) : (
            <LinearGradient
              colors={["#E0E7FF", "#C7D2FE"]}
              style={styles.imagePlaceholder}
            >
              <Feather name="package" size={28} color="#6366F1" />
            </LinearGradient>
          )}
          <View
            style={[
              styles.itemStatusBadge,
              {
                backgroundColor: item.status === "Lost" ? "#EF4444" : "#10B981",
              },
            ]}
          >
            <Text style={styles.itemStatusText}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.itemCardContent}>
          <Text style={styles.itemCardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.itemCardMeta}>
            <View style={styles.metaTag}>
              <Feather name="tag" size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.category}</Text>
            </View>
            <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const AnimatedMatchCard = memo(({ item, index, onPress, styles, colors }) => {
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const matchPercentage = item.match_score ? Math.round(item.match_score) : 0;
  const matchColor =
    matchPercentage >= 80
      ? "#10B981"
      : matchPercentage >= 60
      ? "#F59E0B"
      : "#6B7280";

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <TouchableOpacity
        style={styles.matchCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.matchCardHeader}>
          <View
            style={[styles.matchScoreBadge, { backgroundColor: matchColor }]}
          >
            <Text style={styles.matchScoreText}>{matchPercentage}%</Text>
          </View>
          <Text style={styles.matchLabel}>Match</Text>
        </View>

        <View style={styles.matchCardImageContainer}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.matchCardImage}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Feather name="package" size={24} color="#9CA3AF" />
            </View>
          )}
        </View>

        <View style={styles.matchCardContent}>
          <Text style={styles.matchCardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.matchCardLocation} numberOfLines={1}>
            <Feather name="map-pin" size={10} /> {item.location || "Campus"}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const EnhancedStatCard = memo(
  ({ icon: Icon, iconName, label, value, gradient, styles, colors }) => (
    <TouchableOpacity style={styles.modernStatCard} activeOpacity={0.9}>
      <LinearGradient
        colors={gradient}
        style={styles.statGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon name={iconName} size={24} color="white" />
      </LinearGradient>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  )
);

const ModernLostItemCard = memo(({ item, styles, colors, onPress }) => (
  <TouchableOpacity
    style={styles.lostItemCard}
    onPress={onPress}
    activeOpacity={0.9}
  >
    <LinearGradient
      colors={["#FEF2F2", "#FEE2E2"]}
      style={styles.lostItemGradient}
    >
      <View style={styles.lostItemHeader}>
        <View style={styles.lostItemBadge}>
          <MaterialIcons name="error" size={16} color="#EF4444" />
          <Text style={styles.lostItemBadgeText}>Your Lost Item</Text>
        </View>
        <Text style={styles.lostItemTime}>{timeAgo(item.created_at)}</Text>
      </View>

      <View style={styles.lostItemContent}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.lostItemImage}
          />
        ) : (
          <View style={[styles.lostItemImage, styles.imagePlaceholder]}>
            <Feather name="package" size={24} color="#9CA3AF" />
          </View>
        )}

        <View style={styles.lostItemDetails}>
          <Text style={styles.lostItemTitle}>{item.title}</Text>
          <Text style={styles.lostItemDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.lostItemTags}>
            <View style={styles.tag}>
              <Feather name="tag" size={12} color="#6B7280" />
              <Text style={styles.tagText}>{item.category}</Text>
            </View>
            <View style={styles.tag}>
              <Feather name="map-pin" size={12} color="#6B7280" />
              <Text style={styles.tagText}>{item.location || "Campus"}</Text>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
));

const ModernActivityItem = memo(({ item, index, onPress, styles, colors }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const statusIcon = item.status === "Lost" ? "error" : "check-circle";
  const statusColor = item.status === "Lost" ? "#EF4444" : "#10B981";

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={styles.modernActivityItem}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.activityLeft}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.activityImage}
            />
          ) : (
            <View style={[styles.activityImage, styles.imagePlaceholder]}>
              <Feather name="package" size={20} color="#9CA3AF" />
            </View>
          )}
          <View
            style={[styles.activityStatusDot, { backgroundColor: statusColor }]}
          />
        </View>

        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <MaterialIcons name={statusIcon} size={16} color={statusColor} />
          </View>
          <Text style={styles.activityUser}>
            {item.profiles?.full_name || "Anonymous User"}
          </Text>
          <View style={styles.activityFooter}>
            <Text style={styles.activityTime}>{timeAgo(item.created_at)}</Text>
            <View style={styles.activityTags}>
              <View
                style={[
                  styles.miniTag,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Text style={[styles.miniTagText, { color: colors.primary }]}>
                  {item.category}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
});

const ModernEmptyState = memo(
  ({
    icon: Icon,
    iconName,
    title,
    description,
    buttonText,
    onButtonPress,
    colors,
    styles,
  }) => (
    <View style={styles.modernEmptyState}>
      <LinearGradient
        colors={[colors.primary + "10", colors.primary + "05"]}
        style={styles.emptyStateIconContainer}
      >
        <Icon name={iconName} size={32} color={colors.primary} />
      </LinearGradient>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateDescription}>{description}</Text>
      {buttonText && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={onButtonPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary + "DD"]}
            style={styles.buttonGradient}
          >
            <Text style={styles.emptyStateButtonText}>{buttonText}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  )
);

const ModernChartCard = memo(({ title, data, type, styles, colors }) => {
  if (data.length === 0) {
    return null;
  }

  return (
    <View style={styles.modernChartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={data.map((d) => ({ value: d.lost, label: d.day }))}
          data2={data.map((d) => ({ value: d.found }))}
          areaChart
          curved
          height={180}
          color1="#EF4444"
          color2="#10B981"
          startFillColor1="#EF4444"
          startFillColor2="#10B981"
          endFillColor1="rgba(239, 68, 68, 0.1)"
          endFillColor2="rgba(16, 185, 129, 0.1)"
          startOpacity={0.4}
          endOpacity={0.1}
          spacing={width / (data.length * 2)}
          xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
          yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
          hideRules
          initialSpacing={20}
          thickness={2}
          hideDataPoints
          hideYAxisText
        />
      </View>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
          <Text style={styles.legendText}>Lost Items</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
          <Text style={styles.legendText}>Found Items</Text>
        </View>
      </View>
    </View>
  );
});

// Helper function
const timeAgo = (dateString) => {
  if (!dateString) return "unknown time";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "invalid date";
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
};

// Updated Styles
const createStyles = (colors) => {
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: colors.shadow || "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    },
  });

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },

    // Header Styles
    headerGradient: {
      paddingBottom: 8,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    headerSubtitle: {
      fontSize: 12,
      fontWeight: "500",
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    appName: {
      fontSize: 28,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    headerIcons: {
      flexDirection: "row",
      gap: 12,
    },
    headerIconButton: {
      position: "relative",
    },
    iconBubble: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
    },
    notificationDot: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#EF4444",
    },

    // Welcome Card
    welcomeCard: {
      margin: 20,
      padding: 20,
      borderRadius: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      ...shadowStyle,
    },
    welcomeContent: {
      flex: 1,
    },
    welcomeGreeting: {
      fontSize: 20,
      fontWeight: "700",
      color: "white",
      marginBottom: 4,
    },
    welcomeMessage: {
      fontSize: 14,
      color: "rgba(255,255,255,0.9)",
      fontWeight: "500",
    },
    welcomeIcon: {
      marginLeft: 16,
    },

    // Stats Section
    statsContainer: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    modernStatCard: {
      flex: 1,
      minWidth: (width - 52) / 2,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      ...shadowStyle,
    },
    statGradient: {
      width: 48,
      height: 48,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textSecondary,
    },

    // Section Styles
    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    viewAllText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },

    // Chart Section
    chartSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    modernChartCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      marginTop: 12,
      ...shadowStyle,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
    },
    chartContainer: {
      marginLeft: -20,
    },
    chartLegend: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 24,
      marginTop: 16,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // AI Section
    aiSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    aiHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    aiIconGradient: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    aiTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    aiSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    aiSettingsButton: {
      padding: 8,
    },

    // Lost Item Card
    lostItemCard: {
      marginBottom: 16,
      borderRadius: 16,
      overflow: "hidden",
      ...shadowStyle,
    },
    lostItemGradient: {
      padding: 16,
    },
    lostItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    lostItemBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    lostItemBadgeText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#EF4444",
    },
    lostItemTime: {
      fontSize: 12,
      color: "#9CA3AF",
    },
    lostItemContent: {
      flexDirection: "row",
      gap: 12,
    },
    lostItemImage: {
      width: 72,
      height: 72,
      borderRadius: 12,
    },
    lostItemDetails: {
      flex: 1,
    },
    lostItemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#111827",
      marginBottom: 4,
    },
    lostItemDescription: {
      fontSize: 13,
      color: "#6B7280",
      lineHeight: 18,
      marginBottom: 8,
    },
    lostItemTags: {
      flexDirection: "row",
      gap: 8,
    },

    // Matches
    matchesContainer: {
      marginTop: 8,
    },
    matchesTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 12,
    },
    matchesList: {
      paddingRight: 20,
    },
    matchCard: {
      width: 140,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      marginRight: 12,
      ...shadowStyle,
    },
    matchCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    matchScoreBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    matchScoreText: {
      fontSize: 11,
      fontWeight: "700",
      color: "white",
    },
    matchLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    matchCardImageContainer: {
      width: "100%",
      height: 100,
      borderRadius: 12,
      marginBottom: 8,
      overflow: "hidden",
    },
    matchCardImage: {
      width: "100%",
      height: "100%",
    },
    matchCardContent: {
      gap: 4,
    },
    matchCardTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    matchCardLocation: {
      fontSize: 11,
      color: colors.textSecondary,
    },

    // Item Cards
    horizontalList: {
      paddingRight: 20,
    },
    modernItemCard: {
      width: HORIZONTAL_CARD_WIDTH,
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginRight: 12,
      overflow: "hidden",
      ...shadowStyle,
    },
    itemCardImageContainer: {
      width: "100%",
      height: HORIZONTAL_CARD_WIDTH,
      position: "relative",
    },
    itemCardImage: {
      width: "100%",
      height: "100%",
    },
    imagePlaceholder: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F3F4F6",
    },
    itemStatusBadge: {
      position: "absolute",
      top: 12,
      left: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    itemStatusText: {
      fontSize: 11,
      fontWeight: "700",
      color: "white",
    },
    itemCardContent: {
      padding: 12,
    },
    itemCardTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      lineHeight: 20,
    },
    itemCardMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    metaTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    timeText: {
      fontSize: 11,
      color: colors.textSecondary,
    },

    // Activity Items
    modernActivityItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
      ...shadowStyle,
    },
    activityLeft: {
      position: "relative",
      marginRight: 12,
    },
    activityImage: {
      width: 56,
      height: 56,
      borderRadius: 12,
    },
    activityStatusDot: {
      position: "absolute",
      bottom: -2,
      right: -2,
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 3,
      borderColor: colors.surface,
    },
    activityContent: {
      flex: 1,
    },
    activityHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    activityUser: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    activityFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    activityTime: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    activityTags: {
      flexDirection: "row",
      gap: 6,
    },

    // Tags
    tag: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F3F4F6",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
    },
    tagText: {
      fontSize: 11,
      color: "#6B7280",
    },
    miniTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    miniTagText: {
      fontSize: 10,
      fontWeight: "600",
    },

    // Live Indicator
    liveIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#10B981",
    },
    liveText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#10B981",
    },

    // Empty State
    modernEmptyState: {
      alignItems: "center",
      paddingVertical: 32,
      paddingHorizontal: 24,
    },
    emptyStateIconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
    },
    emptyStateDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 16,
      lineHeight: 18,
    },
    emptyStateButton: {
      marginTop: 8,
    },
    buttonGradient: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    emptyStateButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "white",
    },
  });
};

export default DashboardScreen;
