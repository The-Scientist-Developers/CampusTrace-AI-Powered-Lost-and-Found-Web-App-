import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../api/apiClient";
import { Toaster, toast } from "react-hot-toast";
import { Settings as SettingsIcon, ShieldCheck, Loader2 } from "lucide-react";

const SectionCard = ({ title, description, icon: Icon, children }) => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
    <div className="p-6">
      <div className="flex items-start gap-4">
        {Icon && (
          <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
        )}
        <div>
          <h3 className="text-xl font-bold text-neutral-800 dark:text-white">
            {title}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {description}
          </p>
        </div>
      </div>
    </div>
    <div className="space-y-4 p-6 border-t border-neutral-200 dark:border-neutral-800">
      {children}
    </div>
  </div>
);

const SettingInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
}) => (
  <div>
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="form-input w-full"
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
      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
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
      <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
    </label>
  </div>
);

const SubmitButton = ({
  onClick,
  loading,
  label,
  loadingLabel = "Saving...",
}) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="w-full py-2.5 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
  >
    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : label}
  </button>
);

export default function AdminSettingsPage({ user }) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [autoApprovePosts, setAutoApprovePosts] = useState(false);
  const [keywordBlacklist, setKeywordBlacklist] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [adminUniversityId, setAdminUniversityId] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      toast.error("User not found. Cannot load settings.");
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("university_id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.university_id) {
          throw new Error("Could not determine admin's university.");
        }

        const universityId = profile.university_id;
        setAdminUniversityId(universityId);

        const { data, error } = await supabase
          .from("site_settings")
          .select("*")
          .eq("university_id", universityId);

        if (error) throw error;

        const settingsMap = data.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {});

        setSiteName(settingsMap.site_name || "Campus Trace");
        setContactEmail(settingsMap.contact_email || "");
        setAutoApprovePosts(settingsMap.auto_approve_posts === "true");
        setKeywordBlacklist(JSON.parse(settingsMap.keyword_blacklist || "[]"));
      } catch (err) {
        console.error("Error fetching settings:", err);
        toast.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleSaveSettings = useCallback(async () => {
    if (!adminUniversityId) {
      toast.error("Cannot save settings without a university ID.");
      return;
    }

    setIsSaving(true);
    const updates = [
      {
        university_id: adminUniversityId,
        setting_key: "site_name",
        setting_value: siteName,
      },
      {
        university_id: adminUniversityId,
        setting_key: "contact_email",
        setting_value: contactEmail,
      },
      {
        university_id: adminUniversityId,
        setting_key: "auto_approve_posts",
        setting_value: autoApprovePosts.toString(),
      },
      {
        university_id: adminUniversityId,
        setting_key: "keyword_blacklist",
        setting_value: JSON.stringify(keywordBlacklist),
      },
    ];

    try {
      const { error } = await supabase.from("site_settings").upsert(updates);
      if (error) throw error;
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(`Failed to save settings: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [
    siteName,
    contactEmail,
    autoApprovePosts,
    keywordBlacklist,
    adminUniversityId,
  ]);

  const handleAddKeyword = () => {
    const newKeyword = keywordInput.trim().toLowerCase();
    if (newKeyword && !keywordBlacklist.includes(newKeyword)) {
      setKeywordBlacklist([...keywordBlacklist, newKeyword]);
    }
    setKeywordInput("");
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    setKeywordBlacklist(keywordBlacklist.filter((k) => k !== keywordToRemove));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8 text-neutral-500 dark:text-zinc-400">
        <SettingsIcon className="w-8 h-8 animate-spin mr-3" />
        Loading Settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fadeIn space-y-8">
      <Toaster position="bottom-right" />
      <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">
        Admin Settings
      </h1>

      <SectionCard
        title="General"
        description="Configure basic information for your university's instance."
        icon={SettingsIcon}
      >
        <SettingInput
          label="Site Name / University Name"
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
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Keyword Blacklist
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Add a forbidden word..."
              className="form-input flex-grow"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
            />
            <button
              onClick={handleAddKeyword}
              className="px-4 py-2 bg-neutral-200 dark:bg-zinc-700 text-neutral-800 dark:text-white font-semibold text-sm rounded-lg hover:bg-neutral-300 dark:hover:bg-zinc-600 transition"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-2">
            Posts containing these words will be automatically flagged for
            review.
          </p>
          {keywordBlacklist.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {keywordBlacklist.map((keyword) => (
                <span
                  key={keyword}
                  className="bg-neutral-100 dark:bg-zinc-700 text-neutral-700 dark:text-zinc-200 pl-3 pr-2 py-1 rounded-full flex items-center gap-2"
                >
                  {keyword}
                  <button
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="hover:text-red-500 text-lg leading-none"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

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
