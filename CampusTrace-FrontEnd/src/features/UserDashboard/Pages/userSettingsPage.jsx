import React, { useState, useEffect } from "react";
import { supabase } from "../../../api/apiClient";
import { Bell, AlertTriangle, Trash2, Loader2, LogOut } from "lucide-react";

const SectionCard = ({ title, description, children }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg">
    <div className="p-6 border-b border-neutral-800">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-sm text-neutral-400 mt-1">{description}</p>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

const SettingToggle = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <span className="text-sm font-medium text-neutral-200">{label}</span>
      <p className="text-xs text-neutral-500">{description}</p>
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
        className={`w-11 h-6 bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
          disabled ? "cursor-not-allowed" : "peer-checked:bg-red"
        }`}
      ></div>
    </label>
  </div>
);

export default function UserSettingsPage({ user }) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [matchNotifications, setMatchNotifications] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

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

  if (loading && false) {
    return (
      <div className="p-8 text-center text-zinc-400">Loading settings...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <h1 className="text-4xl font-bold text-white mb-8">Settings</h1>

      {/* --- Notification Settings --- */}
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
        <div className="text-right">
          <button
            onClick={handlePreferencesSave}
            disabled={isSaving}
            className="px-5 py-2 mt-2 bg-red text-white font-semibold text-sm rounded-lg hover:bg-red/80 transition disabled:opacity-50"
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
        <h2 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2">
          <AlertTriangle />
          Danger Zone
        </h2>
        <div className="bg-neutral-900 border border-red-500/30 rounded-xl shadow-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white">Delete Your Account</h3>
            <p className="text-sm text-neutral-400 mt-1 max-w-lg">
              Once you delete your account, all of your posts and personal data
              will be permanently removed. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="px-4 py-2 bg-red/80 text-white font-semibold text-sm rounded-lg border border-red hover:bg-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
