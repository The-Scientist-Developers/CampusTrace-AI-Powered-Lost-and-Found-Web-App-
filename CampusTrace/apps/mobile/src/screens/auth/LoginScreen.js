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
  Image,
  Modal,
  FlatList,
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
  ChevronRight,
  ChevronLeft,
  Hash,
  UploadCloud, // Added for file upload
  Camera, // Added for camera
} from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";
import { useTheme } from "../../contexts/ThemeContext";
import LoadingScreen from "../../components/LoadingScreen";
import { apiClient, API_BASE_URL } from "../../utils/apiClient"; // Make sure API_BASE_URL is exported from your client
import * as ImagePicker from "expo-image-picker"; // Import ImagePicker
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  G,
  Line,
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
  const { colors, fontSizes, isDark } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [universityId, setUniversityId] = useState(""); // Kept for validation logic, but field is now image
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [registerType, setRegisterType] = useState("regular");

  // NEW: State for University ID Image
  const [idImage, setIdImage] = useState(null); // Will store { uri, name, type }

  // NEW: State for University Selection
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [showUniversityPicker, setShowUniversityPicker] = useState(false);

  const [loginAttempts, setLoginAttempts] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);

  const [savedAccounts, setSavedAccounts] = useState([]);
  const [showSavedAccounts, setShowSavedAccounts] = useState(true);

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadSavedEmail();
    loadSavedAccounts();
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/universities`);
      const data = await response.json();
      if (response.ok && data.universities) {
        setUniversities(data.universities);
        // Auto-select first university if only one exists
        if (data.universities.length === 1) {
          setSelectedUniversity(data.universities[0]);
        }
      }
    } catch (error) {
      console.log("Error fetching universities:", error);
      Alert.alert(
        "Error",
        "Could not load universities. Please check your connection."
      );
    }
  };

  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (cooldownTime === 0 && loginAttempts >= 5) {
      setLoginAttempts(0);
      setLastAttemptTime(null);
    }
  }, [cooldownTime, loginAttempts]);

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
      accounts = accounts.filter((acc) => acc.email !== email);
      accounts.unshift({
        email,
        fullName: fullName || email.split("@")[0],
        avatarUrl: avatarUrl || null,
        lastLogin: new Date().toISOString(),
      });
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
        if (accounts.length === 0) {
          setShowSavedAccounts(false);
        }
      }
    } catch (error) {
      console.log("Error removing account:", error);
    }
  };

  const selectAccount = (account) => {
    setEmail(account.email);
    setShowSavedAccounts(false);
  };

  const checkRateLimit = () => {
    const now = Date.now();
    if (lastAttemptTime && now - lastAttemptTime > 15 * 60 * 1000) {
      setLoginAttempts(0);
      setLastAttemptTime(null);
      return true;
    }
    if (cooldownTime > 0) {
      Alert.alert(
        "Too Many Attempts",
        `Please wait ${cooldownTime} seconds before trying again.`,
        [{ text: "OK" }]
      );
      return false;
    }
    if (loginAttempts >= 5) {
      setCooldownTime(60);
      Alert.alert(
        "Too Many Attempts",
        "Too many login attempts. Please wait 60 seconds.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
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
      if (registerType === "manual") {
        if (!idImage) {
          newErrors.idImage = "University ID photo is required";
        }
        if (!selectedUniversity) {
          newErrors.university = "Please select your university";
        }
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
      idImage: !isLogin && registerType === "manual",
      confirmPassword: !isLogin,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    if (!checkRateLimit()) return;

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      let result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (result.error) throw result.error;

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

      setLoginAttempts(0);
      setCooldownTime(0);
      setLastAttemptTime(null);

      // Alert.alert("Success", "Logged in successfully!"); // Let AuthNavigator handle it
    } catch (error) {
      setLoginAttempts((prev) => prev + 1);
      setLastAttemptTime(Date.now());
      Alert.alert("Error", error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      if (registerType === "regular") {
        // Regular signup via mobile-specific endpoint (no CAPTCHA required)
        const response = await fetch(`${API_BASE_URL}/api/auth/signup-mobile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim(),
            password: password,
            captchaToken: "mobile-bypass", // Not validated on mobile endpoint
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.detail || responseData.message || "Sign up failed"
          );
        }

        Alert.alert(
          "Success",
          "Account created! Please check your email to verify your account.",
          [{ text: "OK", onPress: () => toggleForm(true) }]
        );
      } else {
        // --- Manual Signup with FormData (mobile-specific endpoint) ---
        if (!selectedUniversity) {
          throw new Error("Please select your university");
        }

        const formData = new FormData();
        formData.append("full_name", fullName.trim());
        formData.append("email", email.trim());
        formData.append("password", password);
        formData.append("university_id", selectedUniversity.id.toString());

        // Append the image file
        formData.append("id_file", {
          uri: idImage.uri,
          name: idImage.name,
          type: idImage.type,
        });

        // Use mobile-specific endpoint (no CAPTCHA required)
        const response = await fetch(
          `${API_BASE_URL}/api/auth/signup-manual-mobile`,
          {
            method: "POST",
            body: formData,
          }
        );

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.detail || "An error occurred");
        }

        // Navigate to Pending Approval screen on success
        navigation.navigate("PendingApproval");
      }

      setLoginAttempts(0);
      setCooldownTime(0);
      setLastAttemptTime(null);
    } catch (error) {
      Alert.alert(
        "Sign Up Failed",
        error.message || "Could not complete registration."
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

  const handleInput = (field, value) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "fullName") setFullName(value);
    if (field === "confirmPassword") setConfirmPassword(value);

    setErrors((prev) => ({ ...prev, [field]: "" }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // --- NEW: Image Picker Functions ---
  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Sorry, we need camera roll permissions to make this work!"
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      const fileName = uri.split("/").pop();
      const fileType = `image/${fileName.split(".").pop()}`;
      setIdImage({ uri, name: fileName, type: fileType });
      setErrors((prev) => ({ ...prev, idImage: null })); // Clear error
    }
  };

  const handleCameraCapture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Sorry, we need camera permissions to make this work!"
      );
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      const fileName = uri.split("/").pop();
      const fileType = `image/${fileName.split(".").pop()}`;
      setIdImage({ uri, name: fileName, type: fileType });
      setErrors((prev) => ({ ...prev, idImage: null })); // Clear error
    }
  };
  // --- END: Image Picker Functions ---

  const getPasswordStrengthScore = () => {
    return Object.values(passwordStrength).filter(Boolean).length;
  };

  const getPasswordStrengthColor = () => {
    const score = getPasswordStrengthScore();
    if (score <= 2) return "#EF4444";
    if (score <= 3) return "#F59E0B";
    return "#10B981";
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
    setUniversityId("");
    setPassword("");
    setConfirmPassword("");
    setIdImage(null); // Clear image
    setRegisterType("regular");
  };

  if (initialLoading) {
    return <LoadingScreen />;
  }

  const themeColors = {
    background: colors.background || "#000000",
    surface: colors.surface || "#1A1A1A",
    border: colors.border || "#363636",
    text: colors.text || "#FFFFFF",
    textSecondary: colors.textSecondary || "#A8A8A8",
    primary: colors.primary || "#0095F6",
    error: colors.error || "#ED4956",
    success: colors.success || "#10B981",
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "space-between",
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
      borderRadius: 12,
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
      paddingVertical: 12,
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
    button: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
    },
    buttonDisabled: {
      backgroundColor: themeColors.border,
      opacity: 0.6,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: fontSizes.base || 16,
      fontWeight: "700",
    },
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
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    toggleContainer: {
      flexDirection: "row",
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    toggleButtonActive: {
      backgroundColor: themeColors.primary,
    },
    toggleButtonInactive: {
      backgroundColor: "transparent",
    },
    toggleTextActive: {
      fontSize: fontSizes.small || 14,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    toggleTextInactive: {
      fontSize: fontSizes.small || 14,
      fontWeight: "500",
      color: themeColors.textSecondary,
    },
    // --- NEW STYLES FOR ID UPLOAD ---
    idUploadContainer: {
      marginBottom: 12,
    },
    idUploadLabel: {
      fontSize: fontSizes.small || 14,
      color: themeColors.textSecondary,
      fontWeight: "600",
      marginBottom: 8,
      paddingLeft: 4,
    },
    idUploadButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    idUploadButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 12,
      paddingVertical: 14,
      gap: 8,
    },
    idUploadButtonText: {
      color: themeColors.text,
      fontSize: fontSizes.small || 14,
      fontWeight: "600",
    },
    idImagePreviewContainer: {
      width: "100%",
      height: 150,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: themeColors.success,
      backgroundColor: themeColors.surface,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 12,
      overflow: "hidden",
    },
    idImagePreview: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    idImagePreviewText: {
      color: themeColors.success,
      fontWeight: "600",
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: themeColors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "70%",
      paddingBottom: Platform.OS === "ios" ? 34 : 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    modalTitle: {
      fontSize: fontSizes.lg || 18,
      fontWeight: "700",
      color: themeColors.text,
    },
    modalCloseButton: {
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    modalCloseText: {
      fontSize: 32,
      color: themeColors.textSecondary,
      lineHeight: 32,
    },
    universityItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    universityItemSelected: {
      backgroundColor: `${themeColors.primary}15`,
    },
    universityItemText: {
      fontSize: fontSizes.base || 16,
      color: themeColors.text,
      flex: 1,
    },
    universityItemTextSelected: {
      color: themeColors.primary,
      fontWeight: "600",
    },
    emptyList: {
      padding: 40,
      alignItems: "center",
    },
    emptyListText: {
      fontSize: fontSizes.base || 16,
      color: themeColors.textSecondary,
      textAlign: "center",
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
        {!showSavedAccounts && isLogin && savedAccounts.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowSavedAccounts(true)}
            style={styles.backButton}
          >
            <ChevronLeft size={28} color={themeColors.text} />
          </TouchableOpacity>
        )}

        <View style={styles.mainContent}>
          <View style={styles.logoContainer}>
            <CampusTraceIcon width={80} height={80} />
          </View>

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
            <View style={styles.formContainer}>
              {!isLogin && (
                <>
                  <View style={styles.toggleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        registerType === "regular"
                          ? styles.toggleButtonActive
                          : styles.toggleButtonInactive,
                      ]}
                      onPress={() => setRegisterType("regular")}
                    >
                      <Text
                        style={
                          registerType === "regular"
                            ? styles.toggleTextActive
                            : styles.toggleTextInactive
                        }
                      >
                        Regular
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        registerType === "manual"
                          ? styles.toggleButtonActive
                          : styles.toggleButtonInactive,
                      ]}
                      onPress={() => setRegisterType("manual")}
                    >
                      <Text
                        style={
                          registerType === "manual"
                            ? styles.toggleTextActive
                            : styles.toggleTextInactive
                        }
                      >
                        Manual (University ID)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputWrapper}>
                    <View
                      style={[
                        styles.inputContainer,
                        errors.fullName &&
                          touched.fullName &&
                          styles.inputError,
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
                </>
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
                    placeholder="Email"
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

              {/* University Selection (Manual Sign Up Only) */}
              {!isLogin && registerType === "manual" && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.idUploadLabel}>
                    Select Your University
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.inputContainer,
                      errors.university &&
                        touched.university &&
                        styles.inputError,
                    ]}
                    onPress={() => setShowUniversityPicker(true)}
                  >
                    <User
                      size={20}
                      color={themeColors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <Text
                      style={[
                        styles.input,
                        !selectedUniversity && {
                          color: themeColors.textSecondary,
                        },
                      ]}
                    >
                      {selectedUniversity
                        ? selectedUniversity.name
                        : "Choose university..."}
                    </Text>
                    <ChevronRight size={20} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                  {errors.university && touched.university && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={14} color={themeColors.error} />
                      <Text style={styles.errorText}>{errors.university}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* University/Student ID Upload (Manual Sign Up Only) */}
              {!isLogin && registerType === "manual" && (
                <View style={styles.idUploadContainer}>
                  <Text style={styles.idUploadLabel}>University ID Photo</Text>
                  <View style={styles.idUploadButtons}>
                    <TouchableOpacity
                      style={styles.idUploadButton}
                      onPress={handleImagePick}
                    >
                      <UploadCloud size={18} color={themeColors.text} />
                      <Text style={styles.idUploadButtonText}>Upload</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.idUploadButton}
                      onPress={handleCameraCapture}
                    >
                      <Camera size={18} color={themeColors.text} />
                      <Text style={styles.idUploadButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                  </View>
                  {idImage && (
                    <View style={styles.idImagePreviewContainer}>
                      <Image
                        source={{ uri: idImage.uri }}
                        style={styles.idImagePreview}
                      />
                    </View>
                  )}
                  {errors.idImage && touched.idImage && (
                    <View style={[styles.errorContainer, { marginTop: 8 }]}>
                      <AlertCircle size={14} color={themeColors.error} />
                      <Text style={styles.errorText}>{errors.idImage}</Text>
                    </View>
                  )}
                </View>
              )}

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

              <TouchableOpacity
                style={[
                  styles.button,
                  (loading || cooldownTime > 0) && styles.buttonDisabled,
                ]}
                onPress={isLogin ? handleLogin : handleSignUp}
                disabled={loading || cooldownTime > 0}
              >
                <Text style={styles.buttonText}>
                  {cooldownTime > 0
                    ? `Wait ${cooldownTime}s`
                    : isLogin
                    ? "Log In"
                    : "Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => {
              if (showSavedAccounts) {
                toggleForm(false);
                setShowSavedAccounts(false);
              } else {
                toggleForm(!isLogin);
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

      {/* University Picker Modal */}
      <Modal
        visible={showUniversityPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUniversityPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your University</Text>
              <TouchableOpacity
                onPress={() => setShowUniversityPicker(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={universities}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.universityItem,
                    selectedUniversity?.id === item.id &&
                      styles.universityItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedUniversity(item);
                    setShowUniversityPicker(false);
                    setErrors((prev) => ({ ...prev, university: "" }));
                  }}
                >
                  <Text
                    style={[
                      styles.universityItemText,
                      selectedUniversity?.id === item.id &&
                        styles.universityItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedUniversity?.id === item.id && (
                    <CheckCircle size={20} color={themeColors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>
                    No universities available. Please contact support.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

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
