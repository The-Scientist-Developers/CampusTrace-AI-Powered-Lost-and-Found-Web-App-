import React, { useState, useEffect } from "react";
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
  Image, // Keep Image import for profile pictures
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  CheckCircle,
  ChevronRight, // For list item
  ChevronLeft, // For back button
} from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";
import { useTheme } from "../../contexts/ThemeContext";
import LoadingScreen from "../../components/LoadingScreen";
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  G,
  Line,
  RadialGradient,
} from "react-native-svg";

// CampusTrace Icon Component
const CampusTraceIcon = ({ width = 80, height = 80 }) => (
  <Svg width={width} height={height} viewBox="0 0 512 512">
    <Defs>
      <LinearGradient id="iconBlueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2563EB" stopOpacity="1" />
        <Stop offset="100%" stopColor="#1E40AF" stopOpacity="1" />
      </LinearGradient>
    </Defs>

    {/* Background */}
    <Rect
      x="16"
      y="16"
      width="480"
      height="480"
      rx="100"
      ry="100"
      fill="url(#iconBlueGradient)"
    />

    {/* Search icon */}
    <G transform="translate(256, 256)">
      {/* Search circle */}
      <Circle
        r="100"
        fill="none"
        stroke="white"
        strokeWidth="26"
        transform="translate(-26, -26)"
      />
      {/* Handle */}
      <Line
        x1="46"
        y1="46"
        x2="110"
        y2="110"
        stroke="white"
        strokeWidth="26"
        strokeLinecap="round"
      />
      {/* AI dot */}
      <Circle r="18" fill="white" transform="translate(-26, -26)" />
    </G>
  </Svg>
);

