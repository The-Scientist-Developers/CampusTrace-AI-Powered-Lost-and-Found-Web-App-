import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  Linking, // Import Linking
  TextInput, // Import TextInput
  Image, // Import Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  KeyRound,
  AlertTriangle,
  Trash2,
  User,
  Camera,
  Check,
  Moon,
  Sun,
  Type,
  Contrast,
} from "lucide-react-native";
import {
  getSupabaseClient,
  API_BASE_URL,
  getAccessToken,
} from "@campustrace/core";
import { useTheme } from "../../contexts/ThemeContext";

// Define brand color locally
const BRAND_COLOR = "#1877F2";

const SectionCard = ({ title, description, children, colors }) => (
  <View
    style={[
      styles.sectionCard,
      {
        backgroundColor: colors?.card || "#FFFFFF",
        borderColor: colors?.border || "#E5E7EB",
      },
    ]}
  >
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors?.text || "#000000" }]}>
        {title}
      </Text>
      {description && (
        <Text
          style={[
            styles.sectionDescription,
            { color: colors?.textSecondary || "#6B7280" },
          ]}
        >
          {description}
        </Text>
      )}
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const SettingToggle = ({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  colors,
}) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleTextContainer}>
      <Text
        style={[
          styles.toggleLabel,
          { color: colors.text },
          disabled && { color: colors.textTertiary },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.toggleDescription,
          { color: colors.textSecondary },
          disabled && { color: colors.textTertiary },
        ]}
      >
        {description}
      </Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={"#FFFFFF"}
    />
  </View>
);

