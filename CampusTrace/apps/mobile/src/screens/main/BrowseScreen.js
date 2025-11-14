import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
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
  Modal,
  FlatList,
  Dimensions,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  Camera,
  X,
  ChevronDown,
  Phone,
  Mail,
  MessageCircle,
  Send,
  Clock,
  Link2,
  Facebook,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { getSupabaseClient, API_BASE_URL } from "@campustrace/core";
import * as ImagePicker from "expo-image-picker";
import SimpleLoadingScreen from "../../components/SimpleLoadingScreen";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Spacing,
  BorderRadius,
  Typography,
  getShadow,
} from "../../constants/designSystem";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const BRAND_COLOR = "#1877F2";

// ==================== Helper Functions ====================

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Parse contact info helper
const parseContactInfo = (contactInfo) => {
  if (!contactInfo) return [];

  const contacts = [];
  const info = contactInfo.toLowerCase();

  // Phone numbers
  const phonePattern = /(\+?\d{1,4}[\s-]?)?(\(?\d{1,4}\)?[\s-]?)?[\d\s-]{5,}/g;
  const phoneMatches = contactInfo.match(phonePattern);
  if (phoneMatches) {
    phoneMatches.forEach((phone) => {
      contacts.push({
        type: "phone",
        value: phone.trim(),
        icon: Phone,
        link: `tel:${phone.replace(/\D/g, "")}`,
        label: "Call",
      });
    });
  }

  // Facebook
  if (info.includes("facebook") || info.includes("fb")) {
    const fbMatch = contactInfo.match(/(?:facebook|fb)[:\s]*([^\s,]+)/i);
    if (fbMatch) {
      contacts.push({
        type: "facebook",
        value: fbMatch[1],
        icon: Facebook,
        link: `https://facebook.com/${fbMatch[1]}`,
        label: "Facebook",
      });
    }
  }

  // Messenger
  if (info.includes("messenger")) {
    const messengerMatch = contactInfo.match(/messenger[:\s]*([^\s,]+)/i);
    if (messengerMatch) {
      contacts.push({
        type: "messenger",
        value: messengerMatch[1],
        icon: MessageCircle,
        link: `https://m.me/${messengerMatch[1]}`,
        label: "Messenger",
      });
    }
  }

  // Email
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = contactInfo.match(emailPattern);
  if (emailMatches) {
    emailMatches.forEach((email) => {
      contacts.push({
        type: "email",
        value: email,
        icon: Mail,
        link: `mailto:${email}`,
        label: "Email",
      });
    });
  }

  // Default fallback
  if (contacts.length === 0 && contactInfo) {
    contacts.push({
      type: "text",
      value: contactInfo,
      icon: Link2,
      link: null,
      label: "Contact Info",
    });
  }

  return contacts;
};

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

// ==================== Component: Filters Modal ====================

