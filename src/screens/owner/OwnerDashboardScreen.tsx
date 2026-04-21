import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { propertyService, tenantService, paymentService, expenseService, staffService, complaintService, authService } from '../../services/dataService';

import { RentifyButton } from '../../components/ui/RentifyButton';
import { TonalCard } from '../../components/ui/TonalCard';

const quickActions = [
  { name: 'Tenants', icon: 'people-outline' as const, route: 'TenantManagement', color: theme.colors.primary },
  { name: 'Payments', icon: 'wallet-outline' as const, route: 'PaymentCollection', color: theme.colors.secondary },
  { name: 'Expenses', icon: 'receipt-outline' as const, route: 'ExpenseTracker', color: '#f59e0b' },
  { name: 'Staff', icon: 'person-outline' as const, route: 'StaffManagement', color: theme.colors.primaryContainer },
  { name: 'Rooms', icon: 'grid-outline' as const, route: 'RoomOverview', color: '#10b981' },
  { name: 'Maintenance', icon: 'construct-outline' as const, route: 'MaintenanceComplaints', color: '#ba1a1a' },
  { name: 'Notices', icon: 'megaphone-outline' as const, route: 'Notices', color: '#7c3aed' },
  { name: 'Add Property', icon: 'add-circle-outline' as const, route: 'RegisterProperty', color: theme.colors.secondary },
  { name: 'Reports', icon: 'analytics-outline' as const, route: 'Reports', color: theme.colors.onSurfaceVariant },
];

