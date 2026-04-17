import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { paymentService } from '../../services/dataService';

export const PaymentCollectionScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'received'>('overview');
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState({ collected: 0, pending: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const data = await paymentService.getAll();
      const summaryData = await paymentService.getSummary('a0000000-0000-0000-0000-000000000001'); // Using default demo property ID
      setPayments(data || []);
      setSummary(summaryData);
    } catch (err) {
      console.log('Payments fetch error:', err);
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

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const recentPayments = payments.filter(p => p.status === 'paid');

  const collectionRate = summary.total > 0 ? Math.round((summary.collected / summary.total) * 100) : 0;

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Payments</Text>
            <Text style={styles.subtitle}>COLLECTION MANAGEMENT</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="download-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Revenue Hero Card */}
        <TonalCard level="low" style={[styles.heroCard, { backgroundColor: theme.colors.primary }]} floating={false}>
          <Text style={styles.heroLabel}>OVERALL REVENUE</Text>
          <Text style={styles.heroAmount}>₹{summary.collected.toLocaleString('en-IN')}</Text>
          <View style={styles.heroSubRow}>
            <View style={styles.heroTrend}>
              <Ionicons name="trending-up" size={16} color={theme.colors.vacantBg} />
              <Text style={styles.heroTrendText}>Live Collection Data</Text>
            </View>
          </View>

          {/* Collection Progress */}
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
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>₹{summary.collected.toLocaleString('en-IN')}</Text>
              <Text style={styles.heroStatLabel}>Collected</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: theme.colors.pendingBg }]}>₹{summary.pending.toLocaleString('en-IN')}</Text>
              <Text style={styles.heroStatLabel}>Pending</Text>
            </View>
          </View>
        </TonalCard>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          {['overview', 'pending', 'received'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as any)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Payments */}
        {(activeTab === 'overview' || activeTab === 'pending') && pendingPayments.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={18} color="#ba1a1a" />
              <Text style={styles.sectionTitle}>Pending Collections</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{pendingPayments.length}</Text>
              </View>
            </View>
            {pendingPayments.map((payment) => (
              <TonalCard key={payment.id} level="lowest" style={styles.paymentCard}>
                <View style={styles.paymentRow}>
                  <View style={[styles.paymentIcon, { backgroundColor: theme.colors.pendingBg }]}>
                    <Ionicons name="time-outline" size={20} color={theme.colors.pendingText} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTenant}>{payment.tenants?.name || 'Unknown'}</Text>
                    <Text style={styles.paymentRoom}>{payment.tenants?.room || '—'} • Due: {new Date(payment.due_date).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={styles.paymentAmount}>₹{payment.amount.toLocaleString()}</Text>
                    <StatusBadge status="pending" label="Overdue" />
                  </View>
                </View>
                <View style={styles.paymentActions}>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="chatbubble-outline" size={15} color={theme.colors.primary} />
                    <Text style={styles.actionText}>Remind</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="call-outline" size={15} color={theme.colors.primary} />
                    <Text style={styles.actionText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]}>
                    <Ionicons name="checkmark-circle-outline" size={15} color={theme.colors.onPrimary} />
                    <Text style={[styles.actionText, { color: theme.colors.onPrimary }]}>Mark Paid</Text>
                  </TouchableOpacity>
                </View>
              </TonalCard>
            ))}
          </>
        )}

        {/* Recent Payments */}
        {(activeTab === 'overview' || activeTab === 'received') && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.secondary} />
              <Text style={styles.sectionTitle}>Recent Payments</Text>
            </View>
            <TonalCard level="lowest" style={styles.ledgerCard}>
              {recentPayments.map((payment, index) => (
                <View key={payment.id} style={[styles.ledgerItem, index > 0 && styles.ledgerBorder]}>
                  <View style={[styles.paymentIconSmall, { backgroundColor: theme.colors.vacantBg }]}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.vacantText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerTenant}>{payment.tenants?.name || 'Unknown'}</Text>
                    <Text style={styles.ledgerSub}>{payment.id.slice(0, 8)} • {payment.tenants?.room} • {payment.method}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.ledgerAmount}>₹{payment.amount.toLocaleString()}</Text>
                    <Text style={styles.ledgerDate}>{new Date(payment.paid_date).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))}
            </TonalCard>
          </>
        )}

        {/* Payment Methods Summary */}
        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.xl, marginLeft: 0 }]}>Payment Methods</Text>
        <View style={styles.methodsRow}>
          {[
            { method: 'UPI', count: 3, icon: 'phone-portrait-outline' as const, color: theme.colors.primary },
            { method: 'Bank', count: 1, icon: 'business-outline' as const, color: theme.colors.secondary },
            { method: 'Cash', count: 1, icon: 'cash-outline' as const, color: '#f59e0b' },
          ].map((item, i) => (
            <TonalCard key={i} level="lowest" style={styles.methodCard}>
              <Ionicons name={item.icon} size={24} color={item.color} />
              <Text style={styles.methodCount}>{item.count}</Text>
              <Text style={styles.methodLabel}>{item.method}</Text>
            </TonalCard>
          ))}
        </View>

        {/* Send Reminder CTA */}
        <RentifyButton title="Send Bulk Reminder" onPress={() => {}} style={{ marginTop: theme.spacing.lg, marginBottom: 40 }} />
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
  iconBtn: { padding: 8 },
  heroCard: { padding: theme.spacing.xl, marginBottom: theme.spacing.xl },
  heroLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onPrimary, letterSpacing: 1.5, opacity: 0.8 },
  heroAmount: { fontFamily: theme.typography.headline.fontFamily, fontSize: 42, color: theme.colors.onPrimary, marginTop: 4 },
  heroSubRow: { marginTop: 8 },
  heroTrend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroTrendText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.vacantBg },
  collectionProgress: { marginTop: 24 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onPrimary, opacity: 0.8 },
  progressPercent: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onPrimary },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.vacantBg, borderRadius: 4 },
  heroStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  heroStat: {},
  heroStatValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 20, color: theme.colors.onPrimary },
  heroStatLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onPrimary, opacity: 0.7, marginTop: 2 },
  tabRow: {
    flexDirection: 'row', backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16, padding: 4, marginBottom: theme.spacing.xl,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: theme.colors.surfaceContainerLowest, ...theme.elevation.floating },
  tabText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant },
  tabTextActive: { color: theme.colors.primary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.md },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 20, color: theme.colors.onSurface },
  countBadge: {
    backgroundColor: '#ba1a1a', width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  countText: { fontFamily: theme.typography.label.fontFamily, fontSize: 12, color: '#fff' },
  paymentCard: { padding: theme.spacing.lg, marginBottom: 12 },
  paymentRow: { flexDirection: 'row', alignItems: 'center' },
  paymentIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  paymentIconSmall: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  paymentInfo: { flex: 1 },
  paymentTenant: { fontFamily: theme.typography.label.fontFamily, fontSize: 16, color: theme.colors.onSurface },
  paymentRoom: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  paymentRight: { alignItems: 'flex-end', gap: 4 },
  paymentAmount: { fontFamily: theme.typography.headline.fontFamily, fontSize: 18, color: theme.colors.onSurface },
  paymentActions: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant + '26',
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  actionBtnPrimary: { backgroundColor: theme.colors.primary },
  actionText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.primary },
  ledgerCard: { padding: 0, overflow: 'hidden', marginBottom: theme.spacing.lg },
  ledgerItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  ledgerBorder: { borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant + '26' },
  ledgerTenant: { fontFamily: theme.typography.label.fontFamily, fontSize: 15, color: theme.colors.onSurface },
  ledgerSub: { fontFamily: theme.typography.body.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  ledgerAmount: { fontFamily: theme.typography.headline.fontFamily, fontSize: 16, color: theme.colors.secondary },
  ledgerDate: { fontFamily: theme.typography.body.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  methodsRow: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.md },
  methodCard: { flex: 1, alignItems: 'center', padding: theme.spacing.lg },
  methodCount: { fontFamily: theme.typography.headline.fontFamily, fontSize: 24, color: theme.colors.onSurface, marginTop: 8 },
  methodLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2 },
});
