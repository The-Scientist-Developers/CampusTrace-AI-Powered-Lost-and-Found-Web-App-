import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Animated skeleton component
const SkeletonPulse = ({ width, height, borderRadius = 8, style }) => {
  const pulseAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#E1E4E8",
          opacity,
        },
        style,
      ]}
    />
  );
};

// Marketplace Item Skeleton
export const MarketplaceItemSkeleton = ({ colors }) => (
  <View
    style={[
      styles.marketplaceItem,
      { backgroundColor: colors?.card || "#FFFFFF" },
    ]}
  >
    <SkeletonPulse width="100%" height={180} borderRadius={12} />
    <View style={styles.marketplaceContent}>
      <SkeletonPulse width="80%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonPulse width="40%" height={14} style={{ marginBottom: 8 }} />
      <SkeletonPulse width="60%" height={12} />
    </View>
  </View>
);

// Dashboard Card Skeleton
export const DashboardCardSkeleton = ({ colors }) => (
  <View
    style={[
      styles.dashboardCard,
      { backgroundColor: colors?.card || "#FFFFFF" },
    ]}
  >
    <SkeletonPulse width={120} height={120} borderRadius={12} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <SkeletonPulse width="90%" height={18} style={{ marginBottom: 8 }} />
      <SkeletonPulse width="70%" height={14} style={{ marginBottom: 8 }} />
      <SkeletonPulse width="50%" height={12} />
    </View>
  </View>
);

// Profile Stats Skeleton
export const ProfileStatsSkeleton = ({ colors }) => (
  <View style={styles.statsGrid}>
    {[1, 2, 3, 4].map((i) => (
      <View
        key={i}
        style={[
          styles.statCard,
          { backgroundColor: colors?.card || "#FFFFFF" },
        ]}
      >
        <SkeletonPulse width={40} height={40} borderRadius={20} />
        <SkeletonPulse
          width="60%"
          height={24}
          style={{ marginTop: 8, marginBottom: 4 }}
        />
        <SkeletonPulse width="80%" height={14} />
      </View>
    ))}
  </View>
);

// List Item Skeleton
export const ListItemSkeleton = ({ colors }) => (
  <View
    style={[styles.listItem, { backgroundColor: colors?.card || "#FFFFFF" }]}
  >
    <SkeletonPulse width={60} height={60} borderRadius={8} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <SkeletonPulse width="70%" height={16} style={{ marginBottom: 6 }} />
      <SkeletonPulse width="50%" height={14} style={{ marginBottom: 6 }} />
      <SkeletonPulse width="40%" height={12} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  marketplaceItem: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    padding: 12,
  },
  marketplaceContent: {
    marginTop: 12,
  },
  dashboardCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  listItem: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
});

export default {
  MarketplaceItemSkeleton,
  DashboardCardSkeleton,
  ProfileStatsSkeleton,
  ListItemSkeleton,
};
