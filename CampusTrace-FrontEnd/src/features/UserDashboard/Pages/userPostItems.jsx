// import React, { useState } from "react";
// import { supabase } from "../../../api/apiClient";
// import { UploadCloud, Image as ImageIcon, X } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";

// export default function PostNewItem() {
//   const [title, setTitle] = useState("");
//   const [status, setStatus] = useState("Lost");
//   const [category, setCategory] = useState("Electronics");
//   const [location, setLocation] = useState("");
//   const [contactInfo, setContactInfo] = useState("");
//   const [description, setDescription] = useState("");
//   const [imageFile, setImageFile] = useState(null);
//   const [imagePreview, setImagePreview] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const navigate = useNavigate();

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setImageFile(file);
//       setImagePreview(URL.createObjectURL(file));
//     }
//   };

//   const removeImage = () => {
//     setImageFile(null);
//     setImagePreview("");
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!title || !description || !location) {
//       toast.error("Please fill out all required fields.");
//       return;
//     }
//     setIsSubmitting(true);
//     const toastId = toast.loading("Submitting your post...");

//     try {
//       const itemData = {
//         title,
//         description,
//         status,
//         category,
//         location,
//         contact_info: contactInfo,
//       };

//       const formData = new FormData();
//       formData.append("item_data", JSON.stringify(itemData));
//       if (imageFile) {
//         formData.append("image_file", imageFile);
//       }

//       const {
//         data: { session },
//       } = await supabase.auth.getSession();
//       const token = session?.access_token;
//       if (!token) throw new Error("Not authenticated");

//       const response = await fetch("http://localhost:8000/api/items/create", {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || "Failed to post item.");
//       }

//       toast.success("Item posted successfully! It's now pending review.", {
//         id: toastId,
//       });
//       navigate("/dashboard/my-posts");
//     } catch (error) {
//       console.error("Error posting item:", error);
//       toast.error(`Error: ${error.message}`, { id: toastId });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold mb-2 text-neutral-800 dark:text-white">
//           Post New Item
//         </h1>
//         <p className="text-neutral-500 dark:text-zinc-400">
//           Fill in the details below to report a lost or found item.
//         </p>
//       </div>

//       <form
//         onSubmit={handleSubmit}
//         className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm"
//       >
//         <div className="p-6 sm:p-8 space-y-6">
//           <div>
//             <label
//               htmlFor="title"
//               className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
//             >
//               Title
//             </label>
//             <input
//               type="text"
//               id="title"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//               required
//               className="form-input w-full"
//               placeholder="e.g., Black Backpack, iPhone 13"
//             />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label
//                 htmlFor="status"
//                 className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
//               >
//                 Status
//               </label>
//               <select
//                 id="status"
//                 value={status}
//                 onChange={(e) => setStatus(e.target.value)}
//                 className="form-select w-full"
//               >
//                 <option value="Lost">I Lost Something</option>
//                 <option value="Found">I Found Something</option>
//               </select>
//             </div>
//             <div>
//               <label
//                 htmlFor="category"
//                 className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
//               >
//                 Category
//               </label>
//               <select
//                 id="category"
//                 value={category}
//                 onChange={(e) => setCategory(e.target.value)}
//                 className="form-select w-full"
//               >
//                 <option value="Electronics">Electronics</option>
//                 <option value="Documents">Documents</option>
//                 <option value="Clothing">Clothing</option>
//                 <option value="Accessories">Accessories</option>
//                 <option value="Other">Other</option>
//               </select>
//             </div>
//             <div>
//               <label
//                 htmlFor="location"
//                 className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
//               >
//                 Location
//               </label>
//               <input
//                 type="text"
//                 id="location"
//                 value={location}
//                 onChange={(e) => setLocation(e.target.value)}
//                 required
//                 className="form-input w-full"
//                 placeholder="e.g., CCSICT building, 2nd floor"
//               />
//             </div>
//             <div>
//               <label
//                 htmlFor="contactInfo"
//                 className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
//               >
//                 Contact Info (Optional)
//               </label>
//               <input
//                 type="text"
//                 id="contactInfo"
//                 value={contactInfo}
//                 onChange={(e) => setContactInfo(e.target.value)}
//                 className="form-input w-full"
//                 placeholder="Phone #, Facebook name, etc."
//               />
//             </div>
//           </div>

//           <div>
//             <label
//               htmlFor="description"
//               className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
//             >
//               Description
//             </label>
//             <textarea
//               id="description"
//               rows="4"
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//               required
//               className="form-textarea w-full"
//               placeholder="Add specific details like brand, color, or identifying marks..."
//             ></textarea>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
//               Upload Image
//             </label>
//             <div className="mt-2 flex justify-center p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
//               {imagePreview ? (
//                 <div className="relative inline-block">
//                   <img
//                     src={imagePreview}
//                     alt="Item Preview"
//                     className="max-h-48 mx-auto rounded-lg"
//                   />
//                   <button
//                     type="button"
//                     onClick={removeImage}
//                     className="absolute -top-2 -right-2 p-1 bg-white dark:bg-neutral-700 rounded-full text-neutral-600 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600 shadow"
//                   >
//                     <X className="w-4 h-4" />
//                   </button>
//                 </div>
//               ) : (
//                 <div className="text-center">
//                   <ImageIcon className="mx-auto w-12 h-12 text-neutral-400 dark:text-neutral-500" />
//                   <div className="mt-4 flex text-sm leading-6 text-neutral-600">
//                     <label
//                       htmlFor="image-upload"
//                       className="relative cursor-pointer rounded-md bg-white dark:bg-neutral-900 font-semibold text-primary-600 hover:text-primary-500"
//                     >
//                       <span>Upload a file</span>
//                       <input
//                         type="file"
//                         id="image-upload"
//                         onChange={handleImageChange}
//                         accept="image/*"
//                         className="sr-only"
//                       />
//                     </label>
//                     <p className="pl-1 dark:text-neutral-400">
//                       or drag and drop
//                     </p>
//                   </div>
//                   <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
//                     PNG, JPG, GIF up to 10MB
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="p-6 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 rounded-b-xl flex justify-end">
//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold text-sm rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
//           >
//             <UploadCloud className="w-4 h-4" />
//             {isSubmitting ? "Submitting..." : "Post Item"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }


// import React, { useState } from "react";
// import { supabase } from "../../../api/apiClient";
// import { UploadCloud, Image as ImageIcon, X } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";
// import { notifyAdminsNewPost } from "../../../utils/notificationHelpers";

// export default function PostNewItem() {
//   const [title, setTitle] = useState("");
//   const [status, setStatus] = useState("Lost");
//   const [category, setCategory] = useState("Electronics");
//   const [location, setLocation] = useState("");
//   const [contactInfo, setContactInfo] = useState("");
//   const [description, setDescription] = useState("");
//   const [imageFile, setImageFile] = useState(null);
//   const [imagePreview, setImagePreview] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const navigate = useNavigate();

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setImageFile(file);
//       setImagePreview(URL.createObjectURL(file));
//     }
//   };

//   const removeImage = () => {
//     setImageFile(null);
//     setImagePreview("");
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!title || !description || !location) {
//       toast.error("Please fill out all required fields.");
//       return;
//     }
//     setIsSubmitting(true);
//     const toastId = toast.loading("Submitting your post...");

//     try {
//       const itemData = {
//         title,
//         description,
//         status,
//         category,
//         location,
//         contact_info: contactInfo,
//       };

//       const formData = new FormData();
//       formData.append("item_data", JSON.stringify(itemData));
//       if (imageFile) {
//         formData.append("image_file", imageFile);
//       }

//       const {
//         data: { session },
//       } = await supabase.auth.getSession();
//       const token = session?.access_token;
//       if (!token) throw new Error("Not authenticated");

//       const response = await fetch("http://localhost:8000/api/items/create", {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || "Failed to post item.");
//       }

//       const result = await response.json();
//       console.log("✅ Item created:", result); // DEBUG

//       // Get user's university_id to notify admins
//       const { data: userProfile, error: profileError } = await supabase
//         .from("profiles")
//         .select("university_id")
//         .eq("id", session.user.id)
//         .single();

//       if (profileError) {
//         console.error("❌ Error fetching user profile:", profileError);
//       } else if (userProfile?.university_id) {
//         // Notify admins of the new post
//         const itemId = result.id || result.item_id || result.data?.id;
//         await notifyAdminsNewPost(
//           userProfile.university_id,
//           title,
//           itemId
//         );
//         console.log("🔔 Admins notified about new post");
//       }

//       toast.success("Item posted successfully! It's now pending review.", {
//         id: toastId,
//       });
//       navigate("/dashboard/my-posts");
//     } catch (error) {
//       console.error("Error posting item:", error);
//       toast.error(`Error: ${error.message}`, { id: toastId });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold mb-2 text-neutral-800 dark:text-white">
//           Post New Item
//         </h1>
//         <p className="text-neutral-500 dark:text-zinc-400">
//           Fill in the details below to report a lost or found item.
//         </p>
//       </div>

//       <form
//         onSubmit={handleSubmit}
//         className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm"
//       >
//         <div className="p-6 sm:p-8 space-y-6">
//           <div>
//             <label
//               htmlFor="title"
//               className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
//             >
//               Title
//             </label>
//             <input
//               type="text"
//               id="title"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//               required
//               className="form-input w-full"
//               placeholder="e.g., Black Backpack, iPhone 13"
//             />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label
//                 htmlFor="status"
//                 className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
//               >
//                 Status
//               </label>
//               <select
//                 id="status"
//                 value={status}
//                 onChange={(e) => setStatus(e.target.value)}
//                 className="form-select w-full"
//               >
//                 <option value="Lost">I Lost Something</option>
//                 <option value="Found">I Found Something</option>
//               </select>
//             </div>
//             <div>
//               <label
//                 htmlFor="category"
//                 className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
//               >
//                 Category
//               </label>
//               <select
//                 id="category"
//                 value={category}
//                 onChange={(e) => setCategory(e.target.value)}
//                 className="form-select w-full"
//               >
//                 <option value="Electronics">Electronics</option>
//                 <option value="Documents">Documents</option>
//                 <option value="Clothing">Clothing</option>
//                 <option value="Accessories">Accessories</option>
//                 <option value="Other">Other</option>
//               </select>
//             </div>
//             <div>
//               <label
//                 htmlFor="location"
//                 className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
//               >
//                 Location
//               </label>
//               <input
//                 type="text"
//                 id="location"
//                 value={location}
//                 onChange={(e) => setLocation(e.target.value)}
//                 required
//                 className="form-input w-full"
//                 placeholder="e.g., CCSICT building, 2nd floor"
//               />
//             </div>
//             <div>
//               <label
//                 htmlFor="contactInfo"
//                 className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
//               >
//                 Contact Info (Optional)
//               </label>
//               <input
//                 type="text"
//                 id="contactInfo"
//                 value={contactInfo}
//                 onChange={(e) => setContactInfo(e.target.value)}
//                 className="form-input w-full"
//                 placeholder="Phone #, Facebook name, etc."
//               />
//             </div>
//           </div>

//           <div>
//             <label
//               htmlFor="description"
//               className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
//             >
//               Description
//             </label>
//             <textarea
//               id="description"
//               rows="4"
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//               required
//               className="form-textarea w-full"
//               placeholder="Add specific details like brand, color, or identifying marks..."
//             ></textarea>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
//               Upload Image
//             </label>
//             <div className="mt-2 flex justify-center p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
//               {imagePreview ? (
//                 <div className="relative inline-block">
//                   <img
//                     src={imagePreview}
//                     alt="Item Preview"
//                     className="max-h-48 mx-auto rounded-lg"
//                   />
//                   <button
//                     type="button"
//                     onClick={removeImage}
//                     className="absolute -top-2 -right-2 p-1 bg-white dark:bg-neutral-700 rounded-full text-neutral-600 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600 shadow"
//                   >
//                     <X className="w-4 h-4" />
//                   </button>
//                 </div>
//               ) : (
//                 <div className="text-center">
//                   <ImageIcon className="mx-auto w-12 h-12 text-neutral-400 dark:text-neutral-500" />
//                   <div className="mt-4 flex text-sm leading-6 text-neutral-600">
//                     <label
//                       htmlFor="image-upload"
//                       className="relative cursor-pointer rounded-md bg-white dark:bg-neutral-900 font-semibold text-primary-600 hover:text-primary-500"
//                     >
//                       <span>Upload a file</span>
//                       <input
//                         type="file"
//                         id="image-upload"
//                         onChange={handleImageChange}
//                         accept="image/*"
//                         className="sr-only"
//                       />
//                     </label>
//                     <p className="pl-1 dark:text-neutral-400">
//                       or drag and drop
//                     </p>
//                   </div>
//                   <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
//                     PNG, JPG, GIF up to 10MB
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="p-6 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 rounded-b-xl flex justify-end">
//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold text-sm rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
//           >
//             <UploadCloud className="w-4 h-4" />
//             {isSubmitting ? "Submitting..." : "Post Item"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }


import React, { useState, useEffect } from "react"; // Added useEffect
import { supabase } from "../../../api/apiClient";
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Loader2, // Added Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { notifyAdminsNewPost } from "../../../utils/notificationHelpers";

// --- 1. SKELETON IMPORTS ---
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// --- 2. SKELETON COMPONENT ---
const PostNewItemSkeleton = () => (
  <div className="max-w-4xl mx-auto">
    {/* Header */}
    <div className="mb-8">
      <Skeleton height={36} width={250} />
      <Skeleton height={20} width={400} className="mt-2" />
    </div>

    {/* Form Box */}
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
      <div className="p-6 sm:p-8 space-y-6">
        {/* Title */}
        <div>
          <Skeleton height={20} width={100} className="mb-2" />
          <Skeleton height={42} borderRadius={8} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status */}
          <div>
            <Skeleton height={20} width={100} className="mb-2" />
            <Skeleton height={42} borderRadius={8} />
          </div>
          {/* Category */}
          <div>
            <Skeleton height={20} width={100} className="mb-2" />
            <Skeleton height={42} borderRadius={8} />
          </div>
          {/* Location */}
          <div>
            <Skeleton height={20} width={100} className="mb-2" />
            <Skeleton height={42} borderRadius={8} />
          </div>
          {/* Contact */}
          <div>
            <Skeleton height={20} width={100} className="mb-2" />
            <Skeleton height={42} borderRadius={8} />
          </div>
        </div>

        {/* Description */}
        <div>
          <Skeleton height={20} width={100} className="mb-2" />
          <Skeleton height={106} borderRadius={8} /> {/* rows="4" */}
        </div>

        {/* Image Upload */}
        <div>
          <Skeleton height={20} width={100} className="mb-2" />
          <Skeleton height={150} borderRadius={8} /> {/* Dashed box */}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 rounded-b-xl flex justify-end">
        <Skeleton height={46} width={120} borderRadius={8} />
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
  const [loading, setLoading] = useState(true); // --- 3. ADD PAGE LOAD STATE ---
  const navigate = useNavigate();

  // --- 4. ADD EFFECT FOR PAGE LOAD SKELETON ---
  // This component doesn't fetch data, so we just show the skeleton
  // for a fixed time on mount to simulate loading.
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // 1-second page load skeleton

    return () => clearTimeout(timer);
  }, []);

  // --- (No changes to handleImageChange or removeImage) ---
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
      toast.error("Please fill out all required fields.");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your post...");

    try {
      // ... (no changes to try block)
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
      console.log("✅ Item created:", result); // DEBUG

      // Get user's university_id to notify admins
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error("❌ Error fetching user profile:", profileError);
      } else if (userProfile?.university_id) {
        // Notify admins of the new post
        const itemId = result.id || result.item_id || result.data?.id;
        await notifyAdminsNewPost(
          userProfile.university_id,
          title,
          itemId
        );
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
      // --- 5. ADJUSTABLE 2-SECOND DELAY FOR SUBMISSION ---
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2000);
    }
  };

  // --- 6. ADD PAGE LOAD SKELETON CHECK ---
  if (loading) {
    return <PostNewItemSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-neutral-800 dark:text-white">
          Post New Item
        </h1>
        <p className="text-neutral-500 dark:text-zinc-400">
          Fill in the details below to report a lost or found item.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm"
      >
        <div className="p-6 sm:p-8 space-y-6">
          {/* ... (no changes to form inputs) ... */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="form-input w-full"
              placeholder="e.g., Black Backpack, iPhone 13"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-select w-full"
              >
                <option value="Lost">I Lost Something</option>
                <option value="Found">I Found Something</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select w-full"
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
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="form-input w-full"
                placeholder="e.g., CCSICT building, 2nd floor"
              />
            </div>
            <div>
              <label
                htmlFor="contactInfo"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Contact Info (Optional)
              </label>
              <input
                type="text"
                id="contactInfo"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="form-input w-full"
                placeholder="Phone #, Facebook name, etc."
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="form-textarea w-full"
              placeholder="Add specific details like brand, color, or identifying marks..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Upload Image
            </label>
            <div className="mt-2 flex justify-center p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
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
                    className="absolute -top-2 -right-2 p-1 bg-white dark:bg-neutral-700 rounded-full text-neutral-600 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600 shadow"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="mx-auto w-12 h-12 text-neutral-400 dark:text-neutral-500" />
                  <div className="mt-4 flex text-sm leading-6 text-neutral-600">
                    <label
                      htmlFor="image-upload"
                      className="relative cursor-pointer rounded-md bg-white dark:bg-neutral-900 font-semibold text-primary-600 hover:text-primary-500"
                    >
                      <span>Upload a file</span>
                      <input
                        type="file"
                        id="image-upload"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1 dark:text-neutral-400">
                      or drag and drop
                    </p>
                  </div>
                  <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 rounded-b-xl flex justify-end">
          {/* --- 7. UPDATED SUBMIT BUTTON --- */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold text-sm rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            {isSubmitting ? "Submitting..." : "Post Item"}
          </button>
        </div>
      </form>
    </div>
  );
}