const LoginScreen = ({ navigation }) => {
  const { colors, fontSizes, isDark } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Saved accounts
  const [savedAccounts, setSavedAccounts] = useState([]);
  // Show saved accounts by default if they exist
  const [showSavedAccounts, setShowSavedAccounts] = useState(true);

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    // Show loading screen for 1.5 seconds
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadSavedEmail();
    loadSavedAccounts();
  }, []);

  // Update password strength
  useEffect(() => {
    if (!isLogin && password) {
      setPasswordStrength({
        hasMinLength: password.length >= 6,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      });
    }
  }, [password, isLogin]);

  const loadSavedAccounts = async () => {
    try {
      const saved = await AsyncStorage.getItem("campustrace_saved_accounts");
      if (saved) {
        const accounts = JSON.parse(saved);
        setSavedAccounts(accounts);
        // Set showSavedAccounts based on whether accounts exist
        setShowSavedAccounts(accounts.length > 0 && isLogin);
      } else {
        setShowSavedAccounts(false);
      }
    } catch (error) {
      console.log("Error loading saved accounts:", error);
      setShowSavedAccounts(false);
    }
  };

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

  const saveAccount = async (email, fullName, avatarUrl = null) => {
    try {
      const saved = await AsyncStorage.getItem("campustrace_saved_accounts");
      let accounts = saved ? JSON.parse(saved) : [];

      // Remove existing account with same email
      accounts = accounts.filter((acc) => acc.email !== email);

      // Add new account at the beginning
      accounts.unshift({
        email,
        fullName: fullName || email.split("@")[0],
        avatarUrl: avatarUrl || null,
        lastLogin: new Date().toISOString(),
      });

      // Keep only last 3 accounts
      accounts = accounts.slice(0, 3);

      await AsyncStorage.setItem(
        "campustrace_saved_accounts",
        JSON.stringify(accounts)
      );
      setSavedAccounts(accounts);
    } catch (error) {
      console.log("Error saving account:", error);
    }
  };

  const removeAccount = async (emailToRemove) => {
    try {
      const saved = await AsyncStorage.getItem("campustrace_saved_accounts");
      if (saved) {
        let accounts = JSON.parse(saved);
        accounts = accounts.filter((acc) => acc.email !== emailToRemove);
        await AsyncStorage.setItem(
          "campustrace_saved_accounts",
          JSON.stringify(accounts)
        );
        setSavedAccounts(accounts);
        // If no accounts left, hide the list
        if (accounts.length === 0) {
          setShowSavedAccounts(false);
        }
      }
    } catch (error) {
      console.log("Error removing account:", error);
    }
  };

  // When selecting an account, fill email and go to form
  const selectAccount = (account) => {
    setEmail(account.email);
    setShowSavedAccounts(false); // Switch to login form
  };

  const validate = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!isLogin) {
      if (!fullName) {
        newErrors.fullName = "Full name is required";
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (confirmPassword !== password) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      const score = Object.values(passwordStrength).filter(Boolean).length;
      if (score < 3) {
        newErrors.password = "Please create a stronger password";
      }
    }

    setErrors(newErrors);
    setTouched({
      email: true,
      password: true,
      fullName: !isLogin,
      confirmPassword: !isLogin,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      let result;

      if (isLogin) {
        result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (result.error) throw result.error;

        // Fetch profile data to get avatar_url
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", result.data.user.id)
          .single();

        const userName =
          profileData?.full_name || result.data?.user?.user_metadata?.full_name;
        const avatarUrl = profileData?.avatar_url || null;

        await saveEmail(email);
        await saveAccount(email, userName, avatarUrl);
        Alert.alert("Success", "Logged in successfully!");
        // On successful login, navigation would happen here (not shown in snippet)
      } else {
        result = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (result.error) throw result.error;

        Alert.alert(
          "Success",
          "Account created! Please check your email to verify your account.",
          [{ text: "OK", onPress: () => setIsLogin(true) }]
        );
      }
    } catch (error) {
      Alert.alert("Error", error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // This logic is kept, but the button is styled like the screenshot
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

  const handleInput = (field, value) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "fullName") setFullName(value);
    if (field === "confirmPassword") setConfirmPassword(value);

    setErrors((prev) => ({ ...prev, [field]: "" }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getPasswordStrengthScore = () => {
    return Object.values(passwordStrength).filter(Boolean).length;
  };

  const getPasswordStrengthColor = () => {
    const score = getPasswordStrengthScore();
    if (score <= 2) return "#EF4444"; // red
    if (score <= 3) return "#F59E0B"; // amber
    return "#10B981"; // green
  };

  const getPasswordStrengthText = () => {
    const score = getPasswordStrengthScore();
    if (score <= 2) return "Weak";
    if (score <= 3) return "Medium";
    return "Strong";
  };

  const toggleForm = (login) => {
    setIsLogin(login);
    setErrors({});
    setTouched({});
    setFullName("");
    setPassword("");
    setConfirmPassword("");
    // Don't clear email
  };

  if (initialLoading || loading) {
    return <LoadingScreen />;
  }

  // Use theme colors for dark mode UI
  // Fallbacks are provided for a dark theme
  const themeColors = {
    background: colors.background || "#000000",
    surface: colors.surface || "#1A1A1A", // For inputs
    border: colors.border || "#363636",
    text: colors.text || "#FFFFFF",
    textSecondary: colors.textSecondary || "#A8A8A8",
    primary: colors.primary || "#0095F6", // Instagram Blue
    error: colors.error || "#ED4956", // Instagram Red
    success: colors.success || "#10B981",
  };

  // Create dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "space-between", // Pushes footer to bottom
      padding: 24,
      paddingTop: Platform.OS === "android" ? 40 : 60,
    },
    mainContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    backButton: {
      position: "absolute",
      top: Platform.OS === "android" ? 30 : 50,
      left: 16,
      zIndex: 10,
    },
    logoContainer: {
      alignItems: "center",
      marginBottom: 48,
    },
    // Saved Accounts List
    savedAccountsContainer: {
      width: "100%",
      alignItems: "center",
    },
    savedAccountItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      width: "100%",
    },
    accountLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    accountAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: themeColors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
      overflow: "hidden",
    },
    accountAvatarImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    accountAvatarText: {
      fontSize: 24,
      fontWeight: "600",
      color: themeColors.text,
    },
    accountInfo: {
      flex: 1,
    },
    accountName: {
      fontSize: fontSizes.base || 16,
      fontWeight: "600",
      color: themeColors.text,
      marginBottom: 2,
    },
    accountEmail: {
      fontSize: fontSizes.small || 14,
      color: themeColors.textSecondary,
    },
    removeButton: {
      padding: 8,
    },
    removeButtonText: {
      fontSize: 24,
      color: themeColors.textSecondary,
      lineHeight: 24,
      fontWeight: "bold",
    },
    useAnotherAccount: {
      paddingVertical: 12,
      alignItems: "center",
      marginBottom: 16,
    },
    useAnotherAccountText: {
      fontSize: fontSizes.base || 16,
      color: themeColors.primary,
      fontWeight: "600",
    },

    // Login/Sign Up Form
    formContainer: {
      width: "100%",
    },
    inputWrapper: {
      marginBottom: 12,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 12, // More rounded
      paddingHorizontal: 14,
      height: 52,
    },
    inputError: {
      borderColor: themeColors.error,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: fontSizes.base || 16,
      color: themeColors.text,
      paddingVertical: 12, // Ensure text isn't cut off
    },
    eyeIcon: {
      padding: 4,
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      paddingLeft: 4,
    },
    errorText: {
      fontSize: fontSizes.small || 14,
      color: themeColors.error,
      marginLeft: 4,
    },
    // Password Strength
    passwordStrength: {
      backgroundColor: "transparent",
      borderRadius: 8,
      paddingVertical: 12,
      marginBottom: 12,
    },
    strengthHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    strengthLabel: {
      fontSize: fontSizes.small || 14,
      color: themeColors.textSecondary,
      fontWeight: "600",
    },
    strengthText: {
      fontSize: fontSizes.small || 14,
      fontWeight: "600",
    },
    requirements: {
      gap: 6,
    },
    requirement: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    unmetCircle: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: themeColors.border,
    },
    requirementText: {
      fontSize: fontSizes.small || 14,
      color: themeColors.textSecondary,
    },
    requirementTextMet: {
      color: themeColors.success,
    },
    // Forgot Password
    forgotPassword: {
      alignSelf: "flex-end",
      marginBottom: 20,
      marginTop: 8,
    },
    forgotPasswordText: {
      fontSize: fontSizes.small || 14,
      color: themeColors.primary,
      fontWeight: "600",
    },
    // Main Button
    button: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: fontSizes.base || 16,
      fontWeight: "700",
    },

    // Footer
    footer: {
      width: "100%",
      alignItems: "center",
      paddingTop: 24,
    },
    footerButton: {
      borderWidth: 1,
      borderColor: themeColors.primary,
      borderRadius: 12,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    footerButtonText: {
      color: themeColors.primary,
      fontSize: fontSizes.base || 16,
      fontWeight: "700",
    },
    metaText: {
      marginTop: 32,
      fontSize: fontSizes.small || 14,
      color: themeColors.textSecondary,
      fontWeight: "600",
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
        {/* Back Button (only on form screen) */}
        {!showSavedAccounts && isLogin && savedAccounts.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowSavedAccounts(true)}
            style={styles.backButton}
          >
            <ChevronLeft size={28} color={themeColors.text} />
          </TouchableOpacity>
        )}

        {/* Main Content: Logo + (List or Form) */}
        <View style={styles.mainContent}>
          <View style={styles.logoContainer}>
            <CampusTraceIcon width={80} height={80} />
          </View>

          {/* Render Saved Accounts List */}
          {showSavedAccounts && isLogin && savedAccounts.length > 0 ? (
            <View style={styles.savedAccountsContainer}>
              {savedAccounts.map((account, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.savedAccountItem}
                  onPress={() => selectAccount(account)}
                >
                  <View style={styles.accountLeft}>
                    <View style={styles.accountAvatar}>
                      {account.avatarUrl ? (
                        <Image
                          source={{ uri: account.avatarUrl }}
                          style={styles.accountAvatarImage}
                        />
                      ) : (
                        <Text style={styles.accountAvatarText}>
                          {account.fullName.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName} numberOfLines={1}>
                        {account.fullName}
                      </Text>
                      <Text style={styles.accountEmail} numberOfLines={1}>
                        {account.email}
                      </Text>
                    </View>
                  </View>
                  {/* Kept remove button functionality */}
                  <TouchableOpacity
                    onPress={() => removeAccount(account.email)}
                    style={styles.removeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.useAnotherAccount}
                onPress={() => setShowSavedAccounts(false)}
              >
                <Text style={styles.useAnotherAccountText}>
                  Use another account
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Render Login/Sign Up Form
            <View style={styles.formContainer}>
              {/* Full Name Input (Sign Up Only) */}
              {!isLogin && (
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.fullName && touched.fullName && styles.inputError,
                    ]}
                  >
                    <User
                      size={20}
                      color={themeColors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor={themeColors.textSecondary}
                      value={fullName}
                      onChangeText={(value) => handleInput("fullName", value)}
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.fullName && touched.fullName && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={14} color={themeColors.error} />
                      <Text style={styles.errorText}>{errors.fullName}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.inputContainer,
                    errors.email && touched.email && styles.inputError,
                  ]}
                >
                  <Mail
                    size={20}
                    color={themeColors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email or username"
                    placeholderTextColor={themeColors.textSecondary}
                    value={email}
                    onChangeText={(value) => handleInput("email", value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.email && touched.email && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={14} color={themeColors.error} />
                    <Text style={styles.errorText}>{errors.email}</Text>
                  </View>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.inputContainer,
                    errors.password && touched.password && styles.inputError,
                  ]}
                >
                  <Lock
                    size={20}
                    color={themeColors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={themeColors.textSecondary}
                    value={password}
                    onChangeText={(value) => handleInput("password", value)}
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
                {errors.password && touched.password && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={14} color={themeColors.error} />
                    <Text style={styles.errorText}>{errors.password}</Text>
                  </View>
                )}
              </View>

              {/* Confirm Password (Sign Up Only) */}
              {!isLogin && (
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.confirmPassword &&
                        touched.confirmPassword &&
                        styles.inputError,
                    ]}
                  >
                    <Lock
                      size={20}
                      color={themeColors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor={themeColors.textSecondary}
                      value={confirmPassword}
                      onChangeText={(value) =>
                        handleInput("confirmPassword", value)
                      }
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirm(!showConfirm)}
                      style={styles.eyeIcon}
                    >
                      {showConfirm ? (
                        <EyeOff size={20} color={themeColors.textSecondary} />
                      ) : (
                        <Eye size={20} color={themeColors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={14} color={themeColors.error} />
                      <Text style={styles.errorText}>
                        {errors.confirmPassword}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Password Strength Indicator (Sign Up Only) */}
              {!isLogin && password.length > 0 && (
                <View style={styles.passwordStrength}>
                  <View style={styles.strengthHeader}>
                    <Text style={styles.strengthLabel}>Password Strength:</Text>
                    <Text
                      style={[
                        styles.strengthText,
                        { color: getPasswordStrengthColor() },
                      ]}
                    >
                      {getPasswordStrengthText()}
                    </Text>
                  </View>
                  <View style={styles.requirements}>
                    <PasswordRequirement
                      met={passwordStrength.hasMinLength}
                      text="At least 6 characters"
                      colors={themeColors}
                    />
                    <PasswordRequirement
                      met={passwordStrength.hasUpperCase}
                      text="One uppercase letter"
                      colors={themeColors}
                    />
                    <PasswordRequirement
                      met={passwordStrength.hasLowerCase}
                      text="One lowercase letter"
                      colors={themeColors}
                    />
                    <PasswordRequirement
                      met={passwordStrength.hasNumber}
                      text="One number"
                      colors={themeColors}
                    />
                    <PasswordRequirement
                      met={passwordStrength.hasSpecialChar}
                      text="One special character"
                      colors={themeColors}
                    />
                  </View>
                </View>
              )}

              {/* Forgot Password (Login Only) */}
              {isLogin && (
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              )}

              {/* Login/Sign Up Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleAuth}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {isLogin ? "Log In" : "Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer: Toggle Button + Meta */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => {
              // If on saved accounts, switch to sign up
              if (showSavedAccounts) {
                toggleForm(false); // Go to Sign Up
                setShowSavedAccounts(false);
              } else {
                toggleForm(!isLogin); // Toggle between Log In and Sign Up
              }
            }}
          >
            <Text style={styles.footerButtonText}>
              {isLogin ? "Create new account" : "Log in"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.metaText}>CampusTrace</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// PasswordRequirement sub-component
const PasswordRequirement = ({ met, text, colors }) => {
  const styles = StyleSheet.create({
    requirement: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    unmetCircle: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: colors.border,
    },
    requirementText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    requirementTextMet: {
      color: colors.success,
    },
  });

  return (
    <View style={styles.requirement}>
      {met ? (
        <CheckCircle size={14} color={colors.success} />
      ) : (
        <View style={styles.unmetCircle} />
      )}
      <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
        {text}
      </Text>
    </View>
  );
};

export default LoginScreen;
