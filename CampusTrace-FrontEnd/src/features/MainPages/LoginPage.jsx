// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { supabase } from "../../api/apiClient.js";
// import { toast } from "react-hot-toast";
// import { useNavigate, Link, useLocation } from "react-router-dom";
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
//   ChevronRight,
//   ShieldCheck,
//   Sparkles,
//   CheckCircle,
// } from "lucide-react";
// import logo from "../../Images/Logo.svg";
// import ReCAPTCHA from "react-google-recaptcha";
// import { motion, AnimatePresence } from "framer-motion";

// const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// const InputField = ({
//   icon: Icon,
//   error,
//   touched,
//   isPassword,
//   showPassword,
//   togglePassword,
//   label,
//   ...props
// }) => (
//   <div className="space-y-2">
//     {" "}
//     {label && (
//       <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
//         {" "}
//         {label}{" "}
//       </label>
//     )}{" "}
//     <div className="relative">
//       {" "}
//       <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
//         {" "}
//         <Icon
//           className={`h-4 w-4 transition-colors ${
//             error && touched
//               ? "text-red-500"
//               : "text-neutral-400 dark:text-neutral-500"
//           }`}
//         />{" "}
//       </div>{" "}
//       <input
//         {...props}
//         type={isPassword ? (showPassword ? "text" : "password") : props.type}
//         className={`block w-full rounded-lg py-2.5 pl-10 ${
//           isPassword ? "pr-10" : "pr-3"
//         } bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border ${
//           error && touched
//             ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
//             : "border-neutral-200 dark:border-neutral-800 focus:border-primary-500 dark:focus:border-primary-500"
//         } placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:focus:ring-primary-500/20 transition-all duration-200`}
//       />{" "}
//       {isPassword && (
//         <button
//           type="button"
//           onClick={togglePassword}
//           className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
//         >
//           {" "}
//           {showPassword ? (
//             <EyeOff className="w-4 h-4" />
//           ) : (
//             <Eye className="w-4 h-4" />
//           )}{" "}
//         </button>
//       )}{" "}
//     </div>{" "}
//     <AnimatePresence>
//       {" "}
//       {error && touched && (
//         <motion.p
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -10 }}
//           className="text-sm text-red-500 flex items-center gap-1.5"
//         >
//           {" "}
//           <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}{" "}
//         </motion.p>
//       )}{" "}
//     </AnimatePresence>{" "}
//   </div>
// );
// const FeatureItem = ({ icon: Icon, title, description }) => (
//   <div className="flex gap-3">
//     {" "}
//     <div className="flex-shrink-0">
//       {" "}
//       <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
//         {" "}
//         <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />{" "}
//       </div>{" "}
//     </div>{" "}
//     <div>
//       {" "}
//       <h3 className="font-medium text-neutral-900 dark:text-white">
//         {title}
//       </h3>{" "}
//       <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
//         {" "}
//         {description}{" "}
//       </p>{" "}
//     </div>{" "}
//   </div>
// );

// export default function LoginPage() {
//   const [isLogin, setIsLogin] = useState(true);
//   const [formData, setFormData] = useState({
//     fullName: "",
//     email: "",
//     password: "",
//   });
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [captchaToken, setCaptchaToken] = useState(null);
//   const recaptchaRef = useRef(null);
//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     if (location.state?.unverified) {
//       toast.error(
//         "Your account has not been approved by an administrator yet. Please try again later."
//       );
//       navigate(location.pathname, { replace: true, state: {} });
//     }
//   }, [location, navigate]);

//   useEffect(() => {
//     const init = async () => {
//       const { data } = await supabase.auth.getSession();
//       if (data.session) navigate("/dashboard");
//     };
//     init();
//     const { data: listener } = supabase.auth.onAuthStateChange(
//       (_event, session) => {
//         if (session) navigate("/dashboard");
//       }
//     );
//     return () => listener.subscription.unsubscribe();
//   }, [navigate]);

//   const handleInput = useCallback((field, value) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//     setErrors((prev) => ({ ...prev, [field]: "" }));
//   }, []);

