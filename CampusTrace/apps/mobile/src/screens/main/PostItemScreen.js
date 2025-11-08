import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
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
  ChevronDown,
  Check,
} from "lucide-react-native";
// Import API_BASE_URL from core
import { getSupabaseClient, API_BASE_URL } from "@campustrace/core";

// Define the brand color here since it's not in core
const BRAND_COLOR = "#1877F2";

// Add `route` to props to get navigation params
export default function PostItemScreen({ navigation, route }) {
  // Check if an item is being passed in for editing
  const itemToEdit = route.params?.itemToEdit;
  const isEditMode = !!itemToEdit;

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Lost");
  const [category, setCategory] = useState("Electronics");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState(null); // This will hold remote URL or local URI
  const [newImageUri, setNewImageUri] = useState(null); // This holds a *newly picked* local image
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const categories = [
    "Electronics",
    "Documents",
    "Clothing",
    "Accessories",
    "Other",
  ];

  const supabase = getSupabaseClient();

  // Add this useEffect to pre-fill the form if in edit mode
  useEffect(() => {
    if (itemToEdit) {
      setTitle(itemToEdit.title);
      setStatus(itemToEdit.status);
      setCategory(itemToEdit.category);
      setLocation(itemToEdit.location);
      setContactInfo(itemToEdit.contact_info || "");
      setDescription(itemToEdit.description);
      setImageUri(itemToEdit.image_url || null); // Set existing image URL
      setNewImageUri(null); // Ensure no new image is set
    }
  }, [itemToEdit]);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Permission to access camera roll is required!"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setNewImageUri(uri); // Set the new local URI
      setImageUri(uri); // Show the new image in preview
    }
  };

  const removeImage = () => {
    setImageUri(null);
    setNewImageUri(null);
  };

  const handleImproveDescription = async () => {
    if (!description.trim()) {
      Alert.alert(
        "Description Required",
        "Please write a brief description first for the AI to improve."
      );
      return;
    }
    setIsGenerating(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Authentication required.");

      const response = await fetch(
        `${API_BASE_URL}/api/items/generate-description`,
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
      Alert.alert("Success", "Description improved!");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !location) {
      Alert.alert("Missing Fields", "Please fill out all required fields.");
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

      // Only append a *new* image file
      if (newImageUri) {
        const filename = newImageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append("image_file", {
          uri:
            Platform.OS === "ios"
              ? newImageUri.replace("file://", "")
              : newImageUri,
          name: filename,
          type,
        });
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      // --- MODIFIED: Choose URL and Method based on edit mode ---
      const endpoint = isEditMode
        ? `${API_BASE_URL}/api/items/update/${itemToEdit.id}`
        : `${API_BASE_URL}/api/items/create`;

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          // Content-Type is set automatically for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail ||
            `Failed to ${isEditMode ? "update" : "post"} item.`
        );
      }

      const result = await response.json();
      console.log(`✅ Item ${isEditMode ? "updated" : "created"}:`, result);
      // --- END OF MODIFICATION ---

      // Notify admins
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", session.user.id)
        .single();

      if (!profileError && userProfile?.university_id && !isEditMode) {
        // Only notify on create, not edit
        console.log("🔔 Would notify admins about new post");
      }

      Alert.alert(
        "Success",
        `Item ${
          isEditMode ? "updated" : "posted"
        } successfully! It's now pending review.`,
        [
          {
            text: "OK",
            // Go to MyPosts if editing, Dashboard if creating
            onPress: () =>
              navigation.navigate(isEditMode ? "MyPosts" : "Dashboard"),
          },
        ]
      );

      // Reset form
      if (!isEditMode) {
        setTitle("");
        setDescription("");
        setLocation("");
        setContactInfo("");
        setImageUri(null);
        setNewImageUri(null);
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "posting"} item:`,
        error
      );
      Alert.alert("Error", error.message);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isEditMode ? "Edit Item" : "Post Item"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isEditMode
            ? "Update your item details"
            : "Help others find their lost items"}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* --- REMOVED OLD HEADER --- */}

          {/* Status Toggle Pills */}
          <View style={styles.statusContainer}>
            <TouchableOpacity
              onPress={() => setStatus("Lost")}
              style={[
                styles.statusButton,
                status === "Lost" && styles.statusButtonActiveLost,
              ]}
              disabled={isEditMode} // Disable changing status when editing
            >
              <Text
                style={[
                  styles.statusButtonText,
                  status === "Lost" && styles.statusButtonTextActive,
                ]}
              >
                I Lost Something
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStatus("Found")}
              style={[
                styles.statusButton,
                status === "Found" && styles.statusButtonActiveFound,
              ]}
              disabled={isEditMode} // Disable changing status when editing
            >
              <Text
                style={[
                  styles.statusButtonText,
                  status === "Found" && styles.statusButtonTextActive,
                ]}
              >
                I Found Something
              </Text>
            </TouchableOpacity>
          </View>

          {isEditMode && (
            <Text style={styles.editNote}>
              Item type (Lost/Found) cannot be changed after posting.
            </Text>
          )}

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Title */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelContainer}>
                <Tag color={BRAND_COLOR} size={16} />
                <Text style={styles.label}>
                  What did you {status.toLowerCase()}? *
                </Text>
              </View>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Black Backpack, iPhone 13"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>

            {/* Category */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelContainer}>
                <FileText color={BRAND_COLOR} size={16} />
                <Text style={styles.label}>Category</Text>
              </View>
              <TouchableOpacity
                style={styles.categoryButton}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={styles.categoryButtonText}>{category}</Text>
                <ChevronDown color="#6b7280" size={20} />
              </TouchableOpacity>
            </View>

            {/* Location */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelContainer}>
                <MapPin color={BRAND_COLOR} size={16} />
                <Text style={styles.label}>Location *</Text>
              </View>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g., CCSICT building, 2nd floor"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>

            {/* Contact Info */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelContainer}>
                <Phone color={BRAND_COLOR} size={16} />
                <Text style={styles.label}>Contact Info (Optional)</Text>
              </View>
              <TextInput
                value={contactInfo}
                onChangeText={setContactInfo}
                placeholder="How can someone reach you?"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>

            {/* Description with AI Button */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelContainerWithButton}>
                <View style={styles.labelContainer}>
                  <FileText color={BRAND_COLOR} size={16} />
                  <Text style={styles.label}>Description *</Text>
                </View>
                <TouchableOpacity
                  onPress={handleImproveDescription}
                  disabled={isGenerating || !description.trim()}
                  style={[
                    styles.aiButton,
                    description.trim() && styles.aiButtonActive,
                  ]}
                >
                  {isGenerating ? (
                    <Loader2
                      color={description.trim() ? "white" : "#9ca3af"}
                      size={14}
                    />
                  ) : (
                    <Sparkles
                      color={description.trim() ? "white" : "#9ca3af"}
                      size={14}
                    />
                  )}
                  <Text
                    style={[
                      styles.aiButtonText,
                      description.trim() && styles.aiButtonTextActive,
                    ]}
                  >
                    Enhance
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the item in detail... (color, brand, features, etc.)"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.textArea}
              />
            </View>

            {/* Image Upload */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelContainer}>
                <ImageIcon color={BRAND_COLOR} size={16} />
                <Text style={styles.label}>Upload Photo (Optional)</Text>
              </View>
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={removeImage}
                    style={styles.removeImageButton}
                  >
                    <X color="white" size={16} />
                  </TouchableOpacity>
                  <View style={styles.imageOverlay}>
                    <Text style={styles.imageOverlayText}>
                      {newImageUri
                        ? "New photo selected"
                        : isEditMode
                        ? "Current photo"
                        : "Photo uploaded"}
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={pickImage}
                  style={styles.uploadButton}
                >
                  <UploadCloud color="#9ca3af" size={40} />
                  <Text style={styles.uploadButtonText}>Tap to upload</Text>
                  <Text style={styles.uploadButtonSubtext}>
                    PNG, JPG, GIF up to 10MB
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator color="white" />
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? "Updating..." : "Submitting..."}
                  </Text>
                </>
              ) : (
                <>
                  <UploadCloud color="white" size={20} />
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? "Update Item" : "Post Item"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.submitNote}>
              Your post will be reviewed before appearing publicly
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X color="#6b7280" size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.categoryList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    category === cat && styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      category === cat && styles.categoryOptionTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                  {category === cat && <Check color={BRAND_COLOR} size={20} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  // --- REMOVED OLD HEADER STYLES ---
  statusContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16, // Reduced margin
  },
  statusButton: {
    flex: 1, // Make buttons take equal space
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    alignItems: "center", // Center text
  },
  statusButtonActiveLost: {
    backgroundColor: "#FEE2E2", // Red for Lost
    borderColor: "#EF4444",
  },
  statusButtonActiveFound: {
    backgroundColor: "#D1FAE5", // Green for Found
    borderColor: "#10B981",
  },
  statusButtonText: {
    fontWeight: "600",
    color: "#4b5563",
  },
  statusButtonTextActive: {
    color: "#1f2937", // Darker text for better contrast
  },
  editNote: {
    textAlign: "center",
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 24,
    marginTop: -8,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labelContainerWithButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginLeft: 8,
  },
  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    fontSize: 14,
    color: "#111827",
  },
  categoryButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  textArea: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
    textAlignVertical: "top",
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  aiButtonActive: {
    backgroundColor: "#a855f7",
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    marginLeft: 4,
  },
  aiButtonTextActive: {
    color: "#ffffff",
  },
  imagePreviewContainer: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 256,
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 8,
    backgroundColor: "#ef4444",
    borderRadius: 999,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 12,
  },
  imageOverlayText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  uploadButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 192,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  uploadButtonText: {
    marginTop: 12,
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  submitContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: BRAND_COLOR,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    marginLeft: 8,
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  submitNote: {
    textAlign: "center",
    fontSize: 12,
    color: "#6b7280",
    marginTop: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  categoryList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  categoryOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  categoryOptionSelected: {
    backgroundColor: "#eff6ff",
  },
  categoryOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  categoryOptionTextSelected: {
    color: BRAND_COLOR,
    fontWeight: "600",
  },
});
