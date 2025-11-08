import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Package,
  FileText,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit3,
  Trash2,
  PackageCheck,
  XCircle,
  Check,
  X,
  Camera,
  RotateCcw,
} from "lucide-react-native";
import { getSupabaseClient, BRAND_COLOR } from "@campustrace/core";
import { Swipeable } from "react-native-gesture-handler";
import { useFocusEffect } from "@react-navigation/native";
import SimpleLoadingScreen from "../../components/SimpleLoadingScreen";

// ====================
// Helper Function
// ====================
const getTimeAgo = (dateString) => {
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
      return `${count}${interval.label.charAt(0)} ago`;
    }
  }
  return "just now";
};

// ====================
// Main Component
// ====================
const MyPostsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  const [activeTab, setActiveTab] = useState("My Posts"); // 'My Posts', 'My Claims', 'Received'
  const [myPosts, setMyPosts] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [receivedClaims, setReceivedClaims] = useState([]);

  const openSwipeableRef = useRef(null);

  // Fetch user first
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  // Fetch all data when user is available or on focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchAllData();
      }
    }, [user?.id])
  );

  const fetchAllData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    try {
      // 1. Fetch My Posts
      const { data: postsData, error: postsError } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (postsError) throw postsError;
      setMyPosts(postsData || []);

      // 2. Fetch My Claims
      const { data: claimsData, error: claimsError } = await supabase
        .from("claims")
        .select("*, item:items(*)")
        .eq("claimant_id", user.id)
        .order("created_at", { ascending: false });
      if (claimsError) throw claimsError;
      setMyClaims(claimsData || []);

      // 3. Fetch Received Claims
      const { data: receivedData, error: receivedError } = await supabase
        .from("claims")
        .select(
          "*, item:items(*), claimant:profiles!claims_claimant_id_fkey(*)"
        )
        .eq("finder_id", user.id)
        .order("created_at", { ascending: false });
      if (receivedError) throw receivedError;
      setReceivedClaims(receivedData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to fetch your data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData(true);
  };

  // --- Action Handlers ---

  const handleDeletePost = (item) => {
    Alert.alert(
      "Delete Post",
      `Are you sure you want to delete "${item.title}"? This is permanent.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setMyPosts((prev) => prev.filter((p) => p.id !== item.id));
            const supabase = getSupabaseClient();
            const { error } = await supabase
              .from("items")
              .delete()
              .eq("id", item.id);
            if (error) {
              Alert.alert("Error", "Could not delete post. Please refresh.");
              fetchAllData(true);
            }
          },
        },
      ]
    );
  };

  const handleMarkRecovered = (item) => {
    Alert.alert(
      "Mark as Recovered",
      `Have you successfully recovered "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Recovered",
          style: "default",
          onPress: async () => {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
              .from("items")
              .update({ moderation_status: "recovered" })
              .eq("id", item.id)
              .select()
              .single();
            if (error) {
              Alert.alert("Error", "Could not mark as recovered.");
            } else {
              setMyPosts((prev) =>
                prev.map((p) => (p.id === item.id ? data : p))
              );
            }
          },
        },
      ]
    );
  };

  const handleEditPost = (item) => {
    navigation.navigate("Post", { itemToEdit: item });
  };

  const handleCancelClaim = (claim) => {
    Alert.alert(
      "Cancel Claim",
      `Are you sure you want to cancel your claim for "${claim.item.title}"?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setMyClaims((prev) => prev.filter((c) => c.id !== claim.id));
            const supabase = getSupabaseClient();
            const { error } = await supabase
              .from("claims")
              .delete()
              .eq("id", claim.id);
            if (error) {
              Alert.alert("Error", "Could not cancel claim. Please refresh.");
              fetchAllData(true);
            }
          },
        },
      ]
    );
  };

  const handleUpdateClaimStatus = (claim, newStatus) => {
    const action = newStatus === "accepted" ? "Accept" : "Reject";
    Alert.alert(
      `${action} Claim`,
      `Are you sure you want to ${action.toLowerCase()} this claim for "${
        claim.item.title
      }"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Yes, ${action}`,
          style: newStatus === "rejected" ? "destructive" : "default",
          onPress: async () => {
            const supabase = getSupabaseClient();
            try {
              // 1. Update the claim status
              const { data: updatedClaim, error: claimError } = await supabase
                .from("claims")
                .update({ status: newStatus })
                .eq("id", claim.id)
                .select()
                .single();

              if (claimError) throw claimError;

              // 2. If accepted, update the item status
              if (newStatus === "accepted") {
                await supabase
                  .from("items")
                  .update({ moderation_status: "pending_return" })
                  .eq("id", claim.item.id);
              }

              // 3. Update local state
              setReceivedClaims((prev) =>
                prev.map((c) =>
                  c.id === claim.id ? { ...c, ...updatedClaim } : c
                )
              );
            } catch (error) {
              Alert.alert("Error", `Failed to ${action.toLowerCase()} claim.`);
            }
          },
        },
      ]
    );
  };

  // --- Render Functions ---

  const renderItemCard = ({ item }) => {
    if (activeTab === "My Posts") {
      return (
        <SwipeablePostCard
          item={item}
          onDelete={handleDeletePost}
          onEdit={handleEditPost}
          onMarkRecovered={handleMarkRecovered}
          openSwipeableRef={openSwipeableRef}
        />
      );
    }

    if (activeTab === "My Claims") {
      return (
        <ClaimCard claim={item} onCancel={() => handleCancelClaim(item)} />
      );
    }

    if (activeTab === "Received") {
      return (
        <ReceivedClaimCard
          claim={item}
          onAccept={() => handleUpdateClaimStatus(item, "accepted")}
          onReject={() => handleUpdateClaimStatus(item, "rejected")}
        />
      );
    }

    return null;
  };

  const getListData = () => {
    switch (activeTab) {
      case "My Posts":
        return myPosts;
      case "My Claims":
        return myClaims;
      case "Received":
        return receivedClaims;
      default:
        return [];
    }
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyState}>
      {activeTab === "My Posts" && <Package size={64} color="#DFE0E4" />}
      {activeTab === "My Claims" && <FileText size={64} color="#DFE0E4" />}
      {activeTab === "Received" && <Users size={64} color="#DFE0E4" />}
      <Text style={styles.emptyStateText}>No {activeTab} Found</Text>
      <Text style={styles.emptyStateSubtext}>
        {activeTab === "My Posts" && "Items you post will appear here."}
        {activeTab === "My Claims" &&
          "Claims you make on items will appear here."}
        {activeTab === "Received" &&
          "Claims made on your items will appear here."}
      </Text>
    </View>
  );

  if (loading) {
    return <SimpleLoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Activity</Text>
        <Text style={styles.headerSubtitle}>
          View your posts, claims, and activity history
        </Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <TabButton
          title="My Posts"
          icon={Package}
          isActive={activeTab === "My Posts"}
          onPress={() => setActiveTab("My Posts")}
        />
        <TabButton
          title="My Claims"
          icon={FileText}
          isActive={activeTab === "My Claims"}
          onPress={() => setActiveTab("My Claims")}
        />
        <TabButton
          title="Received"
          icon={Users}
          isActive={activeTab === "Received"}
          onPress={() => setActiveTab("Received")}
        />
      </View>

      {/* List */}
      <FlatList
        data={getListData()}
        renderItem={renderItemCard}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={
          getListData().length === 0 ? styles.listEmpty : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyComponent}
      />
    </SafeAreaView>
  );
};

