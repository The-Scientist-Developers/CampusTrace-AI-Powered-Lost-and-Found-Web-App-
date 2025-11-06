import React, { useState, useEffect, useRef } from "react";
import { supabase, apiClient } from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { Edit, Save, X, Loader2, Camera, AlertTriangle } from "lucide-react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ErrorModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#2a2a2a] rounded-xl p-8 w-full max-w-sm text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-bold mt-4 text-neutral-800 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
          {message}
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

const CameraModal = ({ isOpen, onClose, onCapture, onFileSelect }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    let stream;
    if (isOpen) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((s) => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch((err) => {
          toast.error("Could not access camera.");
          onClose();
        });
    }
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 text-neutral-800 dark:text-white">
          Update Profile Picture
        </h3>
        <div className="bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto"
          ></video>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={handleCapture}
            className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
          >
            Capture
          </button>
          <label className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white font-semibold rounded-lg cursor-pointer">
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

const AdminProfilePageSkeleton = () => (
  <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Skeleton circle width={128} height={128} />
        <div className="flex-1 text-center sm:text-left">
          <Skeleton height={36} width="60%" />
          <Skeleton height={20} width="70%" className="mt-2" />
          <Skeleton
            height={22}
            width="25%"
            className="mt-2"
            borderRadius="999px"
          />
        </div>
        <Skeleton height={38} width={120} borderRadius={6} />
      </div>
    </div>
  </div>
);

export default function AdminProfilePage({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [faceDetectionError, setFaceDetectionError] = useState(null);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  const [faceDetector, setFaceDetector] = useState(null);
  const [isModelsLoading, setIsModelsLoading] = useState(true);

  // Initialize MediaPipe Face Detector
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
        toast.error("Could not load AI features for face detection.");
      } finally {
        setIsModelsLoading(false);
      }
    };
    createFaceDetector();
  }, []);

  // Fetch Profile Data
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        setProfile(data);
        setFullName(data.full_name || "");
        setAvatarUrl(data.avatar_url || "");
      } catch (err) {
        toast.error("Failed to load profile data.");
      } finally {
        setTimeout(() => setLoading(false), 1000);
      }
    };
    fetchData();
  }, [user]);

  // Face detection logic
  const processImageForUpload = async (file) => {
    if (isModelsLoading || !faceDetector) {
      toast.error("AI models are still loading, please wait a moment.");
      return;
    }

    const toastId = toast.loading("Analyzing image...");
    try {
      const image = new Image();
      image.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const detections = faceDetector.detect(image);
      const confidentDetections = detections.detections.filter(
        (detection) => detection.categories[0].score > 0.5
      );

      if (confidentDetections.length === 0) {
        toast.dismiss(toastId);
        setFaceDetectionError({
          title: "No Face Detected",
          message:
            "We couldn't find a clear face in the image. Please upload a different picture for your profile.",
        });
        return;
      }

      if (confidentDetections.length > 1) {
        toast.dismiss(toastId);
        setFaceDetectionError({
          title: "Multiple Faces Detected",
          message:
            "Your profile picture should only contain your face. Please upload an image with a single person.",
        });
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
    if (file) processImageForUpload(file);
  };

  const onCapture = (blob) => {
    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
    processImageForUpload(file);
  };

  // Handle profile update submission
  const handleProfileUpdate = async () => {
    if (!profile) return;
    setIsUploading(true);
    try {
      const { profile: updatedProfile } = await apiClient.updateProfile({
        fullName,
        avatarFile,
      });
      if (!updatedProfile)
        throw new Error("Invalid response from profile update.");

      setProfile(updatedProfile);
      setAvatarUrl(updatedProfile.avatar_url);
      setFullName(updatedProfile.full_name || "");
      setAvatarFile(null);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <AdminProfilePageSkeleton />;
  if (!profile)
    return (
      <div className="p-8 text-center text-neutral-500">Profile not found.</div>
    );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      <ErrorModal
        isOpen={!!faceDetectionError}
        onClose={() => setFaceDetectionError(null)}
        title={faceDetectionError?.title}
        message={faceDetectionError?.message}
      />
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={onCapture}
        onFileSelect={onAvatarChange}
      />

      <h1 className="text-4xl font-bold text-neutral-800 dark:text-white">
        Admin Profile
      </h1>

      <div className="bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <img
              src={
                avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  profile.full_name || profile.email
                )}&background=eef2ff&color=4338ca`
              }
              alt="Avatar"
              className="w-32 h-32 rounded-full border-4 border-neutral-200 dark:border-neutral-700 object-cover"
            />
            {isEditing && (
              <button
                onClick={() => setIsCameraModalOpen(true)}
                className="absolute bottom-1 right-1 p-2 bg-primary-600 rounded-full text-white cursor-pointer hover:bg-primary-700 transition"
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
          <div className="flex-1 text-center sm:text-left">
            {isEditing ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input text-3xl font-bold text-neutral-800 dark:text-white bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1 mb-2 w-full"
              />
            ) : (
              <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">
                {fullName || profile.email.split("@")[0]}
              </h1>
            )}
            <p className="text-neutral-500 dark:text-neutral-400">
              {profile.email}
            </p>
            <span className="mt-2 inline-block px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
              {profile.role || "Admin"}
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
                onClick={() => {
                  setIsEditing(false);
                  setAvatarUrl(profile.avatar_url || "");
                }}
                className="p-2 text-neutral-500 dark:text-gray-400 hover:bg-neutral-100 dark:hover:bg-zinc-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-neutral-200 dark:bg-zinc-700 text-neutral-800 dark:text-white font-semibold text-sm rounded-md hover:bg-neutral-300 dark:hover:bg-zinc-600 transition flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
