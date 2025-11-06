import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  Pressable,
  Vibration,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  User,
  Clock,
  ShieldCheck,
  Sparkles,
  XCircle,
  ChevronRight,
  ArrowLeft,
  Fingerprint,
  Key,
} from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";

const { width, height } = Dimensions.get("window");

// Mobile-optimized Password Requirement Component
const PasswordRequirement = ({ met, text }) => (
  <Animated.View style={[styles.passwordReq, { opacity: met ? 1 : 0.5 }]}>
    <View style={[styles.checkCircle, met && styles.checkCircleMet]}>
      {met && <CheckCircle size={10} color="#FFFFFF" />}
    </View>
    <Text style={[styles.passwordReqText, met && styles.passwordReqMet]}>
      {text}
    </Text>
  </Animated.View>
);

// Mobile Card Component
const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// Floating Label Input Component
const FloatingLabelInput = ({
  icon: Icon,
  label,
  value,
  onChangeText,
  onFocus,
  onBlur,
  error,
  touched,
  isPassword,
  showPassword,
  togglePassword,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedLabel = useRef(new Animated.Value(value ? 1 : 0)).current;
  const animatedError = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedLabel, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  useEffect(() => {
    if (error && touched) {
      Animated.sequence([
        Animated.timing(animatedError, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      if (Platform.OS === "ios") {
        Vibration.vibrate();
      }
    } else {
      Animated.timing(animatedError, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [error, touched]);

  const labelStyle = {
    position: "absolute",
    left: 44,
    top: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [22, 8],
    }),
    fontSize: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: ["#94A3B8", "#64748B"],
    }),
  };

  return (
    <View style={styles.floatingInputContainer}>
      <View
        style={[
          styles.floatingInputWrapper,
          isFocused && styles.floatingInputFocused,
          error && touched && styles.floatingInputError,
        ]}
      >
        <Icon
          size={22}
          color={
            error && touched ? "#EF4444" : isFocused ? "#6366F1" : "#CBD5E1"
          }
          style={styles.floatingInputIcon}
        />
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
        <TextInput
          style={[
            styles.floatingInput,
            (isFocused || value) && styles.floatingInputActive,
            isPassword && styles.floatingInputPassword,
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={togglePassword}
            style={styles.passwordToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={20} color="#CBD5E1" />
            ) : (
              <Eye size={20} color="#CBD5E1" />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && touched && (
        <Animated.View
          style={[
            styles.errorMessage,
            {
              opacity: animatedError,
              transform: [
                {
                  translateY: animatedError.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <AlertCircle size={14} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}
    </View>
  );
};

export default function LoginScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Rate limiting
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height * 0.3)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const formSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 12,
        stiffness: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Mode switch animation
    Animated.parallel([
      Animated.spring(formSlide, {
        toValue: isLogin ? 0 : 1,
        damping: 20,
        stiffness: 90,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: isLogin ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isLogin]);

  useEffect(() => {
    // Update password strength
    if (!isLogin) {
      const strength = {
        hasMinLength: formData.password.length >= 6,
        hasUpperCase: /[A-Z]/.test(formData.password),
        hasLowerCase: /[a-z]/.test(formData.password),
        hasNumber: /\d/.test(formData.password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
      };
      setPasswordStrength(strength);
    }
  }, [formData.password, isLogin]);

  useEffect(() => {
    // Cooldown timer
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime(cooldownTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  const handleInput = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        damping: 10,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Minimum 6 characters";
    }

    if (!isLogin) {
      if (!formData.fullName) {
        newErrors.fullName = "Name is required";
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm password";
      } else if (confirmPassword !== formData.password) {
        newErrors.confirmPassword = "Passwords don't match";
      }

      const score = Object.values(passwordStrength).filter(Boolean).length;
      if (score < 3) {
        newErrors.password = "Password too weak";
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

  const handleLogin = async () => {
    animateButtonPress();
    if (!validate()) return;

    if (cooldownTime > 0) {
      Alert.alert("Too Many Attempts", `Please wait ${cooldownTime} seconds`, [
        { text: "OK" },
      ]);
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Service unavailable");
      }

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        });

      if (authError) throw authError;

      if (authData.user) {
        // Check profile status
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("is_verified, is_banned")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          await supabase.auth.signOut();
          throw new Error("Profile verification failed");
        }

        if (profileData?.is_banned) {
          await supabase.auth.signOut();
          throw new Error("Account suspended");
        }

        if (profileData && profileData.is_verified === false) {
          await supabase.auth.signOut();
          throw new Error("Awaiting verification");
        }

        // Success animation and navigation
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          damping: 10,
          useNativeDriver: true,
        }).start(() => {
          navigation.replace("MainApp");
        });
      }
    } catch (error) {
      setLoginAttempts((prev) => prev + 1);

      if (loginAttempts >= 4) {
        setCooldownTime(60);
        setLoginAttempts(0);
      }

      Alert.alert(
        "Login Failed",
        error.message || "Please check your credentials",
        [{ text: "Try Again" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    animateButtonPress();

    setTouched({
      email: true,
      password: true,
      fullName: true,
      confirmPassword: true,
    });

    if (!validate()) return;

    const score = Object.values(passwordStrength).filter(Boolean).length;
    if (score < 3) {
      Alert.alert(
        "Weak Password",
        "Please meet at least 3 password requirements",
        [{ text: "OK" }]
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Service unavailable");
      }

      // Check domain
      const emailDomain = formData.email.split("@")[1];
      const { data: domainData, error: domainError } = await supabase
        .from("allowed_domains")
        .select("university_id")
        .eq("domain_name", emailDomain)
        .single();

      if (domainError || !domainData) {
        Alert.alert(
          "University Not Registered",
          `The domain "${emailDomain}" is not registered with CampusTrace.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Use University ID",
              onPress: () => navigation.navigate("ManualVerification"),
            },
          ]
        );
        setLoading(false);
        return;
      }

      // Create account
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
          },
        },
      });

      if (error) throw error;

      Alert.alert("Success! 🎉", "Check your email to verify your account", [
        {
          text: "OK",
          onPress: () =>
            navigation.navigate("VerifyEmail", { email: formData.email }),
        },
      ]);

      // Reset form
      setFormData({ fullName: "", email: "", password: "" });
      setConfirmPassword("");
      setErrors({});
      setTouched({});
    } catch (error) {
      Alert.alert("Sign Up Failed", error.message || "Please try again", [
        { text: "OK" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    if (Platform.OS === "ios") {
      Vibration.vibrate();
    }
    setIsLogin(!isLogin);
    setErrors({});
    setTouched({});
  };

  const getPasswordStrengthScore = () => {
    return Object.values(passwordStrength).filter(Boolean).length;
  };

  const getStrengthColor = () => {
    const score = getPasswordStrengthScore();
    if (score <= 2) return "#EF4444";
    if (score <= 3) return "#F59E0B";
    return "#10B981";
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#6366F1", "#8B5CF6", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Animated.View
                style={[
                  styles.content,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { translateY: slideAnim },
                      { scale: scaleAnim },
                    ],
                  },
                ]}
              >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                  <Animated.View
                    style={[
                      styles.logoContainer,
                      {
                        transform: [
                          {
                            rotate: rotateAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.logoCircle}>
                      <Text style={styles.logoEmoji}>📍</Text>
                    </View>
                  </Animated.View>

                  <Text style={styles.appTitle}>CampusTrace</Text>
                  <Text style={styles.appSubtitle}>
                    Your university's smart lost & found
                  </Text>
                </View>

                {/* Main Card */}
                <Animated.View
                  style={[
                    {
                      transform: [
                        {
                          translateX: formSlide.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Card>
                    {/* Tab Switcher */}
                    <View style={styles.tabContainer}>
                      <Pressable
                        onPress={() => setIsLogin(true)}
                        style={({ pressed }) => [
                          styles.tab,
                          isLogin && styles.tabActive,
                          pressed && styles.tabPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tabText,
                            isLogin && styles.tabTextActive,
                          ]}
                        >
                          Sign In
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setIsLogin(false)}
                        style={({ pressed }) => [
                          styles.tab,
                          !isLogin && styles.tabActive,
                          pressed && styles.tabPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tabText,
                            !isLogin && styles.tabTextActive,
                          ]}
                        >
                          Sign Up
                        </Text>
                      </Pressable>
                    </View>

                    {/* Welcome Text */}
                    <View style={styles.welcomeContainer}>
                      <Text style={styles.welcomeTitle}>
                        {isLogin ? "Welcome back! 👋" : "Join us today! 🚀"}
                      </Text>
                      <Text style={styles.welcomeSubtitle}>
                        {isLogin
                          ? "Sign in to continue to your account"
                          : "Create your account in seconds"}
                      </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                      {!isLogin && (
                        <FloatingLabelInput
                          icon={User}
                          label="Full Name"
                          value={formData.fullName}
                          onChangeText={(text) => handleInput("fullName", text)}
                          error={errors.fullName}
                          touched={touched.fullName}
                          autoCapitalize="words"
                          autoCorrect={false}
                        />
                      )}

                      <FloatingLabelInput
                        icon={Mail}
                        label="University Email"
                        value={formData.email}
                        onChangeText={(text) => handleInput("email", text)}
                        error={errors.email}
                        touched={touched.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoCompleteType="email"
                      />

                      <FloatingLabelInput
                        icon={Lock}
                        label="Password"
                        value={formData.password}
                        onChangeText={(text) => handleInput("password", text)}
                        error={errors.password}
                        touched={touched.password}
                        isPassword
                        showPassword={showPassword}
                        togglePassword={() => setShowPassword(!showPassword)}
                      />

                      {/* Password Strength (Sign Up) */}
                      {!isLogin && formData.password && (
                        <View style={styles.strengthContainer}>
                          <View style={styles.strengthHeader}>
                            <Text style={styles.strengthLabel}>
                              Password Strength
                            </Text>
                            <View
                              style={[
                                styles.strengthBadge,
                                { backgroundColor: getStrengthColor() },
                              ]}
                            >
                              <Text style={styles.strengthBadgeText}>
                                {getPasswordStrengthScore()}/5
                              </Text>
                            </View>
                          </View>

                          <View style={styles.strengthBars}>
                            {[...Array(5)].map((_, i) => (
                              <View
                                key={i}
                                style={[
                                  styles.strengthBar,
                                  i < getPasswordStrengthScore() && {
                                    backgroundColor: getStrengthColor(),
                                  },
                                ]}
                              />
                            ))}
                          </View>

                          <View style={styles.requirementsGrid}>
                            <PasswordRequirement
                              met={passwordStrength.hasMinLength}
                              text="6+ chars"
                            />
                            <PasswordRequirement
                              met={passwordStrength.hasUpperCase}
                              text="Uppercase"
                            />
                            <PasswordRequirement
                              met={passwordStrength.hasLowerCase}
                              text="Lowercase"
                            />
                            <PasswordRequirement
                              met={passwordStrength.hasNumber}
                              text="Number"
                            />
                            <PasswordRequirement
                              met={passwordStrength.hasSpecialChar}
                              text="Special"
                            />
                          </View>
                        </View>
                      )}

                      {/* Confirm Password (Sign Up) */}
                      {!isLogin && (
                        <FloatingLabelInput
                          icon={ShieldCheck}
                          label="Confirm Password"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          error={errors.confirmPassword}
                          touched={touched.confirmPassword}
                          isPassword
                          showPassword={showConfirm}
                          togglePassword={() => setShowConfirm(!showConfirm)}
                        />
                      )}

                      {/* Forgot Password (Sign In) */}
                      {isLogin && (
                        <TouchableOpacity
                          onPress={() => navigation.navigate("ForgotPassword")}
                          style={styles.forgotButton}
                        >
                          <Text style={styles.forgotText}>
                            Forgot password?
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Submit Button */}
                      <Animated.View
                        style={{ transform: [{ scale: buttonScale }] }}
                      >
                        <TouchableOpacity
                          onPress={isLogin ? handleLogin : handleSignup}
                          disabled={loading || cooldownTime > 0}
                          style={[
                            styles.submitButton,
                            (loading || cooldownTime > 0) &&
                              styles.submitButtonDisabled,
                          ]}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={
                              loading || cooldownTime > 0
                                ? ["#CBD5E1", "#CBD5E1"]
                                : ["#6366F1", "#8B5CF6"]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitButtonGradient}
                          >
                            {loading ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : cooldownTime > 0 ? (
                              <>
                                <Clock size={20} color="#FFFFFF" />
                                <Text style={styles.submitButtonText}>
                                  Wait {cooldownTime}s
                                </Text>
                              </>
                            ) : (
                              <>
                                <Text style={styles.submitButtonText}>
                                  {isLogin ? "Sign In" : "Create Account"}
                                </Text>
                                <ChevronRight size={20} color="#FFFFFF" />
                              </>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>

                      {/* Biometric Login (Sign In) */}
                      {isLogin && Platform.OS === "ios" && (
                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert(
                              "Biometric Login",
                              "Use Face ID or Touch ID to sign in?",
                              [
                                { text: "Cancel", style: "cancel" },
                                { text: "Use Biometrics", onPress: () => {} },
                              ]
                            );
                          }}
                          style={styles.biometricButton}
                        >
                          <Fingerprint size={24} color="#6366F1" />
                          <Text style={styles.biometricText}>
                            Use Face ID / Touch ID
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Alternative Options */}
                      <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                      </View>

                      {isLogin ? (
                        <TouchableOpacity
                          onPress={() => navigation.navigate("MagicLink")}
                          style={styles.altButton}
                        >
                          <Key size={18} color="#6366F1" />
                          <Text style={styles.altButtonText}>
                            Send Magic Link
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("ManualVerification")
                          }
                          style={styles.altButton}
                        >
                          <ShieldCheck size={18} color="#6366F1" />
                          <Text style={styles.altButtonText}>
                            Verify with Student ID
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Card>
                </Animated.View>

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    {isLogin
                      ? "Don't have an account?"
                      : "Already have an account?"}
                  </Text>
                  <TouchableOpacity onPress={switchMode}>
                    <Text style={styles.footerLink}>
                      {isLogin ? "Sign Up" : "Sign In"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94A3B8",
  },
  tabTextActive: {
    color: "#6366F1",
  },
  welcomeContainer: {
    marginBottom: 28,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "400",
  },
  form: {
    gap: 18,
  },
  floatingInputContainer: {
    marginBottom: 4,
  },
  floatingInputWrapper: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 64,
  },
  floatingInputFocused: {
    borderColor: "#6366F1",
    backgroundColor: "#FFFFFF",
  },
  floatingInputError: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  floatingInputIcon: {
    position: "absolute",
    left: 16,
    top: 20,
  },
  floatingInput: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
    paddingLeft: 28,
    paddingTop: 12,
  },
  floatingInputActive: {
    paddingTop: 20,
  },
  floatingInputPassword: {
    paddingRight: 44,
  },
  passwordToggle: {
    position: "absolute",
    right: 16,
    top: 20,
    padding: 4,
  },
  errorMessage: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingLeft: 4,
    gap: 6,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "500",
  },
  strengthContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  strengthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  strengthBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
  },
  requirementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  passwordReq: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 2,
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleMet: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  passwordReqText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  passwordReqMet: {
    color: "#10B981",
  },
  forgotButton: {
    alignSelf: "flex-end",
    paddingVertical: 4,
  },
  forgotText: {
    color: "#6366F1",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    shadowOpacity: 0.1,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    marginTop: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  biometricText: {
    color: "#6366F1",
    fontSize: 15,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    paddingHorizontal: 12,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  altButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#6366F1",
  },
  altButtonText: {
    color: "#6366F1",
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 32,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 15,
    fontWeight: "500",
  },
  footerLink: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
