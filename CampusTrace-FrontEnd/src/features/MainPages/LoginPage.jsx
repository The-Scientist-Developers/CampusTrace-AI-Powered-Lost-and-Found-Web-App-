// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { supabase } from "../../api/apiClient.js";
// import { toast } from "react-hot-toast";
// import { useNavigate } from "react-router-dom";
// import {
//   Mail,
//   Lock,
//   LogIn,
//   Loader2,
//   Eye,
//   EyeOff,
//   User,
//   AlertCircle,
//   UserPlus,
// } from "lucide-react";
// import logo from "../../Images/Logo.svg";
// import ReCAPTCHA from "react-google-recaptcha";
// import { motion, AnimatePresence } from "framer-motion";

// // Custom hook for form validation
// const useFormValidation = () => {
//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});

//   const validateEmail = (email) => {
//     if (!email) return "Email is required";
//     if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
//       return "Invalid email address";
//     }
//     return "";
//   };

//   const validatePassword = (password) => {
//     if (!password) return "Password is required";
//     if (password.length < 6) return "Password must be at least 6 characters";
//     return "";
//   };

//   const validateName = (name) => {
//     if (!name) return "Full name is required";
//     if (name.length < 2) return "Name must be at least 2 characters";
//     return "";
//   };

//   const validatePasswordConfirm = (password, confirmPassword) => {
//     if (!confirmPassword) return "Please confirm your password";
//     if (password !== confirmPassword) return "Passwords do not match";
//     return "";
//   };

//   return {
//     errors,
//     setErrors,
//     touched,
//     setTouched,
//     validateEmail,
//     validatePassword,
//     validateName,
//     validatePasswordConfirm,
//   };
// };

// // Clean Input Component
// const FormInput = ({
//   icon: Icon,
//   error,
//   touched,
//   isPassword = false,
//   showPassword,
//   onTogglePassword,
//   ...props
// }) => {
//   return (
//     <div className="relative mb-6">
//       <div className="relative">
//         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
//           <Icon
//             className={`h-5 w-5 transition-colors ${
//               error && touched ? "text-red-500" : "text-neutral-400"
//             }`}
//             aria-hidden="true"
//           />
//         </div>
//         <input
//           {...props}
//           type={isPassword ? (showPassword ? "text" : "password") : props.type}
//           className={`
//             block w-full rounded-md border-0 py-3 pl-10 ${
//               isPassword ? "pr-10" : "pr-4"
//             }
//             text-neutral-900 dark:text-white
//             bg-white dark:bg-zinc-900
//             ring-1 ring-inset
//             placeholder:text-neutral-400
//             focus:ring-2 focus:ring-inset
//             sm:text-sm sm:leading-6
//             transition-all duration-200
//             ${
//               error && touched
//                 ? "ring-red-500 focus:ring-red-500"
//                 : "ring-neutral-300 dark:ring-zinc-700 focus:ring-primary-600"
//             }
//           `}
//         />
//         {isPassword && (
//           <button
//             type="button"
//             onClick={onTogglePassword}
//             className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
//           >
//             {showPassword ? (
//               <EyeOff className="w-5 h-5" />
//             ) : (
//               <Eye className="w-5 h-5" />
//             )}
//           </button>
//         )}
//       </div>
//       {error && touched && (
//         <motion.p
//           initial={{ opacity: 0, y: -5 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="mt-1 text-sm text-red-500 flex items-center gap-1"
//         >
//           <AlertCircle className="w-3 h-3" />
//           {error}
//         </motion.p>
//       )}
//     </div>
//   );
// };

// export default function LoginPage() {
//   const [isLogin, setIsLogin] = useState(true);
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//     confirmPassword: "",
//     fullName: "",
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [captchaToken, setCaptchaToken] = useState(null);
//   const recaptchaRef = useRef(null);
//   const navigate = useNavigate();

//   const {
//     errors,
//     setErrors,
//     touched,
//     setTouched,
//     validateEmail,
//     validatePassword,
//     validateName,
//     validatePasswordConfirm,
//   } = useFormValidation();

