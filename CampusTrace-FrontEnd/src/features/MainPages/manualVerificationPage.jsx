import React, { useState, useEffect } from "react";
import { supabase, getAccessToken } from "../../api/apiClient";
import { toast } from "react-hot-toast";
import {
  ShieldCheck,
  University,
  UploadCloud,
  Loader2,
  CheckCircle,
} from "lucide-react";

const InputField = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
      {label}
    </label>
    {children}
  </div>
);

export default function ManualVerificationPage() {
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchUniversities = async () => {
      const { data, error } = await supabase
        .from("universities")
        .select("id, name")
        .eq("status", "active");
      if (error) {
        toast.error("Could not load universities.");
      } else {
        setUniversities(data);
      }
    };
    fetchUniversities();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setIdFile(file);
    } else {
      toast.error("Please upload a valid image file.");
      setIdFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUniversity || !idFile) {
      toast.error("Please select your university and upload your ID.");
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading("Submitting for review...");

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Authentication error. Please log in again.");
      }

      const formData = new FormData();
      formData.append("university_id", selectedUniversity);
      formData.append("id_file", idFile);

      const response = await fetch(
        "http://localhost:8000/api/onboarding/submit-manual-verification",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Submission failed.");
      }

      toast.success("Verification Submitted!", { id: toastId });
      setIsSubmitted(true);
    } catch (error) {
      console.error("Submission Error:", error); // Added for better debugging
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
            Verification Submitted!
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Please check your email in the next 24-48 hours for an update on
            your account status.
          </p>
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
            Manual Verification Required
          </h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            To ensure a safe community, please provide your university details
            for manual approval. An administrator will review your submission
            and you'll be notified via email once approved.
          </p>
        </div>

        <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                    Make sure your name and photo are clearly visible. This
                    image is for verification purposes only and will be handled
                    securely.
                  </p>
                </div>
              </div>
            </InputField>

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
      </div>
    </div>
  );
}