const FiltersModal = memo(
  ({ visible, onClose, filters, onFiltersChange, colors, styles }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const categories = [
      "Electronics",
      "Documents",
      "Clothing",
      "Accessories",
      "Other",
    ];

    const handleApply = () => {
      onFiltersChange(localFilters);
      onClose();
    };

    const handleReset = () => {
      setLocalFilters({
        status: "All",
        categories: [],
        sortBy: "newest",
        dateFilter: "",
      });
    };

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Status</Text>
                {["All", "Lost", "Found"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.filterOption}
                    onPress={() => setLocalFilters({ ...localFilters, status })}
                  >
                    <View
                      style={[
                        styles.radio,
                        localFilters.status === status && styles.radioSelected,
                      ]}
                    />
                    <Text style={styles.filterOptionText}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Categories</Text>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.filterOption}
                    onPress={() => {
                      const cats = localFilters.categories || [];
                      const newCats = cats.includes(category)
                        ? cats.filter((c) => c !== category)
                        : [...cats, category];
                      setLocalFilters({ ...localFilters, categories: newCats });
                    }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        (localFilters.categories || []).includes(category) &&
                          styles.checkboxSelected,
                      ]}
                    >
                      {(localFilters.categories || []).includes(category) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.filterOptionText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sort By */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sort By</Text>
                {[
                  { value: "newest", label: "Newest First" },
                  { value: "oldest", label: "Oldest First" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.filterOption}
                    onPress={() =>
                      setLocalFilters({ ...localFilters, sortBy: option.value })
                    }
                  >
                    <View
                      style={[
                        styles.radio,
                        localFilters.sortBy === option.value &&
                          styles.radioSelected,
                      ]}
                    />
                    <Text style={styles.filterOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleReset}
              >
                <Text style={styles.clearButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

// ==================== Component: Item Details Modal ====================

const ItemDetailsModal = memo(
  ({ visible, item, onClose, onClaim, user, navigation, colors, styles }) => {
    if (!item) return null;

    const posterName =
      item.profiles?.full_name ||
      (item.profiles?.email ? item.profiles.email.split("@")[0] : "Anonymous");
    const contactMethods = parseContactInfo(item.contact_info);
    const isFoundItem = item.status?.toLowerCase() === "found";
    const isMyOwnItem = item.profiles?.id === user?.id;
    const showActionButtons = !isMyOwnItem;

    const handleStartConversation = async () => {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          Alert.alert("Error", "Authentication required");
          return;
        }

        const formData = new FormData();
        formData.append("item_id", item.id);

        const response = await fetch(`${API_BASE_URL}/api/conversations/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Failed to start conversation");
        }

        const { conversation_id } = await response.json();

        // Navigate to chat
        if (navigation) {
          navigation.navigate("Dashboard", {
            screen: "Chat",
            params: { conversationId: conversation_id },
          });
          onClose();
        }
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to start conversation");
      }
    };

    const handleContactPress = (contact) => {
      if (contact.link) {
        Linking.openURL(contact.link).catch(() => {
          Alert.alert("Error", "Cannot open this link");
        });
      }
    };

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <SafeAreaView
          style={[
            styles.detailModalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Fixed Header */}
          <View
            style={[
              styles.detailHeader,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.detailBadges}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === "Lost"
                          ? colors.isDark
                            ? "#7F1D1D"
                            : "#FEE2E2"
                          : colors.isDark
                          ? "#064E3B"
                          : "#D1FAE5",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          item.status === "Lost"
                            ? colors.error
                            : colors.success,
                      },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.category}
                  </Text>
                </View>
              </View>
              <Text style={[styles.detailTitle, { color: colors.text }]}>
                {item.title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Fixed Image */}
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.detailImageFixed}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.noImageContainerFixed,
                { backgroundColor: colors.surface },
              ]}
            >
              <Camera size={48} color={colors.border} />
              <Text
                style={[styles.noImageText, { color: colors.textSecondary }]}
              >
                No Image Available
              </Text>
            </View>
          )}

          {/* Fixed Poster Info */}
          <View
            style={[
              styles.posterCardFixed,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.posterInfo}>
              <View
                style={[
                  styles.posterAvatar,
                  { backgroundColor: colors.surface },
                ]}
              >
                <User size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.posterLabel, { color: colors.textSecondary }]}
                >
                  Posted by
                </Text>
                <Text style={[styles.posterName, { color: colors.text }]}>
                  {posterName}
                </Text>
                {item.profiles?.email && (
                  <Text
                    style={[styles.posterEmail, { color: colors.textTertiary }]}
                  >
                    {item.profiles.email}
                  </Text>
                )}
              </View>
            </View>

            {/* Contact Methods */}
            {contactMethods.length > 0 && (
              <View style={styles.contactMethods}>
                {contactMethods.map((contact, index) => {
                  const Icon = contact.icon;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.contactButton,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => handleContactPress(contact)}
                      disabled={!contact.link}
                    >
                      <Icon size={16} color={colors.primary} />
                      <Text
                        style={[
                          styles.contactButtonText,
                          { color: colors.primary },
                        ]}
                      >
                        {contact.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={[
              styles.detailScrollContent,
              { backgroundColor: colors.background },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <View
                style={[
                  styles.detailItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <MapPin size={20} color={colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Location
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {item.location || "N/A"}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.detailItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Calendar size={20} color={colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Date Posted
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.detailItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Clock size={20} color={colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Time Posted
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatTime(item.created_at)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description */}
            <View
              style={[
                styles.descriptionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.descriptionLabel, { color: colors.text }]}>
                Description
              </Text>
              <Text
                style={[
                  styles.descriptionText,
                  { color: colors.textSecondary },
                ]}
              >
                {item.description || "No description provided."}
              </Text>
            </View>

            {/* Action Buttons */}
            {showActionButtons && (
              <View style={styles.actionButtons}>
                {isFoundItem && (
                  <TouchableOpacity
                    style={[
                      styles.claimButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => onClaim(item)}
                  >
                    <Send size={20} color="#FFF" />
                    <Text style={styles.claimButtonText}>Claim This Item</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.messageButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleStartConversation}
                >
                  <MessageCircle size={20} color="#FFF" />
                  <Text style={styles.messageButtonText}>Message Poster</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }
);

// ==================== Component: Claim Modal ====================

const ClaimModal = memo(
  ({ visible, item, onClose, onSubmit, colors, styles }) => {
    const [verificationMessage, setVerificationMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      if (!verificationMessage.trim()) {
        Alert.alert("Error", "Please provide a verification detail");
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(item.id, verificationMessage);
        Alert.alert(
          "Success",
          "Claim submitted! The finder has been notified."
        );
        setVerificationMessage("");
        onClose();
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to submit claim");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: colors.overlay || "rgba(0,0,0,0.5)" },
          ]}
        >
          <View
            style={[styles.claimModalContent, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.claimModalTitle, { color: colors.text }]}>
              Claim Item: {item?.title}
            </Text>
            <Text
              style={[
                styles.claimModalSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              To verify ownership, please describe a unique detail only you
              would know.
            </Text>

            <TextInput
              style={[
                styles.claimInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your secret detail here..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={5}
              value={verificationMessage}
              onChangeText={setVerificationMessage}
              editable={!isSubmitting}
              textAlignVertical="top"
            />

            <View style={styles.claimModalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                  isSubmitting && { ...styles.disabledButton, opacity: 0.5 },
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Send size={18} color="#FFF" />
                    <Text style={styles.submitButtonText}>Submit Claim</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

// ==================== Component: Marketplace Grid Item ====================

const MarketplaceItem = memo(({ item, colors, styles }) => {
  const statusColor =
    item.status === "Lost"
      ? colors?.error || "#EF4444"
      : colors?.success || "#10B981";

  return (
    <View
      style={[
        styles.marketplaceItem,
        { backgroundColor: colors?.card || "#FFFFFF" },
      ]}
    >
      {/* Image */}
      <View style={styles.marketplaceImageContainer}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.marketplaceImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.marketplacePlaceholder,
              { backgroundColor: colors?.surface || "#F3F4F6" },
            ]}
          >
            <Camera size={32} color={colors?.textTertiary || "#D1D5DB"} />
          </View>
        )}
        {/* Status Badge on Image */}
        <View
          style={[
            styles.marketplaceStatusBadge,
            { backgroundColor: statusColor },
          ]}
        >
          <Text style={styles.marketplaceStatusText}>{item.status}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.marketplaceContent}>
        <Text
          style={[
            styles.marketplaceTitle,
            { color: colors?.text || "#000000" },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View style={styles.marketplaceMetaRow}>
          <View
            style={[
              styles.marketplaceCategoryTag,
              { backgroundColor: colors?.surface || "#F0F2F5" },
            ]}
          >
            <Text
              style={[
                styles.marketplaceCategoryText,
                { color: colors?.textSecondary || "#6B7280" },
              ]}
              numberOfLines={1}
            >
              {item.category}
            </Text>
          </View>
        </View>
        <View style={styles.marketplaceLocationRow}>
          <MapPin size={12} color={colors?.textSecondary || "#8E8E93"} />
          <Text
            style={[
              styles.marketplaceLocation,
              { color: colors?.textSecondary || "#8E8E93" },
            ]}
            numberOfLines={1}
          >
            {item.location || "Unknown location"}
          </Text>
        </View>
        <Text
          style={[
            styles.marketplaceTime,
            { color: colors?.textTertiary || "#9CA3AF" },
          ]}
        >
          {item.created_at ? getTimeAgo(item.created_at) : "Recently"}
        </Text>
      </View>
    </View>
  );
});

// ==================== Main Component: BrowseScreen ====================

const BrowseScreen = () => {
  const navigation = useNavigation();
  const { colors, fontSizes } = useTheme();

  // Create styles with current theme colors
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState({
    status: "All",
    categories: [],
    sortBy: "newest",
    dateFilter: "",
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const rowOptions = [10, 20, 40];
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Get current user
  useEffect(() => {
    getCurrentUser();
  }, []);

  // Fetch items when filters or search changes
  useEffect(() => {
    if (user && !imagePreview) {
      fetchItems(true);
    }
  }, [filters, debouncedSearchQuery, user]);

  const getCurrentUser = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error("Error getting user:", error);
    }
  }, []);

  const fetchItems = async (reset = false, pageOverride = null) => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      if (!user?.id) {
        setItems([]);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error("Could not find user profile.");

      let query = supabase
        .from("items")
        .select("*, profiles(id, full_name, email)", { count: "exact" })
        .eq("university_id", profile.university_id)
        .eq("moderation_status", "approved");

      // Apply filters
      if (filters.status !== "All") {
        query = query.eq("status", filters.status);
      }

      if (filters.categories && filters.categories.length > 0) {
        query = query.in("category", filters.categories);
      }

      if (filters.dateFilter) {
        query = query.gte("created_at", filters.dateFilter);
      }

      if (debouncedSearchQuery) {
        query = query.or(
          `title.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%,ai_tags.cs.{${debouncedSearchQuery}}`
        );
      }

      // Pagination - use pageOverride if provided, otherwise use currentPage
      const page =
        pageOverride !== null ? pageOverride : reset ? 1 : currentPage;
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      // Sorting
      query = query.order("created_at", {
        ascending: filters.sortBy === "oldest",
      });

      const { data, error, count } = await query;

      if (error) throw error;

      // Always replace items for pagination, never append
      setItems(data || []);
      setTotalItems(count || 0);
      setHasMore((data?.length || 0) === itemsPerPage);
    } catch (error) {
      console.error("Error fetching items:", error);
      Alert.alert("Error", "Failed to load items");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleImageSearch = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setIsImageSearching(true);
      setLoading(true);
      setImagePreview(result.assets[0].uri);
      setSearchQuery("");

      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) throw new Error("Authentication required");

        const formData = new FormData();
        formData.append("image_file", {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: "search.jpg",
        });

        const response = await fetch(`${API_BASE_URL}/api/items/image-search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        });

        if (!response.ok) throw new Error("Image search failed");

        const data = await response.json();
        const results = data.results || data || [];

        setItems(results);
        setTotalItems(results.length);
        setCurrentPage(1);

        if (results.length === 0) {
          Alert.alert(
            "No Results",
            "No similar items found. Try a different image."
          );
        } else {
          Alert.alert("Success", `Found ${results.length} similar items!`);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to search by image");
        clearImageSearch();
      } finally {
        setIsImageSearching(false);
        setLoading(false);
      }
    }
  };

  const clearImageSearch = () => {
    setImagePreview(null);
    setSearchQuery("");
    setCurrentPage(1);
    fetchItems(true, 1);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (imagePreview) {
      clearImageSearch();
    } else {
      setCurrentPage(1);
      fetchItems(true, 1);
    }
  };

  const handleLoadMore = () => {
    // Disabled - using manual pagination instead
    return;
  };

  const submitClaim = async (itemId, verificationMessage) => {
    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) throw new Error("Authentication required");

    const response = await fetch(`${API_BASE_URL}/api/claims/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        item_id: itemId,
        verification_message: verificationMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to submit claim.");
    }

    return response.json();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.marketplaceCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={() => setSelectedItem(item)}
      activeOpacity={0.7}
    >
      <MarketplaceItem item={item} colors={colors} styles={styles} />
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading || !hasMore) return null;
    return (
      <View
        style={[styles.footerLoader, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  if ((loading && items.length === 0 && !refreshing) || isImageSearching) {
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
          Browse All Items
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Find lost items or help return found items
        </Text>
      </View>

      {/* Enhanced Search Bar */}
      <View
        style={[styles.searchContainer, { backgroundColor: colors.surface }]}
      >
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={
              imagePreview ? "Image search active" : "Search by text..."
            }
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (imagePreview) {
                clearImageSearch();
              }
            }}
            editable={!imagePreview}
          />
          {imagePreview ? (
            <View
              style={[
                styles.imageSearchPreview,
                { backgroundColor: colors.surface },
              ]}
            >
              <Image
                source={{ uri: imagePreview }}
                style={styles.previewThumbnail}
              />
              <TouchableOpacity onPress={clearImageSearch}>
                <X size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleImageSearch}
              disabled={isImageSearching}
              style={[styles.cameraButton, { backgroundColor: colors.surface }]}
            >
              {isImageSearching ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Camera size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={20} color={colors.text} />
          {(filters.categories?.length > 0 || filters.status !== "All") && (
            <View
              style={[styles.filterDot, { backgroundColor: colors.primary }]}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {(filters.status !== "All" || filters.categories?.length > 0) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.activeFilters, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.activeFiltersContent}
        >
          {filters.status !== "All" && (
            <TouchableOpacity
              style={[
                styles.chip,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setFilters({ ...filters, status: "All" })}
            >
              <Text style={styles.chipTextActive}>{filters.status}</Text>
              <X size={14} color="#FFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}

          {filters.categories?.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => {
                setFilters({
                  ...filters,
                  categories: filters.categories.filter((c) => c !== cat),
                });
              }}
            >
              <Text style={styles.chipTextActive}>{cat}</Text>
              <X size={14} color="#FFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results count & Row options */}
      <View
        style={[
          styles.resultsCountRow,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.resultsCount}>
          <Text style={[styles.resultsCountText, { color: colors.text }]}>
            {imagePreview ? "Image search: " : ""}
            {totalItems} item{totalItems !== 1 ? "s" : ""} found
          </Text>
        </View>
        <View style={styles.rowOptions}>
          <Text
            style={[styles.rowOptionsLabel, { color: colors.textSecondary }]}
          >
            Rows:
          </Text>
          {rowOptions.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.rowOptionButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
                itemsPerPage === opt && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => {
                setItemsPerPage(opt);
                setCurrentPage(1);
                fetchItems(true, 1);
              }}
            >
              <Text
                style={[
                  styles.rowOptionText,
                  { color: colors.text },
                  itemsPerPage === opt && { color: "#FFFFFF" },
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Items Grid */}
      <FlatList
        key={`marketplace-grid-${itemsPerPage}`}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        contentContainerStyle={
          items.length === 0 ? styles.emptyListContainer : styles.gridContainer
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {imagePreview ? (
              <Camera size={64} color="#DFE0E4" />
            ) : (
              <Search size={64} color="#DFE0E4" />
            )}
            <Text style={styles.emptyStateText}>No items found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || imagePreview
                ? "Try different search criteria"
                : "Lost and found items will appear here"}
            </Text>
            {(searchQuery || imagePreview) && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSearchQuery("");
                  clearImageSearch();
                }}
              >
                <Text style={styles.resetButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === 1 && styles.paginationDisabled,
            ]}
            onPress={() => {
              if (currentPage > 1) {
                const newPage = currentPage - 1;
                setCurrentPage(newPage);
                fetchItems(false, newPage);
              }
            }}
            disabled={currentPage === 1}
          >
            <ChevronLeft
              size={20}
              color={currentPage === 1 ? "#A1A1AA" : BRAND_COLOR}
            />
          </TouchableOpacity>
          <Text style={styles.paginationText}>
            Page {currentPage} of{" "}
            {Math.max(1, Math.ceil(totalItems / itemsPerPage))}
          </Text>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage >= Math.ceil(totalItems / itemsPerPage) &&
                styles.paginationDisabled,
            ]}
            onPress={() => {
              if (currentPage < Math.ceil(totalItems / itemsPerPage)) {
                const newPage = currentPage + 1;
                setCurrentPage(newPage);
                fetchItems(false, newPage);
              }
            }}
            disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
          >
            <ChevronRight
              size={20}
              color={
                currentPage >= Math.ceil(totalItems / itemsPerPage)
                  ? "#A1A1AA"
                  : BRAND_COLOR
              }
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Modals */}
      <FiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        colors={colors}
        styles={styles}
      />

      <ItemDetailsModal
        visible={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onClaim={(item) => {
          setShowClaim(true);
        }}
        user={user}
        navigation={navigation}
        colors={colors}
        styles={styles}
      />

      <ClaimModal
        visible={showClaim}
        item={selectedItem}
        onClose={() => setShowClaim(false)}
        onSubmit={submitClaim}
        colors={colors}
        styles={styles}
      />
    </SafeAreaView>
  );
};

// ==================== Styles ====================

const createStyles = (colors) =>
  StyleSheet.create({
    resultsCountRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.surface,
    },
    rowOptions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    rowOptionsLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginRight: 4,
    },
    rowOptionButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: colors.background,
      marginHorizontal: 2,
    },
    rowOptionActive: {
      backgroundColor: BRAND_COLOR,
    },
    rowOptionText: {
      fontSize: 13,
      color: colors.text,
      fontWeight: "500",
    },
    rowOptionTextActive: {
      color: "#FFF",
    },
    paginationRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
    },
    paginationButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.surface,
      marginHorizontal: 2,
    },
    paginationDisabled: {
      backgroundColor: colors.border,
    },
    paginationText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
      marginHorizontal: 8,
    },
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
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadow || "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
      fontWeight: "400",
      lineHeight: 20,
    },
    searchContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    searchBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 40,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    cameraButton: {
      padding: 4,
    },
    filterButton: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    },
    filterDot: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.error,
    },
    imageSearchPreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    previewThumbnail: {
      width: 30,
      height: 30,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeFilters: {
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    activeFiltersContent: {
      paddingHorizontal: 16,
      gap: 8,
      flexDirection: "row",
    },
    resultsCount: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.surface,
    },
    resultsCountText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
    },
    chipActive: {
      backgroundColor: BRAND_COLOR,
    },
    chipText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
    },
    chipTextActive: {
      color: "#FFFFFF",
    },
    card: {
      marginBottom: 1,
    },
    gridContainer: {
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    gridRow: {
      justifyContent: "space-between",
      paddingHorizontal: 8,
    },
    emptyListContainer: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 80,
      paddingHorizontal: 20,
    },
    emptyStateText: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.textSecondary,
      marginTop: 16,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: "center",
    },
    resetButton: {
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: BRAND_COLOR,
      borderRadius: 8,
    },
    resetButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
    footerLoader: {
      paddingVertical: 20,
      alignItems: "center",
    },

    // Marketplace Grid Styles - Enhanced
    marketplaceCard: {
      width: (screenWidth - 40) / 2, // Better spacing
      marginBottom: Spacing.md,
    },
    marketplaceItem: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      ...getShadow("sm"),
    },
    marketplaceImageContainer: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor: colors.surface,
      position: "relative",
    },
    marketplaceImage: {
      width: "100%",
      height: "100%",
    },
    marketplacePlaceholder: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.surface,
    },
    marketplaceStatusBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    marketplaceStatusText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    marketplaceContent: {
      padding: 8,
    },
    marketplaceTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
      lineHeight: 18,
    },
    marketplaceCategoryTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: colors.surface,
      borderRadius: 4,
      alignSelf: "flex-start",
      marginBottom: 4,
    },
    marketplaceCategoryText: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    marketplaceLocationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 2,
    },
    marketplaceLocation: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    marketplaceTime: {
      fontSize: 11,
      color: colors.textTertiary,
    },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay || "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
      padding: 0,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: screenHeight * 0.8,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalBody: {
      padding: 20,
    },
    modalFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    filterSection: {
      marginBottom: 24,
    },
    filterSectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
      color: colors.text,
    },
    filterOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    filterOptionText: {
      fontSize: 15,
      marginLeft: 12,
      color: colors.text,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
    },
    radioSelected: {
      borderColor: BRAND_COLOR,
      backgroundColor: BRAND_COLOR,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    checkboxSelected: {
      borderColor: BRAND_COLOR,
      backgroundColor: BRAND_COLOR,
    },
    checkmark: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "bold",
    },
    clearButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
    },
    clearButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: "500",
    },
    applyButton: {
      flex: 1,
      backgroundColor: BRAND_COLOR,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    applyButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
    },

    // Detail Modal Styles
    detailModalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    detailHeader: {
      flexDirection: "row",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailScrollContent: {
      flex: 1,
    },
    detailBadges: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 8,
    },
    detailTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    detailImageFixed: {
      width: screenWidth,
      height: screenWidth * 0.75,
      resizeMode: "cover",
    },
    noImageContainerFixed: {
      width: screenWidth,
      height: screenWidth * 0.75,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    detailImage: {
      width: screenWidth,
      height: screenWidth,
      resizeMode: "cover",
    },
    noImageContainer: {
      width: screenWidth,
      height: screenWidth * 0.6,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    noImageText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textSecondary,
    },
    posterCardFixed: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    posterCard: {
      margin: 16,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    posterInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    posterAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryLight,
      justifyContent: "center",
      alignItems: "center",
    },
    posterLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    posterName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    posterEmail: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    contactMethods: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
    },
    contactButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
    },
    contactButtonText: {
      fontSize: 14,
      color: BRAND_COLOR,
      fontWeight: "500",
    },
    detailsGrid: {
      paddingHorizontal: 16,
    },
    detailItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
    },
    descriptionCard: {
      margin: 16,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    descriptionLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    descriptionText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    actionButtons: {
      padding: 16,
      gap: 12,
    },
    claimButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      backgroundColor: BRAND_COLOR,
      paddingVertical: 14,
      borderRadius: 12,
    },
    claimButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    messageButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.text,
      paddingVertical: 14,
      borderRadius: 12,
    },
    messageButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    categoryBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textSecondary,
    },

    // Claim Modal Styles
    claimModalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      width: "90%",
      maxWidth: 400,
    },
    claimModalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    claimModalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    claimInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      minHeight: 120,
      marginBottom: 20,
      color: colors.text,
      backgroundColor: colors.background,
    },
    claimModalButtons: {
      flexDirection: "row",
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
    },
    cancelButtonText: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    submitButton: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      backgroundColor: BRAND_COLOR,
      paddingVertical: 12,
      borderRadius: 8,
    },
    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
    },
    disabledButton: {
      opacity: 0.5,
    },
  });

export default BrowseScreen;
