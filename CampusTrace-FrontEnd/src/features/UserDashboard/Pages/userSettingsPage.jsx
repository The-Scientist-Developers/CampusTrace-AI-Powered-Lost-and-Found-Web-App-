import React, { useState, useEffect } from "react";
import { supabase } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { AlertTriangle, Loader2 } from "lucide-react";
import axios from "axios";

// --- Skeleton Imports ---
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// --- Section Card Component ---
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

// --- Setting Toggle Component ---
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

// --- Skeleton Components ---
const SettingToggleSkeleton = () => (
  <div className="flex items-center justify-between py-2">
    <div>
      <Skeleton height={20} width={150} />
      <Skeleton height={16} width={250} className="mt-1" />
    </div>
    <Skeleton width={44} height={24} borderRadius={999} />
  </div>
);

const UserSettingsPageSkeleton = () => (
  <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <Skeleton height={40} width={200} className="mb-8" />
    {/* Notification Preferences Card */}
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm">
      <div className="p-6 border-b border-neutral-200 dark:border-[#3a3a3a]">
        <Skeleton height={24} width={250} />
        <Skeleton height={20} width={350} className="mt-1" />
      </div>
      <div className="p-6 space-y-4">
        <SettingToggleSkeleton />
        <SettingToggleSkeleton />
        <SettingToggleSkeleton />
        <SettingToggleSkeleton />
        <SettingToggleSkeleton />
        <div className="text-right pt-2">
          <Skeleton height={38} width={130} borderRadius={8} />
        </div>
      </div>
    </div>
    {/* Danger Zone Card */}
    <div className="mt-12">
      <Skeleton height={24} width={150} className="mb-2" />
      <div className="bg-white dark:bg-[#2a2a2a] border border-red-200 dark:border-red-500/30 rounded-xl shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Skeleton height={20} width={200} />
          <Skeleton height={16} width={350} className="mt-2" />
          <Skeleton height={16} width={300} className="mt-1" />
        </div>
        <Skeleton height={38} width={130} borderRadius={8} />
      </div>
    </div>
  </div>
);

// --- Main Component ---
export default function UserSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  // State for all notification preferences
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [claimNotifications, setClaimNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [moderationNotifications, setModerationNotifications] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState(true);

  // Fetch user preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          toast.error("You must be logged in");
          setLoading(false);
          return;
        }

        const response = await axios.get("/api/profile/preferences", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.data.preferences) {
          const prefs = response.data.preferences;
          setMatchNotifications(prefs.match_notifications ?? true);
          setClaimNotifications(prefs.claim_notifications ?? true);
          setMessageNotifications(prefs.message_notifications ?? true);
          setModerationNotifications(prefs.moderation_notifications ?? true);
          setEmailNotificationsEnabled(
            prefs.email_notifications_enabled ?? true
          );
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
        toast.error("Failed to load preferences");
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Save preferences handler
  const handlePreferencesSave = async () => {
    setIsSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      await axios.put(
        "/api/profile/preferences",
        {
          match_notifications: matchNotifications,
          claim_notifications: claimNotifications,
          message_notifications: messageNotifications,
          moderation_notifications: moderationNotifications,
          email_notifications_enabled: emailNotificationsEnabled,
        },
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      toast.success("Notification preferences saved!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete account handler
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

  // Show loading skeleton
  if (loading) {
    return <UserSettingsPageSkeleton />;
  }

  // Main render
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <h1 className="text-4xl font-bold text-neutral-800 dark:text-white mb-8">
        Settings
      </h1>

      {/* Notification Preferences Section */}
      <SectionCard
        title="Notification Preferences"
        description="Choose how and when you receive updates from Campus Trace."
      >
        {/* Email Master Toggle */}
        <div className="pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-700">
          <SettingToggle
            label="Email Notifications"
            description="Master switch for all email notifications. Disable to stop receiving any emails from Campus Trace."
            checked={emailNotificationsEnabled}
            onChange={() =>
              setEmailNotificationsEnabled(!emailNotificationsEnabled)
            }
          />
        </div>

        {/* Individual Notification Settings */}
        <div
          className={
            emailNotificationsEnabled ? "" : "opacity-50 pointer-events-none"
          }
        >
          <SettingToggle
            label="Potential Match Alerts"
            description="Get notified when a 'Found' item matches one of your 'Lost' items."
            checked={matchNotifications}
            onChange={() => setMatchNotifications(!matchNotifications)}
            disabled={!emailNotificationsEnabled}
          />
          <SettingToggle
            label="Claim Notifications"
            description="Receive alerts when someone claims your found item or responds to your claim."
            checked={claimNotifications}
            onChange={() => setClaimNotifications(!claimNotifications)}
            disabled={!emailNotificationsEnabled}
          />
          <SettingToggle
            label="Message Notifications"
            description="Get notified when you receive a new message in your conversations."
            checked={messageNotifications}
            onChange={() => setMessageNotifications(!messageNotifications)}
            disabled={!emailNotificationsEnabled}
          />
          <SettingToggle
            label="Moderation Updates"
            description="Receive notifications about the status of your posts (approved, pending, rejected)."
            checked={moderationNotifications}
            onChange={() =>
              setModerationNotifications(!moderationNotifications)
            }
            disabled={!emailNotificationsEnabled}
          />
        </div>

        <div className="text-right pt-2">
          <button
            onClick={handlePreferencesSave}
            disabled={isSaving}
            className="px-5 py-2 mt-2 bg-primary-600 text-white font-semibold text-sm rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </SectionCard>

      {/* Danger Zone Section */}
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
            className="px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg border border-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Account"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