//   const validate = () => {
//     const newErrors = {};
//     if (!formData.email) newErrors.email = "Email is required";
//     else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
//       newErrors.email = "Please enter a valid email";
//     if (!formData.password) newErrors.password = "Password is required";
//     else if (formData.password.length < 6)
//       newErrors.password = "Password must be at least 6 characters";
//     if (!isLogin) {
//       if (!formData.fullName) newErrors.fullName = "Full name is required";
//       if (!confirmPassword)
//         newErrors.confirmPassword = "Please confirm your password";
//       else if (confirmPassword !== formData.password)
//         newErrors.confirmPassword = "Passwords do not match";
//     }
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const resetCaptcha = () => {
//     recaptchaRef.current?.reset();
//     setCaptchaToken(null);
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     if (!validate()) return;
//     if (!captchaToken) {
//       toast.error("Please complete the CAPTCHA verification");
//       return;
//     }
//     setLoading(true);
//     try {
//       const { error } = await supabase.auth.signInWithPassword({
//         email: formData.email,
//         password: formData.password,
//       });
//       if (error) {
//         const msg = error.message || "";
//         if (msg.includes("Email not confirmed")) {
//           throw new Error("Please confirm your email address first");
//         }
//         if (msg.includes("Invalid login credentials")) {
//           throw new Error("Invalid email or password");
//         }
//         throw error;
//       }
//       toast.success("Welcome back!");
//     } catch (err) {
//       toast.error(err.message || "Sign in failed");
//       resetCaptcha();
//     } finally {
//       setLoading(false);
//     }
//   };

//   const parseSignupError = (detail = "") => {
//     const lower = detail.toLowerCase();
//     if (lower.includes("domain") && lower.includes("not")) {
//       return "This email domain is not registered with CampusTrace";
//     }
//     if (lower.includes("already")) {
//       return "An account with this email already exists";
//     }
//     if (lower.includes("confirm")) {
//       return "Please check your email for a confirmation link";
//     }
//     return detail || "Sign up failed";
//   };

//   const handleSignup = async (e) => {
//     e.preventDefault();
//     if (!validate()) return;
//     if (!captchaToken) {
//       toast.error("Please complete the CAPTCHA verification");
//       return;
//     }
//     setLoading(true);
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           full_name: formData.fullName,
//           email: formData.email,
//           password: formData.password,
//           captchaToken,
//         }),
//       });
//       const data = await response.json();

//       if (!response.ok) {
//         const errorMessage = parseSignupError(data.detail || data.message);
//         throw new Error(errorMessage);
//       }

//       toast.success("Account created! Check your email to confirm");
//       setIsLogin(true);
//     } catch (err) {
//       toast.error(err.message || "Sign up failed");
//       resetCaptcha();
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex">
//       <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-neutral-900 dark:to-neutral-950 p-12 flex-col justify-between">
//         <div>
//           <div className="flex items-center gap-3 mb-12">
//             <img src={logo} alt="CampusTrace" className="h-8 w-8 rounded-lg" />
//             <span className="text-xl font-bold text-neutral-900 dark:text-white">
//               CampusTrace
//             </span>
//           </div>
//           <div className="space-y-8">
//             <div>
//               <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
//                 Find what's lost,
//                 <span className="text-primary-600 dark:text-primary-400">
//                   {" "}
//                   return what's found
//                 </span>
//               </h1>
//               <p className="text-neutral-600 dark:text-neutral-400">
//                 Join your university's lost and found community
//               </p>
//             </div>
//             <div className="space-y-6">
//               <FeatureItem
//                 icon={ShieldCheck}
//                 title="University Verified"
//                 description="Secure access limited to verified university email addresses"
//               />
//               <FeatureItem
//                 icon={Sparkles}
//                 title="AI-Powered Matching"
//                 description="Smart image recognition helps match lost and found items"
//               />
//               <FeatureItem
//                 icon={CheckCircle}
//                 title="Trusted Community"
//                 description="Connect with fellow students and staff on your campus"
//               />
//             </div>
//           </div>
//         </div>
//         <div className="mt-12">
//           <p className="text-sm text-neutral-500 dark:text-neutral-400">
//             © 2024 CampusTrace. All rights reserved.
//           </p>
//         </div>
//       </div>
//       <div className="flex-1 flex items-center justify-center p-6">
//         <motion.div
//           className="w-full max-w-sm lg:max-w-md"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4 }}
//         >
//           <div className="lg:hidden text-center mb-8">
//             <img
//               src={logo}
//               alt="CampusTrace"
//               className="mx-auto h-12 w-12 rounded-lg mb-4"
//             />
//             <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
//               CampusTrace
//             </h1>
//           </div>
//           <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8">
//             <div className="text-center mb-8">
//               <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
//                 {isLogin ? "Welcome back" : "Create your account"}
//               </h2>
//               <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
//                 {isLogin
//                   ? "Enter your credentials to access your account"
//                   : "Sign up with your university email"}
//               </p>
//             </div>
//             <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 mb-8">
//               <button
//                 className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
//                   isLogin
//                     ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
//                     : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
//                 }`}
//                 onClick={() => {
//                   setIsLogin(true);
//                   setTouched({});
//                   setErrors({});
//                   resetCaptcha();
//                 }}
//               >
//                 Sign In
//               </button>
//               <button
//                 className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
//                   !isLogin
//                     ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
//                     : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
//                 }`}
//                 onClick={() => {
//                   setIsLogin(false);
//                   setTouched({});
//                   setErrors({});
//                   resetCaptcha();
//                 }}
//               >
//                 Sign Up
//               </button>
//             </div>
//             <form
//               onSubmit={isLogin ? handleLogin : handleSignup}
//               className="space-y-5"
//             >
//               <AnimatePresence mode="wait">
//                 {!isLogin && (
//                   <motion.div
//                     key="fullname"
//                     initial={{ opacity: 0, height: 0 }}
//                     animate={{ opacity: 1, height: "auto" }}
//                     exit={{ opacity: 0, height: 0 }}
//                     transition={{ duration: 0.2 }}
//                   >
//                     <InputField
//                       icon={User}
//                       label="Full Name"
//                       type="text"
//                       placeholder="John Doe"
//                       value={formData.fullName}
//                       onChange={(e) => handleInput("fullName", e.target.value)}
//                       onBlur={() =>
//                         setTouched((prev) => ({ ...prev, fullName: true }))
//                       }
//                       error={errors.fullName}
//                       touched={touched.fullName}
//                     />
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//               <InputField
//                 icon={Mail}
//                 label="Email Address"
//                 type="email"
//                 placeholder="you@university.edu"
//                 value={formData.email}
//                 onChange={(e) => handleInput("email", e.target.value)}
//                 onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
//                 error={errors.email}
//                 touched={touched.email}
//                 autoComplete="email"
//               />
//               <InputField
//                 icon={Lock}
//                 label="Password"
//                 isPassword
//                 placeholder="Enter your password"
//                 value={formData.password}
//                 onChange={(e) => handleInput("password", e.target.value)}
//                 onBlur={() =>
//                   setTouched((prev) => ({ ...prev, password: true }))
//                 }
//                 error={errors.password}
//                 touched={touched.password}
//                 showPassword={showPassword}
//                 togglePassword={() => setShowPassword((prev) => !prev)}
//                 autoComplete={isLogin ? "current-password" : "new-password"}
//               />
//               <AnimatePresence mode="wait">
//                 {!isLogin && (
//                   <motion.div
//                     key="confirm"
//                     initial={{ opacity: 0, height: 0 }}
//                     animate={{ opacity: 1, height: "auto" }}
//                     exit={{ opacity: 0, height: 0 }}
//                     transition={{ duration: 0.2 }}
//                   >
//                     <InputField
//                       icon={Lock}
//                       label="Confirm Password"
//                       isPassword
//                       placeholder="Confirm your password"
//                       value={confirmPassword}
//                       onChange={(e) => setConfirmPassword(e.target.value)}
//                       onBlur={() =>
//                         setTouched((prev) => ({
//                           ...prev,
//                           confirmPassword: true,
//                         }))
//                       }
//                       error={errors.confirmPassword}
//                       touched={touched.confirmPassword}
//                       showPassword={showConfirm}
//                       togglePassword={() => setShowConfirm((prev) => !prev)}
//                       autoComplete="new-password"
//                     />
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//               {isLogin && (
//                 <div className="flex justify-between items-center">
//                   <label className="flex items-center">
//                     <input
//                       type="checkbox"
//                       className="w-4 h-4 text-primary-600 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded focus:ring-primary-500"
//                     />
//                     <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
//                       Remember me
//                     </span>
//                   </label>
//                   <a
//                     href="/update-password"
//                     className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
//                   >
//                     Forgot password?
//                   </a>
//                 </div>
//               )}
//               <div className="flex justify-center py-4">
//                 <ReCAPTCHA
//                   ref={recaptchaRef}
//                   sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
//                   onChange={setCaptchaToken}
//                   theme={
//                     window.matchMedia("(prefers-color-scheme: dark)").matches
//                       ? "dark"
//                       : "light"
//                   }
//                 />
//               </div>
//               <button
//                 type="submit"
//                 disabled={loading || !captchaToken}
//                 className="w-full rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400
//                                  text-white py-3 font-semibold flex items-center justify-center gap-2
//                                  disabled:cursor-not-allowed transition-all duration-200
//                                  shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30
//                                  transform hover:-translate-y-0.5"
//               >
//                 {loading ? (
//                   <>
//                     <Loader2 className="w-5 h-5 animate-spin" />
//                     <span>
//                       {isLogin ? "Signing in..." : "Creating account..."}
//                     </span>
//                   </>
//                 ) : (
//                   <>
//                     {isLogin ? (
//                       <>
//                         <span>Sign In</span>
//                         <ChevronRight className="w-5 h-5" />
//                       </>
//                     ) : (
//                       <>
//                         <UserPlus className="w-5 h-5" />
//                         <span>Create Account</span>
//                       </>
//                     )}
//                   </>
//                 )}
//               </button>
//             </form>
//             <div className="relative my-6">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div>
//               </div>
//               <div className="relative flex justify-center text-sm">
//                 <span className="px-2 bg-white dark:bg-neutral-900 text-neutral-500">
//                   or
//                 </span>
//               </div>
//             </div>
//             <AnimatePresence>
//               {!isLogin && (
//                 <motion.div
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                   transition={{ delay: 0.2 }}
//                 >
//                   <div className="text-center">
//                     <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
//                       Don't have a university email?
//                     </p>
//                     <Link
//                       to="/manual-verification"
//                       className="w-full inline-flex justify-center py-2.5 px-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-sm rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
//                     >
//                       Register with your University ID instead
//                     </Link>
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//             <div className="text-center mt-6">
//               <button
//                 className="text-primary-600 dark:text-primary-400 hover:text-primary-700
//                                  dark:hover:text-primary-300 font-medium text-sm inline-flex items-center gap-1
//                                  group"
//                 onClick={() => {
//                   setIsLogin((prev) => !prev);
//                   setErrors({});
//                   setTouched({});
//                   resetCaptcha();
//                 }}
//               >
//                 <span>{isLogin ? "Create an account" : "Sign in instead"}</span>
//                 <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
//               </button>
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// }




// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { supabase } from "../../api/apiClient.js"; // Import supabase directly
// import { toast } from "react-hot-toast";
// import { useNavigate, Link, useLocation } from "react-router-dom";
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
//   ChevronRight,
//   ShieldCheck,
//   Sparkles,
//   CheckCircle,
// } from "lucide-react";
// import logo from "../../Images/Logo.svg";
// import ReCAPTCHA from "react-google-recaptcha";
// import { motion, AnimatePresence } from "framer-motion";

// const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// const InputField = ({
//   icon: Icon,
//   error,
//   touched,
//   isPassword,
//   showPassword,
//   togglePassword,
//   label,
//   ...props
// }) => (
//   <div className="space-y-2">
//     {" "}
//     {label && (
//       <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
//         {" "}
//         {label}{" "}
//       </label>
//     )}{" "}
//     <div className="relative">
//       {" "}
//       <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
//         {" "}
//         <Icon
//           className={`h-4 w-4 transition-colors ${
//             error && touched
//               ? "text-red-500"
//               : "text-neutral-400 dark:text-neutral-500"
//           }`}
//         />{" "}
//       </div>{" "}
//       <input
//         {...props}
//         type={isPassword ? (showPassword ? "text" : "password") : props.type}
//         className={`block w-full rounded-lg py-2.5 pl-10 ${
//           isPassword ? "pr-10" : "pr-3"
//         } bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border ${
//           error && touched
//             ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
//             : "border-neutral-200 dark:border-neutral-800 focus:border-primary-500 dark:focus:border-primary-500"
//         } placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:focus:ring-primary-500/20 transition-all duration-200`}
//       />{" "}
//       {isPassword && (
//         <button
//           type="button"
//           onClick={togglePassword}
//           className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
//         >
//           {" "}
//           {showPassword ? (
//             <EyeOff className="w-4 h-4" />
//           ) : (
//             <Eye className="w-4 h-4" />
//           )}{" "}
//         </button>
//       )}{" "}
//     </div>{" "}
//     <AnimatePresence>
//       {" "}
//       {error && touched && (
//         <motion.p
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -10 }}
//           className="text-sm text-red-500 flex items-center gap-1.5"
//         >
//           {" "}
//           <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}{" "}
//         </motion.p>
//       )}{" "}
//     </AnimatePresence>{" "}
//   </div>
// );
// const FeatureItem = ({ icon: Icon, title, description }) => (
//   <div className="flex gap-3">
//     {" "}
//     <div className="flex-shrink-0">
//       {" "}
//       <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
//         {" "}
//         <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />{" "}
//       </div>{" "}
//     </div>{" "}
//     <div>
//       {" "}
//       <h3 className="font-medium text-neutral-900 dark:text-white">
//         {title}
//       </h3>{" "}
//       <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
//         {" "}
//         {description}{" "}
//       </p>{" "}
//     </div>{" "}
//   </div>
// );

