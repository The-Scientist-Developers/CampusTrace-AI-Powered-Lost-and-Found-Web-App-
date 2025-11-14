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
  Dimensions,
  Platform,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
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
  ShieldCheck,
  Loader2,
  Eye,
  MapPin,
  Calendar,
} from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";
import { Swipeable } from "react-native-gesture-handler";
import { useFocusEffect } from "@react-navigation/native";
import SimpleLoadingScreen from "../../components/SimpleLoadingScreen";
import { useTheme } from "../../contexts/ThemeContext";
import { apiClient } from "../../utils/apiClient";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 16;
const CARD_WIDTH = width - CARD_MARGIN * 2;
const BRAND_COLOR = "#1877F2";

// Small screens (phones)
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;
const isLargeScreen = width >= 768;

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
  const { colors, fontSizes } = useTheme();

  // Create styles with current theme colors
  const styles = React.useMemo(
    () => createStyles(colors, fontSizes),
    [colors, fontSizes]
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  const [activeTab, setActiveTab] = useState("My Posts");
  const [myPosts, setMyPosts] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [receivedClaims, setReceivedClaims] = useState([]);

  const openSwipeableRef = useRef(null);

  const [isHandoverModalVisible, setIsHandoverModalVisible] = useState(false);
  const [selectedHandoverItem, setSelectedHandoverItem] = useState(null);
  const [handoverCode, setHandoverCode] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");

  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedViewItem, setSelectedViewItem] = useState(null);

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

  const openViewModal = (item) => {
    setSelectedViewItem(item);
    setIsViewModalVisible(true);
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

  const openHandoverModal = (item) => {
    setSelectedHandoverItem(item);
    setHandoverCode("");
    setCompleteError("");
    setIsCompleting(false);
    setIsHandoverModalVisible(true);
  };

  const handleCompleteHandover = async () => {
    if (handoverCode.length !== 4) {
      setCompleteError("Code must be 4 digits.");
      return;
    }
    setIsCompleting(true);
    setCompleteError("");
    try {
      const formData = new FormData();
      formData.append("code", handoverCode);
      const { data } = await apiClient.post(
        `/handover/items/${selectedHandoverItem.id}/complete-handover`,
        formData
      );
      // Close modal and refresh
      setIsHandoverModalVisible(false);
      onRefresh();
    } catch (error) {
      console.error("Error completing handover:", error);
      setCompleteError(
        error.response?.data?.detail || "Invalid code or error."
      );
    } finally {
      setIsCompleting(false);
    }
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
          onOpenHandover={openHandoverModal}
          onView={openViewModal}
          openSwipeableRef={openSwipeableRef}
          colors={colors}
          fontSizes={fontSizes}
          styles={styles}
        />
      );
    }

    if (activeTab === "My Claims") {
      return (
        <ClaimCard
          claim={item}
          onCancel={() => handleCancelClaim(item)}
          colors={colors}
          fontSizes={fontSizes}
          styles={styles}
        />
      );
    }

    if (activeTab === "Received") {
      return (
        <ReceivedClaimCard
          claim={item}
          onAccept={() => handleUpdateClaimStatus(item, "accepted")}
          onReject={() => handleUpdateClaimStatus(item, "rejected")}
          colors={colors}
          fontSizes={fontSizes}
          styles={styles}
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
      {activeTab === "My Posts" && <Package size={64} color={colors.border} />}
      {activeTab === "My Claims" && (
        <FileText size={64} color={colors.border} />
      )}
      {activeTab === "Received" && <Users size={64} color={colors.border} />}
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

  // Calculate stats
  const activeCount = myPosts.filter((p) =>
    ["approved", "pending_return"].includes(p.moderation_status)
  ).length;
  const pendingCount = myPosts.filter(
    (p) => p.moderation_status === "pending"
  ).length;
  const resolvedCount = myPosts.filter((p) =>
    ["recovered", "rejected"].includes(p.moderation_status)
  ).length;
  const claimsCount = receivedClaims.length;

  if (loading) {
    return <SimpleLoadingScreen />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          My Activity
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          View your posts, claims, and activity history
        </Text>
      </View>

      {/* Stats Cards */}
      {activeTab === "My Posts" && (
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <CheckCircle size={20} color="#10B981" />
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Clock size={20} color="#EAB308" />
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Package size={20} color="#3B82F6" />
            <Text style={styles.statValue}>{resolvedCount}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AlertCircle size={20} color={colors.primary} />
            <Text style={styles.statValue}>{claimsCount}</Text>
            <Text style={styles.statLabel}>Claims</Text>
          </View>
        </View>
      )}

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <TabButton
          title="My Posts"
          icon={Package}
          isActive={activeTab === "My Posts"}
          onPress={() => setActiveTab("My Posts")}
          colors={colors}
          fontSizes={fontSizes}
          styles={styles}
        />
        <TabButton
          title="My Claims"
          icon={FileText}
          isActive={activeTab === "My Claims"}
          onPress={() => setActiveTab("My Claims")}
          colors={colors}
          fontSizes={fontSizes}
          styles={styles}
        />
        <TabButton
          title="Received"
          icon={Users}
          isActive={activeTab === "Received"}
          onPress={() => setActiveTab("Received")}
          colors={colors}
          fontSizes={fontSizes}
          styles={styles}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyComponent}
      />

      {/* Handover Modal */}
      <Modal
        transparent={true}
        visible={isHandoverModalVisible}
        animationType="fade"
        onRequestClose={() => setIsHandoverModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContainer, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Complete Handover
            </Text>
            <Text
              style={[styles.modalSubtitle, { color: colors.textSecondary }]}
            >
              Enter the 4-digit code from the claimant for "
              {selectedHandoverItem?.title}".
            </Text>
            <TextInput
              style={[
                styles.handoverInput,
                { color: colors.text, borderColor: colors.border },
              ]}
              placeholder="1234"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={4}
              value={handoverCode}
              onChangeText={setHandoverCode}
            />
            {completeError && (
              <Text style={styles.errorText}>{completeError}</Text>
            )}
            <Pressable
              onPress={handleCompleteHandover}
              disabled={isCompleting || handoverCode.length !== 4}
              style={({ pressed }) => [
                styles.modalButton,
                { backgroundColor: colors.success },
                (isCompleting || handoverCode.length !== 4) &&
                  styles.disabledButton,
                pressed && styles.pressedButton,
              ]}
            >
              {isCompleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#FFFFFF" />
                  <Text style={styles.modalButtonText}> Verify Code</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => setIsHandoverModalVisible(false)}
              style={({ pressed }) => [
                styles.modalButton,
                { backgroundColor: colors.border, marginTop: 10 },
                pressed && styles.pressedButton,
              ]}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* View Post Modal */}
      <Modal
        transparent={true}
        visible={isViewModalVisible}
        animationType="slide"
        onRequestClose={() => setIsViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.viewModalContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <View
              style={[
                styles.viewModalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Post Details
              </Text>
              <TouchableOpacity
                onPress={() => setIsViewModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.viewModalContent}>
              {selectedViewItem && (
                <>
                  {/* Image */}
                  <View style={styles.viewImageContainer}>
                    {selectedViewItem.image_url ? (
                      <Image
                        source={{ uri: selectedViewItem.image_url }}
                        style={styles.viewImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View
                        style={[
                          styles.viewImagePlaceholder,
                          { backgroundColor: colors.background },
                        ]}
                      >
                        <Camera size={48} color={colors.textSecondary} />
                        <Text
                          style={[
                            styles.noImageText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          No Image
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Title */}
                  <Text style={[styles.viewTitle, { color: colors.text }]}>
                    {selectedViewItem.title}
                  </Text>

                  {/* Badges */}
                  <View style={styles.viewBadgeRow}>
                    <StatusBadge
                      status={selectedViewItem.moderation_status}
                      styles={styles}
                    />
                    <TypeBadge type={selectedViewItem.status} styles={styles} />
                  </View>

                  {/* Info Grid */}
                  <View style={styles.viewInfoGrid}>
                    <View
                      style={[
                        styles.viewInfoItem,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <MapPin size={18} color={colors.textSecondary} />
                      <View style={styles.viewInfoTextContainer}>
                        <Text
                          style={[
                            styles.viewInfoLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Location
                        </Text>
                        <Text
                          style={[styles.viewInfoValue, { color: colors.text }]}
                        >
                          {selectedViewItem.location || "N/A"}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.viewInfoItem,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <Calendar size={18} color={colors.textSecondary} />
                      <View style={styles.viewInfoTextContainer}>
                        <Text
                          style={[
                            styles.viewInfoLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Date Posted
                        </Text>
                        <Text
                          style={[styles.viewInfoValue, { color: colors.text }]}
                        >
                          {new Date(
                            selectedViewItem.created_at
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  <View
                    style={[
                      styles.viewDescriptionContainer,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.viewDescriptionLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      DESCRIPTION
                    </Text>
                    <Text
                      style={[
                        styles.viewDescriptionText,
                        { color: colors.text },
                      ]}
                    >
                      {selectedViewItem.description ||
                        "No description provided."}
                    </Text>
                  </View>

                  {/* AI Tags */}
                  {selectedViewItem.ai_tags &&
                    selectedViewItem.ai_tags.length > 0 && (
                      <View
                        style={[
                          styles.viewDescriptionContainer,
                          { backgroundColor: colors.background },
                        ]}
                      >
                        <Text
                          style={[
                            styles.viewDescriptionLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          AI GENERATED TAGS
                        </Text>
                        <View style={styles.viewTagsContainer}>
                          {selectedViewItem.ai_tags.map((tag, index) => (
                            <View
                              key={index}
                              style={[
                                styles.viewTag,
                                { backgroundColor: colors.primary + "20" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.viewTagText,
                                  { color: colors.primary },
                                ]}
                              >
                                {tag}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  onOpenHandover,
  onView,
  openSwipeableRef,
  colors,
  fontSizes,
  styles,
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
          styles={styles}
        />
      )}
    >
      <PostCard
        item={item}
        onMarkRecovered={() => onMarkRecovered(item)}
        onOpenHandover={() => onOpenHandover(item)}
        onView={() => onView(item)}
        onDelete={() => onDelete(item)}
        colors={colors}
        fontSizes={fontSizes}
        styles={styles}
      />
    </Swipeable>
  );
};

const TabButton = ({
  title,
  icon: Icon,
  isActive,
  onPress,
  colors,
  fontSizes,
  styles,
}) => (
  <TouchableOpacity
    style={[
      styles.segmentButton,
      { backgroundColor: colors.surface, borderColor: colors.border },
      isActive && {
        backgroundColor: colors.primary + "10",
        borderColor: colors.primary,
      },
    ]}
    onPress={onPress}
  >
    <Icon
      size={isSmallScreen ? 16 : 18}
      color={isActive ? colors.primary : colors.textSecondary}
    />
    <Text
      style={[
        styles.segmentText,
        isActive && { color: colors.primary, fontWeight: "600" },
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const PostCard = ({
  item,
  onMarkRecovered,
  onOpenHandover,
  onView,
  onDelete,
  colors,
  fontSizes,
  styles,
}) => (
  <View
    style={[
      styles.card,
      { backgroundColor: colors.surface, borderColor: colors.border },
    ]}
  >
    <View style={styles.cardHeader}>
      <ItemImage imageUrl={item.image_url} colors={colors} styles={styles} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.badgeRow}>
          <StatusBadge status={item.moderation_status} styles={styles} />
          <TypeBadge type={item.status} styles={styles} />
        </View>
        <Text style={styles.cardTimestamp}>{getTimeAgo(item.created_at)}</Text>
      </View>
      {/* Action buttons in header */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={onView}
          style={[
            styles.iconButton,
            { backgroundColor: colors.primary + "10" },
          ]}
        >
          <Eye size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={[styles.iconButton, { backgroundColor: "#EF444410" }]}
        >
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
    {item.moderation_status === "pending_return" ? (
      <TouchableOpacity
        style={[
          styles.claimButton,
          { backgroundColor: colors.success || "#10B981" },
        ]}
        onPress={onOpenHandover}
      >
        <ShieldCheck size={16} color="#FFFFFF" />
        <Text style={styles.claimButtonText}>Complete Handover</Text>
      </TouchableOpacity>
    ) : item.moderation_status === "approved" && item.status === "Lost" ? (
      <TouchableOpacity
        style={[
          styles.recoverButton,
          {
            backgroundColor: colors.primary + "10",
            borderColor: colors.border,
          },
        ]}
        onPress={onMarkRecovered}
      >
        <PackageCheck size={16} color={colors.primary} />
        <Text style={styles.recoverButtonText}>Mark as Recovered</Text>
      </TouchableOpacity>
    ) : item.moderation_status === "recovered" ? (
      <View style={[styles.recoveredBanner, { backgroundColor: "#10B98110" }]}>
        <CheckCircle size={16} color="#10B981" />
        <Text style={styles.recoveredBannerText}>Recovered!</Text>
      </View>
    ) : null}
  </View>
);

const ClaimCard = ({ claim, onCancel, colors, fontSizes, styles }) => (
  <View
    style={[
      styles.card,
      { backgroundColor: colors.surface, borderColor: colors.border },
    ]}
  >
    <View style={styles.cardHeader}>
      <ItemImage
        imageUrl={claim.item.image_url}
        colors={colors}
        styles={styles}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardSubtitle}>Your claim for:</Text>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {claim.item.title}
        </Text>
        <View style={styles.badgeRow}>
          <ClaimStatusBadge status={claim.status} styles={styles} />
        </View>
        <Text style={styles.cardTimestamp}>{getTimeAgo(claim.created_at)}</Text>
      </View>
    </View>
    {claim.status === "pending" && (
      <TouchableOpacity
        style={[
          styles.cancelButton,
          { backgroundColor: "#EF444410", borderColor: colors.border },
        ]}
        onPress={onCancel}
      >
        <XCircle size={16} color="#EF4444" />
        <Text style={styles.cancelButtonText}>Cancel Claim</Text>
      </TouchableOpacity>
    )}
  </View>
);

const ReceivedClaimCard = ({
  claim,
  onAccept,
  onReject,
  colors,
  fontSizes,
  styles,
}) => (
  <View
    style={[
      styles.card,
      { backgroundColor: colors.surface, borderColor: colors.border },
    ]}
  >
    <View style={styles.cardHeader}>
      <ItemImage
        imageUrl={claim.item.image_url}
        colors={colors}
        styles={styles}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardSubtitle}>
          Claim from{" "}
          <Text style={{ fontWeight: "bold", color: colors.text }}>
            {claim.claimant.full_name || "Anonymous"}
          </Text>
        </Text>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {claim.item.title}
        </Text>
        <View style={styles.badgeRow}>
          <ClaimStatusBadge status={claim.status} styles={styles} />
        </View>
      </View>
    </View>
    <View
      style={[
        styles.verificationBox,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={styles.verificationTitle}>Verification Message:</Text>
      <Text style={styles.verificationBody}>{claim.verification_message}</Text>
    </View>
    {claim.status === "pending" && (
      <View style={styles.actionButtonRow}>
        <TouchableOpacity
          style={[
            styles.rejectButton,
            { backgroundColor: "#EF444410", borderColor: colors.border },
          ]}
          onPress={onReject}
        >
          <X size={16} color="#EF4444" />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: colors.primary }]}
          onPress={onAccept}
        >
          <Check size={16} color="#FFFFFF" />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

const PostSwipeActions = ({
  progress,
  dragX,
  onDelete,
  onEdit,
  item,
  styles,
}) => {
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

const ItemImage = ({ imageUrl, colors, styles }) => (
  <View
    style={[
      styles.itemImageContainer,
      { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
    ]}
  >
    {imageUrl ? (
      <Image source={{ uri: imageUrl }} style={styles.itemImage} />
    ) : (
      <View
        style={[
          styles.itemImagePlaceholder,
          { backgroundColor: colors.surfaceSecondary },
        ]}
      >
        <Camera size={24} color={colors.textSecondary} />
      </View>
    )}
  </View>
);

const StatusBadge = ({ status, styles }) => {
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

const ClaimStatusBadge = ({ status, styles }) => {
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

const TypeBadge = ({ type, styles }) => {
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
const createStyles = (colors, fontSizes) => {
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: colors.shadow || "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
    web: {
      boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
    },
  });

  // Responsive image sizes
  const imageSize = isSmallScreen ? 70 : isMediumScreen ? 80 : 100;

  // Responsive paddings
  const cardPadding = isSmallScreen ? 10 : 12;
  const headerPadding = isSmallScreen ? 12 : 16;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.surface,
    },
    loadingText: {
      marginTop: 12,
      fontSize: fontSizes.base,
      color: colors.textSecondary,
    },
    header: {
      paddingHorizontal: headerPadding,
      paddingVertical: cardPadding,
      backgroundColor: colors.surface,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: isSmallScreen ? fontSizes.large : fontSizes.xlarge,
      fontWeight: "bold",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      marginTop: 4,
    },
    segmentContainer: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      paddingHorizontal: headerPadding,
      paddingVertical: cardPadding,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      gap: 8,
    },
    segmentButton: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: isSmallScreen ? 8 : 10,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: isSmallScreen ? 4 : 6,
    },
    segmentButtonActive: {
      backgroundColor: colors.primary + "10",
      borderColor: colors.primary,
    },
    segmentText: {
      fontSize: isSmallScreen ? fontSizes.tiny : fontSizes.small,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    segmentTextActive: {
      color: colors.primary,
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
      backgroundColor: colors.surface,
    },
    emptyStateText: {
      fontSize: fontSizes.large,
      fontWeight: "600",
      color: colors.textSecondary,
      marginTop: 16,
    },
    emptyStateSubtext: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: "center",
    },
    // Card Styles
    card: {
      backgroundColor: colors.surface,
      marginHorizontal: CARD_MARGIN,
      marginTop: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      ...shadowStyle,
    },
    cardHeader: {
      flexDirection: "row",
      padding: cardPadding,
    },
    itemImageContainer: {
      width: imageSize,
      height: imageSize,
      borderRadius: 8,
      backgroundColor: colors.background,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
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
      marginLeft: cardPadding,
      justifyContent: "center",
    },
    cardTitle: {
      fontSize: fontSizes.base,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
    },
    cardSubtitle: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    cardTimestamp: {
      fontSize: fontSizes.tiny,
      color: colors.textSecondary,
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
      paddingHorizontal: isSmallScreen ? 6 : 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: fontSizes.tiny,
      fontWeight: "600",
      marginLeft: 4,
    },
    // Action Buttons
    recoverButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary + "10",
      paddingVertical: cardPadding,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    recoverButtonText: {
      color: colors.primary,
      fontSize: fontSizes.small,
      fontWeight: "600",
    },
    recoveredBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#10B98110",
      paddingVertical: cardPadding,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    recoveredBannerText: {
      color: "#059669",
      fontSize: fontSizes.small,
      fontWeight: "600",
    },
    cancelButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#FEE2E2",
      paddingVertical: cardPadding,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    cancelButtonText: {
      color: "#DC2626",
      fontSize: fontSizes.small,
      fontWeight: "600",
    },
    verificationBox: {
      backgroundColor: colors.background,
      padding: cardPadding,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    verificationTitle: {
      fontSize: fontSizes.tiny,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 4,
    },
    verificationBody: {
      fontSize: fontSizes.small,
      color: colors.text,
      lineHeight: 20,
    },
    actionButtonRow: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    rejectButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: cardPadding,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.divider,
    },
    rejectButtonText: {
      color: "#EF4444",
      fontSize: fontSizes.small,
      fontWeight: "600",
    },
    acceptButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: cardPadding,
      backgroundColor: "#10B981",
    },
    acceptButtonText: {
      color: "#FFFFFF",
      fontSize: fontSizes.small,
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
      backgroundColor: colors.border,
    },
    // Stats Row
    statsRow: {
      flexDirection: "row",
      paddingHorizontal: headerPadding,
      paddingVertical: cardPadding,
      gap: 8,
      backgroundColor: colors.background,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: isSmallScreen ? 10 : 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      ...shadowStyle,
    },
    statValue: {
      fontSize: isSmallScreen ? fontSizes.base : fontSizes.large,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 6,
    },
    statLabel: {
      fontSize: fontSizes.tiny,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: "center",
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: "90%",
      borderRadius: 12,
      padding: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
    },
    modalSubtitle: {
      fontSize: 14,
      marginTop: 8,
      marginBottom: 16,
    },
    handoverInput: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      letterSpacing: 10,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 12,
      marginBottom: 10,
    },
    errorText: {
      color: "#E53E3E",
      fontSize: 14,
      textAlign: "center",
      marginBottom: 10,
    },
    modalButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 12,
      borderRadius: 8,
    },
    modalButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    disabledButton: {
      opacity: 0.5,
    },
    pressedButton: {
      opacity: 0.8,
    },
    claimButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: cardPadding,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    claimButtonText: {
      color: "#FFFFFF",
      fontSize: fontSizes.small,
      fontWeight: "600",
    },
    // Card Actions
    cardActions: {
      flexDirection: "row",
      gap: 6,
      marginLeft: 8,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    // View Modal Styles
    viewModalContainer: {
      width: "100%",
      height: "90%",
      marginTop: "auto",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: "hidden",
    },
    viewModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
    },
    closeButton: {
      padding: 4,
    },
    viewModalContent: {
      flex: 1,
      padding: 16,
    },
    viewImageContainer: {
      width: "100%",
      height: 250,
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 16,
    },
    viewImage: {
      width: "100%",
      height: "100%",
    },
    viewImagePlaceholder: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    noImageText: {
      marginTop: 8,
      fontSize: fontSizes.small,
    },
    viewTitle: {
      fontSize: fontSizes.xlarge,
      fontWeight: "bold",
      marginBottom: 12,
    },
    viewBadgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    viewInfoGrid: {
      gap: 12,
      marginBottom: 16,
    },
    viewInfoItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 8,
      gap: 12,
    },
    viewInfoTextContainer: {
      flex: 1,
    },
    viewInfoLabel: {
      fontSize: fontSizes.tiny,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    viewInfoValue: {
      fontSize: fontSizes.base,
      fontWeight: "600",
    },
    viewDescriptionContainer: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    viewDescriptionLabel: {
      fontSize: fontSizes.tiny,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    viewDescriptionText: {
      fontSize: fontSizes.base,
      lineHeight: 22,
    },
    viewTagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
    },
    viewTag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    viewTagText: {
      fontSize: fontSizes.small,
      fontWeight: "600",
    },
  });
};

export default MyPostsScreen;
