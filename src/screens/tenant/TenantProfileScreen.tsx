import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';

const profileRows = [
  { label: 'Phone', value: '+91 98765 43210', icon: 'call-outline' as const },
  { label: 'Email', value: 'aakash@example.com', icon: 'mail-outline' as const },
  { label: 'Emergency Contact', value: '+91 98450 00112', icon: 'medkit-outline' as const },
];

export default function TenantProfileScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <View style={styles.profileTop}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>AM</Text>
        </View>
        <Text style={styles.name}>Aakash Mehta</Text>
        <Text style={styles.tagline}>Tenant since Jan 2025</Text>

        <View style={styles.roomBadge}>
          <Ionicons name="bed-outline" size={14} color={theme.colors.primary} />
          <Text style={styles.roomText}>Luxury Wing A2</Text>
        </View>
      </View>

      <TonalCard level="lowest" style={styles.card}>
        <Text style={styles.cardTitle}>Contact Details</Text>
        {profileRows.map((row) => (
          <View key={row.label} style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name={row.icon} size={16} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue}>{row.value}</Text>
              </View>
            </View>
          </View>
        ))}
      </TonalCard>

      <TonalCard level="lowest" style={styles.card}>
        <Text style={styles.cardTitle}>Lease Information</Text>

        <View style={styles.leaseRow}>
          <Text style={styles.leaseLabel}>Lease Type</Text>
          <Text style={styles.leaseValue}>11 Months</Text>
        </View>
        <View style={styles.leaseRow}>
          <Text style={styles.leaseLabel}>Start Date</Text>
          <Text style={styles.leaseValue}>01 Jan 2026</Text>
        </View>
        <View style={styles.leaseRow}>
          <Text style={styles.leaseLabel}>End Date</Text>
          <Text style={styles.leaseValue}>30 Nov 2026</Text>
        </View>
        <View style={styles.leaseRowLast}>
          <Text style={styles.leaseLabel}>Monthly Rent</Text>
          <Text style={styles.leaseValue}>Rs 12,500</Text>
        </View>
      </TonalCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 36,
  },
  header: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 8,
    marginRight: 6,
  },
  title: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 30,
    color: theme.colors.onSurface,
  },
  profileTop: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 30,
    color: theme.colors.onPrimary,
  },
  name: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 24,
    color: theme.colors.onSurface,
  },
  tagline: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  roomBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  roomText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: 6,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 18,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    marginBottom: theme.spacing.md,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    marginRight: 10,
  },
  detailLabel: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  detailValue: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  leaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant + '33',
  },
  leaseRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaseLabel: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  leaseValue: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
});