// export default function LoginPage() {
//   const [isLogin, setIsLogin] = useState(true);
//   const [formData, setFormData] = useState({
//     fullName: "",
//     email: "",
//     password: "",
//   });
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [captchaToken, setCaptchaToken] = useState(null);
//   const recaptchaRef = useRef(null);
//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     // This toast remains useful for edge cases where navigation state might be used
//     if (location.state?.unverified) {
//       toast.error(
//         "Your account has not been approved by an administrator yet. Please try again later."
//       );
//       // Clear the state to prevent repeated toasts on refresh
//       navigate(location.pathname, { replace: true, state: {} });
//     }
//   }, [location, navigate]);

//   useEffect(() => {
//     // Initial check for existing session (handled by App.jsx redirect mostly)
//     const init = async () => {
//       const { data } = await supabase.auth.getSession();
//       // App.jsx will handle the redirect based on profile status if session exists
//       // No direct navigate('/dashboard') needed here anymore.
//     };
//     init();

//     // Listener for auth state changes (handled by App.jsx redirect mostly)
//     const { data: listener } = supabase.auth.onAuthStateChange(
//       (_event, session) => {
//         // App.jsx's useEffect will pick up the session change and redirect appropriately
//         // No direct navigate('/dashboard') needed here anymore.
//         if (!session) {
//           // Optional: If user signs out on this page, clear form or navigate to home
//           // navigate('/'); // Example
//         }
//       }
//     );
//     return () => listener.subscription.unsubscribe();
//   }, [navigate]); // navigate dependency might be removable if App.jsx handles all redirects

