import React, { useState, useEffect } from "react";
import { supabase, apiClient } from "../../../api/apiClient"; // Adjust path as needed
import { toast } from "react-hot-toast";
import {
  User,
  Edit,
  Save,
  X,
  Loader2,
  FileText,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

// --- Reusable Stat Card ---
const StatCard = ({ label, value, icon: Icon }) => (
  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
    <Icon className="w-8 h-8 text-red" />
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-neutral-400">{label}</p>
    </div>
  </div>
);

// --- Main UserProfilePage Component ---
export default function UserProfilePage({ user }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // --- State for editable fields ---
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  // --- Fetch profile and post data ---
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setError("User not found.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("items").select("*").eq("user_id", user.id),
        ]);

        if (profileRes.error) throw profileRes.error;
        if (postsRes.error) throw postsRes.error;

        setProfile(profileRes.data);
        setPosts(postsRes.data || []);

        // Initialize editable state
        setFullName(profileRes.data.full_name || "");
        setAvatarUrl(profileRes.data.avatar_url || "");
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("Failed to load profile.");
        toast.error("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // --- Handler for saving profile changes ---
  const handleProfileUpdate = async () => {
    if (!profile) return;
    setIsUploading(true);

    try {
      const response = await apiClient.updateProfile({
        fullName,
        avatarFile,
      });

      const updatedProfile = response?.profile;
      if (!updatedProfile) {
        throw new Error("Invalid response from profile update.");
      }

      setProfile(updatedProfile); // Update local profile state
      setAvatarUrl(updatedProfile.avatar_url);
      setFullName(updatedProfile.full_name || "");
      setAvatarFile(null); // Clear the file input
      setIsEditing(false); // Exit edit mode
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- Handler for avatar file input change ---
  const onAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file)); // Show a preview
    }
  };

  // Calculate stats from posts
  const totalPosts = posts.length;
  const foundItems = posts.filter(
    (p) => p.status?.toLowerCase() === "found"
  ).length;
  const recoveredItems = posts.filter(
    (p) => p.moderation_status?.toLowerCase() === "recovered"
  ).length;

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-400">Loading profile...</div>
    );
  }
  if (error) {
    return <div className="p-8 text-center text-red">{error}</div>;
  }
  if (!profile) {
    return (
      <div className="p-8 text-center text-zinc-400">Profile not found.</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Profile Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <img
              src={
                avatarUrl ||
                `https://ui-avatars.com/api/?name=${
                  profile.full_name || profile.email
                }&background=18181b&color=f4f4f5`
              }
              alt="Avatar"
              className="w-32 h-32 rounded-full border-4 border-neutral-700 object-cover"
            />
            {isEditing && (
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-1 right-1 p-2 bg-red rounded-full text-white cursor-pointer hover:bg-red/80 transition"
              >
                <Edit className="w-4 h-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarChange}
                />
              </label>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            {isEditing ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-3xl font-bold text-white bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1 mb-2 w-full"
              />
            ) : (
              <h1 className="text-3xl font-bold text-white">
                {fullName || profile.email.split("@")[0]}
              </h1>
            )}
            <p className="text-neutral-400">{profile.email}</p>
            <span className="mt-2 inline-block px-3 py-1 text-xs font-medium rounded-full bg-red/20 text-red">
              {profile.role || "Member"}
            </span>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleProfileUpdate}
                disabled={isUploading}
                className="px-4 py-2 bg-green-600 text-white font-semibold text-sm rounded-md hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-zinc-400 hover:bg-zinc-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-zinc-700 text-white font-semibold text-sm rounded-md hover:bg-zinc-600 transition flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Total Posts" value={totalPosts} icon={FileText} />
        <StatCard
          label="Items You Found"
          value={foundItems}
          icon={HelpCircle}
        />
        <StatCard
          label="Items Recovered"
          value={recoveredItems}
          icon={CheckCircle}
        />
      </div>

      {/* Recent Posts Section */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Your Recent Posts
        </h2>
        {posts.length > 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg p-4 divide-y divide-neutral-800">
            {posts.slice(0, 5).map(
              (
                post // Show up to 5 posts
              ) => (
                <div key={post.id} className="flex items-center gap-4 py-3">
                  <div className="w-12 h-12 bg-neutral-800 rounded-md flex-shrink-0 flex items-center justify-center">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.item_name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-white truncate">
                      {post.item_name}
                    </p>
                    <p className="text-sm text-neutral-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      post.moderation_status === "approved"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {post.moderation_status}
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="text-center p-12 bg-neutral-900 border border-neutral-800 rounded-xl">
            <p className="text-neutral-500">
              You haven't posted any items yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
