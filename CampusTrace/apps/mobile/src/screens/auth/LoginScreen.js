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
  ActivityIndicator,
  Linking,
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
} from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";
import LoadingScreen from "../../components/LoadingScreen";

const LoginScreen = ({ navigation }) => {
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
  const [showSavedAccounts, setShowSavedAccounts] = useState(false);

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
        setShowSavedAccounts(accounts.length > 0 && isLogin);
      }
    } catch (error) {
      console.log("Error loading saved accounts:", error);
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

  const saveAccount = async (email, fullName) => {
    try {
      const saved = await AsyncStorage.getItem("campustrace_saved_accounts");
      let accounts = saved ? JSON.parse(saved) : [];

      // Remove existing account with same email
      accounts = accounts.filter((acc) => acc.email !== email);

      // Add new account at the beginning
      accounts.unshift({
        email,
        fullName: fullName || email.split("@")[0],
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
        setShowSavedAccounts(accounts.length > 0);
      }
    } catch (error) {
      console.log("Error removing account:", error);
    }
  };

  const selectAccount = (account) => {
    setEmail(account.email);
    setShowSavedAccounts(false);
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

        await saveEmail(email);
        await saveAccount(email, result.data?.user?.user_metadata?.full_name);
        Alert.alert("Success", "Logged in successfully!");
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
    Alert.alert(
      "Reset Password",
      "Please visit the web app to reset your password.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Web App",
          onPress: () =>
            Linking.openURL("https://campustrace.com/forgot-password"),
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

  if (initialLoading) {
    return <LoadingScreen />;
  }

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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>CT</Text>
          </View>
          <Text style={styles.appName}>CampusTrace</Text>
          <Text style={styles.tagline}>
            {isLogin ? "Welcome back" : "Create your account"}
          </Text>
        </View>

        {/* Saved Accounts */}
        {showSavedAccounts && savedAccounts.length > 0 && (
          <View style={styles.savedAccountsContainer}>
            {savedAccounts.map((account, index) => (
              <TouchableOpacity
                key={index}
                style={styles.savedAccountItem}
                onPress={() => selectAccount(account)}
              >
                <View style={styles.accountLeft}>
                  <View style={styles.accountAvatar}>
                    <Text style={styles.accountAvatarText}>
                      {account.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{account.fullName}</Text>
                    <Text style={styles.accountEmail}>{account.email}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => removeAccount(account.email)}
                  style={styles.removeButton}
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
        )}

        {/* Form Container */}
        {(!showSavedAccounts || !isLogin) && (
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
                  <User size={20} color="#8E8E93" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#8E8E93"
                    value={fullName}
                    onChangeText={(value) => handleInput("fullName", value)}
                    autoCapitalize="words"
                  />
                </View>
                {errors.fullName && touched.fullName && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={14} color="#EF4444" />
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
                <Mail size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#8E8E93"
                  value={email}
                  onChangeText={(value) => handleInput("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && touched.email && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={14} color="#EF4444" />
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
                <Lock size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#8E8E93"
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
                    <EyeOff size={20} color="#8E8E93" />
                  ) : (
                    <Eye size={20} color="#8E8E93" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && touched.password && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={14} color="#EF4444" />
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
                  <Lock size={20} color="#8E8E93" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#8E8E93"
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
                      <EyeOff size={20} color="#8E8E93" />
                    ) : (
                      <Eye size={20} color="#8E8E93" />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && touched.confirmPassword && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={14} color="#EF4444" />
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
                  />
                  <PasswordRequirement
                    met={passwordStrength.hasUpperCase}
                    text="One uppercase letter"
                  />
                  <PasswordRequirement
                    met={passwordStrength.hasLowerCase}
                    text="One lowercase letter"
                  />
                  <PasswordRequirement
                    met={passwordStrength.hasNumber}
                    text="One number"
                  />
                  <PasswordRequirement
                    met={passwordStrength.hasSpecialChar}
                    text="One special character"
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
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Login/Sign Up Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? "Log In" : "Sign Up"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Divider */}
        {(!showSavedAccounts || !isLogin) && (
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
          </View>
        )}

        {/* Switch Mode */}
        {(!showSavedAccounts || !isLogin) && (
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setErrors({});
              setTouched({});
            }}
          >
            <Text style={styles.switchButtonText}>
              {isLogin ? "Create new account" : "Already have an account?"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Register with University ID */}
        {!isLogin && (
          <TouchableOpacity
            style={styles.universityIdButton}
            onPress={() => {
              Alert.alert(
                "Register with University ID",
                "For faster verification, register using your university ID on the web app.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Open Web App",
                    onPress: () =>
                      Linking.openURL("https://campustrace.com/register"),
                  },
                ]
              );
            }}
          >
            <Text style={styles.universityIdText}>
              Register with your University ID instead
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const PasswordRequirement = ({ met, text }) => (
  <View style={styles.requirement}>
    {met ? (
      <CheckCircle size={14} color="#10B981" />
    ) : (
      <View style={styles.unmetCircle} />
    )}
    <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1877F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1C1E21",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 15,
    color: "#606770",
  },
  savedAccountsContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  savedAccountItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  accountLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1877F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  accountAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1E21",
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 13,
    color: "#606770",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    fontSize: 24,
    color: "#606770",
    lineHeight: 24,
  },
  useAnotherAccount: {
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#DFE0E4",
    marginTop: 4,
  },
  useAnotherAccountText: {
    fontSize: 15,
    color: "#1877F2",
    fontWeight: "600",
  },
  formContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F6F7",
    borderWidth: 1,
    borderColor: "#DFE0E4",
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 50,
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1C1E21",
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
    fontSize: 13,
    color: "#EF4444",
    marginLeft: 4,
  },
  passwordStrength: {
    backgroundColor: "#F5F6F7",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 13,
    color: "#606770",
    fontWeight: "600",
  },
  strengthText: {
    fontSize: 13,
    fontWeight: "600",
  },
  requirements: {
    gap: 6,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unmetCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#DFE0E4",
  },
  requirementText: {
    fontSize: 12,
    color: "#8A8D91",
  },
  requirementTextMet: {
    color: "#10B981",
  },
  forgotPassword: {
    alignSelf: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#1877F2",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#1877F2",
    borderRadius: 6,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    marginVertical: 20,
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#DFE0E4",
  },
  switchButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1877F2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  switchButtonText: {
    fontSize: 15,
    color: "#1877F2",
    fontWeight: "600",
  },
  universityIdButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  universityIdText: {
    fontSize: 14,
    color: "#606770",
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