// ====================
// Sub-Components
// ====================

const SwipeablePostCard = ({
  item,
  onDelete,
  onEdit,
  onMarkRecovered,
  openSwipeableRef,
}) => {
  const ref = useRef(null);
  const onSwipeableOpen = () => {
    if (openSwipeableRef.current && openSwipeableRef.current !== ref.current) {
      openSwipeableRef.current.close();
    }
    openSwipeableRef.current = ref.current;
  };

  return (
    <Swipeable
      ref={ref}
      onSwipeableOpen={onSwipeableOpen}
      renderRightActions={(progress, dragX) => (
        <PostSwipeActions
          progress={progress}
          dragX={dragX}
          item={item}
          onDelete={() => {
            ref.current?.close();
            onDelete(item);
          }}
          onEdit={() => {
            ref.current?.close();
            onEdit(item);
          }}
        />
      )}
    >
      <PostCard item={item} onMarkRecovered={() => onMarkRecovered(item)} />
    </Swipeable>
  );
};

const TabButton = ({ title, icon: Icon, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
    onPress={onPress}
  >
    <Icon size={18} color={isActive ? BRAND_COLOR : "#6B7280"} />
    <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const PostCard = ({ item, onMarkRecovered }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <ItemImage imageUrl={item.image_url} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.badgeRow}>
          <StatusBadge status={item.moderation_status} />
          <TypeBadge type={item.status} />
        </View>
        <Text style={styles.cardTimestamp}>{getTimeAgo(item.created_at)}</Text>
      </View>
    </View>
    {item.moderation_status === "approved" && item.status === "Lost" && (
      <TouchableOpacity style={styles.recoverButton} onPress={onMarkRecovered}>
        <PackageCheck size={16} color={BRAND_COLOR} />
        <Text style={styles.recoverButtonText}>Mark as Recovered</Text>
      </TouchableOpacity>
    )}
    {item.moderation_status === "recovered" && (
      <View style={styles.recoveredBanner}>
        <CheckCircle size={16} color="#10B981" />
        <Text style={styles.recoveredBannerText}>Recovered!</Text>
      </View>
    )}
  </View>
);

const ClaimCard = ({ claim, onCancel }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <ItemImage imageUrl={claim.item.image_url} />
      <View style={styles.cardContent}>
        <Text style={styles.cardSubtitle}>Your claim for:</Text>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {claim.item.title}
        </Text>
        <View style={styles.badgeRow}>
          <ClaimStatusBadge status={claim.status} />
        </View>
        <Text style={styles.cardTimestamp}>{getTimeAgo(claim.created_at)}</Text>
      </View>
    </View>
    {claim.status === "pending" && (
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <XCircle size={16} color="#EF4444" />
        <Text style={styles.cancelButtonText}>Cancel Claim</Text>
      </TouchableOpacity>
    )}
  </View>
);

const ReceivedClaimCard = ({ claim, onAccept, onReject }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <ItemImage imageUrl={claim.item.image_url} />
      <View style={styles.cardContent}>
        <Text style={styles.cardSubtitle}>
          Claim from{" "}
          <Text style={{ fontWeight: "bold" }}>
            {claim.claimant.full_name || "Anonymous"}
          </Text>
        </Text>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {claim.item.title}
        </Text>
        <View style={styles.badgeRow}>
          <ClaimStatusBadge status={claim.status} />
        </View>
      </View>
    </View>
    <View style={styles.verificationBox}>
      <Text style={styles.verificationTitle}>Verification Message:</Text>
      <Text style={styles.verificationBody}>{claim.verification_message}</Text>
    </View>
    {claim.status === "pending" && (
      <View style={styles.actionButtonRow}>
        <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
          <X size={16} color="#EF4444" />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Check size={16} color="#FFFFFF" />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

const PostSwipeActions = ({ progress, dragX, onDelete, onEdit, item }) => {
  const isRecovered = item.moderation_status === "recovered";
  return (
    <View style={styles.swipeActionContainer}>
      <TouchableOpacity
        style={[styles.swipeButton, styles.editButton]}
        onPress={onEdit}
      >
        <Animated.View>
          <Edit3 size={24} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.swipeButton,
          styles.deleteButton,
          isRecovered && styles.disabledButton,
        ]}
        onPress={onDelete}
        disabled={isRecovered}
      >
        <Animated.View>
          <Trash2 size={24} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const ItemImage = ({ imageUrl }) => (
  <View style={styles.itemImageContainer}>
    {imageUrl ? (
      <Image source={{ uri: imageUrl }} style={styles.itemImage} />
    ) : (
      <View style={styles.itemImagePlaceholder}>
        <Camera size={24} color="#9CA3AF" />
      </View>
    )}
  </View>
);

const StatusBadge = ({ status }) => {
  const config = {
    pending: { bg: "#FEF3C7", text: "#D97706", label: "Pending", icon: Clock },
    approved: {
      bg: "#D1FAE5",
      text: "#059669",
      label: "Approved",
      icon: CheckCircle,
    },
    rejected: {
      bg: "#FEE2E2",
      text: "#DC2626",
      label: "Rejected",
      icon: XCircle,
    },
    recovered: {
      bg: "#DBEAFE",
      text: "#2563EB",
      label: "Recovered",
      icon: PackageCheck,
    },
    pending_return: {
      bg: "#E0F2FE",
      text: "#0284C7",
      label: "Pending Return",
      icon: RotateCcw,
    },
  }[status] || {
    bg: "#F3F4F6",
    text: "#6B7280",
    label: "Unknown",
    icon: AlertCircle,
  };

  const Icon = config.icon;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Icon size={12} color={config.text} />
      <Text style={[styles.badgeText, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
};

const ClaimStatusBadge = ({ status }) => {
  const config = {
    pending: { bg: "#FEF3C7", text: "#D97706", label: "Pending", icon: Clock },
    accepted: {
      bg: "#D1FAE5",
      text: "#059669",
      label: "Accepted",
      icon: CheckCircle,
    },
    rejected: {
      bg: "#FEE2E2",
      text: "#DC2626",
      label: "Rejected",
      icon: XCircle,
    },
  }[status] || {
    bg: "#F3F4F6",
    text: "#6B7280",
    label: "Unknown",
    icon: AlertCircle,
  };

  const Icon = config.icon;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Icon size={12} color={config.text} />
      <Text style={[styles.badgeText, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
};

const TypeBadge = ({ type }) => {
  const isLost = type === "Lost";
  const color = isLost ? "#DC2626" : "#059669";
  const bg = isLost ? "#FEE2E2" : "#D1FAE5";
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: color }]}>{type}</Text>
    </View>
  );
};

// ====================
// Styles
// ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // Use a light gray background
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
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: "#E0F2FE",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  segmentTextActive: {
    color: BRAND_COLOR,
  },
  list: {
    flex: 1,
  },
  listEmpty: {
    flexGrow: 1,
  },
  emptyState: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  // Card Styles
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    padding: 12,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
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
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },
  cardTimestamp: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  // Action Buttons
  recoverButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E0F2FE",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  recoverButtonText: {
    color: BRAND_COLOR,
    fontSize: 14,
    fontWeight: "600",
  },
  recoveredBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#D1FAE5",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  recoveredBannerText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  verificationBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  verificationTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  verificationBody: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  actionButtonRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  rejectButtonText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#10B981",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  // Swipe Actions
  swipeActionContainer: {
    flexDirection: "row",
    width: 160,
  },
  swipeButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  editButton: {
    backgroundColor: "#3B82F6",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
  },
});

export default MyPostsScreen;
