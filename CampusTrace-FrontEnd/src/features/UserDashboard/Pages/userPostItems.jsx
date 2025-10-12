import React, { useState } from "react";
import { supabase } from "../../../api/apiClient";
import { UploadCloud, Image as ImageIcon, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !location) {
      alert("Please fill out all required fields.");
      return;
    }
    setIsSubmitting(true);

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

      const response = await fetch("http://localhost:8000/api/items/create", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to post item.");
      }

      alert("Item posted successfully with AI tags!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error posting item:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Post New Item</h1>
        <p className="text-zinc-400">
          Fill in the details below to report a lost or found item.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl"
      >
        <div className="p-6 sm:p-8 space-y-6">
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
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3"
              placeholder="e.g., Black Backpack, iPhone 13"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-neutral-300 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3"
              >
                <option value="Lost">Lost</option>
                <option value="Found">Found</option>
              </select>
            </div>
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
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3"
              >
                <option value="Electronics">Electronics</option>
                <option value="Documents">Documents</option>
                <option value="Clothing">Clothing</option>
                <option value="Accessories">Accessories</option>
                <option value="Other">Other</option>
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
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3"
                placeholder="e.g., CCSICT building"
              />
            </div>
            <div>
              <label
                htmlFor="contactInfo"
                className="block text-sm font-medium text-neutral-300 mb-2"
              >
                Contact Info (Optional)
              </label>
              <input
                type="text"
                id="contactInfo"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3"
                placeholder="Phone #, Facebook name, etc."
              />
            </div>
          </div>

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
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3"
              placeholder="Add specific details like brand, color, or marks..."
            ></textarea>
          </div>

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
                    className="absolute -top-2 -right-2 p-1 bg-neutral-700 rounded-full text-white hover:bg-neutral-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <ImageIcon className="w-12 h-12 text-neutral-500 mb-4" />
                  <label
                    htmlFor="image-upload"
                    className="px-4 py-2 bg-neutral-700 text-white text-sm font-semibold rounded-md hover:bg-neutral-600 cursor-pointer"
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

        <div className="p-6 sm:p-8 bg-black/30 border-t border-neutral-800 rounded-b-xl flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-red text-white font-semibold text-sm rounded-md hover:bg-red/80 disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Post Item"}
          </button>
        </div>
      </form>
    </div>
  );
}
