import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { RentifyButton } from '../../components/ui/RentifyButton';

const transactions = [
  {
    id: 'PAY-1027',
    title: 'October Rent',
    date: '05 Oct 2026',
    amount: 'Rs 12,500',
    badge: { status: 'occupied' as const, label: 'Paid' },
    method: 'UPI',
  },
  {
    id: 'SEC-1027',
    title: 'Security Deposit (Part 2)',
    date: '07 Oct 2026',
    amount: 'Rs 5,000',
    badge: { status: 'occupied' as const, label: 'Paid' },
    method: 'Bank Transfer',
  },
  {
    id: 'PAY-1127',
    title: 'November Rent',
    date: '05 Nov 2026',
    amount: 'Rs 12,500',
    badge: { status: 'pending' as const, label: 'Pending' },
    method: 'Not paid',
  },
];

export default function TenantPaymentScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>RENT AND DEPOSIT TRACKER</Text>
        </View>
      </View>

      <TonalCard level="lowest" style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Amount Due</Text>
        <Text style={styles.balanceValue}>Rs 12,500</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Due on 05 Nov 2026</Text>
          <StatusBadge status="pending" label="Pending" />
        </View>

        <RentifyButton title="Pay Now" onPress={() => {}} style={styles.payBtn} />
      </TonalCard>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <View style={styles.list}>
        {transactions.map((tx) => (
          <TonalCard key={tx.id} level="lowest" style={styles.txCard}>
            <View style={styles.txTopRow}>
              <View>
                <Text style={styles.txTitle}>{tx.title}</Text>
                <Text style={styles.txMeta}>{tx.id} - {tx.date}</Text>
              </View>
              <Text style={styles.txAmount}>{tx.amount}</Text>
            </View>

            <View style={styles.txBottomRow}>
              <Text style={styles.txMethod}>{tx.method}</Text>
              <StatusBadge status={tx.badge.status} label={tx.badge.label} />
            </View>
          </TonalCard>
        ))}
      </View>

      <TonalCard level="low" style={styles.tipCard} floating={false}>
        <View style={styles.tipRow}>
          <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.tipTitle}>Payment reminder</Text>
        </View>
        <Text style={styles.tipBody}>Pay before the due date to avoid late fees and keep your account in good standing.</Text>
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
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 30,
    color: theme.colors.onSurface,
  },
  subtitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    letterSpacing: 1.6,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  balanceCard: {
    marginBottom: theme.spacing.xl,
  },
  balanceLabel: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    color: theme.colors.onSurfaceVariant,
  },
  balanceValue: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 44,
    color: theme.colors.primary,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metaText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  payBtn: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 20,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  list: {
    marginBottom: theme.spacing.xl,
  },
  txCard: {
    marginBottom: 10,
    padding: theme.spacing.md,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  txTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 15,
    color: theme.colors.onSurface,
    maxWidth: 210,
  },
  txMeta: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 3,
  },
  txAmount: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 16,
    color: theme.colors.secondary,
    marginLeft: 8,
  },
  txBottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txMethod: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  tipCard: {
    padding: theme.spacing.lg,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurface,
    marginLeft: 8,
  },
  tipBody: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
});
