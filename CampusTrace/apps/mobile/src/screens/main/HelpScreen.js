import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronDown, HelpCircle } from "lucide-react-native";

// Define brand color locally
const BRAND_COLOR = "#1877F2";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  {
    question: "How do I report a lost item?",
    answer:
      'Go to the "Post Item" tab, select "I Lost Something", fill in the details about your item, and submit. Your post will be reviewed by an admin before it goes live.',
  },
  {
    question: "How do I claim a found item?",
    answer:
      'From the "Browse" tab, tap on a "Found" item you believe is yours. In the item details, tap "Claim This Item". You will be asked to provide a unique detail (like the lock screen wallpaper, a specific scratch, etc.) to prove ownership.',
  },
  {
    question: "What happens after I submit a claim?",
    answer:
      "The user who found the item will be notified. They will review your claim and either accept or reject it. You will receive a notification in your 'Notifications' tab and can start a message with them from your 'Messages' tab.",
  },
  {
    question: "How does the AI match work?",
    answer:
      "When you post a 'Lost' item, our AI compares its title, description, and image (if provided) against all 'Found' items in your university. It looks for similarities and shows you the best potential matches on your Dashboard.",
  },
  {
    question: "What if my post is rejected?",
    answer:
      "A post might be rejected if it's a duplicate, contains inappropriate content, or is not a lost/found item. You will receive a notification explaining the reason.",
  },
];

const FaqItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.faqQuestionRow} onPress={toggleOpen}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <ChevronDown
          size={20}
          color={BRAND_COLOR}
          style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.faqAnswerContainer}>
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
};

const HelpScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Standard Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.subHeader}>
          <HelpCircle size={32} color={BRAND_COLOR} />
          <Text style={styles.subHeaderTitle}>Frequently Asked Questions</Text>
        </View>

        <View style={styles.faqList}>
          {FAQ_DATA.map((item, index) => (
            <FaqItem item={item} key={index} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  subHeader: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  subHeaderTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 12,
  },
  faqList: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  faqQuestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginRight: 12,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
});

export default HelpScreen;
