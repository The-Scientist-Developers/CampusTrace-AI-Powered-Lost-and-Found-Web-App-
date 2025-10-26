import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/apiClient";
import { toast } from "react-hot-toast";
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const navigate = useNavigate();

  // Check if user has a valid session/token for password reset
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // If no session or error, redirect to forgot password page
      if (!session || error) {
        toast.error("Invalid or expired reset link. Please request a new one.");
        navigate("/forgot-password");
      }
    };
    
    checkSession();
  }, [navigate]);

  // Password strength checker
  useEffect(() => {
    setPasswordStrength({
      hasMinLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  const handleUpdatePassword = async (event) => {
    event.preventDefault();

    // Password validation
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    
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
        // Handle specific Supabase errors
        if (error.message.includes("expired") || error.message.includes("invalid")) {
          throw new Error("Token expired or link is invalid. Please request a new password reset.");
        }
        if (error.message.toLowerCase().includes("should be different")) {
          throw new Error("New password should be different from the old password.");
        }
        throw error;
      }

      // Sign out the user after password update
      await supabase.auth.signOut();

      toast.success("Password updated successfully! Please sign in again.", {
        id: toastId,
        duration: 5000,
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 1000);
      
    } catch (error) {
      toast.error(error.message || "Failed to update password.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="bg-neutral-100 dark:bg-[#1a1a1a] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-800 dark:text-zinc-100">
            Create a New Password
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-gray-400">
            Enter your new password below. Make it strong and secure.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleUpdatePassword}>
          <div className="space-y-4">
            {/* New Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-zinc-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="relative block w-full appearance-none rounded-md border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] px-3 py-3 pr-10 text-neutral-900 dark:text-zinc-100 placeholder-neutral-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-600 dark:text-zinc-400">
                      Password strength:
                    </span>
                    <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <PasswordRequirement met={passwordStrength.hasMinLength} text="At least 6 characters" />
                    <PasswordRequirement met={passwordStrength.hasUpperCase} text="One uppercase letter" />
                    <PasswordRequirement met={passwordStrength.hasLowerCase} text="One lowercase letter" />
                    <PasswordRequirement met={passwordStrength.hasNumber} text="One number" />
                    <PasswordRequirement met={passwordStrength.hasSpecialChar} text="One special character" />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-neutral-700 dark:text-zinc-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="relative block w-full appearance-none rounded-md border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] px-3 py-3 pr-10 text-neutral-900 dark:text-zinc-100 placeholder-neutral-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300" />
                  )}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="mt-2 flex items-center">
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                      <span className="text-xs text-green-600 dark:text-green-400">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500 mr-1.5" />
                      <span className="text-xs text-red-600 dark:text-red-400">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-3 px-4 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-primary-200 group-hover:text-primary-100" />
              </span>
              {isLoading ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Password requirement component
function PasswordRequirement({ met, text }) {
  return (
    <div className="flex items-center text-xs">
      {met ? (
        <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 flex-shrink-0" />
      ) : (
        <XCircle className="h-3 w-3 text-neutral-400 dark:text-zinc-600 mr-1.5 flex-shrink-0" />
      )}
      <span className={met ? "text-green-600 dark:text-green-400" : "text-neutral-500 dark:text-zinc-500"}>
        {text}
      </span>
    </div>
  );
}