//   const handleInput = useCallback((field, value) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//     setErrors((prev) => ({ ...prev, [field]: "" })); // Clear error on input
//     setTouched((prev) => ({ ...prev, [field]: true })); // Mark as touched
//   }, []);

//   const validate = () => {
//     const newErrors = {};
//     if (!formData.email) newErrors.email = "Email is required";
//     else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
//       newErrors.email = "Please enter a valid email";

//     if (!formData.password) newErrors.password = "Password is required";
//     else if (formData.password.length < 6 && isLogin)
//       // Keep length check for login UX
//       newErrors.password = "Password must be at least 6 characters";
//     else if (formData.password.length < 6 && !isLogin)
//       // Stricter validation potentially on signup side
//       newErrors.password = "Password must be at least 6 characters";

//     if (!isLogin) {
//       if (!formData.fullName) newErrors.fullName = "Full name is required";
//       if (!confirmPassword)
//         newErrors.confirmPassword = "Please confirm your password";
//       else if (confirmPassword !== formData.password)
//         newErrors.confirmPassword = "Passwords do not match";
//     }
//     setErrors(newErrors);
//     // Mark all fields as touched on submit attempt
//     setTouched({
//       email: true,
//       password: true,
//       fullName: !isLogin,
//       confirmPassword: !isLogin,
//     });
//     return Object.keys(newErrors).length === 0;
//   };

//   const resetCaptcha = () => {
//     recaptchaRef.current?.reset();
//     setCaptchaToken(null);
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setTouched({ email: true, password: true }); // Mark fields as touched on submit
//     if (!validate()) return; // Re-validate, considering touched status
//     if (!captchaToken) {
//       toast.error("Please complete the CAPTCHA verification");
//       return;
//     }
//     setLoading(true);
//     try {
//       // --- Step 1: Authenticate User ---
//       const { data: authData, error: authError } =
//         await supabase.auth.signInWithPassword({
//           email: formData.email,
//           password: formData.password,
//         });

