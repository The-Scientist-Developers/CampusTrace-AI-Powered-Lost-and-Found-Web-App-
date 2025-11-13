import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Award, Calendar } from "lucide-react-native";

const BadgeList = ({ badges = [], colors }) => {
  if (badges.length === 0) {
    return (
      <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
        <Award size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No badges earned yet
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
          Help the community by posting and returning items!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {badges.map((badge, index) => (
        <View
          key={badge.id || index}
          style={[
            styles.badgeCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Badge Icon */}
          <View style={styles.iconContainer}>
            {badge.badge_icon_url || badge.icon_url ? (
              <Image
                source={{ uri: badge.badge_icon_url || badge.icon_url }}
                style={styles.badgeIcon}
              />
            ) : (
              <View
                style={[
                  styles.fallbackIcon,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Award size={24} color={colors.primary} />
              </View>
            )}
          </View>

          {/* Badge Info */}
          <View style={styles.badgeInfo}>
            <Text style={[styles.badgeName, { color: colors.text }]}>
              {badge.badge_name || badge.name}
            </Text>
            <Text
              style={[styles.badgeDescription, { color: colors.textSecondary }]}
            >
              {badge.badge_description || badge.description}
            </Text>
            {badge.earned_at && (
              <View style={styles.dateContainer}>
                <Calendar size={12} color={colors.textTertiary} />
                <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                  Earned {new Date(badge.earned_at).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  badgeCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  fallbackIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeInfo: {
    flex: 1,
    justifyContent: "center",
  },
  badgeName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 14,
    marginBottom: 6,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 12,
  },
});

export default BadgeList;
