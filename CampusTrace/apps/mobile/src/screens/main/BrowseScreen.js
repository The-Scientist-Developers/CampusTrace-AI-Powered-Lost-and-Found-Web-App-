import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Filter, MapPin, Calendar, User } from "lucide-react-native";

const BrowseScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse All</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <ScrollView style={styles.feed}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={64} color="#DFE0E4" />
            <Text style={styles.emptyStateText}>No items yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Lost and found items will appear here
            </Text>
          </View>
        ) : (
          items.map((item, index) => <FeedItem key={index} item={item} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const FeedItem = ({ item }) => (
  <View style={styles.feedItem}>
    {/* Header */}
    <View style={styles.feedItemHeader}>
      <View style={styles.feedItemUser}>
        <View style={styles.avatar}>
          <User size={20} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.userName}>{item.userName}</Text>
          <View style={styles.locationRow}>
            <MapPin size={12} color="#8E8E93" />
            <Text style={styles.location}>{item.location}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.moreButton}>•••</Text>
    </View>

    {/* Image */}
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item.image }}
        style={styles.itemImage}
        resizeMode="cover"
      />
    </View>

    {/* Content */}
    <View style={styles.feedItemContent}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemDescription}>{item.description}</Text>
      <View style={styles.metaRow}>
        <Calendar size={14} color="#8E8E93" />
        <Text style={styles.metaText}>{item.date}</Text>
      </View>
    </View>

    {/* Divider */}
    <View style={styles.divider} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
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
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#DBDBDB",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#000000",
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
  },
  feed: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
  },
  feedItem: {
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  feedItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  feedItemUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1877F2",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: "#8E8E93",
  },
  moreButton: {
    fontSize: 20,
    color: "#000000",
    fontWeight: "bold",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F0F2F5",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  feedItemContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  divider: {
    height: 0.5,
    backgroundColor: "#DBDBDB",
  },
});

export default BrowseScreen;
