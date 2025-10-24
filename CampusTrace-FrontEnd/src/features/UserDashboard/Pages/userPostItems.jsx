import React, { useState, useEffect } from "react";
import { supabase } from "../../../api/apiClient";
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Loader2,
  Sparkles,
  MapPin,
  Tag,
  Phone,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { notifyAdminsNewPost } from "../../../utils/notificationHelpers";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// --- SKELETON COMPONENT ---
const PostNewItemSkeleton = () => (
  <div className="max-w-3xl mx-auto px-4">
    {/* Header */}
    <div className="text-center mb-8">
      <Skeleton circle height={64} width={64} className="mx-auto mb-4" />
      <Skeleton height={36} width={250} className="mx-auto" />
      <Skeleton height={20} width={350} className="mx-auto mt-2" />
    </div>

    {/* Status Pills */}
    <div className="flex justify-center gap-4 mb-8">
      <Skeleton height={44} width={140} borderRadius={999} />
      <Skeleton height={44} width={140} borderRadius={999} />
    </div>

    {/* Form Card */}
    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm">
      <div className="p-6 space-y-6">
        <Skeleton height={70} borderRadius={12} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton height={70} borderRadius={12} />
          <Skeleton height={70} borderRadius={12} />
        </div>
        <Skeleton height={120} borderRadius={12} />
        <Skeleton height={180} borderRadius={12} />
      </div>
      <div className="p-6 border-t">
        <Skeleton height={48} borderRadius={12} />
      </div>
    </div>
  </div>
);

export default function PostNewItem() {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Lost");
  const [category, setCategory] = useState("Electronics");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleImproveDescription = async () => {
    if (!description.trim()) {
      toast.error(
        "Please write a brief description first for the AI to improve."
      );
      return;
    }
    setIsGenerating(true);
    const toastId = toast.loading("Improving description with AI...");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Authentication required.");

      const response = await fetch(
        "http://localhost:8000/api/items/generate-description",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            category,
            draft_description: description,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "AI helper failed.");
      }

      const { description: aiDescription } = await response.json();
      setDescription(aiDescription);
      toast.success("Description improved!", { id: toastId });
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !location) {
      toast.error("Please fill out all required fields.");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your post...");

    try {
      const itemData = {
        title,
        description,
        status,
        category,
        location,
        contact_info: contactInfo,
      };

      const formData = new FormData();
      formData.append("item_data", JSON.stringify(itemData));
      if (imageFile) {
        formData.append("image_file", imageFile);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const response = await fetch("http://localhost:8000/api/items/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to post item.");
      }

      const result = await response.json();
      console.log("✅ Item created:", result);

      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error("❌ Error fetching user profile:", profileError);
      } else if (userProfile?.university_id) {
        const itemId = result.id || result.item_id || result.data?.id;
        await notifyAdminsNewPost(userProfile.university_id, title, itemId);
        console.log("🔔 Admins notified about new post");
      }

      toast.success("Item posted successfully! It's now pending review.", {
        id: toastId,
      });
      navigate("/dashboard/my-posts");
    } catch (error) {
      console.error("Error posting item:", error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2000);
    }
  };

  if (loading) {
    return <PostNewItemSkeleton />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Improved Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mb-4 shadow-lg">
          <UploadCloud className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-neutral-800 dark:text-white">
          Post New Item
        </h1>
        <p className="text-neutral-500 dark:text-gray-400">
          Help reunite lost items with their owners
        </p>
      </div>

      {/* Status Toggle Pills */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => setStatus("Lost")}
          className={`px-6 py-2.5 rounded-full font-medium transition-all ${
            status === "Lost"
              ? "bg-green-500 text-white shadow-lg transform scale-105"
              : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-2 border-neutral-200 dark:border-neutral-700"
          }`}
        >
          I Lost Something
        </button>
        <button
          type="button"
          onClick={() => setStatus("Found")}
          className={`px-6 py-2.5 rounded-full font-medium transition-all ${
            status === "Found"
              ? "bg-green-500 text-white shadow-lg transform scale-105"
              : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-2 border-neutral-200 dark:border-neutral-700"
          }`}
        >
          I Found Something
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden"
      >
        <div className="p-6 sm:p-8 space-y-6">
          {/* Title with Icon */}
          <div>
            <label
              htmlFor="title"
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              <Tag className="w-4 h-4 text-primary-500" />
              What did you {status.toLowerCase()}? *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-500 transition-colors"
              placeholder="e.g., Black Backpack, iPhone 13"
            />
          </div>

          {/* Grid with better spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="category"
                className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                <FileText className="w-4 h-4 text-primary-500" />
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-500 transition-colors"
              >
                <option value="Electronics"> Electronics</option>
                <option value="Documents">Documents</option>
                <option value="Clothing"> Clothing</option>
                <option value="Accessories"> Accessories</option>
                <option value="Other"> Other</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="location"
                className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                <MapPin className="w-4 h-4 text-primary-500" />
                Location *
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-500 transition-colors"
                placeholder="e.g., CCSICT building, 2nd floor"
              />
            </div>
          </div>

          {/* Contact Info - Full Width */}
          <div>
            <label
              htmlFor="contactInfo"
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              <Phone className="w-4 h-4 text-primary-500" />
              Contact Info (Optional)
            </label>
            <input
              type="text"
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-500 transition-colors"
              placeholder="How can someone reach you? (Phone, Email, Messenger)"
            />
          </div>

          {/* Description with improved AI button */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="description"
                className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                <FileText className="w-4 h-4 text-primary-500" />
                Description *
              </label>
              <button
                type="button"
                onClick={handleImproveDescription}
                disabled={isGenerating || !description.trim()}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  description.trim()
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-md"
                    : "bg-neutral-100 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
                }`}
                title={
                  !description.trim()
                    ? "Write a description first"
                    : "Improve with AI"
                }
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Enhance with AI
              </button>
            </div>
            <textarea
              id="description"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white focus:border-primary-500 dark:focus:border-primary-500 transition-colors resize-none"
              placeholder="Describe the item in detail... (color, brand, distinguishing features, etc.)"
            ></textarea>
          </div>

          {/* Image Upload - Improved Design */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              <ImageIcon className="w-4 h-4 text-primary-500" />
              Upload Photo (Optional)
            </label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                  <img
                    src={imagePreview}
                    alt="Item Preview"
                    className="w-full h-64 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                    <p className="text-white text-sm font-medium">
                      Photo uploaded successfully
                    </p>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-10 h-10 mb-3 text-neutral-400" />
                    <p className="mb-2 text-sm text-neutral-700 dark:text-neutral-300">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    id="image-upload"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Submit Button */}
        <div className="p-6 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <UploadCloud className="w-5 h-5" />
                Post Item
              </>
            )}
          </button>
          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-3">
            Your post will be reviewed before appearing publicly
          </p>
        </div>
      </form>
    </div>
  );
}
