import React, { useState, useRef } from "react";
import { supabase } from "../../api/apiClient";
import { useTheme } from "../../contexts/ThemeContext";
import ReCAPTCHA from "react-google-recaptcha";
import toast from "react-hot-toast";

const LockIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
      clipRule="evenodd"
    />
  </svg>
);

const LogoIcon = () => (
  <svg
    className="mx-auto h-12 w-auto text-neutral-700 dark:text-zinc-200"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export default function LoginPage() {
  const { theme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaValue, setCaptchaValue] = useState(null);
  const recaptchaRef = useRef();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!captchaValue) {
      toast.error("Please complete the CAPTCHA.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Processing...");

    try {
      if (isSignUp) {
        // --- Handle Sign Up via our backend for CAPTCHA verification ---
        const response = await fetch("http://localhost:8000/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            captchaToken: captchaValue,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Sign up failed.");
        }

        if (data.user && data.session === null) {
          toast.success(
            "Sign up successful! Please check your email to confirm your account.",
            { id: toastId }
          );
        } else {
          // This case handles auto-confirmation (if enabled in Supabase)
          toast.success("Sign up successful! You are now logged in.", {
            id: toastId,
          });
        }
        // Reset form on successful signup
        setEmail("");
        setPassword("");
      } else {
        // --- Handle Sign In directly with Supabase (it has rate limiting) ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Signed in successfully!", { id: toastId });
        // The onAuthStateChange listener in App.jsx will handle the redirect
      }
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsLoading(false);
      setCaptchaValue(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    }
  };

  return (
    <div className="bg-neutral-100 dark:bg-zinc-950 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <LogoIcon />
          <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-800 dark:text-zinc-100">
            {isSignUp ? "Create an Account" : "Sign in to Campus Trace"}
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-zinc-400">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
              }}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="relative block w-full appearance-none rounded-t-md border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-3 text-neutral-900 dark:text-zinc-100 placeholder-neutral-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm disabled:opacity-50"
                placeholder="University email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="relative block w-full appearance-none rounded-b-md border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-3 text-neutral-900 dark:text-zinc-100 placeholder-neutral-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm disabled:opacity-50"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(value) => setCaptchaValue(value)}
              theme={theme}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !captchaValue}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-3 px-4 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <LockIcon className="h-5 w-5 text-primary-200" />
              </span>
              {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
