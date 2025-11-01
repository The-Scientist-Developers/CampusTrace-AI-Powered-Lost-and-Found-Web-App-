import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../api/apiClient";
import { toast } from "react-hot-toast";
import { Mail, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  React.useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime(cooldownTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Sending reset link...");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.message.toLowerCase().includes("rate limit")) {
          setCooldownTime(60);
          throw new Error("Too many requests. Please try again later.");
        }
        if (error.message.toLowerCase().includes("not found")) {
          throw new Error("No account found with this email address.");
        }
        throw error;
      }

      toast.success("Reset link sent! Check your email.", { id: toastId });
      setIsSubmitted(true);
    } catch (error) {
      toast.error(error.message || "Failed to send reset link.", {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsSubmitted(false);
    setCooldownTime(60);
    await handleSubmit(new Event("submit"));
  };

  if (isSubmitted) {
    return (
      <div className="bg-neutral-100 dark:bg-[#1a1a1a] min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center bg-white dark:bg-[#2a2a2a] p-8 rounded-xl shadow-lg border border-neutral-200 dark:border-[#3a3a3a]">
          <div className="mx-auto h-20 w-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>

          <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">
            Check Your Email
          </h2>

          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            We've sent a password reset link to:
          </p>
          <p className="font-semibold text-neutral-800 dark:text-white mt-1">
            {email}
          </p>

          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> The reset link will expire in 1 hour.
            </p>
          </div>

          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-500">
            Didn't receive the email? Check your spam folder or click below to
            resend.
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={cooldownTime > 0}
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-neutral-200 dark:bg-zinc-700 text-neutral-700 dark:text-zinc-200 font-semibold rounded-lg hover:bg-neutral-300 dark:hover:bg-zinc-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${
                  cooldownTime > 0 ? "animate-spin" : ""
                }`}
              />
              {cooldownTime > 0 ? `Resend in ${cooldownTime}s` : "Resend Email"}
            </button>

            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-100 dark:bg-[#1a1a1a] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-800 dark:text-zinc-100">
            Forgot Your Password?
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-gray-400">
            No worries! Enter your email address and we'll send you a link to
            reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 dark:text-zinc-300 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || cooldownTime > 0}
                className="relative block w-full appearance-none rounded-md border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] px-3 py-3 pl-10 text-neutral-900 dark:text-zinc-100 placeholder-neutral-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || cooldownTime > 0}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-3 px-4 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out"
            >
              {cooldownTime > 0
                ? `Wait ${cooldownTime}s before retry`
                : isLoading
                ? "Sending..."
                : "Send Reset Link"}
            </button>

            <Link
              to="/login"
              className="group relative flex w-full justify-center items-center rounded-md border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-zinc-100 hover:bg-neutral-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 transition-all duration-200 ease-in-out"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Login
            </Link>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Make sure to check your spam or junk folder if
            you don't see the email in your inbox.
          </p>
        </div>
      </div>
    </div>
  );
}

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
