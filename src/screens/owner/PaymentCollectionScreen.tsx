import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { paymentService } from '../../services/dataService';

type PaymentRecord = {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  method?: string;
  due_date?: string;
  paid_date?: string;
  month?: string;
  tenants?: { name?: string; room?: string; block?: string };
};

export const PaymentCollectionScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'received'>('overview');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      const data = await paymentService.getAll();
      setPayments(data || []);
    } catch (err: any) {
      setMessage(err.message || 'Could not load payments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const summary = useMemo(() => {
    const collected = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pending = payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const total = collected + pending;
    return { collected, pending, total };
  }, [payments]);

  const pendingPayments = payments.filter(p => p.status !== 'paid');
  const recentPayments = payments.filter(p => p.status === 'paid');
  const collectionRate = summary.total > 0 ? Math.round((summary.collected / summary.total) * 100) : 0;

  const methodSummary = useMemo(() => {
    const buckets: Record<string, number> = {};
    payments.forEach(payment => {
      const key = payment.method || 'Unspecified';
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets);
  }, [payments]);

  const handleMarkPaid = async (payment: PaymentRecord) => {
    try {
      await paymentService.markPaid(payment.id, payment.method || 'UPI');
      setMessage(`${payment.tenants?.name || 'Tenant'} marked paid.`);
      fetchPayments();
    } catch (error: any) {
      setMessage(error.message || 'Could not update payment.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Payments</Text>
            <Text style={styles.subtitle}>COLLECTION MANAGEMENT</Text>
          </View>
        </View>

        <TonalCard level="low" style={[styles.heroCard, { backgroundColor: theme.colors.primary }]} floating={false}>
          <Text style={styles.heroLabel}>OVERALL REVENUE</Text>
          <Text style={styles.heroAmount}>Rs {summary.collected.toLocaleString('en-IN')}</Text>
          <View style={styles.collectionProgress}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Collection Progress</Text>
              <Text style={styles.progressPercent}>{collectionRate}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${collectionRate}%` }]} />
            </View>
          </View>
          <View style={styles.heroStatsRow}>
            <View>
              <Text style={styles.heroStatValue}>Rs {summary.collected.toLocaleString('en-IN')}</Text>
              <Text style={styles.heroStatLabel}>Collected</Text>
            </View>
            <View>
              <Text style={styles.heroStatValue}>Rs {summary.pending.toLocaleString('en-IN')}</Text>
              <Text style={styles.heroStatLabel}>Pending</Text>
            </View>
          </View>
        </TonalCard>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.tabRow}>
          {['overview', 'pending', 'received'].map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab as 'overview' | 'pending' | 'received')} style={[styles.tab, activeTab === tab && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {(activeTab === 'overview' || activeTab === 'pending') && (
          <>
            <Text style={styles.sectionTitle}>Pending Collections</Text>
            {pendingPayments.length === 0 ? (
              <TonalCard level="lowest"><Text style={styles.emptyText}>No pending payments right now.</Text></TonalCard>
            ) : (
              pendingPayments.map(payment => (
                <TonalCard key={payment.id} level="lowest" style={styles.paymentCard}>
                  <View style={styles.paymentRow}>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentTenant}>{payment.tenants?.name || 'Unknown Tenant'}</Text>
                      <Text style={styles.paymentMeta}>
                        {payment.tenants?.room || '-'} / Due: {payment.due_date ? new Date(payment.due_date).toLocaleDateString() : 'Not set'} / {payment.month || 'Current cycle'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={styles.paymentAmount}>Rs {Number(payment.amount || 0).toLocaleString('en-IN')}</Text>
                      <StatusBadge status="pending" label={payment.status === 'overdue' ? 'Overdue' : 'Pending'} />
                    </View>
                  </View>
                  <View style={styles.paymentActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Reminder', `Reminder prepared for ${payment.tenants?.name || 'tenant'}.`)}>
                      <Text style={styles.actionText}>Remind</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => handleMarkPaid(payment)}>
                      <Text style={[styles.actionText, { color: theme.colors.onPrimary }]}>Mark Paid</Text>
                    </TouchableOpacity>
                  </View>
                </TonalCard>
              ))
            )}
          </>
        )}

        {(activeTab === 'overview' || activeTab === 'received') && (
          <>
            <Text style={styles.sectionTitle}>Received Payments</Text>
            <TonalCard level="lowest" style={styles.ledgerCard}>
              {recentPayments.length === 0 ? (
                <Text style={styles.emptyText}>No paid entries yet.</Text>
              ) : (
                recentPayments.map((payment, index) => (
                  <View key={payment.id} style={[styles.ledgerItem, index > 0 && styles.ledgerBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ledgerTenant}>{payment.tenants?.name || 'Unknown Tenant'}</Text>
                      <Text style={styles.ledgerSub}>{payment.tenants?.room || '-'} / {payment.method || 'Unspecified'} / {payment.month || 'Current cycle'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.ledgerAmount}>Rs {Number(payment.amount || 0).toLocaleString('en-IN')}</Text>
                      <Text style={styles.ledgerDate}>{payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : 'Paid'}</Text>
                    </View>
                  </View>
                ))
              )}
            </TonalCard>
          </>
        )}

        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.xl }]}>Payment Methods</Text>
        <View style={styles.methodsRow}>
          {methodSummary.length === 0 ? (
            <TonalCard level="lowest" style={styles.methodCard}><Text style={styles.emptyText}>No payment methods logged yet.</Text></TonalCard>
          ) : (
            methodSummary.map(([method, count]) => (
              <TonalCard key={method} level="lowest" style={styles.methodCard}>
                <Text style={styles.methodCount}>{count}</Text>
                <Text style={styles.methodLabel}>{method}</Text>
              </TonalCard>
            ))
          )}
        </View>

        <RentifyButton title="Refresh Collection Data" onPress={fetchPayments} style={{ marginTop: theme.spacing.lg, marginBottom: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scrollContainer: { padding: theme.spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl },
  backBtn: { padding: 8, marginRight: 12 },
  title: { fontFamily: theme.typography.headline.fontFamily, fontSize: 28, color: theme.colors.onSurface },
  subtitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, letterSpacing: 2, marginTop: 2 },
  heroCard: { padding: theme.spacing.xl, marginBottom: theme.spacing.xl },
  heroLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onPrimary, letterSpacing: 1.5, opacity: 0.8 },
  heroAmount: { fontFamily: theme.typography.headline.fontFamily, fontSize: 42, color: theme.colors.onPrimary, marginTop: 4 },
  collectionProgress: { marginTop: 24 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onPrimary, opacity: 0.8 },
  progressPercent: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onPrimary },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.vacantBg, borderRadius: 4 },
  heroStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  heroStatValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 20, color: theme.colors.onPrimary },
  heroStatLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onPrimary, opacity: 0.7, marginTop: 2 },
  message: { marginBottom: theme.spacing.md, fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.danger },
  tabRow: { flexDirection: 'row', backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 8, padding: 4, marginBottom: theme.spacing.xl },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: theme.colors.surfaceContainerLowest, ...theme.elevation.floating },
  tabText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant },
  tabTextActive: { color: theme.colors.primary },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 20, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  paymentCard: { padding: theme.spacing.lg, marginBottom: 12 },
  paymentRow: { flexDirection: 'row', alignItems: 'center' },
  paymentInfo: { flex: 1 },
  paymentTenant: { fontFamily: theme.typography.label.fontFamily, fontSize: 16, color: theme.colors.onSurface },
  paymentMeta: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  paymentAmount: { fontFamily: theme.typography.headline.fontFamily, fontSize: 18, color: theme.colors.onSurface },
  paymentActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow },
  actionBtnPrimary: { backgroundColor: theme.colors.primary },
  actionText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.primary },
  ledgerCard: { padding: 0, overflow: 'hidden', marginBottom: theme.spacing.lg },
  ledgerItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  ledgerBorder: { borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant + '26' },
  ledgerTenant: { fontFamily: theme.typography.label.fontFamily, fontSize: 15, color: theme.colors.onSurface },
  ledgerSub: { fontFamily: theme.typography.body.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  ledgerAmount: { fontFamily: theme.typography.headline.fontFamily, fontSize: 16, color: theme.colors.secondary },
  ledgerDate: { fontFamily: theme.typography.body.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  methodsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: theme.spacing.md },
  methodCard: { width: '31%', alignItems: 'center', padding: theme.spacing.lg },
  methodCount: { fontFamily: theme.typography.headline.fontFamily, fontSize: 24, color: theme.colors.onSurface },
  methodLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' },
  emptyText: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant, padding: theme.spacing.lg },
});