//   // Check for existing session
//   useEffect(() => {
//     const checkSession = async () => {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();
//       if (session) {
//         navigate("/dashboard");
//       }
//     };
//     checkSession();

//     const { data: authListener } = supabase.auth.onAuthStateChange(
//       (event, session) => {
//         if (session) {
//           navigate("/dashboard");
//         }
//       }
//     );

//     return () => authListener.subscription.unsubscribe();
//   }, [navigate]);

//   const handleInputChange = useCallback(
//     (field, value) => {
//       setFormData((prev) => ({ ...prev, [field]: value }));

//       // Clear error when user starts typing
//       if (errors[field]) {
//         setErrors((prev) => ({ ...prev, [field]: "" }));
//       }
//     },
//     [errors, setErrors]
//   );

//   const handleBlur = useCallback(
//     (field) => {
//       setTouched((prev) => ({ ...prev, [field]: true }));

//       // Validate on blur
//       let error = "";
//       switch (field) {
//         case "email":
//           error = validateEmail(formData.email);
//           break;
//         case "password":
//           error = validatePassword(formData.password);
//           break;
//         case "fullName":
//           error = validateName(formData.fullName);
//           break;
//         case "confirmPassword":
//           error = validatePasswordConfirm(
//             formData.password,
//             formData.confirmPassword
//           );
//           break;
//       }

//       if (error) {
//         setErrors((prev) => ({ ...prev, [field]: error }));
//       }
//     },
//     [
//       formData,
//       setTouched,
//       setErrors,
//       validateEmail,
//       validatePassword,
//       validateName,
//       validatePasswordConfirm,
//     ]
//   );

//   const switchMode = () => {
//     setIsLogin(!isLogin);
//     setFormData({ email: "", password: "", confirmPassword: "", fullName: "" });
//     setErrors({});
//     setTouched({});
//     setCaptchaToken(null);
//     recaptchaRef.current?.reset();
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validate all fields
//     const emailError = validateEmail(formData.email);
//     const passwordError = validatePassword(formData.password);
//     let nameError = "";
//     let confirmError = "";

//     if (!isLogin) {
//       nameError = validateName(formData.fullName);
//       confirmError = validatePasswordConfirm(
//         formData.password,
//         formData.confirmPassword
//       );
//     }

//     if (emailError || passwordError || nameError || confirmError) {
//       setErrors({
//         email: emailError,
//         password: passwordError,
//         fullName: nameError,
//         confirmPassword: confirmError,
//       });
//       setTouched({
//         email: true,
//         password: true,
//         fullName: !isLogin,
//         confirmPassword: !isLogin,
//       });
//       return;
//     }

//     if (!captchaToken) {
//       toast.error("Please complete the CAPTCHA verification");
//       return;
//     }

//     setLoading(true);

//     try {
//       if (isLogin) {
//         // Login
//         const { data, error } = await supabase.auth.signInWithPassword({
//           email: formData.email,
//           password: formData.password,
//         });

//         if (error) throw error;
//         toast.success("Welcome back! Redirecting to dashboard...");
//       } else {
//         // Sign up
//         const { data, error } = await supabase.auth.signUp({
//           email: formData.email,
//           password: formData.password,
//           options: {
//             data: {
//               full_name: formData.fullName,
//             },
//           },
//         });

//         if (error) throw error;

//         if (data?.user?.identities?.length === 0) {
//           toast.error("An account with this email already exists");
//           return;
//         }

//         toast.success(
//           "Account created! Please check your email to verify your account.",
//           { duration: 6000 }
//         );
//         setIsLogin(true); // Switch to login view after successful signup
//       }
//     } catch (err) {
//       console.error("Auth error:", err);

//       // Handle specific error cases
//       if (err.message?.includes("Invalid login credentials")) {
//         toast.error("Invalid email or password");
//       } else if (err.message?.includes("Email not confirmed")) {
//         toast.error("Please verify your email before logging in");
//       } else if (err.message?.includes("User already registered")) {
//         toast.error("An account with this email already exists");
//       } else {
//         toast.error(err.message || "An error occurred. Please try again.");
//       }

