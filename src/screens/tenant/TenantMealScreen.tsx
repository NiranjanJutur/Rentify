import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../theme/theme';

export default function TenantMealScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Meals</Text>
        <Text style={styles.subtitle}>Daily food & meal card management</Text>
      </View>
      
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <Text style={styles.cardTitle}>Today's Menu</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Breakfast Active</Text>
          </View>
        </View>
        
        <View style={styles.mealItem}>
          <Text style={styles.mealName}>Breakfast: Idli & Sambar</Text>
          <Text style={styles.mealTime}>08:00 AM - 10:00 AM</Text>
        </View>
        
        <View style={styles.mealItem}>
          <Text style={styles.mealName}>Lunch: North Indian Thali</Text>
          <Text style={styles.mealTime}>01:00 PM - 03:00 PM</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  header: {
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.headline,
    fontSize: 32,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  subtitle: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: theme.spacing.lg,
    ...theme.elevation.floating,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    ...theme.typography.headline,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  badge: {
    backgroundColor: theme.colors.occupiedBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: theme.colors.occupiedText,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  mealItem: {
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
  },
  mealName: {
    ...theme.typography.label,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  mealTime: {
    ...theme.typography.body,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  }
});
