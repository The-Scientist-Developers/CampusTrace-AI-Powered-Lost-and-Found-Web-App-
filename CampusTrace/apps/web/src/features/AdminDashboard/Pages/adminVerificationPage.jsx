import React, { useState, useEffect, useCallback } from "react";
import { supabase, getAccessToken } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { Loader2, Check, X, ShieldCheck, Inbox } from "lucide-react";
import { API_BASE_URL } from "../../../api/apiClient";

const VerificationCard = ({ request, onRespond }) => (
  <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm p-5">
    <div className="flex flex-col md:flex-row gap-5">
      <div className="md:w-1/3">
        <a
          href={request.id_image_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={request.id_image_url}
            alt="University ID"
            className="rounded-lg w-full object-cover cursor-pointer"
          />
        </a>
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-lg text-neutral-800 dark:text-white">
          {request.user.full_name}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {request.user.email}
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          Submitted on: {new Date(request.created_at).toLocaleDateString()}
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onRespond(request.id, request.user_id, true)}
            className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> Approve
          </button>
          <button
            onClick={() => onRespond(request.id, request.user_id, false)}
            className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> Reject
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default function ManualVerificationAdminPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/admin/manual-verifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch requests.");
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRespond = async (verificationId, userId, approve) => {
    const toastId = toast.loading(
      approve ? "Approving user..." : "Rejecting user..."
    );
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/admin/manual-verifications/${verificationId}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ approve, user_id: userId }),
        }
      );
      if (!response.ok) throw new Error("Action failed.");
      toast.success(`User has been ${approve ? "approved" : "rejected"}.`, {
        id: toastId,
      });
      fetchRequests(); // Refresh the list
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary-600" />
          Manual Verification Requests
        </h1>
        <p className="text-neutral-500 dark:text-gray-400 mt-1">
          Review and approve users who signed up with a personal email.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center p-16 bg-white dark:bg-[#2a2a2a] border-2 border-dashed border-neutral-200 dark:border-[#3a3a3a] rounded-xl">
          <Inbox className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-gray-400 text-lg font-medium">
            No pending requests
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((req) => (
            <VerificationCard
              key={req.id}
              request={req}
              onRespond={handleRespond}
            />
          ))}
        </div>
      )}
    </div>
  );
}