const SettingsScreen = ({ navigation }) => {
  const {
    isDark,
    themeMode,
    setTheme,
    toggleTheme,
    colorMode,
    changeColorMode,
    fontSize,
    changeFontSize,
    highContrast,
    toggleHighContrast,
    colors,
  } = useTheme();

  const [supabase, setSupabase] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Notification Preferences
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [claimNotifications, setClaimNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [moderationNotifications, setModerationNotifications] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState(true);

  useEffect(() => {
    const supabaseClient = getSupabaseClient();
    setSupabase(supabaseClient);

    const fetchUserAndProfile = async () => {
      if (!supabaseClient) {
        setLoading(false);
        return;
      }
      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error("You must be logged in");
        }

        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        setUser(user);

        // Fetch both profile and preferences
        const [profileRes, prefsRes] = await Promise.all([
          supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single(),
          fetch(`${API_BASE_URL}/api/profile/preferences`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Handle Profile
        if (profileRes.error) throw profileRes.error;
        if (profileRes.data) {
          setFullName(profileRes.data.full_name || "");
          setAvatarUrl(profileRes.data.avatar_url || null);
        }

        // Handle Preferences
        if (!prefsRes.ok) throw new Error("Failed to load preferences");
        const prefsData = await prefsRes.json();
        if (prefsData.preferences) {
          const prefs = prefsData.preferences;
          setMatchNotifications(prefs.match_notifications ?? true);
          setClaimNotifications(prefs.claim_notifications ?? true);
          setMessageNotifications(prefs.message_notifications ?? true);
          setModerationNotifications(prefs.moderation_notifications ?? true);
          setEmailNotificationsEnabled(
            prefs.email_notifications_enabled ?? true,
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", error.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();
  }, [supabase]);

  const handleProfileSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Full name cannot be empty.");
      return;
    }
    setIsSavingProfile(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Authentication required.");

      // Use FormData to match the backend API
      const formData = new FormData();
      formData.append("full_name", fullName.trim());

      const response = await fetch(`${API_BASE_URL}/api/profile/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to update profile name.");
      }

      Alert.alert("Success", "Profile name saved!");
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", error.message || "Failed to save profile name");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenWebApp = (section) => {
    const webAppUrl = `https://campustrace.site/dashboard/profile`; // Your web app URL
    Alert.alert(
      `Update ${section}`,
      `To update your ${section.toLowerCase()}, you will be redirected to the secure web app.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Web App",
          onPress: () => {
            Linking.openURL(webAppUrl).catch(() => {
              Alert.alert(
                "Error",
                `Could not open the web app. Please visit ${webAppUrl} manually.`,
              );
            });
          },
        },
      ],
    );
  };

  const handlePreferencesSave = async () => {
    setIsSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("You must be logged in");
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          match_notifications: matchNotifications,
          claim_notifications: claimNotifications,
          message_notifications: messageNotifications,
          moderation_notifications: moderationNotifications,
          email_notifications_enabled: emailNotificationsEnabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      Alert.alert("Success", "Notification preferences saved!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      Alert.alert("Error", error.message || "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This action is irreversible. You will lose all your posts and data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await supabase.rpc("delete_user_account");
              if (error) throw error;

              Alert.alert(
                "Success",
                "Account deleted successfully. You will be logged out.",
              );
              await supabase.auth.signOut();
            } catch (err) {
              Alert.alert("Error", "Failed to delete account.");
              console.error("Error deleting account:", err);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <LinearGradient
        colors={[colors.background, colors.background]}
        style={styles.headerGradient}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: "transparent",
              borderBottomWidth: 0,
              paddingTop: 16,
              paddingBottom: 8,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Settings
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {loading ? (
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={[styles.scrollView, { backgroundColor: colors.background }]}
        >
          {/* --- Profile Section (As requested) --- */}
          <View style={styles.sectionContainer}>
            <SectionCard
              title="Profile"
              description="Manage your public profile information."
              colors={colors}
            >
              {/* Avatar */}
              <View style={styles.profileEditContainer}>
                <View style={styles.avatarContainer}>
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarPlaceholder,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <User size={40} color={colors.primary} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.cameraIcon,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleOpenWebApp("Profile Photo")}
                  >
                    <Camera size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Full Name */}
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <User
                  size={18}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              {/* Save Profile Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                  isSavingProfile && styles.buttonDisabled,
                ]}
                onPress={handleProfileSave}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Check size={20} color="#FFFFFF" />
                )}
                <Text style={styles.buttonText}>
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </Text>
              </TouchableOpacity>
            </SectionCard>
          </View>

          {/* Accessibility Section */}
          <View style={styles.sectionContainer}>
            <SectionCard
              title="Accessibility"
              description="Customize your visual experience."
              colors={colors}
            >
              {/* Theme Mode Selector */}
              <View style={styles.themeModeSection}>
                <View style={styles.iconLabelRow}>
                  {isDark ? (
                    <Moon size={20} color={colors.primary} />
                  ) : (
                    <Sun size={20} color={colors.primary} />
                  )}
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>
                    Theme Mode
                  </Text>
                </View>
                <Text
                  style={[
                    styles.toggleDescription,
                    { color: colors.textSecondary, marginBottom: 12 },
                  ]}
                >
                  Choose your preferred theme or follow system settings
                </Text>

                <View style={styles.themeModeGrid}>
                  <TouchableOpacity
                    style={[
                      styles.themeModeButton,
                      {
                        backgroundColor:
                          themeMode === "system"
                            ? colors.primary
                            : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setTheme("system")}
                  >
                    <Text
                      style={[
                        styles.themeModeIcon,
                        {
                          color:
                            themeMode === "system" ? "#FFFFFF" : colors.text,
                        },
                      ]}
                    >
                      ⚙️
                    </Text>
                    <Text
                      style={[
                        styles.themeModeLabel,
                        {
                          color:
                            themeMode === "system" ? "#FFFFFF" : colors.text,
                        },
                      ]}
                    >
                      System
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.themeModeButton,
                      {
                        backgroundColor:
                          themeMode === "light"
                            ? colors.primary
                            : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setTheme("light")}
                  >
                    <Sun
                      size={24}
                      color={themeMode === "light" ? "#FFFFFF" : colors.text}
                    />
                    <Text
                      style={[
                        styles.themeModeLabel,
                        {
                          color:
                            themeMode === "light" ? "#FFFFFF" : colors.text,
                        },
                      ]}
                    >
                      Light
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.themeModeButton,
                      {
                        backgroundColor:
                          themeMode === "dark"
                            ? colors.primary
                            : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setTheme("dark")}
                  >
                    <Moon
                      size={24}
                      color={themeMode === "dark" ? "#FFFFFF" : colors.text}
                    />
                    <Text
                      style={[
                        styles.themeModeLabel,
                        {
                          color: themeMode === "dark" ? "#FFFFFF" : colors.text,
                        },
                      ]}
                    >
                      Dark
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Color Theme Picker */}
              <View style={styles.colorThemeSection}>
                <View style={styles.iconLabelRow}>
                  <Type size={20} color={colors.primary} />
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>
                    Color Theme
                  </Text>
                </View>
                <Text
                  style={[
                    styles.toggleDescription,
                    { color: colors.textSecondary, marginBottom: 12 },
                  ]}
                >
                  Choose a color theme that suits your preference
                </Text>

                <View style={styles.colorThemeGrid}>
                  <TouchableOpacity
                    style={[
                      styles.colorThemeButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor:
                          colorMode === "blue" ? colors.primary : colors.border,
                      },
                      colorMode === "blue" && { borderWidth: 3 },
                    ]}
                    onPress={() => changeColorMode("blue")}
                  >
                    <View
                      style={[
                        styles.colorThemeCircle,
                        { backgroundColor: "#1877F2" },
                      ]}
                    />
                    <Text style={[styles.colorThemeEmoji, { fontSize: 24 }]}>
                      🧩
                    </Text>
                    <Text
                      style={[styles.colorThemeLabel, { color: colors.text }]}
                    >
                      Autism
                    </Text>
                    <Text
                      style={[
                        styles.colorThemeDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Blue
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.colorThemeButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor:
                          colorMode === "purple"
                            ? colors.primary
                            : colors.border,
                      },
                      colorMode === "purple" && { borderWidth: 3 },
                    ]}
                    onPress={() => changeColorMode("purple")}
                  >
                    <View
                      style={[
                        styles.colorThemeCircle,
                        { backgroundColor: "#9333EA" },
                      ]}
                    />
                    <Text style={[styles.colorThemeEmoji, { fontSize: 24 }]}>
                      💜
                    </Text>
                    <Text
                      style={[styles.colorThemeLabel, { color: colors.text }]}
                    >
                      GAD
                    </Text>
                    <Text
                      style={[
                        styles.colorThemeDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Purple
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.colorThemeButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor:
                          colorMode === "pink" ? colors.primary : colors.border,
                      },
                      colorMode === "pink" && { borderWidth: 3 },
                    ]}
                    onPress={() => changeColorMode("pink")}
                  >
                    <View
                      style={[
                        styles.colorThemeCircle,
                        { backgroundColor: "#EC4899" },
                      ]}
                    />
                    <Text style={[styles.colorThemeEmoji, { fontSize: 24 }]}>
                      🎗️
                    </Text>
                    <Text
                      style={[styles.colorThemeLabel, { color: colors.text }]}
                    >
                      Breast Cancer
                    </Text>
                    <Text
                      style={[
                        styles.colorThemeDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Pink
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.colorThemeButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor:
                          colorMode === "green"
                            ? colors.primary
                            : colors.border,
                      },
                      colorMode === "green" && { borderWidth: 3 },
                    ]}
                    onPress={() => changeColorMode("green")}
                  >
                    <View
                      style={[
                        styles.colorThemeCircle,
                        { backgroundColor: "#10B981" },
                      ]}
                    />
                    <Text style={[styles.colorThemeEmoji, { fontSize: 24 }]}>
                      🌍
                    </Text>
                    <Text
                      style={[styles.colorThemeLabel, { color: colors.text }]}
                    >
                      Environmental
                    </Text>
                    <Text
                      style={[
                        styles.colorThemeDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Green
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* High Contrast Toggle */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextContainer}>
                  <View style={styles.iconLabelRow}>
                    <Contrast size={20} color={colors.primary} />
                    <Text style={[styles.toggleLabel, { color: colors.text }]}>
                      High Contrast
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.toggleDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Increase contrast for better visibility
                  </Text>
                </View>
                <Switch
                  value={highContrast}
                  onValueChange={toggleHighContrast}
                  trackColor={{ false: "#E5E7EB", true: colors.primary }}
                  thumbColor={"#FFFFFF"}
                />
              </View>
            </SectionCard>
          </View>

          {/* Notification Preferences Section */}
          <View style={styles.sectionContainer}>
            <SectionCard
              title="Notification Preferences"
              description="Choose how and when you receive updates."
              colors={colors}
            >
              <View style={styles.toggleGroup}>
                <SettingToggle
                  label="Email Notifications"
                  description="Master switch for all email notifications."
                  value={emailNotificationsEnabled}
                  onValueChange={setEmailNotificationsEnabled}
                  colors={colors}
                />
              </View>

              <View style={!emailNotificationsEnabled && styles.disabledGroup}>
                <SettingToggle
                  label="Potential Match Alerts"
                  description="Notify when a 'Found' item matches your 'Lost' item."
                  value={matchNotifications}
                  onValueChange={setMatchNotifications}
                  disabled={!emailNotificationsEnabled}
                  colors={colors}
                />
                <SettingToggle
                  label="Claim Notifications"
                  description="Alerts when someone claims your item or responds."
                  value={claimNotifications}
                  onValueChange={setClaimNotifications}
                  disabled={!emailNotificationsEnabled}
                  colors={colors}
                />
                <SettingToggle
                  label="Message Notifications"
                  description="Get notified about new messages."
                  value={messageNotifications}
                  onValueChange={setMessageNotifications}
                  disabled={!emailNotificationsEnabled}
                  colors={colors}
                />
                <SettingToggle
                  label="Moderation Updates"
                  description="Updates on your post status (approved, rejected)."
                  value={moderationNotifications}
                  onValueChange={setModerationNotifications}
                  disabled={!emailNotificationsEnabled}
                  colors={colors}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                  isSaving && styles.buttonDisabled,
                ]}
                onPress={handlePreferencesSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Save Preferences</Text>
                )}
              </TouchableOpacity>
            </SectionCard>
          </View>

          {/* Security Section */}
          <View style={styles.sectionContainer}>
            <SectionCard
              title="Security"
              description="Manage your account security."
              colors={colors}
            >
              <View style={styles.securityRow}>
                <View style={styles.toggleTextContainer}>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>
                    Password
                  </Text>
                  <Text
                    style={[
                      styles.toggleDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Update your password to keep your account secure.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.securityButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleOpenWebApp("Password")} // Use new handler
                >
                  <KeyRound size={16} color={colors.primary} />
                  <Text
                    style={[
                      styles.securityButtonText,
                      { color: colors.primary },
                    ]}
                  >
                    Update
                  </Text>
                </TouchableOpacity>
              </View>
            </SectionCard>
          </View>

          {/* Danger Zone Section */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.dangerZoneTitle, { color: colors.error }]}>
              Danger Zone
            </Text>
            <View
              style={[
                styles.dangerZoneCard,
                { backgroundColor: colors.card, borderColor: colors.error },
              ]}
            >
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  Delete Your Account
                </Text>
                <Text
                  style={[
                    styles.toggleDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  This action is permanent and cannot be undone.
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.buttonDanger,
                  { backgroundColor: colors.error },
                  isDeleting && styles.buttonDisabled,
                ]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Trash2 size={16} color="#FFFFFF" />
                )}
                <Text style={styles.buttonText}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  headerGradient: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 0,
  },
  backButton: { padding: 4 },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1 },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1F2937" },
  sectionDescription: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  sectionContent: {
    padding: 16,
  },
  comingSoonText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  toggleGroup: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 12,
  },
  disabledGroup: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#9CA3AF",
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: { fontSize: 16, fontWeight: "500", color: "#1F2937" },
  toggleDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 18,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_COLOR,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    gap: 8,
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  securityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  securityButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#E0F2FE",
  },
  securityButtonText: {
    color: BRAND_COLOR,
    fontSize: 14,
    fontWeight: "600",
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#EF4444",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  dangerZoneCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  buttonDanger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  // --- NEW STYLES FOR PROFILE EDIT ---
  profileEditContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: BRAND_COLOR,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: BRAND_COLOR,
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#1F2937",
    width: "100%", // For profile name input
  },
  // --- THEME/ACCESSIBILITY STYLES ---
  iconLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  colorThemeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  colorThemeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  colorThemeButton: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  colorThemeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  colorThemeEmoji: {
    marginBottom: 4,
  },
  colorThemeLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  colorThemeDesc: {
    fontSize: 12,
  },
  fontSizeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  fontSizeGrid: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  fontSizeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  fontSizeButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  fontSizeLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  themeModeSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  themeModeGrid: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  themeModeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  themeModeIcon: {
    fontSize: 24,
  },
  themeModeLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default SettingsScreen;
