import React, { useState, useEffect } from "react"; // Added useEffect
import { supabase } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { AlertTriangle, Loader2 } from "lucide-react";

// --- 1. SKELETON IMPORTS ---
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// --- (No changes to SectionCard) ---
const SectionCard = ({ title, description, children }) => (
  <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm">
    <div className="p-6 border-b border-neutral-200 dark:border-[#3a3a3a]">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-white">
        {title}
      </h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
        {description}
      </p>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

// --- (No changes to SettingToggle) ---
const SettingToggle = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {label}
      </span>
      <p className="text-xs text-neutral-500 dark:text-neutral-500">
        {description}
      </p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div
        className={`w-11 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "peer-checked:bg-primary-600"
        }`}
      ></div>
    </label>
  </div>
);

// --- 2. SKELETON COMPONENTS ---

const SettingToggleSkeleton = () => (
  <div className="flex items-center justify-between py-2">
    <div>
      <Skeleton height={20} width={150} /> {/* Label */}
      <Skeleton height={16} width={250} className="mt-1" /> {/* Description */}
    </div>
    <Skeleton width={44} height={24} borderRadius={999} />{" "}
    {/* Toggle (w-11 h-6) */}
  </div>
);

const UserSettingsPageSkeleton = () => (
  <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <Skeleton height={40} width={200} className="mb-8" /> {/* Page Title */}
    {/* Notification Preferences Card */}
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm">
      <div className="p-6 border-b border-neutral-200 dark:border-[#3a3a3a]">
        <Skeleton height={24} width={250} /> {/* Card Title */}
        <Skeleton height={20} width={350} className="mt-1" />{" "}
        {/* Card Description */}
      </div>
      <div className="p-6 space-y-4">
        <SettingToggleSkeleton />
        <SettingToggleSkeleton />
        <div className="text-right pt-2">
          <Skeleton height={38} width={130} borderRadius={8} />{" "}
          {/* Save Button */}
        </div>
      </div>
    </div>
    {/* Danger Zone Card */}
    <div className="mt-12">
      <Skeleton height={24} width={150} className="mb-2" />{" "}
      {/* Danger Zone Title */}
      <div className="bg-white dark:bg-[#2a2a2a] border border-red-200 dark:border-red-500/30 rounded-xl shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Skeleton height={20} width={200} /> {/* Delete Title */}
          <Skeleton height={16} width={350} className="mt-2" />{" "}
          {/* Delete Description */}
          <Skeleton height={16} width={300} className="mt-1" />
        </div>
        <Skeleton height={38} width={130} borderRadius={8} />{" "}
        {/* Delete Button */}
      </div>
    </div>
  </div>
);

// --- 3. ADJUSTABLE DELAY (in milliseconds) ---
// This page is static, so we simulate a load time.
const loadingDelay = 1000; // 1 second

export default function UserSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [matchNotifications, setMatchNotifications] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  // --- 4. ADD LOADING STATE ---
  const [loading, setLoading] = useState(true);

  // --- 5. ADD USEEFFECT FOR SIMULATED DELAY ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, loadingDelay);

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, []); // Empty array ensures this runs only once on mount

  // --- (No changes to handlers: handlePreferencesSave, handleDeleteAccount) ---
  const handlePreferencesSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Notification preferences saved!");
    setIsSaving(false);
  };

  const handleDeleteAccount = async () => {
    const confirmationText = "DELETE";
    const promptResponse = window.prompt(
      `This action is irreversible. You will lose all your posts and data. To confirm, please type "${confirmationText}" below:`
    );

    if (promptResponse !== confirmationText) {
      toast.error("Deletion cancelled. Confirmation text did not match.");
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_user_account");
      if (error) throw error;

      toast.success("Account deleted successfully. You will be logged out.");
      await supabase.auth.signOut();
    } catch (err) {
      toast.error("Failed to delete account.");
      console.error("Error deleting account:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- 6. ADD LOADING CHECK ---
  if (loading) {
    return <UserSettingsPageSkeleton />;
  }

  // --- (No changes to final JSX return) ---
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <h1 className="text-4xl font-bold text-neutral-800 dark:text-white mb-8">
        Settings
      </h1>

      <SectionCard
        title="Notification Preferences"
        description="Choose how you receive updates from Campus Trace."
      >
        <SettingToggle
          label="Potential Match Alerts"
          description="Receive an email when a 'Found' item matches one of your 'Lost' items."
          checked={matchNotifications}
          onChange={() => setMatchNotifications(!matchNotifications)}
        />
        <SettingToggle
          label="Weekly Summary"
          description="Get a weekly digest of new items posted at your university."
          checked={weeklySummary}
          onChange={() => setWeeklySummary(!weeklySummary)}
        />
        <div className="text-right pt-2">
          <button
            onClick={handlePreferencesSave}
            disabled={isSaving}
            className="px-5 py-2 mt-2 bg-primary-600 text-white font-semibold text-sm rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </SectionCard>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-500 mb-2 flex items-center gap-2">
          <AlertTriangle />
          Danger Zone
        </h2>
        <div className="bg-white dark:bg-[#2a2a2a] border border-red-200 dark:border-red-500/30 rounded-xl shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-neutral-800 dark:text-white">
              Delete Your Account
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-lg">
              Once you delete your account, all of your posts and personal data
              will be permanently removed. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg border border-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Delete Account"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
