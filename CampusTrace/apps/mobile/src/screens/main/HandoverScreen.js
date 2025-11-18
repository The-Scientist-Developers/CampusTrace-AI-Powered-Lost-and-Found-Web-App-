import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Clipboard,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL, supabase } from "../../api/apiClient";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/designSystem";

const HandoverScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { itemId, role } = route.params; // role: 'claimant' or 'finder'

  const [loading, setLoading] = useState(false);
  const [handoverCode, setHandoverCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [handoverData, setHandoverData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role === "claimant") {
      checkExistingHandover();
    }
  }, [role]);

  const checkExistingHandover = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${API_BASE_URL}/api/handover/items/${itemId}/handover-status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHandoverData(data);
      }
    } catch (err) {
      console.error("Error checking handover:", err);
    }
  };

  const generateHandoverCode = async () => {
    setLoading(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${API_BASE_URL}/api/handover/items/${itemId}/start-handover`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate code");
      }

      const data = await response.json();
      setHandoverCode(data.code);
      setHandoverData(data);
      Alert.alert(
        "Success",
        "Handover code generated! Show this to the finder."
      );
    } catch (err) {
      setError(err.message);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyHandoverCode = async () => {
    if (verificationCode.length !== 4) {
      setError("Please enter a 4-digit code");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${API_BASE_URL}/api/handover/items/${itemId}/verify-handover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: verificationCode }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Invalid code");
      }

      Alert.alert(
        "Success!",
        "Item handover verified! The item has been marked as returned.",
        [{ text: "OK", onPress: () => navigation.navigate("MyPosts") }]
      );
    } catch (err) {
      setError(err.message);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(handoverCode || handoverData?.code);
    Alert.alert("Copied", "Code copied to clipboard!");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="shield-checkmark"
              size={40}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.title}>Secure Handover</Text>
          <Text style={styles.subtitle}>
            {role === "claimant"
              ? "Generate a code to verify item pickup"
              : "Enter the code from the claimant"}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.card}>
        {role === "claimant" ? (
          // Claimant View - Generate Code
          <>
            {handoverData?.verified ? (
              // Verified Status
              <View style={styles.verifiedContainer}>
                <View style={styles.verifiedIconContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={80}
                    color={COLORS.success}
                  />
                </View>
                <Text style={styles.verifiedTitle}>Handover Verified! ✅</Text>
                <Text style={styles.verifiedSubtitle}>
                  The item has been successfully returned
                </Text>
                <View style={styles.verifiedInfo}>
                  <Text style={styles.verifiedInfoText}>
                    Verified on:{" "}
                    {new Date(handoverData.verified_at).toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation.navigate("MyPosts")}
                >
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Back to My Posts</Text>
                </TouchableOpacity>
              </View>
            ) : handoverCode || handoverData?.code ? (
              // Show Code
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Your Handover Code</Text>
                <View style={styles.codeDisplay}>
                  <Text style={styles.codeText}>
                    {handoverCode || handoverData?.code}
                  </Text>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={copyToClipboard}
                  >
                    <Ionicons
                      name="copy-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                    <Text style={styles.secondaryButtonText}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={generateHandoverCode}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <>
                        <Ionicons
                          name="refresh-outline"
                          size={20}
                          color={COLORS.primary}
                        />
                        <Text style={styles.secondaryButtonText}>
                          Regenerate
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.warningBox}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={COLORS.warning}
                  />
                  <Text style={styles.warningText}>
                    Code expires in 24 hours
                  </Text>
                </View>

                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsTitle}>Instructions:</Text>
                  <Text style={styles.instructionItem}>
                    1. Meet with the finder at the agreed location
                  </Text>
                  <Text style={styles.instructionItem}>
                    2. Show them this 4-digit code
                  </Text>
                  <Text style={styles.instructionItem}>
                    3. They will verify it in their app
                  </Text>
                  <Text style={styles.instructionItem}>
                    4. Once verified, the item is officially returned!
                  </Text>
                </View>
              </View>
            ) : (
              // Generate Code Button
              <View style={styles.generateContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={64}
                  color={COLORS.text.secondary}
                />
                <Text style={styles.generateTitle}>Ready to Pick Up?</Text>
                <Text style={styles.generateSubtitle}>
                  Generate a secure 4-digit code to complete the handover
                  process. You'll show this code to the finder when you meet.
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={generateHandoverCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name="shield-checkmark"
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.primaryButtonText}>
                        Generate Code
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          // Finder View - Verify Code
          <View style={styles.verifyContainer}>
            <Text style={styles.verifyLabel}>Enter 4-Digit Code</Text>
            <TextInput
              style={styles.codeInput}
              value={verificationCode}
              onChangeText={(text) =>
                setVerificationCode(text.replace(/[^0-9]/g, ""))
              }
              maxLength={4}
              placeholder="1234"
              keyboardType="number-pad"
              placeholderTextColor={COLORS.text.tertiary}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.verifyButton,
                verificationCode.length !== 4 && styles.disabledButton,
              ]}
              onPress={verifyHandoverCode}
              disabled={loading || verificationCode.length !== 4}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.verifyButtonText}>Verify & Complete</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>Verification Steps:</Text>
              <Text style={styles.instructionItem}>
                1. Ask the claimant to show their 4-digit code
              </Text>
              <Text style={styles.instructionItem}>
                2. Enter the code above
              </Text>
              <Text style={styles.instructionItem}>
                3. Tap "Verify & Complete"
              </Text>
              <Text style={styles.instructionItem}>
                4. The item will be marked as returned
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  backButton: {
    marginBottom: SPACING.md,
  },
  headerContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    padding: SPACING.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  // Claimant - Verified
  verifiedContainer: {
    alignItems: "center",
  },
  verifiedIconContainer: {
    marginBottom: SPACING.lg,
  },
  verifiedTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.success,
    marginBottom: SPACING.sm,
  },
  verifiedSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
  },
  verifiedInfo: {
    backgroundColor: `${COLORS.success}20`,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  verifiedInfoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
  },
  // Claimant - Code Display
  codeContainer: {
    alignItems: "center",
  },
  codeLabel: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  codeDisplay: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    width: "100%",
    alignItems: "center",
  },
  codeText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: `${COLORS.primary}20`,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: `${COLORS.warning}20`,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  warningText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
  },
  // Claimant - Generate
  generateContainer: {
    alignItems: "center",
  },
  generateTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  generateSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.button,
    color: "#fff",
  },
  // Finder - Verify
  verifyContainer: {
    alignItems: "stretch",
  },
  verifyLabel: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  codeInput: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: COLORS.background.primary,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    letterSpacing: 8,
    color: COLORS.text.primary,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: `${COLORS.error}20`,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  verifyButtonText: {
    ...TYPOGRAPHY.button,
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Instructions
  instructionsBox: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  instructionsTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  instructionItem: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
});

export default HandoverScreen;
