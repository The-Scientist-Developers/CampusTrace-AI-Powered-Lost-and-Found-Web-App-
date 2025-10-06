import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/apiClient"; // Make sure this path is correct
import { Toaster, toast } from "react-hot-toast"; // For notifications
import { Settings as SettingsIcon, ShieldCheck, Users } from "lucide-react";

const SectionCard = ({ title, description, icon: Icon, children }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg p-6 mb-8">
    <div className="flex items-start gap-4 mb-4">
      {Icon && <Icon className="w-6 h-6 text-red mt-1 flex-shrink-0" />}
      <div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-neutral-400 text-sm">{description}</p>
      </div>
    </div>
    <div className="space-y-4 pt-4 border-t border-neutral-800">{children}</div>
  </div>
);

const SettingInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
}) => (
  <div>
    <label className="block text-sm font-medium text-neutral-300 mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:ring-2 focus:ring-red focus:border-red outline-none transition ${className}`}
    />
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
      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red"></div>
    </label>
  </div>
);

const SubmitButton = ({
  onClick,
  loading,
  label,
  loadingLabel = "Saving...",
  className = "",
}) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`w-full py-2.5 px-4 bg-red text-white font-semibold rounded-lg hover:bg-red/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {loading ? loadingLabel : label}
  </button>
);

// --- Main AdminSettings Component ---

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // States for each setting
  const [siteName, setSiteName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [autoApprovePosts, setAutoApprovePosts] = useState(false);
  const [keywordBlacklist, setKeywordBlacklist] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");

  // Fetches settings from the 'site_settings' table when the component loads
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("site_settings").select("*");

      if (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings.");
        setLoading(false);
        return;
      }

      // Convert the array of settings from the DB into a simple key-value object
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});

      // Set the state with values from the database, providing defaults
      setSiteName(settingsMap.site_name || "Campus Trace");
      setContactEmail(settingsMap.contact_email || "");
      setAutoApprovePosts(settingsMap.auto_approve_posts === "true"); // Convert string 'true'/'false' to boolean

      try {
        const keywords = JSON.parse(settingsMap.keyword_blacklist || "[]");
        setKeywordBlacklist(keywords);
      } catch (e) {
        console.error("Failed to parse keyword blacklist:", e);
        setKeywordBlacklist([]);
      }

      setLoading(false);
    };

    fetchSettings();
  }, []);

  // Saves all current settings back to the database
  const handleSaveSettings = useCallback(async () => {
    setIsSaving(true);

    // Prepare the data in the format Supabase expects for an upsert
    const updates = [
      { setting_key: "site_name", setting_value: siteName },
      { setting_key: "contact_email", setting_value: contactEmail },
      {
        setting_key: "auto_approve_posts",
        setting_value: autoApprovePosts.toString(),
      },
      {
        setting_key: "keyword_blacklist",
        setting_value: JSON.stringify(keywordBlacklist),
      },
    ];

    try {
      // 'upsert' will INSERT new settings and UPDATE existing ones
      const { error } = await supabase
        .from("site_settings")
        .upsert(updates, { onConflict: "setting_key" });
      if (error) throw error;
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(`Failed to save settings: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [siteName, contactEmail, autoApprovePosts, keywordBlacklist]);

  // Handler to add a new keyword to the blacklist
  const handleAddKeyword = () => {
    const newKeyword = keywordInput.trim().toLowerCase();
    if (newKeyword && !keywordBlacklist.includes(newKeyword)) {
      setKeywordBlacklist([...keywordBlacklist, newKeyword]);
    }
    setKeywordInput(""); // Clear the input field
  };

  // Handler to remove a keyword
  const handleRemoveKeyword = (keywordToRemove) => {
    setKeywordBlacklist(keywordBlacklist.filter((k) => k !== keywordToRemove));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8 text-zinc-400">
        <SettingsIcon className="w-8 h-8 animate-spin mr-3" />
        Loading Settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fadeIn">
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "bg-zinc-800 text-white border border-zinc-700",
        }}
      />

      <h1 className="text-3xl font-bold text-white mb-8">Admin Settings</h1>

      {/* General Settings */}
      <SectionCard
        title="General"
        description="Configure basic information and core functionality."
        icon={SettingsIcon}
      >
        <SettingInput
          label="Site Name"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
        />
        <SettingInput
          label="Public Contact Email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="e.g., support@yourschool.edu"
        />
      </SectionCard>

      {/* Content Moderation Settings */}
      <SectionCard
        title="Content Moderation"
        description="Set rules for post approval and content filtering."
        icon={ShieldCheck}
      >
        <SettingToggle
          label="Auto-Approve New Posts"
          description={
            autoApprovePosts
              ? "New posts will appear immediately."
              : "Posts will require manual approval."
          }
          checked={autoApprovePosts}
          onChange={() => setAutoApprovePosts(!autoApprovePosts)}
        />
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Keyword Blacklist
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Add a forbidden word..."
              className="flex-grow p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 focus:ring-2 focus:ring-red"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
            />
            <button
              onClick={handleAddKeyword}
              className="px-4 py-2 bg-zinc-700 text-white font-semibold text-sm rounded-lg hover:bg-zinc-600 transition"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Posts containing these words will be automatically flagged for
            review.
          </p>
          {keywordBlacklist.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {keywordBlacklist.map((keyword) => (
                <span
                  key={keyword}
                  className="bg-zinc-700 text-zinc-200 pl-3 pr-2 py-1 rounded-full flex items-center gap-2"
                >
                  {keyword}
                  <button
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="hover:text-red"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Global Save Button */}
      <div className="mt-8">
        <SubmitButton
          onClick={handleSaveSettings}
          loading={isSaving}
          label="Save All Settings"
        />
      </div>
    </div>
  );
}
