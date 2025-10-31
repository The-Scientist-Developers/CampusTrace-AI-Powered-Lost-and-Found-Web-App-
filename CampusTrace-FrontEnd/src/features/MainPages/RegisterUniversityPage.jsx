import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../api/apiClient";
import {
  Building,
  User,
  Mail,
  Lock,
  Loader2,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

export default function RegisterUniversityPage() {
  const [universityName, setUniversityName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");
    const toastId = toast.loading("Registering university...");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/onboarding/register-university`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            university_name: universityName,
            full_name: fullName,
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to register university.");
      }

      toast.success("Registration successful! Please check your email.", {
        id: toastId,
      });
      setIsSubmitted(true); // Show the verification message
    } catch (error) {
      setError(error.message);
      toast.error(error.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center bg-white dark:bg-[#2a2a2a] p-8 rounded-xl shadow-lg border border-neutral-200 dark:border-[#3a3a3a]">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">
            Registration Successful!
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            A verification link has been sent to your email address. Please
            check your inbox and click the link to activate your account.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
          >
            Back to Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-100 dark:bg-[#1a1a1a] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-800 dark:text-zinc-100">
            Register Your University
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-gray-400">
            Create an admin account to get started with Campus Trace.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <InputField
              icon={Building}
              type="text"
              placeholder="University Name"
              value={universityName}
              onChange={(e) => setUniversityName(e.target.value)}
              required
            />
            <InputField
              icon={User}
              type="text"
              placeholder="Your Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <InputField
              icon={Mail}
              type="email"
              placeholder="Your University Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <InputField
              icon={Lock}
              type="password"
              placeholder="Create a Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <InputField
              icon={Lock}
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center pt-2">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-3 px-4 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                "Register & Create Account"
              )}
            </button>
          </div>
        </form>
        <div className="space-y-4 text-center text-sm text-neutral-600 dark:text-gray-400">
          <p>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const InputField = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      <Icon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
    </div>
    <input
      {...props}
      className="block w-full rounded-md border-0 py-3 pl-10 text-neutral-900 dark:text-white bg-white dark:bg-[#2a2a2a] ring-1 ring-inset ring-neutral-300 dark:ring-zinc-700 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
    />
  </div>
);
