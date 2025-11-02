import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../api/apiClient";
import { motion } from "framer-motion";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Loader2,
} from "lucide-react";
import logo from "../../Images/Logo.svg";

const ConfirmEmailPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Get email from localStorage (set during signup)
    const signupEmail = localStorage.getItem("signup_email");
    if (signupEmail) {
      setEmail(signupEmail);
    }

    // Check if user is already logged in
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();
  }, [navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!email || countdown > 0) return;

    setResending(true);
    setResendMessage("");
    setResendError("");

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) throw error;

      setResendMessage("Confirmation email sent! Please check your inbox.");
      setCountdown(60); // 60 second cooldown
    } catch (error) {
      console.error("Resend error:", error);
      setResendError(
        error.message || "Failed to resend email. Please try again later."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-8 border border-neutral-200 dark:border-neutral-800">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link to="/">
              <img src={logo} alt="CampusTrace logo" className="h-16 w-16" />
            </Link>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
              >
                <CheckCircle className="w-5 h-5 text-white" />
              </motion.div>
            </motion.div>
          </div>

          {/* Heading */}
          <motion.h1
            className="text-2xl sm:text-3xl font-bold text-center text-neutral-900 dark:text-white mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Confirm Your Email
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-center text-neutral-600 dark:text-neutral-400 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            We've sent a confirmation email to
          </motion.p>

          {/* Email Display */}
          {email && (
            <motion.div
              className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-center text-primary-700 dark:text-primary-300 font-semibold break-all">
                {email}
              </p>
            </motion.div>
          )}

          {/* Instructions */}
          <motion.div
            className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Next Steps:
            </h3>
            <ol className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li className="flex gap-2">
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  1.
                </span>
                <span>Check your email inbox (and spam folder)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  2.
                </span>
                <span>Click the confirmation link in the email</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  3.
                </span>
                <span>You'll be redirected to log in</span>
              </li>
            </ol>
          </motion.div>

          {/* Resend Message */}
          {resendMessage && (
            <motion.div
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4 flex items-start gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">
                {resendMessage}
              </p>
            </motion.div>
          )}

          {/* Resend Error */}
          {resendError && (
            <motion.div
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 flex items-start gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">
                {resendError}
              </p>
            </motion.div>
          )}

          {/* Resend Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <button
              onClick={handleResendEmail}
              disabled={resending || countdown > 0}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                resending || countdown > 0
                  ? "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
            >
              {resending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Resend in {countdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Resend Confirmation Email
                </>
              )}
            </button>
          </motion.div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
                or
              </span>
            </div>
          </div>

          {/* Back to Login */}
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Login
          </Link>
        </div>

        {/* Footer Note */}
        <motion.p
          className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Didn't receive the email? Check your spam folder or try resending.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default ConfirmEmailPage;
