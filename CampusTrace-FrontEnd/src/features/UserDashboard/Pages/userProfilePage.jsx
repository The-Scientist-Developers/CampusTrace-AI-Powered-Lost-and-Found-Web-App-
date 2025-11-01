import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase, apiClient } from "../../../api/apiClient";
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
  Camera,
} from "lucide-react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] p-4 sm:p-6 rounded-xl shadow-sm flex items-center gap-4">
    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 flex-shrink-0" />
    <div>
      <p className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-white">
        {value}
      </p>
      <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
    </div>
  </div>
);

const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] p-4 sm:p-6 rounded-xl shadow-sm flex items-center gap-4">
    <Skeleton circle width={32} height={32} />
    <div>
      <Skeleton height={28} width={50} />
      <Skeleton height={20} width={100} />
    </div>
  </div>
);

const PostItemSkeleton = () => (
  <div className="flex items-center gap-3 sm:gap-4 py-3">
    <Skeleton
      width={40}
      height={40}
      sm:width={48}
      sm:height={48}
      className="rounded-md"
    />
    <div className="flex-grow min-w-0">
      {" "}
      {/* Added min-w-0 for truncation */}
      <Skeleton height={20} width="70%" />
      <Skeleton height={16} width="50%" className="mt-1" />
    </div>
    <Skeleton
      height={22}
      width={60}
      sm:width={80}
      borderRadius="999px"
      className="flex-shrink-0"
    />
  </div>
);