//       // Reset captcha on error
//       recaptchaRef.current?.reset();
//       setCaptchaToken(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-neutral-100 dark:bg-zinc-950 min-h-screen flex items-center justify-center p-4">
//       <motion.div
//         className="w-full max-w-md"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         {/* Logo and Header */}
//         <div className="text-center mb-8">
//           <img
//             className="mx-auto h-12 w-12 mb-4 rounded-full"
//             src={logo}
//             alt="CampusTrace"
//           />
//           <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-800 dark:text-zinc-100">
//             {isLogin ? "Welcome back" : "Create your account"}
//           </h2>
//           <p className="mt-2 text-sm text-neutral-600 dark:text-zinc-400">
//             {isLogin
//               ? "Sign in to access your CampusTrace account"
//               : "Join CampusTrace to help find lost items on campus"}
//           </p>
//         </div>

//         {/* Toggle Buttons */}
//         <div className="flex bg-white dark:bg-zinc-900 rounded-lg p-1 mb-8 ring-1 ring-inset ring-neutral-300 dark:ring-zinc-700">
//           <button
//             onClick={() => !isLogin && switchMode()}
//             className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
//               isLogin
//                 ? "bg-primary-600 text-white shadow-sm"
//                 : "text-neutral-600 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200"
//             }`}
//           >
//             Sign In
//           </button>
//           <button
//             onClick={() => isLogin && switchMode()}
//             className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
//               !isLogin
//                 ? "bg-primary-600 text-white shadow-sm"
//                 : "text-neutral-600 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200"
//             }`}
//           >
//             Sign Up
//           </button>
//         </div>

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="space-y-2">
//           <AnimatePresence mode="wait">
//             {!isLogin && (
//               <motion.div
//                 key="fullName"
//                 initial={{ opacity: 0, height: 0 }}
//                 animate={{ opacity: 1, height: "auto" }}
//                 exit={{ opacity: 0, height: 0 }}
//                 transition={{ duration: 0.2 }}
//               >
//                 <FormInput
//                   icon={User}
//                   type="text"
//                   placeholder="Full Name"
//                   value={formData.fullName}
//                   onChange={(e) =>
//                     handleInputChange("fullName", e.target.value)
//                   }
//                   onBlur={() => handleBlur("fullName")}
//                   error={errors.fullName}
//                   touched={touched.fullName}
//                   autoComplete="name"
//                 />
//               </motion.div>
//             )}
//           </AnimatePresence>

//           <FormInput
//             icon={Mail}
//             type="email"
//             placeholder="Email Address"
//             value={formData.email}
//             onChange={(e) => handleInputChange("email", e.target.value)}
//             onBlur={() => handleBlur("email")}
//             error={errors.email}
//             touched={touched.email}
//             autoComplete="email"
//             required
//           />

//           <FormInput
//             icon={Lock}
//             isPassword
//             placeholder="Password"
//             value={formData.password}
//             onChange={(e) => handleInputChange("password", e.target.value)}
//             onBlur={() => handleBlur("password")}
//             error={errors.password}
//             touched={touched.password}
//             showPassword={showPassword}
//             onTogglePassword={() => setShowPassword(!showPassword)}
//             autoComplete={isLogin ? "current-password" : "new-password"}
//             required
//           />

