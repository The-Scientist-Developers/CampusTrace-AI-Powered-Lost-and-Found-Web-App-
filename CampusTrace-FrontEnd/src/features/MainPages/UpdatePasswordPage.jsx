// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "../../api/apiClient";
// import { toast } from "react-hot-toast";
// import { Lock } from "lucide-react";

// export default function UpdatePasswordPage() {
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleUpdatePassword = async (event) => {
//     event.preventDefault();

//     // --- NEW: Password validation ---
//     if (password.length < 6) {
//       toast.error("Password must be at least 6 characters long.");
//       return;
//     }
//     if (password !== confirmPassword) {
//       toast.error("Passwords do not match.");
//       return;
//     }
//     // --- End of validation ---

//     setIsLoading(true);
//     const toastId = toast.loading("Updating password...");

//     try {
//       const { error } = await supabase.auth.updateUser({
//         password: password,
//       });

//       if (error) throw error;

//       toast.success("Password updated successfully! Please sign in again.", {
//         id: toastId,
//       });
//       navigate("/login");
//     } catch (error) {
//       toast.error(error.message, { id: toastId });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="bg-neutral-100 dark:bg-[#1a1a1a] min-h-screen flex items-center justify-center p-4">
//       <div className="w-full max-w-md space-y-8">
//         <div className="text-center">
//           <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-800 dark:text-zinc-100">
//             Create a New Password
//           </h2>
//           <p className="mt-2 text-sm text-neutral-600 dark:text-gray-400">
//             Enter your new password below. It must be at least 6 characters.
//           </p>
//         </div>

//         <form className="mt-8 space-y-6" onSubmit={handleUpdatePassword}>
//           <div className="space-y-4">
//             <div>
//               <label htmlFor="password" className="sr-only">
//                 New Password
//               </label>
//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 required
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 disabled={isLoading}
//                 className="relative block w-full appearance-none rounded-md border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] px-3 py-3 text-neutral-900 dark:text-zinc-100 placeholder-neutral-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm disabled:opacity-50"
//                 placeholder="Enter new password"
//               />
//             </div>
//             {/* --- NEW: Confirm Password Field --- */}
//             <div>
//               <label htmlFor="confirm-password" className="sr-only">
//                 Confirm New Password
//               </label>
//               <input
//                 id="confirm-password"
//                 name="confirm-password"
//                 type="password"
//                 required
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 disabled={isLoading}
//                 className="relative block w-full appearance-none rounded-md border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] px-3 py-3 text-neutral-900 dark:text-zinc-100 placeholder-neutral-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm disabled:opacity-50"
//                 placeholder="Confirm new password"
//               />
//             </div>
//           </div>

//           <div>
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-3 px-4 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               <span className="absolute inset-y-0 left-0 flex items-center pl-3">
//                 <Lock className="h-5 w-5 text-primary-200" />
//               </span>
//               {isLoading ? "Updating..." : "Update Password"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }







// import React, { useState } from "react";
// import { Link } from "react-router-dom";
// import { supabase } from "../../api/apiClient";
// import { toast } from "react-hot-toast";
// import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

// export default function ForgotPasswordPage() {
//   const [email, setEmail] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSubmitted, setIsSubmitted] = useState(false);

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     // Frontend validation: Email is required
//     if (!email) {
//       toast.error("Please enter your email address.");
//       return;
//     }

//     // Frontend validation: Valid email format
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//       toast.error("Please enter a valid email address.");
//       return;
//     }

//     setIsLoading(true);
//     const toastId = toast.loading("Sending reset link...");

//     try {
//       const { error } = await supabase.auth.resetPasswordForEmail(email, {
//         redirectTo: `${window.location.origin}/reset-password`,
//       });

//       if (error) {
//         // Handle specific Supabase errors
//         if (error.message.toLowerCase().includes("rate limit")) {
//           throw new Error("Too many requests. Please try again later.");
//         }
//         if (error.message.toLowerCase().includes("not found")) {
//           throw new Error("No account found with this email address.");
//         }
//         throw error;
//       }

//       toast.success("Reset link sent! Check your email.", { id: toastId });
//       setIsSubmitted(true);
//     } catch (error) {
//       toast.error(error.message || "Failed to send reset link.", { id: toastId });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (isSubmitted) {
//     return (
//       <div className="bg-neutral-100 dark:bg-[#1a1a1a] min-h-screen flex items-center justify-center p-4">
//         <div className="w-full max-w-md text-center bg-white dark:bg-[#2a2a2a] p-8 rounded-xl shadow-lg border border-neutral-200 dark:border-[#3a3a3a]">
//           <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
//           <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">
//             Check Your Email
//           </h2>
//           <p className="mt-2 text-neutral-600 dark:text-neutral-400">
//             We've sent a password reset link to <strong>{email}</strong>. 
//             Please check your inbox and click the link to reset your password.
//           </p>
//           <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-500">
//             Didn't receive the email? Check your spam folder or try again in a few minutes.
//           </p>
//           <Link
//             to="/login"
//             className="mt-6 inline-block w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
//           >
//             Back to Login
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-neutral-100 dark:bg-[#1a1a1a] min-h-screen flex items-center justify-center p-4">
//       <div className="w-full max-w-md space-y-8">
//         <div className="text-center">
//           <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-800 dark:text-zinc-100">
//             Forgot Your Password?
//           </h2>
//           <p className="mt-2 text-sm text-neutral-600 dark:text-gray-400">
//             Enter your email address and we'll send you a link to reset your password.
//           </p>
//         </div>

//         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//           <div>
//             <label htmlFor="email" className="sr-only">
//               Email Address
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 required
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 disabled={isLoading}
//                 className="relative block w-full appearance-none rounded-md border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] px-3 py-3 pl-10 text-neutral-900 dark:text-zinc-100 placeholder-neutral-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm disabled:opacity-50"
//                 placeholder="Enter your email address"
//               />
//             </div>
//           </div>

//           <div className="space-y-3">
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-3 px-4 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               {isLoading ? "Sending..." : "Send Reset Link"}
//             </button>

//             <Link
//               to="/login"
//               className="group relative flex w-full justify-center rounded-md border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-zinc-100 hover:bg-neutral-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 transition-colors"
//             >
//               <ArrowLeft className="w-5 h-5 mr-2" />
//               Back to Login
//             </Link>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }




/**
 * File: UpdatePasswordPage.jsx
 * 
 * Password Reset (handleUpdatePassword) Error Messages:
 * 
 * Frontend Validations:
 * - "Password must be at least 6 characters long." (Frontend validation)
 * - "Passwords do not match." (Frontend validation)
 * 
 * Backend Error Messages (From Supabase updateUser):
 * - "Token expired or link is invalid. Please request a new password reset." (From Supabase)
 * - "New password should be different from the old password." (From Supabase)
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/apiClient";
import { toast } from "react-hot-toast";
import { Lock } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (event) => {
    event.preventDefault();

    // Frontend validation: "Password must be at least 6 characters long."
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    
    // Frontend validation: "Passwords do not match."
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Updating password...");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        // From Supabase: "Token expired or link is invalid. Please request a new password reset."
        if (error.message.toLowerCase().includes("token") || 
            error.message.toLowerCase().includes("expired") ||
            error.message.toLowerCase().includes("invalid")) {
          throw new Error("Token expired or link is invalid. Please request a new password reset.");
        }
        
        // From Supabase: "New password should be different from the old password."
        if (error.message.toLowerCase().includes("same") || 
            error.message.toLowerCase().includes("different")) {
          throw new Error("New password should be different from the old password.");
        }
        
        throw error;
      }

      toast.success("Password updated successfully! Please sign in again.", {
        id: toastId,
      });
      navigate("/login");
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-neutral-100 dark:bg-[#1a1a1a] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-800 dark:text-zinc-100">
            Create a New Password
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-gray-400">
            Enter your new password below. It must be at least 6 characters.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleUpdatePassword}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="relative block w-full appearance-none rounded-md border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] px-3 py-3 text-neutral-900 dark:text-zinc-100 placeholder-neutral-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm disabled:opacity-50"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="relative block w-full appearance-none rounded-md border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] px-3 py-3 text-neutral-900 dark:text-zinc-100 placeholder-neutral-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm disabled:opacity-50"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-3 px-4 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-primary-200" />
              </span>
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}