export const OwnerDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    properties: 0,
    tenants: 0,
    occupied: 0,
    vacant: 0,
    collected: 0,
    expected: 0,
    pending: 0,
    expenses: 0,
    profit: 0,
    openComplaints: 0,
    staffOnline: '0/0'
  });
  const [activeProperty, setActiveProperty] = useState<any>(null);
  const [propertyList, setPropertyList] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [upcomingDues, setUpcomingDues] = useState<any[]>([]);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const props = await propertyService.getMyProperties();
      setPropertyList(props || []);
      
      const currentProp = props?.[0];
      setActiveProperty(currentProp);

      if (!currentProp) {
        setMetrics(prev => ({ ...prev, properties: 0 }));
        setRecentPayments([]);
        setUpcomingDues([]);
        return;
      }

      const propId = currentProp.id;
      const [tenants, paySum, expSum, staff, complaints, allPayments] = await Promise.all([
        tenantService.getAll(propId),
        paymentService.getSummary(propId),
        expenseService.getSummary(propId),
        staffService.getAll(propId),
        complaintService.getAll(propId),
        paymentService.getAll(propId)
      ]);

      const occupied = tenants?.filter((t: any) => t.status === 'occupied').length || 0;
      const staffCount = staff?.filter((s: any) => s.status === 'active').length || 0;

      setMetrics({
        properties: props?.length || 0,
        tenants: tenants?.length || 0,
        occupied,
        vacant: (tenants?.length || 0) - occupied,
        collected: paySum.collected,
        expected: paySum.total,
        pending: paySum.pending,
        expenses: expSum.totalExpenses,
        profit: paySum.collected - expSum.totalExpenses,
        openComplaints: complaints?.filter((c: any) => c.status === 'open').length || 0,
        staffOnline: `${staffCount}/${staff?.length || 0}`
      });

      // Simple recent activity logic
      setRecentPayments(allPayments?.slice(0, 4) || []);
      
      // Simple upcoming dues logic
      const dues = allPayments?.filter(p => p.status !== 'paid').slice(0, 4) || [];
      setUpcomingDues(dues);

    } catch (err) {
      console.log('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      // Navigation state will reset automatically if App.tsx uses onAuthStateChange, 
      // but we can explicitly navigate too if needed.
      navigation.reset({
        index: 0,
        routes: [{ name: 'OwnerLogin' }],
      });
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
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
        <View style={styles.webContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{activeProperty?.name || 'Estate Overview'}</Text>
              <Text style={styles.subtitle}>
                {propertyList.length === 0 
                  ? 'No properties registered' 
                  : `Monitoring ${metrics.properties} Properties / ${metrics.tenants} Tenants`}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('OwnerProfile')}>
                <Ionicons name="person-circle-outline" size={32} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerBtn, { marginLeft: 8 }]} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={26} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {propertyList.length === 0 && (
            <TonalCard level="medium" style={styles.emptyStateCard}>
              <Ionicons name="business-outline" size={48} color={theme.colors.primary} />
              <Text style={styles.emptyStateTitle}>Welcome to Rentify!</Text>
              <Text style={styles.emptyStateText}>You haven't added any properties yet. Register your first property to start managing tenants and tracking rent.</Text>
              <RentifyButton 
                title="Add a Property" 
                variant="primary" 
                onPress={() => navigation.navigate('RegisterProperty')} 
                style={{ paddingHorizontal: 40, marginTop: 10 }}
              />
            </TonalCard>
          )}

          {/* Occupancy Card */}
          <View style={styles.occupancyCard}>
            <Text style={styles.sectionTitleSmall}>Occupancy</Text>
            <View style={styles.row}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricValueLarge}>{metrics.occupied}</Text>
                <Text style={styles.metricLabelSmall}>Occupied</Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricValueLarge}>{metrics.vacant}</Text>
                <Text style={styles.metricLabelSmall}>Vacant</Text>
              </View>
            </View>
          </View>

          {/* Financial Metrics */}
          <View style={[styles.card, styles.primaryCard]}>
            <Text style={styles.cardHeroValue}>Rs {metrics.collected.toLocaleString('en-IN')}</Text>
            <Text style={styles.cardHeroLabel}>Rent Collected</Text>
            <View style={styles.financeRow}>
              <View style={styles.metricBlock}>
                  <Text style={styles.financeVal}>Rs {metrics.expected.toLocaleString('en-IN')}</Text>
                  <Text style={styles.financeLbl}>Expected</Text>
              </View>
              <View style={styles.metricBlock}>
                  <Text style={styles.financeVal}>Rs {metrics.pending.toLocaleString('en-IN')}</Text>
                  <Text style={styles.financeLbl}>Pending</Text>
              </View>
            </View>
            <View style={styles.financeRow}>
              <View style={styles.metricBlock}>
                  <Text style={styles.financeVal}>Rs {metrics.expenses.toLocaleString('en-IN')}</Text>
                  <Text style={styles.financeLbl}>Expenses</Text>
              </View>
              <View style={styles.metricBlock}>
                  <Text style={styles.financeVal}>Rs {metrics.profit.toLocaleString('en-IN')}</Text>
                  <Text style={styles.financeLbl}>Net Cashflow</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions Grid */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickActionItem}
                onPress={() => navigation.navigate(action.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '1A' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Operational Pulse */}
          <View style={styles.card}>
            <Text style={styles.sectionTitleSmall}>Operational Pulse</Text>
            <View style={styles.row}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricValueLarge}>{metrics.openComplaints}</Text>
                <Text style={styles.metricLabelSmall}>Open Complaints</Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricValueLarge}>{metrics.staffOnline}</Text>
                <Text style={styles.metricLabelSmall}>Staff Clocked-in</Text>
              </View>
            </View>
          </View>

          {/* Activity Feed */}
          <Text style={styles.sectionTitle}>Activity Feed</Text>
          <View style={styles.listContainer}>
            {recentPayments.length === 0 ? (
              <Text style={styles.emptyActivityText}>No recent activities recorded.</Text>
            ) : (
              recentPayments.map((p, i) => (
                <View key={p.id} style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: p.status === 'paid' ? theme.colors.secondary : theme.colors.warning }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityText}>
                      {p.tenants?.name} {p.status === 'paid' ? 'paid rent for' : 'has rent due for'} {p.tenants?.room}
                    </Text>
                    <Text style={styles.activityTime}>{p.month || 'Recent'}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Upcoming Dues */}
          <Text style={styles.sectionTitle}>Upcoming Dues</Text>
          <View style={styles.listContainer}>
            {upcomingDues.length === 0 ? (
              <Text style={styles.emptyActivityText}>No pending dues.</Text>
            ) : (
              upcomingDues.map((p) => (
                <View key={p.id} style={styles.dueItem}>
                  <View style={styles.dueAvatar}>
                    <Text style={styles.dueAvatarText}>{(p.tenants?.name || 'T')[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dueName}>{p.tenants?.name}</Text>
                    <Text style={styles.dueRoom}>{p.tenants?.block} / {p.tenants?.room}</Text>
                  </View>
                  <Text style={styles.dueAmount}>Rs {p.amount.toLocaleString('en-IN')}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemContainer}>
          <Ionicons name="home" size={20} color={theme.colors.primary} />
          <Text style={styles.navActive}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemContainer} onPress={() => navigation.navigate('TenantManagement')}>
          <Ionicons name="people-outline" size={20} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.navItem}>Tenants</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemContainer} onPress={() => navigation.navigate('PaymentCollection')}>
          <Ionicons name="wallet-outline" size={20} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.navItem}>Payments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemContainer} onPress={() => navigation.navigate('MaintenanceComplaints')}>
          <Ionicons name="construct-outline" size={20} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.navItem}>Maintenance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemContainer} onPress={() => navigation.navigate('Notices')}>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.navItem}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: 100,
  },
  webContainer: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 900,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  headerActions: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  headerBtn: { 
    padding: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  greeting: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 32,
    color: theme.colors.onSurface,
  },
  subtitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.elevation.floating,
  },
  primaryCard: {
    backgroundColor: theme.colors.primary,
  },
  occupancyCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.elevation.floating,
  },
  sectionTitleSmall: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 18,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  metricBlock: {
    marginRight: theme.spacing.xxl,
  },
  metricValueLarge: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 36,
    color: theme.colors.onSurface,
  },
  metricLabelSmall: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
  },
  cardHeroValue: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 42,
    color: theme.colors.onPrimary,
  },
  cardHeroLabel: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 15,
    color: theme.colors.onPrimary,
    opacity: 0.8,
  },
  financeVal: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 18,
    color: theme.colors.onPrimary,
  },
  financeLbl: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    color: theme.colors.onPrimary,
    opacity: 0.8,
  },
  sectionTitle: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 22,
    color: theme.colors.onSurface,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  quickActionItem: {
    width: '22%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  // Activity
  listContainer: {
    marginBottom: theme.spacing.md,
  },
  activityItem: {
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: theme.spacing.md,
    borderRadius: 16,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 6,
    marginRight: 12,
  },
  activityText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 15,
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  activityTime: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    color: theme.colors.secondary,
  },
  // Dues
  dueItem: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: theme.spacing.md,
    borderRadius: 16,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.elevation.floating,
  },
  dueAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dueAvatarText: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 16,
    color: theme.colors.onPrimary,
  },
  dueName: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  dueRoom: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  dueAmount: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 16,
    color: theme.colors.primary,
  },
  // Bottom Nav
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: theme.colors.surfaceContainerLowest,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant + '26',
  },
  navItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navItem: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  navActive: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    color: theme.colors.primary,
    marginTop: 4,
  },
  emptyStateCard: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
    marginVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  emptyStateTitle: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 22,
    color: theme.colors.onSurface,
    marginTop: 16,
  },
  emptyStateText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: theme.spacing.lg,
  },
  emptyActivityText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  }
});
