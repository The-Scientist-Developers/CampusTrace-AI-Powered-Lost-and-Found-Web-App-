import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Shield,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { API_BASE_URL, getSupabaseClient } from "@campustrace/core";
import {
  Spacing,
  BorderRadius,
  Typography,
} from "../../constants/designSystem";

const HandoverScreen = ({ route, navigation }) => {
  const { itemId, role } = route.params; // role: 'claimant' or 'finder'
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [handoverCode, setHandoverCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [handoverData, setHandoverData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role === "claimant") {
      checkExistingHandover();
    }
  }, []);

  const checkExistingHandover = async () => {
    try {
      const supabase = getSupabaseClient();
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
        if (data.has_handover && !data.verified && !data.expired) {
          // Fetch the actual code (you might need to adjust this based on your API)
          setHandoverData(data);
        }
      }
    } catch (err) {
      console.error("Error checking handover:", err);
    }
  };

  const generateHandoverCode = async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseClient();
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
      const supabase = getSupabaseClient();
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
        "Success! 🎉",
        "Item handover verified! The item has been marked as returned.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      setError(err.message);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    // Note: You'll need to install @react-native-clipboard/clipboard
    // For now, just show an alert
    Alert.alert("Code", handoverCode || handoverData?.code);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Shield size={48} color={colors.primary} />
          <Text style={styles.title}>Secure Handover</Text>
          <Text style={styles.subtitle}>
            {role === "claimant"
              ? "Generate a code to verify item pickup"
              : "Enter the code from the claimant"}
          </Text>
        </View>

        {role === "claimant" ? (
          // Claimant View - Generate Code
          <View style={styles.content}>
            {handoverCode || handoverData?.code ? (
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Your Handover Code</Text>
                <View style={styles.codeDisplay}>
                  <Text style={styles.codeText}>
                    {handoverCode || handoverData?.code}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyToClipboard}
                >
                  <Copy size={20} color={colors.primary} />
                  <Text style={styles.copyButtonText}>Copy Code</Text>
                </TouchableOpacity>

                <View style={styles.infoBox}>
                  <Clock size={20} color={colors.warning} />
                  <Text style={styles.infoText}>Code expires in 24 hours</Text>
                </View>

                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsTitle}>Instructions:</Text>
                  <Text style={styles.instructionsText}>
                    1. Meet with the finder at the agreed location{"\n"}
                    2. Show them this 4-digit code{"\n"}
                    3. They will verify it in their app{"\n"}
                    4. Once verified, the item is officially returned!
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.generateContainer}>
                <AlertCircle size={64} color={colors.textSecondary} />
                <Text style={styles.generateTitle}>Ready to Pick Up?</Text>
                <Text style={styles.generateText}>
                  Generate a secure 4-digit code to complete the handover
                  process. You'll show this code to the finder when you meet.
                </Text>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generateHandoverCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Shield size={20} color="#FFF" />
                      <Text style={styles.generateButtonText}>
                        Generate Code
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          // Finder View - Verify Code
          <View style={styles.content}>
            <View style={styles.verifyContainer}>
              <Text style={styles.verifyLabel}>Enter 4-Digit Code</Text>
              <TextInput
                style={styles.codeInput}
                value={verificationCode}
                onChangeText={(text) =>
                  setVerificationCode(text.replace(/[^0-9]/g, ""))
                }
                keyboardType="number-pad"
                maxLength={4}
                placeholder="1234"
                placeholderTextColor={colors.textTertiary}
              />

              {error ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  verificationCode.length !== 4 && styles.verifyButtonDisabled,
                ]}
                onPress={verifyHandoverCode}
                disabled={loading || verificationCode.length !== 4}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <CheckCircle size={20} color="#FFF" />
                    <Text style={styles.verifyButtonText}>
                      Verify & Complete
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsTitle}>
                  Verification Steps:
                </Text>
                <Text style={styles.instructionsText}>
                  1. Ask the claimant to show their 4-digit code{"\n"}
                  2. Enter the code above{"\n"}
                  3. Tap "Verify & Complete"{"\n"}
                  4. The item will be marked as returned
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: Spacing.lg,
    },
    header: {
      alignItems: "center",
      marginBottom: Spacing.xl,
    },
    title: {
      fontSize: Typography.sizes.xxl,
      fontWeight: Typography.weights.bold,
      color: colors.text,
      marginTop: Spacing.md,
    },
    subtitle: {
      fontSize: Typography.sizes.md,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: Spacing.sm,
    },
    content: {
      flex: 1,
    },
    codeContainer: {
      alignItems: "center",
    },
    codeLabel: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.semibold,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    codeDisplay: {
      backgroundColor: colors.primary,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.xxl,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.lg,
    },
    codeText: {
      fontSize: 48,
      fontWeight: Typography.weights.bold,
      color: "#FFF",
      letterSpacing: 8,
    },
    copyButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.xl,
    },
    copyButtonText: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: colors.primary,
    },
    infoBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: colors.warning + "20",
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
    },
    infoText: {
      fontSize: Typography.sizes.sm,
      color: colors.warning,
    },
    instructionsBox: {
      backgroundColor: colors.surface,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      width: "100%",
    },
    instructionsTitle: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    instructionsText: {
      fontSize: Typography.sizes.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    generateContainer: {
      alignItems: "center",
      paddingVertical: Spacing.xxl,
    },
    generateTitle: {
      fontSize: Typography.sizes.xl,
      fontWeight: Typography.weights.bold,
      color: colors.text,
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    generateText: {
      fontSize: Typography.sizes.md,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.lg,
    },
    generateButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: colors.primary,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.lg,
    },
    generateButtonText: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: "#FFF",
    },
    verifyContainer: {
      width: "100%",
    },
    verifyLabel: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.semibold,
      color: colors.text,
      marginBottom: Spacing.md,
      textAlign: "center",
    },
    codeInput: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      fontSize: 32,
      fontWeight: Typography.weights.bold,
      color: colors.text,
      textAlign: "center",
      letterSpacing: 16,
      marginBottom: Spacing.lg,
    },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: colors.error + "20",
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
    },
    errorText: {
      fontSize: Typography.sizes.sm,
      color: colors.error,
    },
    verifyButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      backgroundColor: colors.success,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.xl,
    },
    verifyButtonDisabled: {
      opacity: 0.5,
    },
    verifyButtonText: {
      fontSize: Typography.sizes.md,
      fontWeight: Typography.weights.semibold,
      color: "#FFF",
    },
  });

export default HandoverScreen;