//       if (authError) {
//         // Handle standard auth errors (invalid credentials, email not confirmed)
//         const msg = authError.message || "";
//         if (msg.includes("Email not confirmed")) {
//           throw new Error("Please confirm your email address first");
//         }
//         if (msg.includes("Invalid login credentials")) {
//           throw new Error("Invalid email or password");
//         }
//         throw authError; // Rethrow other auth errors
//       }

//       // --- Step 2: Check Verification Status IF Auth Succeeded ---
//       if (authData.user) {
//         const { data: profileData, error: profileError } = await supabase
//           .from("profiles")
//           .select("is_verified, is_banned") // Select is_verified and is_banned
//           .eq("id", authData.user.id)
//           .single();

//         if (profileError) {
//           // Profile might not exist yet if signup was interrupted, or DB error
//           console.error("Login: Error fetching profile:", profileError.message);
//           // Decide how to handle: maybe let them proceed cautiously,
//           // or sign them out and show a generic error. Signing out is safer.
//           await supabase.auth.signOut();
//           throw new Error(
//             "Could not verify account status. Please try again later."
//           );
//         }

//         // --- Step 3: Handle Banned or Unverified Users ---
//         if (profileData?.is_banned) {
//           await supabase.auth.signOut(); // Log out banned user immediately
//           throw new Error("Your account has been suspended.");
//         }

//         if (profileData && profileData.is_verified === false) {
//           // User authenticated BUT not yet approved by admin
//           await supabase.auth.signOut(); // Log them out immediately
//           throw new Error( // Use a specific error message
//             "Your account is awaiting administrator approval. Please check back later."
//           );
//         }

//         // --- Step 4: If Verified and Not Banned ---
//         // User is authenticated AND verified (or profile check succeeded)
//         // Let the onAuthStateChange listener in App.jsx handle the redirect
//         toast.success("Welcome back!");
//         // No navigate('/dashboard') needed here, App.jsx handles it.
//       } else {
//         // Should not happen if authError is null, but as a safeguard
//         throw new Error("Authentication failed unexpectedly.");
//       }
//     } catch (err) {
//       // Catch errors from auth OR the verification check
//       toast.error(err.message || "Sign in failed");
//       resetCaptcha(); // Reset captcha on any error during login attempt
//     } finally {
//       setLoading(false);
//     }
//   };

//   const parseSignupError = (detail = "") => {
//     const lower = detail.toLowerCase();
//     if (lower.includes("domain") && lower.includes("not")) {
//       return "This email domain is not registered with CampusTrace";
//     }
//     if (lower.includes("already")) {
//       return "An account with this email already exists";
//     }
//     if (lower.includes("confirm")) {
//       // This might still be relevant if backend doesn't handle redirects correctly
//       return "Please check your email for a confirmation link";
//     }
//     if (lower.includes("password")) {
//       // Catch weak password errors from backend more explicitly
//       return "Password is too weak. Please include uppercase, lowercase, numbers, and symbols.";
//     }
//     return detail || "Sign up failed";
//   };

//   const handleSignup = async (e) => {
//     e.preventDefault();
//     setTouched({
//       email: true,
//       password: true,
//       fullName: true,
//       confirmPassword: true,
//     }); // Mark fields as touched
//     if (!validate()) return; // Re-validate
//     if (!captchaToken) {
//       toast.error("Please complete the CAPTCHA verification");
//       return;
//     }
//     setLoading(true);
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           full_name: formData.fullName,
//           email: formData.email,
//           password: formData.password,
//           captchaToken,
//         }),
//       });
//       const data = await response.json();

//       if (!response.ok) {
//         const errorMessage = parseSignupError(data.detail || data.message);
//         throw new Error(errorMessage);
//       }

//       toast.success("Account created! Check your email to confirm");
//       setIsLogin(true); // Switch to login view after successful signup request
//       // Clear form for potential login attempt after confirmation
//       setFormData({ fullName: "", email: "", password: "" });
//       setConfirmPassword("");
//       setErrors({});
//       setTouched({});
//       resetCaptcha(); // Reset captcha after successful signup request
//     } catch (err) {
//       toast.error(err.message || "Sign up failed");
//       resetCaptcha(); // Reset captcha on signup failure
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex">
//       {/* Left Panel (Desktop Only) */}
//       <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-neutral-900 dark:to-neutral-950 p-12 flex-col justify-between">
//         <div>
//           <div className="flex items-center gap-3 mb-12">
//             <img src={logo} alt="CampusTrace" className="h-8 w-8 rounded-lg" />
//             <span className="text-xl font-bold text-neutral-900 dark:text-white">
//               CampusTrace
//             </span>
//           </div>
//           <div className="space-y-8">
//             <div>
//               <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
//                 Find what's lost,
//                 <span className="text-primary-600 dark:text-primary-400">
//                   {" "}
//                   return what's found
//                 </span>
//               </h1>
//               <p className="text-neutral-600 dark:text-neutral-400">
//                 Join your university's lost and found community
//               </p>
//             </div>
//             <div className="space-y-6">
//               <FeatureItem
//                 icon={ShieldCheck}
//                 title="University Verified"
//                 description="Secure access limited to verified university email addresses"
//               />
//               <FeatureItem
//                 icon={Sparkles}
//                 title="AI-Powered Matching"
//                 description="Smart image recognition helps match lost and found items"
//               />
//               <FeatureItem
//                 icon={CheckCircle}
//                 title="Trusted Community"
//                 description="Connect with fellow students and staff on your campus"
//               />
//             </div>
//           </div>
//         </div>
//         <div className="mt-12">
//           <p className="text-sm text-neutral-500 dark:text-neutral-400">
//             © {new Date().getFullYear()} CampusTrace. All rights reserved.
//           </p>
//         </div>
//       </div>

