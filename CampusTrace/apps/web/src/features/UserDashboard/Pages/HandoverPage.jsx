import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { API_BASE_URL, supabase } from "../../../api/apiClient";
import {
  Shield,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const HandoverPage = () => {
  const { itemId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role"); // 'claimant' or 'finder'
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [handoverCode, setHandoverCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [handoverData, setHandoverData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role === "claimant") {
      checkExistingHandover();
    }
  }, [role]);

  const checkExistingHandover = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${API_BASE_URL}/api/handover/items/${itemId}/handover-status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.has_handover && !data.verified && !data.expired) {
          setHandoverData(data);
        }
      }
    } catch (err) {
      console.error("Error checking handover:", err);
    }
  };

  const generateHandoverCode = async () => {
    setLoading(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${API_BASE_URL}/api/handover/items/${itemId}/start-handover`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate code");
      }

      const data = await response.json();
      setHandoverCode(data.code);
      setHandoverData(data);
      toast.success("Handover code generated! Show this to the finder.");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyHandoverCode = async () => {
    if (verificationCode.length !== 4) {
      setError("Please enter a 4-digit code");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${API_BASE_URL}/api/handover/items/${itemId}/verify-handover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: verificationCode }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Invalid code");
      }

      toast.success(
        "Item handover verified! The item has been marked as returned. You've earned credit on the leaderboard!"
      );
      setTimeout(() => navigate("/dashboard/my-posts"), 1500);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(handoverCode || handoverData?.code);
    toast.success("Code copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1a1a] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white mb-2">
            Secure Handover
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {role === "claimant"
              ? "Generate a code to verify item pickup"
              : "Enter the code from the claimant"}
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-2xl shadow-lg p-8">
          {role === "claimant" ? (
            // Claimant View - Generate Code
            <>
              {handoverCode || handoverData?.code ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-neutral-800 dark:text-white mb-4">
                      Your Handover Code
                    </p>
                    <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 mb-4">
                      <p className="text-6xl font-bold text-white tracking-widest">
                        {handoverCode || handoverData?.code}
                      </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={copyToClipboard}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span className="font-medium">Copy Code</span>
                      </button>
                      <button
                        onClick={generateHandoverCode}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                        <span className="font-medium">Regenerate</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      Code expires in 24 hours
                    </p>
                  </div>

                  <div className="bg-neutral-50 dark:bg-[#1a1a1a] rounded-xl p-6">
                    <h3 className="font-semibold text-neutral-800 dark:text-white mb-3">
                      Instructions:
                    </h3>
                    <ol className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <li className="flex gap-2">
                        <span className="font-semibold">1.</span>
                        <span>Meet with the finder at the agreed location</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold">2.</span>
                        <span>Show them this 4-digit code</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold">3.</span>
                        <span>They will verify it in their app</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold">4.</span>
                        <span>
                          Once verified, the item is officially returned!
                        </span>
                      </li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <AlertCircle className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mx-auto" />
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">
                      Ready to Pick Up?
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Generate a secure 4-digit code to complete the handover
                      process. You'll show this code to the finder when you
                      meet.
                    </p>
                  </div>
                  <button
                    onClick={generateHandoverCode}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        <span>Generate Code</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            // Finder View - Verify Code
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-neutral-800 dark:text-white mb-4 text-center">
                  Enter 4-Digit Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  maxLength={4}
                  placeholder="1234"
                  className="w-full text-center text-4xl font-bold tracking-widest bg-neutral-50 dark:bg-[#1a1a1a] border-2 border-neutral-300 dark:border-neutral-700 rounded-xl p-6 text-neutral-800 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-300">
                    {error}
                  </p>
                </div>
              )}

              <button
                onClick={verifyHandoverCode}
                disabled={loading || verificationCode.length !== 4}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Verify & Complete</span>
                  </>
                )}
              </button>

              <div className="bg-neutral-50 dark:bg-[#1a1a1a] rounded-xl p-6">
                <h3 className="font-semibold text-neutral-800 dark:text-white mb-3">
                  Verification Steps:
                </h3>
                <ol className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <li className="flex gap-2">
                    <span className="font-semibold">1.</span>
                    <span>Ask the claimant to show their 4-digit code</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">2.</span>
                    <span>Enter the code above</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">3.</span>
                    <span>Tap "Verify & Complete"</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">4.</span>
                    <span>The item will be marked as returned</span>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HandoverPage;
