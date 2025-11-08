import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image, // Import Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Menu,
} from "lucide-react-native";
// Remove BRAND_COLOR import
import { getSupabaseClient } from "@campustrace/core";

// Define brand color locally to prevent crash
const BRAND_COLOR = "#1877F2";

// Add navigation prop
const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // State for the full profile

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let profileListener = null;

    // Listen for auth events (SIGNED_IN, SIGNED_OUT, INITIAL_SESSION)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        // Clean up old listener
        if (profileListener) {
          supabase.removeChannel(profileListener);
          profileListener = null;
        }

        if (event === "SIGNED_OUT") {
          setProfile(null); // Clear profile on sign out
          return;
        }

        const userId = currentUser?.id;

        if (userId) {
          // 1. Fetch initial profile data
          (async () => {
            try {
              const { data: profileData, error } = await supabase
                .from("profiles")
                .select("*") // Select all profile data
                .eq("id", userId)
                .single();

              if (error) throw error;
              setProfile(profileData);
            } catch (error) {
              console.error("Error fetching initial profile:", error);
              setProfile(null);
            }
          })();

          // 2. Subscribe to *future* updates
          profileListener = supabase
            .channel(`public:profiles:id=eq.${userId}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "profiles",
                filter: `id=eq.${userId}`,
              },
              (payload) => {
                setProfile((prev) => ({ ...prev, ...payload.new }));
              }
            )
            .subscribe();
        }
      }
    );

    // Cleanup function
    return () => {
      authListener?.subscription.unsubscribe();
      if (profileListener) {
        supabase.removeChannel(profileListener);
      }
    };
  }, []);

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            const supabase = getSupabaseClient();
            await supabase.auth.signOut();
            // The auth listener will handle setting user/profile to null
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>
            Manage your account and view your activity
          </Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Menu size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarLarge}>
            {/* --- UPDATED AVATAR LOGIC --- */}
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <User size={48} color="#FFFFFF" />
            )}
            {/* --- END OF UPDATE --- */}
          </View>
          <Text style={styles.userName}>
            {/* --- UPDATED NAME LOGIC --- */}
            {profile?.full_name || user?.email?.split("@")[0] || "User"}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={Settings}
            label="Settings"
            onPress={() => {
              // --- UPDATED NAVIGATION ---
              navigation.navigate("Settings");
            }}
          />
          <MenuItem
            icon={Bell}
            label="Notifications"
            onPress={() => {
              navigation.navigate("Dashboard", { screen: "Notifications" });
            }}
          />
          <MenuItem
            icon={HelpCircle}
            label="Help & Support"
            onPress={() => {
              navigation.navigate("Help");
            }}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const MenuItem = ({ icon: Icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <Icon size={24} color="#000000" />
      <Text style={styles.menuItemLabel}>{label}</Text>
    </View>
    <ChevronRight size={20} color="#8E8E93" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  headerContent: {
    flex: 1,
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
  menuButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BRAND_COLOR, // Use fixed color
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden", // Add overflow hidden for image
  },
  // --- ADDED AVATAR IMAGE STYLE ---
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#8E8E93",
  },
  menuSection: {
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EFEFEF",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    color: "#000000",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
});

export default ProfileScreen;
