import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../api/apiClient.js";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  LogIn,
  Loader2,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  UserPlus,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { motion, AnimatePresence } from "framer-motion";

import { API_BASE_URL } from "../../api/apiClient.js";

// Password requirement component
const PasswordRequirement = ({ met, text }) => (
  <div className="flex items-center text-xs">
    {met ? (
      <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 flex-shrink-0" />
    ) : (
      <XCircle className="h-3 w-3 text-neutral-400 dark:text-zinc-600 mr-1.5 flex-shrink-0" />
    )}
    <span
      className={
        met
          ? "text-green-600 dark:text-green-400"
          : "text-neutral-500 dark:text-zinc-500"
      }
    >
      {text}
    </span>
  </div>
);

const InputField = ({
  icon: Icon,
  error,
  touched,
  isPassword,
  showPassword,
  togglePassword,
  label,
  ...props
}) => (
  <div className="space-y-2">
    {label && (
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
    )}
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
        <Icon
          className={`h-4 w-4 transition-colors ${
            error && touched
              ? "text-red-500"
              : "text-neutral-400 dark:text-neutral-500"
          }`}
        />
      </div>
      <input
        {...props}
        type={isPassword ? (showPassword ? "text" : "password") : props.type}
        className={`block w-full rounded-lg py-2.5 pl-10 ${
          isPassword ? "pr-10" : "pr-3"
        } bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border ${
          error && touched
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            : "border-neutral-200 dark:border-neutral-800 focus:border-primary-500 dark:focus:border-primary-500"
        } placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:focus:ring-primary-500/20 transition-all duration-200`}
      />
      {isPassword && (
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
    <AnimatePresence>
      {error && touched && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-sm text-red-500 flex items-center gap-1.5"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const FeatureItem = ({ icon: Icon, title, description }) => (
  <div className="flex gap-3">
    <div className="flex-shrink-0">
      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>
    </div>
    <div>
      <h3 className="font-medium text-neutral-900 dark:text-white">{title}</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
        {description}
      </p>
    </div>
  </div>
);

export default function LoginPage() {
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
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Rate limiting states
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime(cooldownTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (cooldownTime === 0 && loginAttempts >= 5) {
      setLoginAttempts(0);
      setLastAttemptTime(null);
    }
  }, [cooldownTime, loginAttempts]);

  useEffect(() => {
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
    if (location.state?.unverified) {
      toast.error(
        "Your account has not been approved by an administrator yet. Please try again later.",
        {
          duration: 5000,
          position: "top-center",
        }
      );
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          // User signed out
        }
      }
    );
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  const handleInput = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const getPasswordStrengthColor = () => {
    const score = Object.values(passwordStrength).filter(Boolean).length;
    if (score <= 2) return "text-red-500";
    if (score <= 3) return "text-yellow-500";
    return "text-green-500";
  };

  const getPasswordStrengthText = () => {
    const score = Object.values(passwordStrength).filter(Boolean).length;
    if (score <= 2) return "Weak";
    if (score <= 3) return "Medium";
    return "Strong";
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!isLogin) {
      if (!formData.fullName) {
        newErrors.fullName = "Full name is required";
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (confirmPassword !== formData.password) {
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

  const resetCaptcha = () => {
    recaptchaRef.current?.reset();
    setCaptchaToken(null);
  };

  const checkRateLimit = () => {
    const now = Date.now();

    if (lastAttemptTime && now - lastAttemptTime > 15 * 60 * 1000) {
      setLoginAttempts(0);
      setLastAttemptTime(null);
      return true;
    }

    if (cooldownTime > 0) {
      toast.error(`Too many attempts. Please wait ${cooldownTime} seconds.`, {
        duration: 3000,
        position: "top-center",
        icon: <Clock className="w-5 h-5" />,
      });
      return false;
    }

    if (loginAttempts >= 5) {
      setCooldownTime(60);
      toast.error("Too many login attempts. Please wait 60 seconds.", {
        duration: 5000,
        position: "top-center",
        icon: <Clock className="w-5 h-5" />,
      });
      return false;
    }

    return true;
  };

  const parseSignupError = (detail = "") => {
    const lower = detail.toLowerCase();

    const errorMappings = [
      {
        check: (s) =>
          s.includes("already") &&
          (s.includes("exists") || s.includes("registered")),
        message:
          "An account with this email already exists. Please sign in instead.",
      },
      {
        check: (s) => s.includes("domain") && s.includes("not"),
        message: "This email domain is not registered with CampusTrace",
      },
      {
        check: (s) => s.includes("weak") && s.includes("password"),
        message: "Password is too weak. Please use at least 6 characters.",
      },
      {
        check: (s) => s.includes("invalid") && s.includes("email"),
        message: "Please enter a valid email address.",
      },
      {
        check: (s) => s.includes("check") && s.includes("inbox"),
        message: "Please check your email for a confirmation link",
      },
    ];

    const mapping = errorMappings.find((m) => m.check(lower));
    return mapping
      ? mapping.message
      : detail || "Sign up failed. Please try again.";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!validate()) {
      return;
    }

    if (!checkRateLimit()) {
      return;
    }

    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA verification", {
        duration: 4000,
        position: "top-center",
      });
      return;
    }

    setLoading(true);
    const currentAttempt = loginAttempts + 1;
    setLoginAttempts(currentAttempt);
    setLastAttemptTime(Date.now());

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (authError) {
        const msg = authError.message || "";

        if (msg.includes("Email not confirmed")) {
          throw new Error("Please confirm your email address first");
        }

        if (msg.includes("Invalid login credentials")) {
          if (currentAttempt >= 5) {
            setCooldownTime(60);
          }

          throw new Error("Invalid email or password");
        }

        throw authError;
      }

      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("is_verified, is_banned")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          await supabase.auth.signOut();
          throw new Error(
            "Could not verify account status. Please try again later."
          );
        }

        if (profileData?.is_banned) {
          await supabase.auth.signOut();
          throw new Error("Your account has been suspended.");
        }

        if (profileData && profileData.is_verified === false) {
          await supabase.auth.signOut();
          throw new Error(
            "Your account is awaiting administrator approval. Please check back later."
          );
        }

        setLoginAttempts(0);
        setLastAttemptTime(null);
        setCooldownTime(0);

        toast.success("Welcome back!", {
          duration: 3000,
          position: "top-center",
        });
      } else {
        throw new Error("Authentication failed unexpectedly.");
      }
    } catch (err) {
      if (currentAttempt >= 5) {
        setCooldownTime(60);
      }

      toast.error(err.message || "Sign in failed", {
        duration: 5000,
        position: "top-center",
      });
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setTouched({
      email: true,
      password: true,
      fullName: true,
      confirmPassword: true,
    });

    if (!validate()) {
      return;
    }

    const score = Object.values(passwordStrength).filter(Boolean).length;
    if (score < 3) {
      toast.error(
        "Please create a stronger password that meets at least 3 requirements",
        {
          duration: 5000,
          position: "top-center",
        }
      );
      return;
    }

    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA verification", {
        duration: 4000,
        position: "top-center",
      });
      return;
    }

    // Check if email domain is registered
    const emailDomain = formData.email.split("@")[1];
    if (!emailDomain) {
      toast.error("Please enter a valid email address", {
        duration: 5000,
        position: "top-center",
      });
      return;
    }

    setLoading(true);

    // First, check if the domain is registered
    try {
      const { data: domainData, error: domainError } = await supabase
        .from("allowed_domains")
        .select("university_id")
        .eq("domain_name", emailDomain)
        .single();

      if (domainError || !domainData) {
        toast.error(
          `The email domain "${emailDomain}" is not registered with CampusTrace. Please contact your university administrator or register your university.`,
          {
            duration: 7000,
            position: "top-center",
          }
        );
        setLoading(false);
        resetCaptcha();
        return;
      }
    } catch (err) {
      toast.error(
        `The email domain "${emailDomain}" is not registered with CampusTrace. Please use a registered university email.`,
        {
          duration: 7000,
          position: "top-center",
        }
      );
      setLoading(false);
      resetCaptcha();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          password: formData.password,
          captchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = parseSignupError(data.detail || data.message);

        toast.error(errorMessage, {
          duration: 6000,
          position: "top-center",
        });

        throw new Error(errorMessage);
      }

      toast.success(
        data.message || "Account created! Check your email to confirm",
        {
          duration: 5000,
          position: "top-center",
        }
      );

      setIsLogin(true);
      setFormData({ fullName: "", email: "", password: "" });
      setConfirmPassword("");
      setErrors({});
      setTouched({});
      resetCaptcha();
    } catch (err) {
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
            padding: "16px",
            borderRadius: "8px",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex">
        {/* Left Panel (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-neutral-900 dark:to-neutral-950 p-12 flex-col justify-between">
          <div>
            <Link
              to="/"
              className="flex items-center gap-3 mb-12 w-fit hover:opacity-80 transition-opacity"
            >
              <img
                src="/Logo.svg"
                alt="CampusTrace logo"
                className="h-10 w-10"
              />
              <span className="text-xl font-bold text-neutral-900 dark:text-white">
                CampusTrace
              </span>
            </Link>
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
                  Find what's lost,
                  <span className="text-primary-600 dark:text-primary-400">
                    {" "}
                    return what's found
                  </span>
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Join your university's lost and found community
                </p>
              </div>
              <div className="space-y-6">
                <FeatureItem
                  icon={ShieldCheck}
                  title="University Verified"
                  description="Secure access limited to verified university email addresses"
                />
                <FeatureItem
                  icon={Sparkles}
                  title="AI-Powered Matching"
                  description="Smart image recognition helps match lost and found items"
                />
                <FeatureItem
                  icon={CheckCircle}
                  title="Trusted Community"
                  description="Connect with fellow students and staff on your campus"
                />
              </div>
            </div>
          </div>
          <div className="mt-12">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              © {new Date().getFullYear()} CampusTrace. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Panel (Login/Signup Form) */}
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            className="w-full max-w-sm lg:max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <Link
                to="/"
                className="inline-flex flex-col items-center hover:opacity-80 transition-opacity"
              >
                <img
                  src="/Logo.svg"
                  alt="CampusTrace logo"
                  className="mx-auto h-12 w-12 mb-4"
                />
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  CampusTrace
                </h1>
              </Link>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {isLogin ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                  {isLogin
                    ? "Enter your credentials to access your account"
                    : "Sign up with your university email or ID"}
                </p>
              </div>

              {/* Rate limit warning */}
              {cooldownTime > 0 && (
                <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center text-sm text-amber-800 dark:text-amber-200">
                    <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>
                      Too many attempts. Please wait {cooldownTime} seconds
                      before trying again.
                    </span>
                  </div>
                </div>
              )}

              {/* Sign In / Sign Up Toggle */}
              <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 mb-8">
                <button
                  className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                    isLogin
                      ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  }`}
                  onClick={() => {
                    console.log("🔄 [UI] Switching to Sign In mode");
                    setIsLogin(true);
                    setTouched({});
                    setErrors({});
                    resetCaptcha();
                  }}
                >
                  Sign In
                </button>
                <button
                  className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                    !isLogin
                      ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  }`}
                  onClick={() => {
                    console.log("🔄 [UI] Switching to Sign Up mode");
                    setIsLogin(false);
                    setTouched({});
                    setErrors({});
                    resetCaptcha();
                  }}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={isLogin ? handleLogin : handleSignup}
                className="space-y-5"
                noValidate
              >
                {/* Full Name Field (Sign Up Only) */}
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      key="fullname"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <InputField
                        icon={User}
                        label="Full Name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) =>
                          handleInput("fullName", e.target.value)
                        }
                        error={errors.fullName}
                        touched={touched.fullName}
                        aria-required="true"
                        aria-invalid={!!errors.fullName && touched.fullName}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Field */}
                <InputField
                  icon={Mail}
                  label="Email Address"
                  type="email"
                  placeholder={
                    isLogin ? "Enter your email" : "you@university.edu"
                  }
                  value={formData.email}
                  onChange={(e) => handleInput("email", e.target.value)}
                  error={errors.email}
                  touched={touched.email}
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={!!errors.email && touched.email}
                />

                {/* Password Field */}
                <div>
                  <InputField
                    icon={Lock}
                    label="Password"
                    isPassword
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInput("password", e.target.value)}
                    error={errors.password}
                    touched={touched.password}
                    showPassword={showPassword}
                    togglePassword={() => setShowPassword((prev) => !prev)}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    aria-required="true"
                    aria-invalid={!!errors.password && touched.password}
                  />

                  {/* Password Strength Indicator (Sign Up Only) */}
                  {!isLogin && formData.password && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-600 dark:text-zinc-400">
                          Password strength:
                        </span>
                        <span
                          className={`text-xs font-medium ${getPasswordStrengthColor()}`}
                        >
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="space-y-1">
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
                      </div>
                      {Object.values(passwordStrength).filter(Boolean).length <
                        3 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                          Please meet at least 3 requirements for a secure
                          password
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm Password Field (Sign Up Only) */}
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div>
                        <InputField
                          icon={Lock}
                          label="Confirm Password"
                          isPassword
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          error={errors.confirmPassword}
                          touched={touched.confirmPassword}
                          showPassword={showConfirm}
                          togglePassword={() => setShowConfirm((prev) => !prev)}
                          autoComplete="new-password"
                          aria-required="true"
                          aria-invalid={
                            !!errors.confirmPassword && touched.confirmPassword
                          }
                        />
                        {/* Password Match Indicator */}
                        {confirmPassword && !errors.confirmPassword && (
                          <div className="mt-2 flex items-center">
                            {formData.password === confirmPassword ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  Passwords match
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-red-500 mr-1.5" />
                                <span className="text-xs text-red-600 dark:text-red-400">
                                  Passwords do not match
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Remember Me / Forgot Password (Login Only) */}
                {isLogin && (
                  <div className="flex justify-between items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
                        Remember me
                      </span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                {/* reCAPTCHA */}
                <div className="flex justify-center py-4">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={setCaptchaToken}
                    theme={
                      window.matchMedia("(prefers-color-scheme: dark)").matches
                        ? "dark"
                        : "light"
                    }
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !captchaToken || cooldownTime > 0}
                  className="w-full rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400
                                   text-white py-3 font-semibold flex items-center justify-center gap-2
                                   disabled:cursor-not-allowed transition-all duration-200
                                   shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30
                                   transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>
                        {isLogin ? "Signing in..." : "Creating account..."}
                      </span>
                    </>
                  ) : cooldownTime > 0 ? (
                    <>
                      <Clock className="w-5 h-5" />
                      <span>Wait {cooldownTime}s</span>
                    </>
                  ) : (
                    <>
                      {isLogin ? (
                        <>
                          <span>Sign In</span>
                          <ChevronRight className="w-5 h-5" />
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          <span>Create Account</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </form>

              {/* "or" Separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-neutral-900 text-neutral-500">
                    or
                  </span>
                </div>
              </div>

              {/* Manual Registration Link (Sign Up Only) */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="text-center">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                        Don't have a university email?
                      </p>
                      <Link
                        to="/manual-verification"
                        className="w-full inline-flex justify-center py-2.5 px-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-sm rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      >
                        Register with your University ID instead
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toggle between Sign In / Sign Up */}
              <div className="text-center mt-6">
                <button
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700
                                   dark:hover:text-primary-300 font-medium text-sm inline-flex items-center gap-1
                                   group"
                  onClick={() => {
                    const newMode = !isLogin;
                    console.log(
                      `🔄 [UI] Toggling to ${
                        newMode ? "Sign Up" : "Sign In"
                      } mode`
                    );
                    setIsLogin(newMode);
                    setErrors({});
                    setTouched({});
                    resetCaptcha();
                  }}
                >
                  <span>
                    {isLogin
                      ? "Create an account"
                      : "Already have an account? Sign in"}
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