const UserProfilePageSkeleton = () => (
  <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 space-y-6 sm:space-y-8">
    {" "}
    {/* Adjusted padding */}
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <Skeleton
          circle
          width={96} /* Smaller on mobile */
          height={96}
          sm:width={128}
          sm:height={128}
          className="border-4 border-neutral-200 dark:border-neutral-700"
        />
        <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
          {" "}
          {/* Added width control */}
          <Skeleton
            height={30}
            sm:height={36}
            width="70%"
            className="mx-auto sm:mx-0"
          />
          <Skeleton
            height={18}
            sm:height={20}
            width="80%"
            className="mt-2 mx-auto sm:mx-0"
          />
          <Skeleton
            height={20}
            sm:height={22}
            width="30%"
            className="mt-2 mx-auto sm:mx-0"
            borderRadius="999px"
          />
        </div>
        <Skeleton
          height={38}
          width={120}
          borderRadius={6}
          className="mt-4 sm:mt-0"
        />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      {" "}
      {/* Adjusted gap */}
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
    <div>
      <Skeleton
        height={24}
        sm:height={28}
        width={200}
        sm:width={250}
        className="mb-4"
      />
      <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm p-3 sm:p-4 divide-y divide-neutral-200 dark:divide-[#3a3a3a]">
        {[...Array(3)].map((_, i) => (
          <PostItemSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

const CameraModal = ({ isOpen, onClose, onCapture, videoRef }) => {
  useEffect(() => {
    let activeStream = null;
    if (isOpen) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user" } })
        .then((stream) => {
          activeStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
          toast.error("Could not access camera. Please check permissions.");
          onClose();
        });
    }
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, onClose]);

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        onCapture(blob);
        onClose();
      }, "image/jpeg");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" // Added padding
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#2a2a2a] rounded-xl p-4 sm:p-6 w-full max-w-md" // Adjusted padding and max-width
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg sm:text-xl font-bold mb-4 text-neutral-800 dark:text-white">
          Update Profile Picture
        </h3>
        <div className="bg-black rounded-lg overflow-hidden mb-4 aspect-video">
          {" "}
          {/* Ensure aspect ratio */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover" // Ensure video covers area
          ></video>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          {" "}
          {/* Stack buttons on mobile */}
          <button
            onClick={onCapture}
            className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition w-full sm:w-auto"
          >
            Capture
          </button>
          <label className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white font-semibold rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition cursor-pointer text-center w-full sm:w-auto">
            {" "}
            {/* Full width on mobile */}
            Upload File
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                onFileSelect(e);
                onClose();
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default function UserProfilePage({ user }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  const [faceDetector, setFaceDetector] = useState(null);
  const [isModelsLoading, setIsModelsLoading] = useState(true);

  useEffect(() => {
    const createFaceDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU",
          },
          runningMode: "IMAGE",
        });
        setFaceDetector(detector);
      } catch (err) {
        console.error("Failed to load face detection models", err);
        toast.error("Could not load AI features for face detection.");
      } finally {
        setIsModelsLoading(false);
      }
    };
    createFaceDetector();
  }, []);

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
          supabase
            .from("items")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (profileRes.error) throw profileRes.error;
        if (postsRes.error) throw postsRes.error;

        setProfile(profileRes.data);
        setPosts(postsRes.data || []);
        setFullName(profileRes.data.full_name || "");
        setAvatarUrl(profileRes.data.avatar_url || "");
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("Failed to load profile.");
        toast.error("Failed to load profile data.");
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchData();
  }, [user]);

  const processImageForUpload = async (file) => {
    if (isModelsLoading || !faceDetector) {
      toast.error("AI models are still loading, please wait a moment.");
      return;
    }

    const toastId = toast.loading("Analyzing image...");
    try {
      const image = new Image();
      image.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const detections = faceDetector.detect(image);
      const confidentDetections = detections.detections.filter(
        (detection) => detection.categories[0].score > 0.5
      );

      if (confidentDetections.length === 0) {
        toast.error("No clear face detected. Please use a different picture.", {
          id: toastId,
        });
        return;
      }
      if (confidentDetections.length > 1) {
        toast.error(
          "Multiple faces detected. Please use an image with only your face.",
          { id: toastId }
        );
        return;
      }

      toast.success("Face detected!", { id: toastId });
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    } catch (err) {
      toast.error("Could not analyze image.", { id: toastId });
      console.error(err);
    }
  };

  const onAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImageForUpload(file);
    }
  };

  const onCapture = (blob) => {
    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
    processImageForUpload(file);
  };

  const handleProfileUpdate = async () => {
    if (!profile || (!fullName.trim() && !avatarFile)) {
      toast.error("No changes to save.");
      return;
    }
    setIsUploading(true);
    try {
      const response = await apiClient.updateProfile({
        fullName: fullName.trim(),
        avatarFile,
      });
      const updatedProfile = response?.profile;

      if (!updatedProfile) {
        throw new Error("Invalid response from profile update.");
      }
      setProfile(updatedProfile);
      setAvatarUrl(updatedProfile.avatar_url);
      setFullName(updatedProfile.full_name || "");
      setAvatarFile(null);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile.");
    } finally {
      setIsUploading(false);
    }
  };

  const totalPosts = posts.length;
  const foundItems = posts.filter(
    (p) => p.status?.toLowerCase() === "found"
  ).length;
  const recoveredItems = posts.filter(
    (p) => p.moderation_status?.toLowerCase() === "recovered"
  ).length;

  // --- Render Logic ---
  if (loading) {
    return <UserProfilePageSkeleton />;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  if (!profile) {
    return (
      <div className="p-8 text-center text-neutral-500 dark:text-gray-400">
        Profile not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 space-y-6 sm:space-y-8 animate-fadeIn">
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={onCapture}
        onFileSelect={onAvatarChange}
      />
      {/* Profile Header Card - Adjusted for Responsiveness */}
      <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <div className="relative flex-shrink-0">
            <img
              src={
                avatarUrl || // Show preview or final URL
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  profile.full_name || profile.email
                )}&background=eef2ff&color=4338ca`
              }
              alt="Avatar"
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-neutral-200 dark:border-neutral-700 object-cover"
            />
            {isEditing && (
              <button
                onClick={() => setIsCameraModalOpen(true)}
                className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 p-2 bg-primary-600 rounded-full text-white cursor-pointer hover:bg-primary-700 transition"
                disabled={isModelsLoading}
                title={
                  isModelsLoading ? "AI models loading..." : "Change picture"
                }
              >
                {isModelsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left w-full sm:w-auto min-w-0">
            {" "}
            {/* Allow text wrapping */}
            {isEditing ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-white bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1 mb-2 w-full"
                placeholder="Enter your full name"
              />
            ) : (
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-white truncate">
                {" "}
                {/* Added truncate */}
                {fullName || profile.email.split("@")[0]}
              </h1>
            )}
            <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 truncate">
              {" "}
              {/* Added truncate */}
              {profile.email}
            </p>
            <span className="mt-2 inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400">
              {profile.role || "Member"}
            </span>
          </div>
          {/* Edit/Save Buttons - Adjusted for Responsiveness */}
          <div className="w-full sm:w-auto mt-4 sm:mt-0 flex-shrink-0">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleProfileUpdate}
                  disabled={isUploading}
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white font-semibold text-sm rounded-md hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setAvatarUrl(profile.avatar_url || ""); // Revert preview
                    setFullName(profile.full_name || ""); // Revert name
                    setAvatarFile(null); // Clear staged file
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-semibold text-sm rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-600 transition flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto px-4 py-2 bg-neutral-200 dark:bg-zinc-700 text-neutral-800 dark:text-white font-semibold text-sm rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-600 transition flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid - Adjusted Gap */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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

      {/* Recent Posts Section - Adjusted Padding */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-white mb-4">
          Your Recent Posts
        </h2>
        {posts.length > 0 ? (
          <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm p-3 sm:p-4 divide-y divide-neutral-200 dark:divide-[#3a3a3a]">
            {posts.slice(0, 5).map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-3 sm:gap-4 py-3"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 dark:bg-neutral-800 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {" "}
                  {/* Added overflow */}
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title || "Item image"} // Use title if available
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-neutral-500 px-1 text-center">
                      {" "}
                      {/* Added padding/centering */}
                      {post.category}
                    </span>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  {" "}
                  {/* Added min-w-0 */}
                  <p className="font-medium text-neutral-800 dark:text-white truncate">
                    {post.title || "Untitled Post"}{" "}
                    {/* Provide fallback title */}
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    // Added flex-shrink-0
                    post.moderation_status === "approved"
                      ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
                      : post.moderation_status === "recovered"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400" // Added recovered style
                      : post.moderation_status === "pending_return"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400" // Added pending return style
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400" // Default to pending
                  }`}
                >
                  {/* Capitalize status */}
                  {post.moderation_status
                    ? post.moderation_status.charAt(0).toUpperCase() +
                      post.moderation_status.slice(1).replace("_", " ")
                    : "Unknown"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 sm:p-12 bg-white dark:bg-[#2a2a2a] border-2 border-dashed border-neutral-200 dark:border-[#3a3a3a] rounded-xl">
            <p className="text-neutral-500 dark:text-neutral-400">
              You haven't posted any items yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