//       {/* Right Panel (Login/Signup Form) */}
//       <div className="flex-1 flex items-center justify-center p-6">
//         <motion.div
//           className="w-full max-w-sm lg:max-w-md"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4 }}
//         >
//           {/* Mobile Header */}
//           <div className="lg:hidden text-center mb-8">
//             <img
//               src={logo}
//               alt="CampusTrace"
//               className="mx-auto h-12 w-12 rounded-lg mb-4"
//             />
//             <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
//               CampusTrace
//             </h1>
//           </div>

//           {/* Form Card */}
//           <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8">
//             <div className="text-center mb-8">
//               <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
//                 {isLogin ? "Welcome back" : "Create your account"}
//               </h2>
//               <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
//                 {isLogin
//                   ? "Enter your credentials to access your account"
//                   : "Sign up with your university email or ID"}
//               </p>
//             </div>

//             {/* Sign In / Sign Up Toggle */}
//             <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 mb-8">
//               <button
//                 className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
//                   isLogin
//                     ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
//                     : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
//                 }`}
//                 onClick={() => {
//                   setIsLogin(true);
//                   setTouched({}); // Clear touched on tab switch
//                   setErrors({});
//                   resetCaptcha();
//                 }}
//               >
//                 Sign In
//               </button>
//               <button
//                 className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
//                   !isLogin
//                     ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
//                     : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
//                 }`}
//                 onClick={() => {
//                   setIsLogin(false);
//                   setTouched({}); // Clear touched on tab switch
//                   setErrors({});
//                   resetCaptcha();
//                 }}
//               >
//                 Sign Up
//               </button>
//             </div>

//             {/* Form */}
//             <form
//               onSubmit={isLogin ? handleLogin : handleSignup}
//               className="space-y-5"
//               noValidate // Prevent browser default validation, rely on custom
//             >
//               {/* Full Name Field (Sign Up Only) */}
//               <AnimatePresence mode="wait">
//                 {!isLogin && (
//                   <motion.div
//                     key="fullname"
//                     initial={{ opacity: 0, height: 0 }}
//                     animate={{ opacity: 1, height: "auto" }}
//                     exit={{ opacity: 0, height: 0 }}
//                     transition={{ duration: 0.2 }}
//                   >
//                     <InputField
//                       icon={User}
//                       label="Full Name"
//                       type="text"
//                       placeholder="John Doe"
//                       value={formData.fullName}
//                       onChange={(e) => handleInput("fullName", e.target.value)}
//                       // onBlur event is removed, touched state is set on submit/input
//                       error={errors.fullName}
//                       touched={touched.fullName}
//                       aria-required="true"
//                       aria-invalid={!!errors.fullName && touched.fullName}
//                     />
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {/* Email Field */}
//               <InputField
//                 icon={Mail}
//                 label="Email Address"
//                 type="email"
//                 placeholder={
//                   isLogin ? "Enter your email" : "you@university.edu"
//                 }
//                 value={formData.email}
//                 onChange={(e) => handleInput("email", e.target.value)}
//                 // onBlur event is removed
//                 error={errors.email}
//                 touched={touched.email}
//                 autoComplete="email"
//                 aria-required="true"
//                 aria-invalid={!!errors.email && touched.email}
//               />

//               {/* Password Field */}
//               <InputField
//                 icon={Lock}
//                 label="Password"
//                 isPassword
//                 placeholder="Enter your password"
//                 value={formData.password}
//                 onChange={(e) => handleInput("password", e.target.value)}
//                 // onBlur event is removed
//                 error={errors.password}
//                 touched={touched.password}
//                 showPassword={showPassword}
//                 togglePassword={() => setShowPassword((prev) => !prev)}
//                 autoComplete={isLogin ? "current-password" : "new-password"}
//                 aria-required="true"
//                 aria-invalid={!!errors.password && touched.password}
//               />

//               {/* Confirm Password Field (Sign Up Only) */}
//               <AnimatePresence mode="wait">
//                 {!isLogin && (
//                   <motion.div
//                     key="confirm"
//                     initial={{ opacity: 0, height: 0 }}
//                     animate={{ opacity: 1, height: "auto" }}
//                     exit={{ opacity: 0, height: 0 }}
//                     transition={{ duration: 0.2 }}
//                   >
//                     <InputField
//                       icon={Lock}
//                       label="Confirm Password"
//                       isPassword
//                       placeholder="Confirm your password"
//                       value={confirmPassword}
//                       onChange={(e) => setConfirmPassword(e.target.value)}
//                       // onBlur event is removed
//                       error={errors.confirmPassword}
//                       touched={touched.confirmPassword}
//                       showPassword={showConfirm}
//                       togglePassword={() => setShowConfirm((prev) => !prev)}
//                       autoComplete="new-password"
//                       aria-required="true"
//                       aria-invalid={
//                         !!errors.confirmPassword && touched.confirmPassword
//                       }
//                     />
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {/* Remember Me / Forgot Password (Login Only) */}
//               {isLogin && (
//                 <div className="flex justify-between items-center">
//                   <label className="flex items-center cursor-pointer">
//                     <input
//                       type="checkbox"
//                       className="w-4 h-4 text-primary-600 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded focus:ring-primary-500"
//                     />
//                     <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
//                       Remember me
//                     </span>
//                   </label>
//                   {/* TODO: Implement forgot password flow */}
//                   <Link
//                     to="/update-password" // Link to your password reset initiation page
//                     className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
//                   >
//                     Forgot password?
//                   </Link>
//                 </div>
//               )}

