import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge } from '../../components/ui/StatusBadge';

const quickAccess = [
  {
    title: 'Meals',
    subtitle: 'Today: Dinner 8:00 PM',
    icon: 'restaurant-outline' as const,
    route: 'TenantMeal',
    tint: theme.colors.primary,
  },
  {
    title: 'Payments',
    subtitle: '1 due this month',
    icon: 'wallet-outline' as const,
    route: 'TenantPayment',
    tint: theme.colors.secondary,
  },
  {
    title: 'Support',
    subtitle: '0 active complaints',
    icon: 'construct-outline' as const,
    route: 'TenantProfile',
    tint: '#ba1a1a',
  },
  {
    title: 'Profile',
    subtitle: 'Lease ends: Dec 2026',
    icon: 'person-outline' as const,
    route: 'TenantProfile',
    tint: theme.colors.primaryContainer,
  },
];

export default function TenantDashboardScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>Aakash Mehta</Text>
          <Text style={styles.subline}>Luxury Wing A2</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AM</Text>
        </View>
      </View>

      <TonalCard level="lowest" style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceValue}>Rs 12,500</Text>

        <View style={styles.balanceMetaRow}>
          <Text style={styles.dueText}>Due on 5 Nov 2026</Text>
          <StatusBadge status="pending" label="Pending" />
        </View>

        <RentifyButton title="Settle Balance" onPress={() => navigation.navigate('TenantPayment')} style={styles.balanceBtn} />
      </TonalCard>

      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.grid}>
        {quickAccess.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.gridCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate(item.route)}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.tint + '1A' }]}>
              <Ionicons name={item.icon} size={20} color={item.tint} />
            </View>
            <Text style={styles.gridTitle}>{item.title}</Text>
            <Text style={styles.gridSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TonalCard level="low" style={styles.noticeCard} floating={false}>
        <View style={styles.noticeRow}>
          <Ionicons name="megaphone-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.noticeTitle}>Mess update</Text>
        </View>
        <Text style={styles.noticeBody}>Sunday breakfast will be served from 8:30 AM due to kitchen maintenance.</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  name: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 30,
    color: theme.colors.primary,
    marginTop: 2,
  },
  subline: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryContainer,
  },
  avatarText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 16,
    color: theme.colors.onPrimary,
  },
  balanceCard: {
    marginBottom: theme.spacing.xl,
  },
  balanceLabel: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 46,
    color: theme.colors.primary,
    marginTop: 6,
  },
  balanceMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  balanceBtn: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 21,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  gridCard: {
    width: '48%',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 20,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  gridSubtitle: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  noticeCard: {
    padding: theme.spacing.lg,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  noticeTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurface,
    marginLeft: 8,
  },
  noticeBody: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
});
