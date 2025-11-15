import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Eye, EyeOff } from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";
import { useTheme } from "../../contexts/ThemeContext";
import LoadingScreen from "../../components/LoadingScreen";
import { API_BASE_URL } from "../../utils/apiClient";
import Svg, {
  Rect,
  Defs,
  LinearGradient,
  Stop,
  G,
  Circle,
  Line,
} from "react-native-svg";

// Smaller CampusTrace Icon Component
const CampusTraceIcon = ({ width = 64, height = 64 }) => (
  <Svg width={width} height={height} viewBox="0 0 512 512">
    <Defs>
      <LinearGradient id="iconBlueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2563EB" stopOpacity="1" />
        <Stop offset="100%" stopColor="#1E40AF" stopOpacity="1" />
      </LinearGradient>
    </Defs>
    <Rect
      x="16"
      y="16"
      width="480"
      height="480"
      rx="100"
      ry="100"
      fill="url(#iconBlueGradient)"
    />
    <G transform="translate(256, 256)">
      <Circle
        r="100"
        fill="none"
        stroke="white"
        strokeWidth="26"
        transform="translate(-26, -26)"
      />
      <Line
        x1="46"
        y1="46"
        x2="110"
        y2="110"
        stroke="white"
        strokeWidth="26"
        strokeLinecap="round"
      />
      <Circle r="18" fill="white" transform="translate(-26, -26)" />
    </G>
  </Svg>
);

const LoginScreen = ({ navigation }) => {
  const { colors, fontSizes } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem("userEmail");
      if (savedEmail) setEmail(savedEmail);
    } catch (error) {
      console.log("Error loading saved email:", error);
    }
  };

  const saveEmail = async (email) => {
    try {
      await AsyncStorage.setItem("userEmail", email);
    } catch (error) {
      console.log("Error saving email:", error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      let result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (result.error) throw result.error;

      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) {
        throw new Error("Unable to connect to authentication service");
      }

      const { data: profileData } = await supabaseClient
        .from("profiles")
        .select("is_verified")
        .eq("id", result.data.user.id)
        .single();

      if (profileData && profileData.is_verified === false) {
        await supabaseClient.auth.signOut();
        navigation.navigate("PendingApproval");
        return;
      }

      await saveEmail(email);
    } catch (error) {
      Alert.alert("Error", error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup-mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
          captchaToken: "mobile-bypass",
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMsg =
          responseData.detail || responseData.message || "Sign up failed";

        if (
          errorMsg.toLowerCase().includes("not registered") ||
          errorMsg.toLowerCase().includes("domain")
        ) {
          const domain = email.split("@")[1];
          Alert.alert(
            "Email Domain Not Registered",
            `The email domain "${domain}" is not registered with CampusTrace. Please use your official university email address.`
          );
        } else if (errorMsg.toLowerCase().includes("already exists")) {
          Alert.alert(
            "Account Already Exists",
            "An account with this email already exists. Please sign in instead.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Go to Login", onPress: () => setIsLogin(true) },
            ]
          );
        } else {
          Alert.alert("Sign Up Failed", errorMsg);
        }
        return;
      }

      Alert.alert(
        "Success",
        "Account created! Please check your email to verify your account.",
        [{ text: "OK", onPress: () => setIsLogin(true) }]
      );
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert(
        "Sign Up Failed",
        error.message || "Could not complete registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Reset Password",
      "Please visit the web app to reset your password.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Web App",
          onPress: () =>
            Linking.openURL("https://campustrace.site/forgot-password"),
        },
      ]
    );
  };

  if (initialLoading) {
    return <LoadingScreen />;
  }

  const themeColors = {
    background: colors.background || "#000000",
    surface: colors.surface || "#121212",
    border: colors.border || "#262626",
    text: colors.text || "#FFFFFF",
    textSecondary: colors.textSecondary || "#A8A8A8",
    primary: colors.primary || "#0095F6",
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 40,
      paddingTop: Platform.OS === "android" ? 80 : 100,
      paddingBottom: 40,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: 48,
    },
    formContainer: {
      width: "100%",
    },
    input: {
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 3,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: fontSizes?.base || 14,
      color: themeColors.text,
      marginBottom: 10,
    },
    passwordContainer: {
      position: "relative",
      marginBottom: 10,
    },
    passwordInput: {
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 3,
      paddingHorizontal: 12,
      paddingVertical: 10,
      paddingRight: 45,
      fontSize: fontSizes?.base || 14,
      color: themeColors.text,
    },
    eyeIcon: {
      position: "absolute",
      right: 12,
      top: 10,
    },
    loginButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
      marginBottom: 20,
    },
    loginButtonDisabled: {
      opacity: 0.5,
    },
    loginButtonText: {
      color: "#FFFFFF",
      fontSize: fontSizes?.base || 14,
      fontWeight: "600",
    },
    forgotPassword: {
      alignItems: "center",
      marginBottom: 40,
    },
    forgotPasswordText: {
      color: themeColors.textSecondary,
      fontSize: fontSizes?.small || 12,
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 30,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: themeColors.border,
    },
    dividerText: {
      color: themeColors.textSecondary,
      paddingHorizontal: 18,
      fontSize: fontSizes?.small || 12,
      fontWeight: "600",
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      paddingVertical: 20,
      alignItems: "center",
    },
    footerText: {
      color: themeColors.textSecondary,
      fontSize: fontSizes?.small || 12,
    },
    footerLink: {
      color: themeColors.primary,
      fontWeight: "600",
    },
    metaText: {
      textAlign: "center",
      color: themeColors.textSecondary,
      fontSize: fontSizes?.small || 12,
      marginTop: 40,
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <CampusTraceIcon width={64} height={64} />
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {!isLogin && (
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={themeColors.textSecondary}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={themeColors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor={themeColors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff size={20} color={themeColors.textSecondary} />
                ) : (
                  <Eye size={20} color={themeColors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={isLogin ? handleLogin : handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {isLogin ? "Log in" : "Sign up"}
                </Text>
              )}
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.footerText}>
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <Text style={styles.footerLink}>
                {isLogin ? "Sign up" : "Log in"}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.metaText}>CampusTrace</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
