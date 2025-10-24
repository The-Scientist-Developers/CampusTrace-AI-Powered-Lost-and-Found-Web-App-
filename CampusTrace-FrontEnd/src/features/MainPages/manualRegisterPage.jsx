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
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const InputField = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
      {label}
    </label>
    {children}
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
  const recaptchaRef = useRef(null);

  useEffect(() => {
    const fetchUniversities = async () => {
      const { data, error } = await supabase
        .from("universities")
        .select("id, name")
        .eq("status", "active");
      if (error) toast.error("Could not load universities.");
      else setUniversities(data);
    };
    fetchUniversities();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) setIdFile(file);
    else {
      toast.error("Please upload a valid image file.");
      setIdFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !selectedUniversity ||
      !idFile ||
      !formData.fullName ||
      !formData.email ||
      !formData.password
    ) {
      toast.error("Please fill out all fields.");
      return;
    }
    if (formData.password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    // *** NEW: Password Strength Validation ***
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA verification.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Submitting registration...");

    try {
      const submissionForm = new FormData();
      submissionForm.append("full_name", formData.fullName);
      submissionForm.append("email", formData.email);
      submissionForm.append("password", formData.password);
      submissionForm.append("university_id", selectedUniversity);
      submissionForm.append("id_file", idFile);
      submissionForm.append("captchaToken", captchaToken);

      const response = await fetch(`${API_BASE_URL}/api/auth/signup-manual`, {
        method: "POST",
        body: submissionForm,
      });

      const data = await response.json();
      if (!response.ok) {
        // Handle specific weak password error from backend
        if (data.detail && data.detail.toLowerCase().includes("password")) {
          throw new Error(
            "Password is too weak. Please include uppercase, lowercase, numbers, and symbols."
          );
        }
        throw new Error(data.detail || "Submission failed.");
      }

      toast.success("Registration Submitted!", { id: toastId });
      setIsSubmitted(true);
    } catch (error) {
      toast.error(error.message, { id: toastId });
      recaptchaRef.current?.reset();
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
            {/* Form Fields */}
            <InputField label="Full Name">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                  className="form-input w-full pl-10"
                  placeholder="John Doe"
                />
              </div>
            </InputField>
            <InputField label="Personal Email">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="form-input w-full pl-10"
                  placeholder="you@gmail.com"
                />
              </div>
            </InputField>
            <InputField label="Password">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="form-input w-full pl-10"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </InputField>
            <InputField label="Confirm Password">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="form-input w-full pl-10"
                  placeholder="Re-enter your password"
                />
              </div>
            </InputField>
            <InputField label="Select Your University">
              <div className="relative">
                <University className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  required
                  className="form-select w-full pl-10"
                >
                  <option value="" disabled>
                    Select a university...
                  </option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </select>
              </div>
            </InputField>

            <InputField label="Upload a clear photo of your University ID">
              <div className="mt-2 flex justify-center p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
                <div className="text-center">
                  {idFile ? (
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {idFile.name}
                    </div>
                  ) : (
                    <UploadCloud className="mx-auto w-12 h-12 text-neutral-400 dark:text-neutral-500" />
                  )}
                  <div className="mt-4 flex text-sm">
                    <label
                      htmlFor="id-upload"
                      className="relative cursor-pointer rounded-md bg-white dark:bg-[#2a2a2a] font-semibold text-primary-600 hover:text-primary-500"
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
                </div>
              </div>
            </InputField>

            <div className="flex justify-center pt-2">
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
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
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