//           <AnimatePresence mode="wait">
//             {!isLogin && (
//               <motion.div
//                 key="confirmPassword"
//                 initial={{ opacity: 0, height: 0 }}
//                 animate={{ opacity: 1, height: "auto" }}
//                 exit={{ opacity: 0, height: 0 }}
//                 transition={{ duration: 0.2 }}
//               >
//                 <FormInput
//                   icon={Lock}
//                   isPassword
//                   placeholder="Confirm Password"
//                   value={formData.confirmPassword}
//                   onChange={(e) =>
//                     handleInputChange("confirmPassword", e.target.value)
//                   }
//                   onBlur={() => handleBlur("confirmPassword")}
//                   error={errors.confirmPassword}
//                   touched={touched.confirmPassword}
//                   showPassword={showConfirmPassword}
//                   onTogglePassword={() =>
//                     setShowConfirmPassword(!showConfirmPassword)
//                   }
//                   autoComplete="new-password"
//                 />
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {isLogin && (
//             <div className="flex justify-end mb-4">
//               <a
//                 href="/update-password"
//                 className="text-sm text-primary-600 hover:text-primary-500 transition-colors hover:underline"
//               >
//                 Forgot password?
//               </a>
//             </div>
//           )}

//           {/* CAPTCHA */}
//           <div className="flex justify-center my-6">
//             <ReCAPTCHA
//               ref={recaptchaRef}
//               sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
//               onChange={setCaptchaToken}
//               theme={
//                 window.matchMedia("(prefers-color-scheme: dark)").matches
//                   ? "dark"
//                   : "light"
//               }
//             />
//           </div>

//           {/* Submit Button */}
//           <button
//             type="submit"
//             disabled={loading || !captchaToken}
//             className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-3 px-4 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             {loading ? (
//               <span className="flex items-center justify-center gap-2">
//                 <Loader2 className="w-5 h-5 animate-spin" />
//                 {isLogin ? "Signing in..." : "Creating account..."}
//               </span>
//             ) : (
//               <span className="flex items-center justify-center gap-2">
//                 {isLogin ? (
//                   <>
//                     <LogIn className="w-5 h-5" />
//                     Sign In
//                   </>
//                 ) : (
//                   <>
//                     <UserPlus className="w-5 h-5" />
//                     Create Account
//                   </>
//                 )}
//               </span>
//             )}
//           </button>
//         </form>

//         {/* Footer */}
//         <div className="space-y-4 text-center text-sm text-neutral-600 dark:text-zinc-400 mt-6">
//           <p>
//             {isLogin ? "Don't have an account? " : "Already have an account? "}
//             <button
//               onClick={switchMode}
//               className="font-medium text-primary-600 hover:text-primary-500 transition-colors hover:underline"
//             >
//               {isLogin ? "Sign up" : "Sign in"}
//             </button>
//           </p>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../api/apiClient.js";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import logo from "../../Images/Logo.svg";
import ReCAPTCHA from "react-google-recaptcha";
import { motion } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const InputField = ({
  icon: Icon,
  error,
  touched,
  isPassword,
  showPassword,
  togglePassword,
  ...props
}) => (
  <div className="relative mb-5">
    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
      <Icon
        className={`h-5 w-5 ${
          error && touched ? "text-red-500" : "text-neutral-400"
        }`}
      />
    </div>
    <input
      {...props}
      type={isPassword ? (showPassword ? "text" : "password") : props.type}
      className={`block w-full rounded-md py-3 pl-10 ${
        isPassword ? "pr-10" : "pr-4"
      } bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white ring-1 ring-inset ${
        error && touched
          ? "ring-red-500 focus:ring-red-500"
          : "ring-neutral-300 dark:ring-zinc-700 focus:ring-primary-600"
      } placeholder:text-neutral-400 focus:outline-none`}
    />
    {isPassword && (
      <button
        type="button"
        onClick={togglePassword}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    )}
    {error && touched && (
      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {error}
      </p>
    )}
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

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate("/dashboard");
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) navigate("/dashboard");
      }
    );
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  const handleInput = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Enter a valid email.";
    if (!formData.password) newErrors.password = "Password is required.";
    else if (formData.password.length < 6)
      newErrors.password = "Minimum 6 characters.";
    if (!isLogin) {
      if (!formData.fullName) newErrors.fullName = "Full name is required.";
      if (!confirmPassword)
        newErrors.confirmPassword = "Confirm your password.";
      else if (confirmPassword !== formData.password)
        newErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetCaptcha = () => {
    recaptchaRef.current?.reset();
    setCaptchaToken(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!captchaToken) {
      toast.error("Complete the CAPTCHA.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) {
        const msg = error.message || "";
        if (msg.includes("Email not confirmed")) {
          throw new Error("Please confirm your email first.");
        }
        if (msg.includes("Invalid login credentials")) {
          throw new Error("Wrong email or password.");
        }
        throw error;
      }
      toast.success("Signed in!");
    } catch (err) {
      toast.error(err.message || "Login failed.");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const parseSignupError = (detail = "") => {
    const lower = detail.toLowerCase();
    if (lower.includes("domain") && lower.includes("not")) {
      return "This email domain is not registered on CampusTrace.";
    }
    if (lower.includes("already")) {
      return "This email already has an account.";
    }
    if (lower.includes("confirm")) {
      return "Please confirm your email via the link we sent.";
    }
    return detail || "Signup failed.";
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!captchaToken) {
      toast.error("Complete the CAPTCHA.");
      return;
    }
    setLoading(true);
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
        throw new Error(parseSignupError(data.detail || data.message));
      }
      toast.success("Check your inbox to confirm your email.");
      setIsLogin(true);
    } catch (err) {
      toast.error(err.message || "Signup failed.");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-100 dark:bg-zinc-950 min-h-screen flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-6">
          <img
            src={logo}
            alt="CampusTrace"
            className="mx-auto h-12 w-12 rounded-full mb-3"
          />
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            {isLogin ? "Welcome back" : "Create an account"}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {isLogin
              ? "Sign in to manage your lost & found posts."
              : "Register with your university email to get started."}
          </p>
        </div>

        <div className="flex bg-neutral-200 dark:bg-zinc-800 rounded-md p-1 mb-6">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium ${
              isLogin
                ? "bg-white dark:bg-zinc-900 text-primary-600 shadow"
                : "text-neutral-500"
            }`}
            onClick={() => {
              setIsLogin(true);
              setTouched({});
              setErrors({});
              resetCaptcha();
            }}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium ${
              !isLogin
                ? "bg-white dark:bg-zinc-900 text-primary-600 shadow"
                : "text-neutral-500"
            }`}
            onClick={() => {
              setIsLogin(false);
              setTouched({});
              setErrors({});
              resetCaptcha();
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSignup}>
          {!isLogin && (
            <InputField
              icon={User}
              type="text"
              placeholder="Full name"
              value={formData.fullName}
              onChange={(e) => handleInput("fullName", e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
              error={errors.fullName}
              touched={touched.fullName}
            />
          )}

          <InputField
            icon={Mail}
            type="email"
            placeholder="University email"
            value={formData.email}
            onChange={(e) => handleInput("email", e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            error={errors.email}
            touched={touched.email}
            autoComplete="email"
          />

          <InputField
            icon={Lock}
            isPassword
            placeholder="Password"
            value={formData.password}
            onChange={(e) => handleInput("password", e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
            error={errors.password}
            touched={touched.password}
            showPassword={showPassword}
            togglePassword={() => setShowPassword((prev) => !prev)}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />

          {!isLogin && (
            <InputField
              icon={Lock}
              isPassword
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() =>
                setTouched((prev) => ({ ...prev, confirmPassword: true }))
              }
              error={errors.confirmPassword}
              touched={touched.confirmPassword}
              showPassword={showConfirm}
              togglePassword={() => setShowConfirm((prev) => !prev)}
              autoComplete="new-password"
            />
          )}

          {isLogin && (
            <div className="flex justify-end mb-4">
              <a
                href="/update-password"
                className="text-sm text-primary-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>
          )}

          <div className="flex justify-center my-6">
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
            disabled={loading || !captchaToken}
            className="w-full rounded-md bg-primary-600 text-white py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isLogin ? "Signing in..." : "Creating account..."}
              </>
            ) : isLogin ? (
              <>
                <LogIn className="w-5 h-5" /> Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" /> Sign Up
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          {isLogin ? "Don’t have an account?" : "Already registered?"}{" "}
          <button
            className="text-primary-600 font-medium hover:underline"
            onClick={() => {
              setIsLogin((prev) => !prev);
              setErrors({});
              setTouched({});
              resetCaptcha();
            }}
          >
            {isLogin ? "Create one" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
