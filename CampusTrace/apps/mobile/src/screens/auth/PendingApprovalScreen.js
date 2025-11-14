import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Clock, LogOut } from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";
import { useTheme } from "../../contexts/ThemeContext";

const PendingApprovalScreen = ({ navigation }) => {
  const { colors, fontSizes, isDark } = useTheme();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      // AuthNavigator will automatically detect the sign-out
      // and switch back to the Login screen.
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out.");
      setLoading(false); // Only set loading false if it fails
    }
  };

  const themeColors = {
    background: colors.background || "#FFFFFF",
    surface: colors.surface || "#F5F5F5",
    border: colors.border || "#E0E0E0",
    text: colors.text || "#000000",
    textSecondary: colors.textSecondary || "#666666",
    primary: colors.primary || "#0095F6",
    warning: colors.warning || "#F59E0B",
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    card: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 32,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${themeColors.warning}15`,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
      borderWidth: 4,
      borderColor: `${themeColors.warning}30`,
    },
    title: {
      fontSize: fontSizes.xl || 24,
      fontWeight: "700",
      color: themeColors.text,
      marginBottom: 16,
      textAlign: "center",
    },
    description: {
      fontSize: fontSizes.base || 16,
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 12,
    },
    logoutButton: {
      marginTop: 32,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: themeColors.primary,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      width: "100%",
    },
    logoutButtonText: {
      color: "#FFFFFF",
      fontSize: fontSizes.base || 16,
      fontWeight: "700",
      marginLeft: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={themeColors.background}
      />
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Clock size={40} color={themeColors.warning} />
          </View>

          <Text style={styles.title}>Account Pending Approval</Text>

          <Text style={styles.description}>
            Your email has been confirmed! Your account now needs approval from
            a university administrator before you can log in.
          </Text>

          <Text style={[styles.description, { marginTop: 12 }]}>
            You will receive an email notification once your account is
            approved.
          </Text>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <LogOut size={20} color="#FFFFFF" />
                <Text style={styles.logoutButtonText}>Back to Login</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PendingApprovalScreen;