//               {/* reCAPTCHA */}
//               <div className="flex justify-center py-4">
//                 <ReCAPTCHA
//                   ref={recaptchaRef}
//                   sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
//                   onChange={setCaptchaToken}
//                   theme={
//                     window.matchMedia("(prefers-color-scheme: dark)").matches
//                       ? "dark"
//                       : "light"
//                   }
//                 />
//               </div>

//               {/* Submit Button */}
//               <button
//                 type="submit"
//                 disabled={loading || !captchaToken} // Also disable if captcha not done
//                 className="w-full rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400
//                                  text-white py-3 font-semibold flex items-center justify-center gap-2
//                                  disabled:cursor-not-allowed transition-all duration-200
//                                  shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30
//                                  transform hover:-translate-y-0.5"
//               >
//                 {loading ? (
//                   <>
//                     <Loader2 className="w-5 h-5 animate-spin" />
//                     <span>
//                       {isLogin ? "Signing in..." : "Creating account..."}
//                     </span>
//                   </>
//                 ) : (
//                   <>
//                     {isLogin ? (
//                       <>
//                         <span>Sign In</span>
//                         <ChevronRight className="w-5 h-5" />
//                       </>
//                     ) : (
//                       <>
//                         <UserPlus className="w-5 h-5" />
//                         <span>Create Account</span>
//                       </>
//                     )}
//                   </>
//                 )}
//               </button>
//             </form>

//             {/* "or" Separator */}
//             <div className="relative my-6">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div>
//               </div>
//               <div className="relative flex justify-center text-sm">
//                 <span className="px-2 bg-white dark:bg-neutral-900 text-neutral-500">
//                   or
//                 </span>
//               </div>
//             </div>

