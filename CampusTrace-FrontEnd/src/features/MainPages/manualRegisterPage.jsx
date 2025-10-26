import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, getAccessToken } from "../../api/apiClient";
import { toast } from "react-hot-toast";
import ReCAPTCHA from "react-google-recaptcha";
import {
  ShieldCheck,
  University,
  UploadCloud,
  Loader2,
  CheckCircle,
  User,
  Mail,
  Lock,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const InputField = ({ label, children, error }) => (
  <div>
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
      {label}
    </label>
    {children}
    {error && (
      <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="w-4 h-4 mr-1" />
        {error}
      </div>
    )}
  </div>
);

export default function ManualRegisterPage() {
  const [universities, setUniversities] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const recaptchaRef = useRef(null);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const { data, error } = await supabase
          .from("universities")
          .select("id, name")
          .eq("status", "active");

        if (error) {
          console.error("Error fetching universities:", error);
          toast.error("Could not load universities. Please refresh the page.");
        } else if (data) {
          setUniversities(data);
        }
      } catch (error) {
        console.error("Unexpected error fetching universities:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    };
    fetchUniversities();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    // Confirm Password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // University validation
    if (!selectedUniversity) {
      newErrors.university = "Please select your university";
    }

    // ID File validation
    if (!idFile) {
      newErrors.idFile = "Please upload your university ID";
    }

    // CAPTCHA validation
    if (!captchaToken) {
      newErrors.captcha = "Please complete the CAPTCHA verification";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setErrors({ ...errors, idFile: null });
      setIdFile(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors({
        ...errors,
        idFile: "Please upload a valid image file (JPG, PNG, or WEBP)",
      });
      setIdFile(null);
      toast.error("Please upload a valid image file.");
      e.target.value = null;
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, idFile: "File size must be less than 5MB" });
      setIdFile(null);
      toast.error("File size must be less than 5MB.");
      e.target.value = null;
      return;
    }

    setIdFile(file);
    setErrors({ ...errors, idFile: null });
  };

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
    if (token) {
      setErrors({ ...errors, captcha: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast.error("Please fix all errors before submitting.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Submitting registration...");

    try {
      const submissionForm = new FormData();
      submissionForm.append("full_name", formData.fullName.trim());
      submissionForm.append("email", formData.email.trim().toLowerCase());
      submissionForm.append("password", formData.password);
      submissionForm.append("university_id", selectedUniversity);
      submissionForm.append("id_file", idFile);
      submissionForm.append("captchaToken", captchaToken);

      let response;
      let data;

      try {
        response = await fetch(`${API_BASE_URL}/api/auth/signup-manual`, {
          method: "POST",
          body: submissionForm,
        });

        // Try to parse JSON response
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("Failed to parse response as JSON:", jsonError);
          throw new Error(
            "Server returned an invalid response. Please try again later."
          );
        }
      } catch (fetchError) {
        console.error("Network error during fetch:", fetchError);
        if (
          fetchError.message.includes("Failed to fetch") ||
          fetchError.message.includes("NetworkError")
        ) {
          throw new Error(
            "Network error. Please check your internet connection and try again."
          );
        }
        throw new Error(
          "Unable to connect to the server. Please try again later."
        );
      }

      if (!response.ok) {
        const errorDetail = data.detail || data.message || "";
        console.error("Server error response:", response.status, errorDetail);

        // Handle specific backend errors
        if (
          errorDetail.toLowerCase().includes("already exists") ||
          errorDetail.toLowerCase().includes("duplicate")
        ) {
          setErrors({
            ...errors,
            email: "A user with this email already exists",
          });
          throw new Error("A user with this email already exists.");
        }
        if (
          errorDetail.toLowerCase().includes("invalid id file type") ||
          errorDetail.toLowerCase().includes("file type")
        ) {
          setErrors({ ...errors, idFile: "Invalid file type" });
          throw new Error(
            "Invalid ID file type. Please upload JPG, PNG, or WEBP."
          );
        }
        if (
          errorDetail.toLowerCase().includes("password") &&
          errorDetail.toLowerCase().includes("weak")
        ) {
          setErrors({ ...errors, password: "Password is too weak" });
          throw new Error(
            "Password is too weak. Please include uppercase, lowercase, numbers, and symbols."
          );
        }
        if (
          errorDetail.toLowerCase().includes("captcha") ||
          errorDetail.toLowerCase().includes("recaptcha")
        ) {
          setErrors({ ...errors, captcha: "CAPTCHA verification failed" });
          throw new Error("CAPTCHA verification failed. Please try again.");
        }
        if (errorDetail.toLowerCase().includes("university")) {
          setErrors({ ...errors, university: "Invalid university selection" });
          throw new Error(
            "Invalid university selected. Please choose a valid university."
          );
        }
        if (
          errorDetail.toLowerCase().includes("email") &&
          errorDetail.toLowerCase().includes("invalid")
        ) {
          setErrors({ ...errors, email: "Invalid email format" });
          throw new Error(
            "Invalid email format. Please enter a valid email address."
          );
        }

        // HTTP status code specific errors
        if (response.status === 400) {
          throw new Error(
            errorDetail ||
              "Invalid request. Please check your information and try again."
          );
        }
        if (response.status === 403) {
          throw new Error(
            "Access denied. Please try again or contact support."
          );
        }
        if (response.status === 409) {
          throw new Error(
            "This email is already registered. Please use a different email."
          );
        }
        if (response.status === 413) {
          throw new Error(
            "File size too large. Please upload a smaller image (max 5MB)."
          );
        }
        if (response.status === 429) {
          throw new Error(
            "Too many requests. Please wait a few minutes and try again."
          );
        }
        if (response.status >= 500) {
          throw new Error(
            "Server error. Please try again later or contact support."
          );
        }

        throw new Error(errorDetail || "Submission failed. Please try again.");
      }

      toast.success("Registration Submitted!", { id: toastId });
      setIsSubmitted(true);
    } catch (error) {
      console.error("Registration error:", error);

      // Display user-friendly error message
      const errorMessage =
        error.message || "An unexpected error occurred. Please try again.";
      toast.error(errorMessage, { id: toastId });

      // Reset CAPTCHA on error
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.reset();
        } catch (resetError) {
          console.error("Failed to reset CAPTCHA:", resetError);
        }
      }
      setCaptchaToken(null);
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
            Registration Submitted!
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Please check your email to confirm your account. You will receive
            another email once an administrator has approved your request.
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
    <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary-600 mb-4" />
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">
            Register with a Personal Email
          </h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Provide your details and a photo of your university ID for manual
            account approval.
          </p>
        </div>

        <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Field */}
            <InputField label="Full Name" error={errors.fullName}>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    setErrors({ ...errors, fullName: null });
                  }}
                  className={`w-full pl-10 px-4 py-2 bg-white dark:bg-[#1a1a1a] border ${
                    errors.fullName
                      ? "border-red-500 dark:border-red-500"
                      : "border-neutral-300 dark:border-neutral-600"
                  } rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400`}
                  placeholder="John Doe"
                />
              </div>
            </InputField>

            {/* Email Field */}
            <InputField label="Personal Email" error={errors.email}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors({ ...errors, email: null });
                  }}
                  className={`w-full pl-10 px-4 py-2 bg-white dark:bg-[#1a1a1a] border ${
                    errors.email
                      ? "border-red-500 dark:border-red-500"
                      : "border-neutral-300 dark:border-neutral-600"
                  } rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400`}
                  placeholder="you@gmail.com"
                />
              </div>
            </InputField>

            {/* Password Field */}
            <InputField label="Password" error={errors.password}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setErrors({ ...errors, password: null });
                  }}
                  className={`w-full pl-10 px-4 py-2 bg-white dark:bg-[#1a1a1a] border ${
                    errors.password
                      ? "border-red-500 dark:border-red-500"
                      : "border-neutral-300 dark:border-neutral-600"
                  } rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400`}
                  placeholder="Minimum 6 characters"
                />
              </div>
            </InputField>

            {/* Confirm Password Field */}
            <InputField label="Confirm Password" error={errors.confirmPassword}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors({ ...errors, confirmPassword: null });
                  }}
                  className={`w-full pl-10 px-4 py-2 bg-white dark:bg-[#1a1a1a] border ${
                    errors.confirmPassword
                      ? "border-red-500 dark:border-red-500"
                      : "border-neutral-300 dark:border-neutral-600"
                  } rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400`}
                  placeholder="Re-enter your password"
                />
              </div>
            </InputField>

            {/* University Field */}
            <InputField
              label="Select Your University"
              error={errors.university}
            >
              <div className="relative">
                <University className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none z-10" />
                <select
                  value={selectedUniversity}
                  onChange={(e) => {
                    setSelectedUniversity(e.target.value);
                    setErrors({ ...errors, university: null });
                  }}
                  className={`w-full pl-10 px-4 py-2 bg-white dark:bg-[#1a1a1a] border ${
                    errors.university
                      ? "border-red-500 dark:border-red-500"
                      : "border-neutral-300 dark:border-neutral-600"
                  } rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 appearance-none`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="" className="text-neutral-400">
                    Select a university...
                  </option>
                  {universities.map((uni) => (
                    <option
                      key={uni.id}
                      value={uni.id}
                      className="text-neutral-900 dark:text-neutral-100"
                    >
                      {uni.name}
                    </option>
                  ))}
                </select>
              </div>
            </InputField>

            {/* ID Upload Field */}
            <InputField
              label="Upload a clear photo of your University ID"
              error={errors.idFile}
            >
              <div
                className={`mt-2 flex justify-center p-6 border-2 border-dashed ${
                  errors.idFile
                    ? "border-red-500 dark:border-red-500"
                    : "border-neutral-300 dark:border-neutral-700"
                } rounded-lg hover:border-primary-400 dark:hover:border-primary-500 transition-colors`}
              >
                <div className="text-center">
                  {idFile ? (
                    <div className="font-medium text-green-600 dark:text-green-400">
                      <CheckCircle className="mx-auto w-8 h-8 mb-2" />
                      {idFile.name}
                    </div>
                  ) : (
                    <UploadCloud className="mx-auto w-12 h-12 text-neutral-400 dark:text-neutral-500" />
                  )}
                  <div className="mt-4 flex justify-center text-sm">
                    <label
                      htmlFor="id-upload"
                      className="relative cursor-pointer rounded-md font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                    >
                      <span>{idFile ? "Change file" : "Upload a file"}</span>
                      <input
                        id="id-upload"
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                    JPG, PNG, or WEBP up to 5MB
                  </p>
                </div>
              </div>
            </InputField>

            {/* CAPTCHA Field */}
            <div>
              <div className="flex justify-center pt-2">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={handleCaptchaChange}
                  onExpired={() => {
                    setCaptchaToken(null);
                    setErrors({
                      ...errors,
                      captcha: "CAPTCHA expired, please verify again",
                    });
                  }}
                  onErrored={() => {
                    setCaptchaToken(null);
                    setErrors({
                      ...errors,
                      captcha: "CAPTCHA error, please try again",
                    });
                    toast.error("CAPTCHA error. Please try again.");
                  }}
                  theme={
                    window.matchMedia("(prefers-color-scheme: dark)").matches
                      ? "dark"
                      : "light"
                  }
                />
              </div>
              {errors.captcha && (
                <div className="mt-2 flex items-center justify-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.captcha}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit for Review"
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
