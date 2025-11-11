import React, { useState, useEffect } from "react";
import { supabase } from "../../../api/apiClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { AlertTriangle, Loader2, KeyRound, ShieldCheck } from "lucide-react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SectionCard = ({ title, description, children }) => (
  <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm">
    <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-[#3a3a3a]">
      <h2 className="text-lg sm:text-xl font-bold text-neutral-800 dark:text-white">
        {title}
      </h2>
      <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
        {description}
      </p>
    </div>
    <div className="p-4 sm:p-6 space-y-4">{children}</div>
  </div>
);

const SettingToggle = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-3 sm:gap-0">
    <div className="flex-1">
      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {label}
      </span>
      <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
        {description}
      </p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
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
    {/* Accessibility Card */}
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm mb-8">
      <div className="p-6 border-b border-neutral-200 dark:border-[#3a3a3a]">
        <Skeleton height={24} width={150} />
        <Skeleton height={20} width={400} className="mt-1" />
      </div>
      <div className="p-6 space-y-4">
        <Skeleton height={20} width={120} />
        <Skeleton height={16} width={350} />
        <Skeleton height={44} width="100%" borderRadius={8} />
      </div>
    </div>
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

export default function UserSettingsPage() {
  const navigate = useNavigate();
  const {
    colorMode,
    setColorMode,
    fontSize,
    setFontSize,
    contrast,
    setContrast,
    theme,
    toggleTheme,
  } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const [matchNotifications, setMatchNotifications] = useState(true);
  const [claimNotifications, setClaimNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [moderationNotifications, setModerationNotifications] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState(true);

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

        // Fetch profile to check admin role
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (!profileError && profileData) {
          setProfile(profileData);
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

  if (loading) {
    return <UserSettingsPageSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-800 dark:text-white mb-6 sm:mb-8">
        Settings
      </h1>

      {/* Accessibility Section - Color Themes */}
      <SectionCard
        title="Accessibility"
        description="Customize your visual experience with different color themes for better accessibility and awareness."
      >
        <div className="py-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
            Color Theme
          </label>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            Choose a color theme to support various awareness campaigns and
            improve accessibility.
          </p>
          <select
            value={colorMode}
            onChange={(e) => setColorMode(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-lg text-sm sm:text-base text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition appearance-none cursor-pointer"
            style={{ WebkitAppearance: "none", MozAppearance: "none" }}
          >
            <option value="default">🎨 Default (Original Purple)</option>
            <option value="purple">
              💜 Purple - Gender and Development (GAD)
            </option>
            <option value="pink">💗 Pink - Breast Cancer Awareness</option>
            <option value="blue">💙 Blue - Autism Awareness</option>
            <option value="green">💚 Green - Environmental Awareness</option>
          </select>
        </div>

        {/* Font Size Control */}
        <div className="py-2 border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
            Font Size
          </label>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            Adjust the text size for better readability.
          </p>
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-2">
            {[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
              { value: "x-large", label: "X-Large" },
            ].map((size) => (
              <button
                key={size.value}
                onClick={() => setFontSize(size.value)}
                className={`px-3 sm:px-4 py-2.5 rounded-lg text-sm sm:text-base font-medium transition ${
                  fontSize === size.value
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                } sm:flex-1`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* High Contrast Mode */}
        <div className="py-2 border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
          <SettingToggle
            label="High Contrast Mode"
            description="Increase contrast with black backgrounds and white text for better visibility."
            checked={contrast === "high"}
            onChange={() =>
              setContrast(contrast === "high" ? "normal" : "high")
            }
          />
        </div>

        {/* Dark Mode Toggle */}
        <div className="py-2 border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
          <SettingToggle
            label="Dark Mode"
            description="Switch between light and dark theme for comfortable viewing in any environment."
            checked={theme === "dark"}
            onChange={toggleTheme}
          />
        </div>
      </SectionCard>

      {/* Admin Dashboard Access - Only visible to admins */}
      {profile?.role === "admin" && (
        <div className="mt-8">
          <SectionCard
            title="Dashboard Access"
            description="Switch between User and Admin dashboards to manage the platform."
          >
            <div className="py-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary-600" />
                    Admin Dashboard
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Access the admin panel to manage users, moderate posts, view
                    analytics, and configure platform settings.
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigate("/admin");
                    setTimeout(() => window.location.reload(), 100);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-primary-600 text-white font-semibold text-sm rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Go to Admin Panel
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Notification Preferences Section */}
      <div className="mt-8">
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
              className="w-full sm:w-auto px-5 py-2.5 sm:py-2 mt-2 bg-primary-600 text-white font-semibold text-sm rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:ml-auto"
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
      </div>

      {/* Security Section */}
      <div className="mt-8">
        <SectionCard
          title="Security"
          description="Manage your account security and password settings."
        >
          <div className="py-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                  Password
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Update your password to keep your account secure. We recommend
                  changing it regularly.
                </p>
              </div>
              <button
                onClick={() => navigate("/reset-password")}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-primary-600 text-white font-semibold text-sm rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2 flex-shrink-0"
              >
                <KeyRound className="w-4 h-4" />
                Update Password
              </button>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Danger Zone Section */}
      <div className="mt-8 sm:mt-12">
        <h2 className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-500 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          Danger Zone
        </h2>
        <div className="bg-white dark:bg-[#2a2a2a] border border-red-200 dark:border-red-500/30 rounded-xl shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-neutral-800 dark:text-white">
              Delete Your Account
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Once you delete your account, all of your posts and personal data
              will be permanently removed. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-red-600 text-white font-semibold text-sm rounded-lg border border-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center gap-2"
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
