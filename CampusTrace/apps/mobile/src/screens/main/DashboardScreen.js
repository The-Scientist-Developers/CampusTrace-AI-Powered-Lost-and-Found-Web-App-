import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Feather,
  MaterialIcons,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  AntDesign,
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

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 24;
const HORIZONTAL_CARD_WIDTH = width * 0.7;

const DashboardScreen = ({ navigation }) => {
  const { colors, fontSizes } = useTheme();

  // Create styles with current theme colors
  const styles = React.useMemo(() => createStyles(colors), [colors]);

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
  }, []);

  const loadDashboardData = async () => {
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error("User profile not found.");

      // Fetch all user's items
      const { data: allMyItems = [], error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id);

      if (itemsError) throw itemsError;

      // Fetch active posts
      const { data: activePosts = [] } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .in("moderation_status", ["approved", "pending", "pending_return"])
        .order("created_at", { ascending: false })
        .limit(4);

      setMyRecentPosts(activePosts);

      // Fetch community activity
      if (profile.university_id) {
        const { data: communityData = [] } = await supabase
          .from("items")
          .select("*, profiles(id, full_name, email)")
          .eq("university_id", profile.university_id)
          .eq("moderation_status", "approved")
          .order("created_at", { ascending: false })
          .limit(50);
        setRecentActivity(communityData);
      } else {
        setRecentActivity([]);
      }

      // Calculate stats
      const lostCount = allMyItems.filter(
        (item) => item.status === "Lost"
      ).length;
      const foundCount = allMyItems.filter(
        (item) => item.status === "Found"
      ).length;
      const recoveredCount = allMyItems.filter(
        (item) => item.moderation_status === "recovered"
      ).length;

      setStats({
        totalItems: allMyItems.length,
        lostItems: lostCount,
        foundItems: foundCount,
        recoveredItems: recoveredCount,
      });

      // Process data for charts
      processChartData(allMyItems);

      // Find latest lost item and fetch matches
      const latestLostItem = allMyItems
        .filter(
          (item) =>
            item.status === "Lost" &&
            item.moderation_status !== "recovered" &&
            item.moderation_status !== "rejected"
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (latestLostItem) {
        setMyLostItem(latestLostItem);
        await fetchMatches(latestLostItem.id);
      } else {
        setMyLostItem(null);
        setPossibleMatches([]);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMatches = async (itemId) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        console.warn("No access token found, cannot fetch matches.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/items/find-matches/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: "Failed to fetch matches, invalid server response.",
        }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const matches = await response.json();
      setPossibleMatches(Array.isArray(matches) ? matches.slice(0, 4) : []);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setPossibleMatches([]);
    }
  };

  const processChartData = (items) => {
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
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const renderMyPostItem = ({ item }) => (
    <ItemCard
      item={item}
      onPress={() => navigation.navigate("Browse", { itemId: item.id })}
      styles={styles}
      colors={colors}
    />
  );

  const renderMatchItem = ({ item }) => (
    <MatchCard
      item={item}
      onPress={() => navigation.navigate("Browse", { itemId: item.id })}
      styles={styles}
      colors={colors}
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Instagram-style Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.appName, { color: colors.text }]}>
          CampusTrace
        </Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Feather name="heart" size={24} color={colors.primary} />
            {/* Optional notification dot */}
            {/* <View style={styles.notificationDot} /> */}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate("Messages")}
          >
            <Feather name="send" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <SimpleLoadingScreen />
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.greeting}>Welcome back!</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                icon={MaterialIcons}
                iconName="inventory"
                label="Total Items"
                value={stats.totalItems}
                color={colors.primary}
                styles={styles}
                colors={colors}
              />
              <StatCard
                icon={MaterialIcons}
                iconName="error-outline"
                label="Lost Items"
                value={stats.lostItems}
                color="#EF4444"
                styles={styles}
                colors={colors}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                icon={MaterialIcons}
                iconName="check-circle-outline"
                label="Found Items"
                value={stats.foundItems}
                color="#10B981"
                styles={styles}
                colors={colors}
              />
              <StatCard
                icon={MaterialIcons}
                iconName="show-chart"
                label="Recovered"
                value={stats.recoveredItems}
                color="#3B82F6"
                styles={styles}
                colors={colors}
              />
            </View>
          </View>

          {/* Charts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            <ChartCard
              title="Weekly Activity"
              data={chartData.weekly}
              type="area"
              styles={styles}
              colors={colors}
            />
            <ChartCard
              title="Top Categories"
              data={chartData.categories}
              type="bar"
              styles={styles}
              colors={colors}
            />
          </View>

          {/* AI-Powered Matches */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons
                name="auto-fix"
                size={22}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>AI-Powered Matches</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Smart matching for your lost items
            </Text>

            {myLostItem ? (
              <View>
                {/* Your Latest Lost Item Card */}
                <View style={styles.latestLostItemCard}>
                  <Text style={styles.latestLostItemTitle}>
                    Your Latest Lost Item
                  </Text>
                  <View style={{ flexDirection: "row" }}>
                    <ItemImage
                      imageUrl={myLostItem.image_url}
                      style={styles.latestLostItemImage}
                      styles={styles}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.latestLostItemName} numberOfLines={1}>
                        {myLostItem.title}
                      </Text>
                      <Text style={styles.latestLostItemDesc} numberOfLines={2}>
                        {myLostItem.description}
                      </Text>
                      <View style={{ flexDirection: "row", marginTop: 8 }}>
                        <View
                          style={[
                            styles.smallBadge,
                            { backgroundColor: "#F3F4F6" },
                          ]}
                        >
                          <AntDesign name="tag" size={12} color="#6B7280" />
                          <Text
                            style={[
                              styles.smallBadgeText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {myLostItem.category}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.smallBadge,
                            { backgroundColor: "#FEE2E2" },
                          ]}
                        >
                          <MaterialIcons
                            name="error-outline"
                            size={12}
                            color="#EF4444"
                          />
                          <Text
                            style={[
                              styles.smallBadgeText,
                              { color: "#EF4444" },
                            ]}
                          >
                            Lost
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Matches List */}
                {possibleMatches.length > 0 ? (
                  <View>
                    <Text style={styles.subSectionTitle}>
                      Possible Matches Found ({possibleMatches.length})
                    </Text>
                    <FlatList
                      data={possibleMatches}
                      renderItem={renderMatchItem}
                      keyExtractor={(item) => item.id.toString()}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingVertical: 12 }}
                    />
                  </View>
                ) : (
                  <EmptyState
                    icon={MaterialIcons}
                    iconName="help-outline"
                    title="No matches found yet"
                    description="Our AI is continuously searching. We'll show potential matches here."
                    colors={colors}
                    styles={styles}
                  />
                )}
              </View>
            ) : (
              <EmptyState
                icon={MaterialIcons}
                iconName="inventory"
                title="No active lost items"
                description="If you lose something, post it here to enable AI-powered matching."
                buttonText="Post Lost Item"
                onButtonClick={() => navigation.navigate("PostItem")}
                colors={colors}
                styles={styles}
              />
            )}
          </View>

          {/* My Active Posts */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>My Active Posts</Text>
              <TouchableOpacity onPress={() => navigation.navigate("MyPosts")}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            {myRecentPosts.length > 0 ? (
              <FlatList
                data={myRecentPosts}
                renderItem={renderMyPostItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 12 }}
              />
            ) : (
              <EmptyState
                icon={Feather}
                iconName="eye-off"
                title="No active posts"
                description="Items you post will appear here. Start by reporting a lost or found item."
                buttonText="Post New Item"
                onButtonClick={() => navigation.navigate("PostItem")}
                colors={colors}
                styles={styles}
              />
            )}
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Community Activity</Text>
            </View>
            {recentActivity.length === 0 ? (
              <EmptyState
                icon={Feather}
                iconName="clock"
                title="No recent activity"
                colors={colors}
                styles={styles}
              />
            ) : (
              recentActivity
                .slice(0, 5)
                .map((item) => (
                  <ActivityItem
                    key={item.id}
                    item={item}
                    onPress={() =>
                      navigation.navigate("Browse", { itemId: item.id })
                    }
                    styles={styles}
                    colors={colors}
                  />
                ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// --- Helper Functions ---
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

// --- Re-usable Components ---
const ItemImage = ({ imageUrl, style, styles }) => (
  <View style={[styles.itemImageContainer, style]}>
    {imageUrl ? (
      <Image source={{ uri: imageUrl }} style={styles.itemImage} />
    ) : (
      <View style={styles.itemImagePlaceholder}>
        <Feather name="camera" size={24} color="#D1D5DB" />
      </View>
    )}
  </View>
);

const StatusBadge = ({ status, styles }) => {
  const statusConfig = {
    approved: { bg: "#D1FAE5", text: "#065F46", label: "Active" },
    pending: { bg: "#FEF3C7", text: "#92400E", label: "Pending" },
    rejected: { bg: "#FEE2E2", text: "#991B1B", label: "Rejected" },
    recovered: { bg: "#DBEAFE", text: "#1E40AF", label: "Recovered" },
    pending_return: { bg: "#CFFAFE", text: "#0E7490", label: "Pending Return" },
  };
  const config = statusConfig[status?.toLowerCase()] || {
    bg: "#F3F4F6",
    text: "#4B5563",
    label: "Unknown",
  };
  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusText, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
};

const ItemCard = ({ item, onPress, styles, colors }) => (
  <TouchableOpacity style={styles.itemCard} onPress={onPress}>
    <ItemImage
      imageUrl={item.image_url}
      style={styles.itemCardImage}
      styles={styles}
    />
    <View style={{ padding: 12 }}>
      <Text style={styles.itemCardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.itemCardFooter}>
        <StatusBadge status={item.moderation_status} styles={styles} />
        <View
          style={[
            styles.smallBadge,
            item.status === "Lost"
              ? { backgroundColor: "#FEE2E2" }
              : { backgroundColor: "#D1FAE5" },
          ]}
        >
          <Text
            style={[
              styles.smallBadgeText,
              item.status === "Lost"
                ? { color: "#EF4444" }
                : { color: "#10B981" },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const MatchCard = ({ item, onPress, styles, colors }) => (
  <TouchableOpacity style={styles.itemCard} onPress={onPress}>
    {item.match_score && (
      <View style={styles.matchBadge}>
        <Text style={styles.matchBadgeText}>
          {Math.round(item.match_score)}% Match
        </Text>
      </View>
    )}
    <ItemImage
      imageUrl={item.image_url}
      style={styles.itemCardImage}
      styles={styles}
    />
    <View style={{ padding: 12 }}>
      <Text style={styles.itemCardTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <View style={styles.itemCardFooter}>
        <Text style={styles.itemCardCategory}>{item.category}</Text>
        <View style={[styles.smallBadge, { backgroundColor: "#D1FAE5" }]}>
          <Text style={[styles.smallBadgeText, { color: "#10B981" }]}>
            Found
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const ActivityItem = ({ item, onPress, styles, colors }) => {
  const statusColor = item.status === "Lost" ? "#EF4444" : "#10B981";
  const posterName =
    item.profiles?.full_name ||
    (item.profiles?.email ? item.profiles.email.split("@")[0] : "Anonymous");

  return (
    <TouchableOpacity style={styles.activityItem} onPress={onPress}>
      <ItemImage
        imageUrl={item.image_url}
        style={styles.activityItemImage}
        styles={styles}
      />
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.activityUser}>{posterName}</Text>
        <Text style={styles.activityTime}>
          {timeAgo(item.created_at)}
          {" · "}
          <Text style={{ color: statusColor }}>{item.status}</Text>
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

const StatCard = ({
  icon: Icon,
  iconName,
  label,
  value,
  color,
  styles,
  colors,
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: color + "15" }]}>
      <Icon name={iconName} size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const EmptyState = ({
  icon: Icon,
  iconName,
  title,
  description,
  buttonText,
  onButtonClick,
  colors,
  styles,
}) => (
  <View
    style={[
      styles.emptyStateContainer,
      {
        backgroundColor:
          colors.card || styles.emptyStateContainer.backgroundColor,
      },
    ]}
  >
    <View
      style={[
        styles.emptyStateIconContainer,
        {
          backgroundColor:
            colors.surface || styles.emptyStateIconContainer.backgroundColor,
        },
      ]}
    >
      <Icon
        name={iconName}
        size={32}
        color={colors.textSecondary || "#9CA3AF"}
      />
    </View>
    <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
      {title}
    </Text>
    {description && (
      <Text
        style={[styles.emptyStateDescription, { color: colors.textSecondary }]}
      >
        {description}
      </Text>
    )}
    {buttonText && (
      <TouchableOpacity
        style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
        onPress={onButtonClick}
      >
        <Text style={[styles.emptyStateButtonText, { color: "#FFFFFF" }]}>
          {buttonText}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

const ChartCard = ({ title, data, type, styles, colors }) => {
  const lostColor = "#EF4444";
  const foundColor = "#10B981";
  const primaryColor = colors.primary;
  const axisColor = colors.textSecondary;

  if (data.length === 0) {
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>No data to display</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      {type === "area" && (
        <View style={{ marginLeft: -10, paddingBottom: 20 }}>
          <LineChart
            data={data.map((d) => ({ value: d.lost, label: d.day }))}
            data2={data.map((d) => ({ value: d.found }))}
            areaChart
            height={200}
            color1={lostColor}
            color2={foundColor}
            startFillColor1={lostColor}
            startFillColor2={foundColor}
            endFillColor1={"#FEE2E2"}
            endFillColor2={"#D1FAE5"}
            startOpacity={0.8}
            endOpacity={0.1}
            spacing={width / (data.length * 1.5)}
            xAxisLabelTextStyle={{ color: axisColor, fontSize: 10 }}
            yAxisTextStyle={{ color: axisColor, fontSize: 10 }}
            xAxisColor={axisColor}
            yAxisColor={axisColor}
            noOfSections={4}
            initialSpacing={10}
            rulesType="solid"
          />
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: lostColor }]}
              />
              <Text style={styles.legendText}>Lost</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: foundColor }]}
              />
              <Text style={styles.legendText}>Found</Text>
            </View>
          </View>
        </View>
      )}
      {type === "bar" && (
        <View style={{ paddingBottom: 20, paddingLeft: 10 }}>
          <BarChart
            data={data.map((d) => ({ value: d.value, label: d.name }))}
            height={200}
            barWidth={20}
            frontColor={primaryColor}
            xAxisLabelTextStyle={{ color: axisColor, fontSize: 10, width: 60 }}
            yAxisTextStyle={{ color: axisColor, fontSize: 10 }}
            xAxisColor={axisColor}
            yAxisColor={axisColor}
            noOfSections={4}
            rulesType="solid"
            yAxisSide="right"
          />
        </View>
      )}
    </View>
  );
};

// --- Styles ---
const createStyles = (colors) => {
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: colors.shadow || "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: {
      elevation: 3,
    },
    web: {
      boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.1)",
    },
  });

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },

    // Instagram-style Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      ...shadowStyle,
    },
    appName: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      fontFamily: Platform.select({
        ios: "System",
        android: "sans-serif",
        web: "Poppins, sans-serif",
      }),
      letterSpacing: -0.5,
      lineHeight: 28,
    },
    headerIcons: {
      flexDirection: "row",
      gap: 16,
    },
    headerIconButton: {
      padding: 4,
      position: "relative",
    },
    notificationDot: {
      position: "absolute",
      top: 2,
      right: 2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#FF3250",
    },

    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },
    welcomeSection: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
      backgroundColor: colors.surface,
    },
    greeting: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    userName: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    statsContainer: {
      padding: 16,
      gap: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    statIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    statValue: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    section: {
      padding: 16,
      backgroundColor: colors.surface,
      marginTop: 8,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 4,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    subSectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      marginTop: 16,
    },
    viewAllText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },

    // Item Card
    itemCard: {
      width: HORIZONTAL_CARD_WIDTH,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 12,
      overflow: "hidden",
    },
    itemCardImage: {
      width: "100%",
      aspectRatio: 1,
    },
    itemCardTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      height: 40,
    },
    itemCardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    itemCardCategory: {
      fontSize: 13,
      color: colors.textSecondary,
    },

    // Match Card
    matchBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      zIndex: 1,
    },
    matchBadgeText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "bold",
    },

    // Latest Lost Item
    latestLostItemCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 8,
    },
    latestLostItemTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      marginBottom: 12,
    },
    latestLostItemImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
    },
    latestLostItemName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    latestLostItemDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },

    // Badges
    smallBadge: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 6,
    },
    smallBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      marginLeft: 4,
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

    // Image Placeholder
    itemImageContainer: {
      backgroundColor: "#F3F4F6",
      overflow: "hidden",
    },
    itemImage: {
      width: "100%",
      height: "100%",
    },
    itemImagePlaceholder: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },

    // Activity Item
    activityItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    activityItemImage: {
      width: 48,
      height: 48,
      borderRadius: 8,
    },
    activityContent: {
      flex: 1,
      marginHorizontal: 12,
    },
    activityTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    activityUser: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    activityTime: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },

    // Empty State
    emptyStateContainer: {
      alignItems: "center",
      paddingVertical: 32,
      backgroundColor: colors.background,
      borderRadius: 12,
      marginVertical: 12,
    },
    emptyStateIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#F3F4F6",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#1F2937",
      marginBottom: 4,
    },
    emptyStateDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    emptyStateButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    emptyStateButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },

    // Chart Card
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 24,
    },
    emptyChart: {
      height: 200,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyChartText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    legendContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 16,
      gap: 24,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 6,
    },
    legendText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
};

export default DashboardScreen;
