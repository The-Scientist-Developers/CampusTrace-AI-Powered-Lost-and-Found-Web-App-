import React, { useState } from "react";
import { supabase } from "../../../api/apiClient";
import { UploadCloud, Image as ImageIcon, X, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PostNewItem() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Lost");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Handler for image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handler to remove the selected image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // This is where you would handle the final submission to Supabase.
    // 1. Upload the image file (if it exists) to Supabase Storage.
    // 2. Get the public URL of the uploaded image.
    // 3. Insert the form data (title, category, etc.) along with the image URL
    //    into your 'posts' table in the Supabase database.

    try {
      let imageUrl = null;
      // 1. Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        alert("Please login to post items");
        navigate("/login");
        return;
      }

      const userId = user.id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError.message);
        return null;
      }

      if (imageFile) {
        // Create a unique file path
        const filePath = `public/${Date.now()}_${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("item_images") // Assumes a bucket named 'item-images'
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // Get the public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from("item_images")
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      const postData = {
        title: title,
        category: category,
        location: location,
        created_at: date,
        description: description,
        image_url: imageUrl,
        user_id: userId,
        university_id: profile.university_id,
      };

      const { error: insertError } = await supabase
        .from("items")
        .insert([postData]);

      if (insertError) throw insertError;

      alert("Item posted successfully!");
      navigate("/dashboard"); // Navigate back to the dashboard on success
    } catch (error) {
      console.error("Error posting item:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // REMOVED max-w-4xl mx-auto p-4 from here, as DashboardLayout's main already provides it.
    <div className="text-white">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Post New Item</h1>
        <p className="text-zinc-400">
          Fill in the details below to report a lost or found item.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl"
      >
        <div className="p-6 sm:p-8 space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-neutral-300 mb-2"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 focus:ring-2 focus:ring-red focus:border-red transition"
              placeholder="e.g., Durex condoms, Black Backpack"
            />
          </div>

          {/* Category, Location, Date Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-neutral-300 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 focus:ring-2 focus:ring-red focus:border-red transition"
              >
                <option value="Lost">Lost</option>{" "}
                {/* Added value attributes */}
                <option value="Found">Found</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-neutral-300 mb-2"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 focus:ring-2 focus:ring-red focus:border-red transition"
                placeholder="e.g., CCSICT building"
              />
            </div>
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-neutral-300 mb-2"
              >
                Date {category}
              </label>
              <div className="relative">
                {" "}
                {/* Added relative for positioning Calendar icon */}
                <input
                  type="date" // Use type="date" for a native date picker
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-red focus:border-red transition" // Added pr-10 for icon space
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />{" "}
                {/* Calendar icon */}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-neutral-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 focus:ring-2 focus:ring-red focus:border-red transition"
              placeholder="Add any specific details, like brand, color, or distinguishing marks..."
            />
          </div>

          {/* Upload Image */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Upload Image
            </label>
            <div className="mt-2 p-6 border-2 border-dashed border-neutral-700 rounded-lg text-center">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Item Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 p-1 bg-neutral-700 rounded-full text-white hover:bg-neutral-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <ImageIcon className="w-12 h-12 text-neutral-500 mb-4" />
                  <label
                    htmlFor="image-upload"
                    className="px-4 py-2 bg-neutral-700 text-white text-sm font-semibold rounded-md hover:bg-neutral-600 cursor-pointer transition"
                  >
                    Browse
                  </label>
                  <input
                    type="file"
                    id="image-upload"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Footer with Submit Button */}
        <div className="p-6 sm:p-8 bg-black/30 border-t border-neutral-800 rounded-b-xl flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-red text-white font-semibold text-sm rounded-md hover:bg-red/80 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadCloud className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Post Item"}
          </button>
        </div>
      </form>
    </div>
  );
}
