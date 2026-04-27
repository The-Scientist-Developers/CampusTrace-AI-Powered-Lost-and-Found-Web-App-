import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../api/apiClient.js";
import { toast, Toaster } from "react-hot-toast";
import { Helmet } from "react-helmet";
import logo from "../../Images/Logo.svg";
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
      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
        {label}
      </label>
    )}
    <div className="relative">
      <input
        {...props}
        type={isPassword ? (showPassword ? "text" : "password") : props.type}
        className={`block w-full rounded-sm py-2 px-3 text-sm ${
          isPassword ? "pr-10" : ""
        } bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white border ${
          error && touched
            ? "border-red-500 focus:border-red-500"
            : "border-neutral-300 dark:border-neutral-700 focus:border-neutral-400 dark:focus:border-neutral-600"
        } placeholder:text-neutral-500 dark:placeholder:text-neutral-500 focus:outline-none transition-colors duration-150`}
      />
      {isPassword && (
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 transition-colors"
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
          className="text-xs text-red-500 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const FeatureItem = ({ icon: Icon, title, description }) => (
  <div className="flex gap-3">
    <div className="flex-shrink-0">
      <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
        <Icon className="w-6 h-6 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
      </div>
    </div>
    <div>
      <h3 className="font-medium text-base sm:text-base text-neutral-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
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

  // Email suggestions state
  const [savedEmails, setSavedEmails] = useState([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [filteredEmails, setFilteredEmails] = useState([]);

  // University selection state
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);

  // Load saved emails and universities from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("campustrace_saved_emails");
    if (saved) {
      try {
        const emails = JSON.parse(saved);
        setSavedEmails(emails);
      } catch (error) {
        console.error("Error loading saved emails:", error);
      }
    }

    // Fetch universities
    const fetchUniversities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/public/universities`);
        const data = await response.json();
        if (response.ok && data.universities) {
          setUniversities(data.universities);
          // Auto-select if only one university
          if (data.universities.length === 1) {
            setSelectedUniversity(data.universities[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching universities:", error);
      }
    };
    fetchUniversities();
  }, []);

  // Filter emails based on input
  useEffect(() => {
    if (formData.email && savedEmails.length > 0) {
      const filtered = savedEmails.filter((email) =>
        email.toLowerCase().includes(formData.email.toLowerCase()),
      );
      setFilteredEmails(filtered);
    } else {
      setFilteredEmails(savedEmails);
    }
  }, [formData.email, savedEmails]);

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
        },
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
        }
      },
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

    // Only validate university selection if universities have been loaded
    if (universities.length > 0 && !selectedUniversity) {
      newErrors.university = "Please select your university";
    }

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
      university: true,
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

  // Function to save email to localStorage
  const saveEmailToLocalStorage = (email) => {
    try {
      const saved = localStorage.getItem("campustrace_saved_emails");
      let emails = saved ? JSON.parse(saved) : [];

      // Add email if it doesn't exist
      if (!emails.includes(email)) {
        emails.unshift(email); // Add to beginning
        // Keep only last 5 emails
        emails = emails.slice(0, 5);
        localStorage.setItem(
          "campustrace_saved_emails",
          JSON.stringify(emails),
        );
        setSavedEmails(emails);
      } else {
        // Move existing email to front
        emails = emails.filter((e) => e !== email);
        emails.unshift(email);
        localStorage.setItem(
          "campustrace_saved_emails",
          JSON.stringify(emails),
        );
        setSavedEmails(emails);
      }
    } catch (error) {
      console.error("Error saving email to localStorage:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setTouched({ university: true, email: true, password: true });

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

    // Validate email domain matches selected university
    const emailDomain = formData.email.split("@")[1];
    if (!emailDomain) {
      toast.error("Please enter a valid email address", {
        duration: 5000,
        position: "top-center",
      });
      return;
    }

    setLoading(true);

    try {
      // List of public email domains
      const publicDomains = [
        "gmail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
        "aol.com",
        "icloud.com",
        "mail.com",
        "protonmail.com",
        "zoho.com",
        "yandex.com",
        "live.com",
        "msn.com",
        "gmx.com",
        "inbox.com",
        "fastmail.com",
      ];

      const isPublicDomain = publicDomains.includes(emailDomain.toLowerCase());

      if (isPublicDomain) {
        // For public domains, try to authenticate first
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
            // Now check if email exists in the database for this university
            try {
              const checkResponse = await fetch(`${API_BASE_URL}/api/auth/check-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  email: formData.email.trim(), 
                  university_id: selectedUniversity.id 
                })
              });
              
              if (checkResponse.ok) {
                const checkData = await checkResponse.json();
                if (!checkData.exists) {
                  // Email doesn't exist for this university
                  throw new Error(
                    `The email '${formData.email.trim()}' is not registered with ${selectedUniversity.name}. Please check your email or select the correct university.`
                  );
                }
              }
            } catch (err) {
              if (err.message.includes("not registered with")) {
                throw err;
              }
              // If check fails for other reasons, fall through to invalid password
            }

            // Email exists but password is wrong
            throw new Error("Invalid password");
          }

          throw authError;
        }

        // Verify that the authenticated user belongs to the selected university
        if (authData.user) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, university_id")
            .eq("id", authData.user.id)
            .single();

          if (profileError || !profileData) {
            await supabase.auth.signOut();
            throw new Error("Could not verify your account. Please try again.");
          }

          if (profileData.university_id !== selectedUniversity.id) {
            await supabase.auth.signOut();
            throw new Error(
              `This email is registered with a different university. Please select the correct university.`,
            );
          }
        }

        if (authData.user) {
          const { data: fullProfileData, error: fullProfileError } =
            await supabase
              .from("profiles")
              .select("is_verified, is_banned")
              .eq("id", authData.user.id)
              .single();

          if (fullProfileError) {
            await supabase.auth.signOut();
            throw new Error(
              "Could not verify account status. Please try again later.",
            );
          }

          if (fullProfileData?.is_banned) {
            await supabase.auth.signOut();
            throw new Error("Your account has been suspended.");
          }

          if (fullProfileData && fullProfileData.is_verified === false) {
            await supabase.auth.signOut();
            throw new Error(
              "Your account is awaiting administrator approval. Please check back later.",
            );
          }

          setLoginAttempts(0);
          setLastAttemptTime(null);
          setCooldownTime(0);

          // Save email to localStorage for future suggestions
          saveEmailToLocalStorage(formData.email);

          toast.success("Welcome back!", {
            duration: 3000,
            position: "top-center",
          });
        } else {
          throw new Error("Authentication failed unexpectedly.");
        }
      } else {
        // For university domains, check if domain matches selected university
        const { data: domainData, error: domainError } = await supabase
          .from("allowed_domains")
          .select("university_id, universities(name)")
          .eq("domain_name", emailDomain)
          .single();

        if (domainError || !domainData) {
          toast.error(
            `Your email domain '${emailDomain}' is not registered with ${selectedUniversity.name}. Please use your official university email or select the correct university.`,
            {
              duration: 7000,
              position: "top-center",
            },
          );
          resetCaptcha();
          setLoading(false);
          return;
        }

        // Check if domain matches selected university
        if (domainData.university_id !== selectedUniversity.id) {
          const actualUniversityName =
            domainData.universities?.name || "another university";
          toast.error(
            `Your email domain '${emailDomain}' is registered with ${actualUniversityName}, not ${selectedUniversity.name}. Please select the correct university.`,
            {
              duration: 7000,
              position: "top-center",
            },
          );
          resetCaptcha();
          setLoading(false);
          return;
        }

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
            throw new Error("Invalid password");
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
              "Could not verify account status. Please try again later.",
            );
          }

          if (profileData?.is_banned) {
            await supabase.auth.signOut();
            throw new Error("Your account has been suspended.");
          }

          if (profileData && profileData.is_verified === false) {
            await supabase.auth.signOut();
            throw new Error(
              "Your account is awaiting administrator approval. Please check back later.",
            );
          }

          setLoginAttempts(0);
          setLastAttemptTime(null);
          setCooldownTime(0);

          // Save email to localStorage for future suggestions
          saveEmailToLocalStorage(formData.email);

          toast.success("Welcome back!", {
            duration: 3000,
            position: "top-center",
          });
        } else {
          throw new Error("Authentication failed unexpectedly.");
        }
      }
    } catch (err) {
      const currentAttempt = loginAttempts + 1;
      setLoginAttempts(currentAttempt);
      setLastAttemptTime(Date.now());
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
      university: true,
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
        },
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

    const emailDomain = formData.email.split("@")[1];
    if (!emailDomain) {
      toast.error("Please enter a valid email address", {
        duration: 5000,
        position: "top-center",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: domainData, error: domainError } = await supabase
        .from("allowed_domains")
        .select("university_id, universities(name)")
        .eq("domain_name", emailDomain)
        .single();

      if (domainError || !domainData) {
        toast.error(
          `Your email domain '${emailDomain}' is not registered with ${selectedUniversity.name}. Please use your official university email or contact your administrator.`,
          {
            duration: 7000,
            position: "top-center",
          },
        );
        setLoading(false);
        resetCaptcha();
        return;
      }

      // Check if domain matches selected university
      if (domainData.university_id !== selectedUniversity.id) {
        const actualUniversityName =
          domainData.universities?.name || "another university";
        toast.error(
          `Your email domain '${emailDomain}' is registered with ${actualUniversityName}, not ${selectedUniversity.name}. Please select the correct university.`,
          {
            duration: 7000,
            position: "top-center",
          },
        );
        setLoading(false);
        resetCaptcha();
        return;
      }
    } catch (err) {
      toast.error(
        `Your email domain '${emailDomain}' is not registered with ${selectedUniversity.name}. Please use your official university email.`,
        {
          duration: 7000,
          position: "top-center",
        },
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
        },
      );

      // Store email in localStorage and redirect to confirm page
      localStorage.setItem("signup_email", formData.email);
      navigate("/confirm-email");

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
      <Helmet>
        <title>
          {isLogin
            ? "Login - CampusTrace Lost and Found"
            : "Sign Up - Join CampusTrace"}
        </title>
        <meta
          name="description"
          content={
            isLogin
              ? "Log in to CampusTrace to access your university's lost and found platform. Report lost items, claim found items, and help reunite belongings with their owners."
              : "Create your CampusTrace account using your university email. Join the intelligent lost and found platform and help build a helpful campus community."
          }
        />
        <meta
          name="keywords"
          content="campustrace login, sign up, student portal, lost and found login, campus account, university authentication"
        />
      </Helmet>

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
        <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-neutral-900 dark:to-neutral-950 p-12 flex-col justify-between">
          <div>
            <Link
              to="/"
              className="flex items-center gap-3 mb-12 w-fit hover:opacity-80 transition-opacity"
            >
              <img src={logo} alt="CampusTrace logo" className="h-12 w-12" />
              <span
                className="text-2xl font-bold text-neutral-900 dark:text-white"
                style={{
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                CampusTrace
              </span>
            </Link>
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                  Find what's lost,
                  <span className="text-primary-600 dark:text-primary-400">
                    {" "}
                    return what's found
                  </span>
                </h1>
                <p className="text-base text-neutral-600 dark:text-neutral-400">
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

        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            className="w-full max-w-sm lg:max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="lg:hidden text-center mb-6">
              <Link
                to="/"
                className="inline-flex flex-col items-center hover:opacity-80 transition-opacity"
              >
                <img
                  src={logo}
                  alt="CampusTrace logo"
                  className="mx-auto h-12 w-12 mb-3"
                />
                <h1
                  className="text-xl font-bold text-neutral-900 dark:text-white"
                  style={{
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  CampusTrace
                </h1>
              </Link>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                  {isLogin ? "Sign In" : "Sign Up"}
                </h2>
              </div>

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

              {loginAttempts > 0 &&
                loginAttempts < 5 &&
                cooldownTime === 0 &&
                isLogin && (
                  <div
                    className={`mb-6 p-3 rounded-lg border ${
                      loginAttempts >= 3
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                    }`}
                  >
                    <div
                      className={`flex items-center text-sm ${
                        loginAttempts >= 3
                          ? "text-red-800 dark:text-red-200"
                          : "text-yellow-800 dark:text-yellow-200"
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>
                        {loginAttempts >= 3
                          ? `Warning: ${5 - loginAttempts} attempt${
                              5 - loginAttempts === 1 ? "" : "s"
                            } remaining before 60-second lockout`
                          : `${loginAttempts} failed attempt${
                              loginAttempts === 1 ? "" : "s"
                            }. ${5 - loginAttempts} remaining before lockout`}
                      </span>
                    </div>
                  </div>
                )}

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

              <form
                onSubmit={isLogin ? handleLogin : handleSignup}
                className="space-y-5"
                noValidate
              >
                {/* University Selection Dropdown */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    University
                  </label>
                  <div className="relative">
                    <select
                      value={selectedUniversity?.id || ""}
                      onChange={(e) => {
                        const university = universities.find(
                          (u) => u.id === parseInt(e.target.value),
                        );
                        setSelectedUniversity(university);
                        setErrors((prev) => ({ ...prev, university: "" }));
                        setTouched((prev) => ({ ...prev, university: true }));
                      }}
                      className={`block w-full rounded-sm py-2 px-3 text-sm bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white border ${
                        errors.university && touched.university
                          ? "border-red-500 focus:border-red-500"
                          : "border-neutral-300 dark:border-neutral-700 focus:border-neutral-400 dark:focus:border-neutral-600"
                      } focus:outline-none transition-colors duration-150`}
                      aria-required="true"
                      aria-invalid={!!errors.university && touched.university}
                    >
                      <option value="">Select your university...</option>
                      {universities.map((university) => (
                        <option key={university.id} value={university.id}>
                          {university.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <AnimatePresence>
                    {errors.university && touched.university && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-xs text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />{" "}
                        {errors.university}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

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

                <div className="relative">
                  <InputField
                    icon={Mail}
                    label="Email Address"
                    type="email"
                    placeholder={
                      isLogin ? "Enter your email" : "you@university.edu"
                    }
                    value={formData.email}
                    onChange={(e) => handleInput("email", e.target.value)}
                    onFocus={() => setShowEmailSuggestions(true)}
                    onBlur={() => {
                      // Delay to allow click on suggestion
                      setTimeout(() => setShowEmailSuggestions(false), 200);
                    }}
                    error={errors.email}
                    touched={touched.email}
                    autoComplete="off"
                    aria-required="true"
                    aria-invalid={!!errors.email && touched.email}
                  />

                  {/* Email Suggestions Dropdown */}
                  {showEmailSuggestions && filteredEmails.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredEmails.map((email, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            handleInput("email", email);
                            setShowEmailSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Mail className="w-4 h-4 text-neutral-400" />
                          <span className="text-neutral-900 dark:text-white">
                            {email}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

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

                {isLogin && (
                  <div className="flex justify-between items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        data-testid="rememberMe"
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
                      } mode`,
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