//             {/* Manual Registration Link (Sign Up Only) */}
//             <AnimatePresence>
//               {!isLogin && (
//                 <motion.div
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                   transition={{ delay: 0.1 }} // Slightly delayed appearance
//                 >
//                   <div className="text-center">
//                     <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
//                       Don't have a university email?
//                     </p>
//                     <Link
//                       to="/manual-verification" // Correct link to manual registration page
//                       className="w-full inline-flex justify-center py-2.5 px-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-sm rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
//                     >
//                       Register with your University ID instead
//                     </Link>
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {/* Toggle between Sign In / Sign Up */}
//             <div className="text-center mt-6">
//               <button
//                 className="text-primary-600 dark:text-primary-400 hover:text-primary-700
//                                  dark:hover:text-primary-300 font-medium text-sm inline-flex items-center gap-1
//                                  group"
//                 onClick={() => {
//                   setIsLogin((prev) => !prev);
//                   setErrors({});
//                   setTouched({}); // Clear touched state when switching forms
//                   resetCaptcha();
//                   // Optionally clear form data too
//                   // setFormData({ fullName: "", email: "", password: "" });
//                   // setConfirmPassword("");
//                 }}
//               >
//                 <span>
//                   {isLogin
//                     ? "Create an account"
//                     : "Already have an account? Sign in"}
//                 </span>
//                 <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
//               </button>
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// }







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
} from "lucide-react";
import logo from "../../Images/Logo.svg";
import ReCAPTCHA from "react-google-recaptcha";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
      <h3 className="font-medium text-neutral-900 dark:text-white">
        {title}
      </h3>
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    
    if (!validate()) {
      toast.error("Please fix the errors in the form", {
        duration: 4000,
        position: "top-center",
      });
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
    
    try {
      // Step 1: Authenticate User
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (authError) {
        const msg = authError.message || "";
        
        if (msg.includes("Email not confirmed")) {
          toast.error("Please confirm your email address first", {
            duration: 5000,
            position: "top-center",
          });
          throw new Error("Please confirm your email address first");
        }
        
        if (msg.includes("Invalid login credentials")) {
          toast.error("Invalid email or password", {
            duration: 4000,
            position: "top-center",
          });
          throw new Error("Invalid email or password");
        }
        
        toast.error(authError.message || "Sign in failed", {
          duration: 4000,
          position: "top-center",
        });
        throw authError;
      }

      // Step 2: Check Verification Status IF Auth Succeeded
      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("is_verified, is_banned")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          console.error("Login: Error fetching profile:", profileError.message);
          await supabase.auth.signOut();
          toast.error("Could not verify account status. Please try again later.", {
            duration: 5000,
            position: "top-center",
          });
          throw new Error("Could not verify account status. Please try again later.");
        }

        // Step 3: Handle Banned or Unverified Users
        if (profileData?.is_banned) {
          await supabase.auth.signOut();
          toast.error("Your account has been suspended.", {
            duration: 5000,
            position: "top-center",
          });
          throw new Error("Your account has been suspended.");
        }

        if (profileData && profileData.is_verified === false) {
          await supabase.auth.signOut();
          toast.error("Your account is awaiting administrator approval. Please check back later.", {
            duration: 6000,
            position: "top-center",
          });
          throw new Error("Your account is awaiting administrator approval. Please check back later.");
        }

        // Step 4: If Verified and Not Banned
        toast.success("Welcome back!", {
          duration: 3000,
          position: "top-center",
        });
      } else {
        toast.error("Authentication failed unexpectedly.", {
          duration: 4000,
          position: "top-center",
        });
        throw new Error("Authentication failed unexpectedly.");
      }
    } catch (err) {
      // Error already displayed via toast above
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const parseSignupError = (detail = "") => {
    console.log("🔍 parseSignupError called with:", detail);
    console.log("🔍 Detail type:", typeof detail);
    
    const lower = detail.toLowerCase();
    console.log("🔍 Lowercase detail:", lower);
    
    // Check for confirmation email already sent
    if (lower.includes("confirmation") && lower.includes("already")) {
      console.log("✅ Matched: confirmation already sent");
      return "A confirmation email has already been sent. Please check your inbox and click the confirmation link before creating a new account.";
    }
    
    if (lower.includes("domain") && lower.includes("not")) {
      console.log("✅ Matched: domain not registered");
      return "This email domain is not registered with CampusTrace";
    }
    
    if (lower.includes("already") || lower.includes("exists")) {
      console.log("✅ Matched: email already exists");
      return "An account with this email already exists. Please sign in instead or use a different email.";
    }
    
    if (lower.includes("confirm") && !lower.includes("already")) {
      console.log("✅ Matched: check email for confirmation");
      return "Please check your email for a confirmation link";
    }
    
    if (lower.includes("password") && lower.includes("weak")) {
      console.log("✅ Matched: weak password");
      return "Password is too weak. Please include uppercase, lowercase, numbers, and symbols.";
    }
    
    console.log("❌ No match found, returning default");
    return detail || "Sign up failed";
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    console.log("🚀 Starting signup process...");
    
    setTouched({
      email: true,
      password: true,
      fullName: true,
      confirmPassword: true,
    });
    
    if (!validate()) {
      console.log("❌ Validation failed");
      toast.error("Please fix the errors in the form", {
        duration: 4000,
        position: "top-center",
      });
      return;
    }
    
    if (!captchaToken) {
      console.log("❌ CAPTCHA not completed");
      toast.error("Please complete the CAPTCHA verification", {
        duration: 4000,
        position: "top-center",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if email already exists in profiles table
      console.log("🔍 Checking if email already exists:", formData.email);
      const { data: existingProfiles, error: checkError } = await supabase
        .from("profiles")
        .select("email, is_verified")
        .eq("email", formData.email)
        .maybeSingle();
      
      console.log("🔍 Check result:", { existingProfiles, checkError });
      
      if (existingProfiles) {
        console.log("⚠️ Email already registered!");
        if (existingProfiles.is_verified === false) {
          toast.error("A confirmation email has already been sent to this address. Please check your inbox and click the confirmation link.", {
            duration: 7000,
            position: "top-center",
            style: {
              background: '#f59e0b',
              color: '#fff',
              fontWeight: '600',
            },
          });
        } else {
          toast.error("An account with this email already exists. Please sign in instead or use a different email.", {
            duration: 6000,
            position: "top-center",
            style: {
              background: '#ef4444',
              color: '#fff',
              fontWeight: '600',
            },
          });
        }
        resetCaptcha();
        setLoading(false);
        return;
      }
      
      console.log("✅ Email available, proceeding with signup...");
      console.log("📤 Sending signup request:", { 
        email: formData.email, 
        fullName: formData.fullName,
        apiUrl: `${API_BASE_URL}/api/auth/signup`
      });
      
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
      
      console.log("📥 Response status:", response.status);
      console.log("📥 Response ok:", response.ok);
      
      const data = await response.json();
      console.log("📥 Response data:", data);
      console.log("📥 data.detail:", data.detail);
      console.log("📥 data.message:", data.message);

      if (!response.ok) {
        console.log("❌ Response not OK, parsing error...");
        const errorMessage = parseSignupError(data.detail || data.message);
        console.log("🔴 Final error message:", errorMessage);
        
        toast.error(errorMessage, {
          duration: 6000,
          position: "top-center",
          style: {
            background: '#ef4444',
            color: '#fff',
            fontWeight: '600',
          },
        });
        throw new Error(errorMessage);
      }

      console.log("✅ Signup successful!");
      toast.success("Account created! Check your email to confirm", {
        duration: 5000,
        position: "top-center",
      });
      
      setIsLogin(true);
      setFormData({ fullName: "", email: "", password: "" });
      setConfirmPassword("");
      setErrors({});
      setTouched({});
      resetCaptcha();
    } catch (err) {
      console.error("💥 Signup error caught:", err);
      console.error("💥 Error message:", err.message);
      console.error("💥 Error stack:", err.stack);
      
      // If error wasn't already shown (network error, etc.)
      if (!err.message.includes("already") && !err.message.includes("domain") && !err.message.includes("confirmation")) {
        toast.error(err.message || "Sign up failed. Please try again.", {
          duration: 5000,
          position: "top-center",
        });
      }
      resetCaptcha();
    } finally {
      console.log("🏁 Signup process finished");
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
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex">
        {/* Left Panel (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-neutral-900 dark:to-neutral-950 p-12 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <img src={logo} alt="CampusTrace" className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold text-neutral-900 dark:text-white">
                CampusTrace
              </span>
            </div>
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
              <img
                src={logo}
                alt="CampusTrace"
                className="mx-auto h-12 w-12 rounded-lg mb-4"
              />
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                CampusTrace
              </h1>
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

              {/* Sign In / Sign Up Toggle */}
              <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 mb-8">
                <button
                  className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                    isLogin
                      ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
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
                  className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                    !isLogin
                      ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
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
                        onChange={(e) => handleInput("fullName", e.target.value)}
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
                      to="/update-password"
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
                  disabled={loading || !captchaToken}
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
                    setIsLogin((prev) => !prev);
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