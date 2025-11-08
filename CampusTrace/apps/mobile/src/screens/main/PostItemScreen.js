import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
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
} from "lucide-react-native";
import { getSupabaseClient } from "@campustrace/core";

const API_BASE_URL = "http://10.0.0.40:8000";

export default function PostItemScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Lost");
  const [category, setCategory] = useState("Electronics");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const supabase = getSupabaseClient();

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
      setImageUri(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImageUri(null);
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

      if (imageUri) {
        const filename = imageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append("image_file", {
          uri:
            Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri,
          name: filename,
          type,
        });
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_BASE_URL}/api/items/create`, {
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

      // Notify admins
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", session.user.id)
        .single();

      if (!profileError && userProfile?.university_id) {
        const itemId = result.id || result.item_id || result.data?.id;
        // Note: notifyAdminsNewPost would need to be implemented for mobile
        console.log("🔔 Would notify admins about new post");
      }

      Alert.alert(
        "Success",
        "Item posted successfully! It's now pending review.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Dashboard"),
          },
        ]
      );

      // Reset form
      setTitle("");
      setDescription("");
      setLocation("");
      setContactInfo("");
      setImageUri(null);
    } catch (error) {
      console.error("Error posting item:", error);
      Alert.alert("Error", error.message);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <UploadCloud color="white" size={32} />
            </View>
            <Text style={styles.title}>Post New Item</Text>
            <Text style={styles.subtitle}>
              Help reunite lost items with their owners
            </Text>
          </View>

          {/* Status Toggle Pills */}
          <View style={styles.statusContainer}>
            <TouchableOpacity
              onPress={() => setStatus("Lost")}
              style={[
                styles.statusButton,
                status === "Lost" && styles.statusButtonActive,
              ]}
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
                status === "Found" && styles.statusButtonActive,
              ]}
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

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Title */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelContainer}>
                <Tag color="#3b82f6" size={16} />
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
                <FileText color="#3b82f6" size={16} />
                <Text style={styles.label}>Category</Text>
              </View>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => setCategory(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Electronics" value="Electronics" />
                  <Picker.Item label="Documents" value="Documents" />
                  <Picker.Item label="Clothing" value="Clothing" />
                  <Picker.Item label="Accessories" value="Accessories" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
            </View>

            {/* Location */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelContainer}>
                <MapPin color="#3b82f6" size={16} />
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
                <Phone color="#3b82f6" size={16} />
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
                  <FileText color="#3b82f6" size={16} />
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
                <ImageIcon color="#3b82f6" size={16} />
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
                      Photo uploaded successfully
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
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                </>
              ) : (
                <>
                  <UploadCloud color="white" size={20} />
                  <Text style={styles.submitButtonText}>Post Item</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.submitNote}>
              Your post will be reviewed before appearing publicly
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: "#2563eb",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  statusButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  statusButtonActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  statusButtonText: {
    fontWeight: "600",
    color: "#4b5563",
  },
  statusButtonTextActive: {
    color: "#ffffff",
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
  pickerContainer: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },
  picker: {
    color: "#111827",
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
    backgroundColor: "#2563eb",
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
});
