import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar, Modal } from 'react-native';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { propertyService, tenantService, paymentService, expenseService, staffService, complaintService, authService } from '../../services/dataService';
import { LinearGradient } from 'expo-linear-gradient';

const quickActions = [
  { name: 'Tenants', icon: 'people-outline' as const, route: 'TenantManagement', color: '#6366f1' },
  { name: 'Payments', icon: 'wallet-outline' as const, route: 'PaymentCollection', color: '#10b981' },
  { name: 'Expenses', icon: 'receipt-outline' as const, route: 'ExpenseTracker', color: '#f59e0b' },
  { name: 'Staff', icon: 'person-outline' as const, route: 'StaffManagement', color: '#ec4899' },
  { name: 'Rooms', icon: 'grid-outline' as const, route: 'RoomOverview', color: '#06b6d4' },
  { name: 'Complaints', icon: 'construct-outline' as const, route: 'MaintenanceComplaints', color: '#ef4444' },
  { name: 'Notices', icon: 'megaphone-outline' as const, route: 'Notices', color: '#8b5cf6' },
  { name: 'Add Prop', icon: 'add-circle-outline' as const, route: 'RegisterProperty', color: '#4f46e5' },
  { name: 'Food', icon: 'restaurant-outline' as const, route: 'OwnerMealManagement', color: '#f43f5e' },
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
  const [ownerName, setOwnerName] = useState('');
  const [showPropertySwitcher, setShowPropertySwitcher] = useState(false);

  const fetchMetrics = useCallback(async (selectedPropId?: string, showSpinner: boolean = true) => {
    try {
      if (showSpinner) setLoading(true);
      const props = await propertyService.getMyProperties();
      setPropertyList(props || []);
      const session = await authService.getSession();
      if (session?.user) {
        let name = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
        if (!name && session.user.email) {
          const prefix = session.user.email.split('@')[0];
          name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        }
        setOwnerName(name || '');
      }

      let currentProp = props?.[0];
      if (selectedPropId) {
        currentProp = props?.find(p => p.id === selectedPropId) || currentProp;
      }
      
      setActiveProperty(currentProp);

      if (!currentProp) {
        setMetrics(prev => ({ ...prev, properties: 0 }));
        setRecentPayments([]);
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

      const staffCount = staff?.filter((s: any) => s.status === 'active').length || 0;
      const totalCapacity = currentProp.total_capacity || 0;
      const occupied = tenants?.filter((t: any) => t.status === 'occupied').length || 0;

      setMetrics({
        properties: props?.length || 0,
        tenants: tenants?.length || 0,
        occupied,
        vacant: Math.max(0, totalCapacity - occupied),
        collected: paySum.collected,
        expected: paySum.total,
        pending: paySum.pending,
        expenses: expSum.totalExpenses,
        profit: paySum.collected - expSum.totalExpenses,
        openComplaints: complaints?.filter((c: any) => c.status === 'open').length || 0,
        staffOnline: `${staffCount}/${staff?.length || 0}`
      });

      setRecentPayments(allPayments?.slice(0, 5) || []);

    } catch (err) {
      console.log('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMetrics(undefined, false);
    }, [fetchMetrics])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const collectionPercentage = metrics.expected > 0 
    ? ((metrics.collected / metrics.expected) * 100).toFixed(1) 
    : '0.0';

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.greeting}>Good Day, {ownerName || 'Owner'}</Text>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
              onPress={() => setShowPropertySwitcher(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.subtitle}>
                {activeProperty?.name || 'Managing your estate'} • {metrics.tenants} tenants
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('OwnerProfile')}>
            <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.profileGradient}>
              <Text style={styles.profileInitial}>{(ownerName || 'O')[0]}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Main Stats Card */}
        <LinearGradient
          colors={['#0F172A', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Total Revenue</Text>
              <Text style={styles.heroValue}>₹{metrics.collected.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="pie-chart" size={14} color="#10b981" />
              <Text style={styles.badgeText}>{collectionPercentage}% Collected</Text>
            </View>
          </View>
          
          <View style={styles.heroDivider} />
          
          <View style={styles.heroBottom}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>₹{metrics.pending.toLocaleString('en-IN')}</Text>
              <Text style={styles.heroStatLbl}>Pending</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>₹{metrics.expenses.toLocaleString('en-IN')}</Text>
              <Text style={styles.heroStatLbl}>Expenses</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: '#10b981' }]}>₹{metrics.profit.toLocaleString('en-IN')}</Text>
              <Text style={styles.heroStatLbl}>Net Profit</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.miniStatCard}>
            <View style={[styles.miniIcon, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="people" size={18} color="#16a34a" />
            </View>
            <Text style={styles.miniVal}>{metrics.occupied}</Text>
            <Text style={styles.miniLbl}>Occupied</Text>
          </View>
          <View style={styles.miniStatCard}>
            <View style={[styles.miniIcon, { backgroundColor: '#fff7ed' }]}>
              <Ionicons name="bed" size={18} color="#ea580c" />
            </View>
            <Text style={styles.miniVal}>{metrics.vacant}</Text>
            <Text style={styles.miniLbl}>Vacant</Text>
          </View>
          <View style={styles.miniStatCard}>
            <View style={[styles.miniIcon, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="warning" size={18} color="#dc2626" />
            </View>
            <Text style={styles.miniVal}>{metrics.openComplaints}</Text>
            <Text style={styles.miniLbl}>Complaints</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.actionItem}
              onPress={() => navigation.navigate(action.route)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '1A' }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionTop}>
          <Text style={styles.sectionHeader}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PaymentCollection')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {recentPayments.length === 0 ? (
            <Text style={styles.emptyText}>No recent activity.</Text>
          ) : (
            recentPayments.map((p) => (
              <View key={p.id} style={styles.activityCard}>
                <View style={styles.activityIcon}>
                  <Ionicons 
                    name={p.status === 'paid' ? "checkmark-circle" : "time"} 
                    size={20} 
                    color={p.status === 'paid' ? "#10b981" : "#f59e0b"} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>{p.tenants?.name || 'Tenant'}</Text>
                  <Text style={styles.activitySub}>{p.status === 'paid' ? 'Rent Received' : 'Rent Pending'} • {p.month}</Text>
                </View>
                <Text style={[styles.activityAmount, { color: p.status === 'paid' ? "#10b981" : "#334155" }]}>
                  ₹{p.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="grid" size={20} color="#4f46e5" />
          <Text style={[styles.navText, { color: '#4f46e5' }]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TenantManagement')}>
          <Ionicons name="people-outline" size={20} color="#64748b" />
          <Text style={styles.navText}>Tenants</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PaymentCollection')}>
          <Ionicons name="wallet-outline" size={20} color="#64748b" />
          <Text style={styles.navText}>Finance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('OwnerProfile')}>
          <Ionicons name="settings-outline" size={20} color="#64748b" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
      {/* Property Switcher Modal */}
      <Modal
        visible={showPropertySwitcher}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPropertySwitcher(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPropertySwitcher(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Switch Property</Text>
                <TouchableOpacity onPress={() => setShowPropertySwitcher(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {propertyList.map((prop) => (
                  <TouchableOpacity
                    key={prop.id}
                    style={[
                      styles.propertyOption,
                      activeProperty?.id === prop.id && styles.propertyOptionActive
                    ]}
                    onPress={() => {
                      fetchMetrics(prop.id);
                      setShowPropertySwitcher(false);
                    }}
                  >
                    <Text style={[
                      styles.propertyOptionText,
                      activeProperty?.id === prop.id && styles.propertyOptionTextActive
                    ]}>
                      {prop.name}
                    </Text>
                    {activeProperty?.id === prop.id && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContainer: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  profileBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', elevation: 4 },
  profileGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileInitial: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 20,
    color: '#fff',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    ...theme.elevation.high,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 20,
    color: theme.colors.onSurface,
  },
  propertyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  propertyOptionActive: {
    backgroundColor: theme.colors.primaryContainer + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  propertyOptionText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  propertyOptionTextActive: {
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.primary,
  },
  heroCard: { borderRadius: 24, padding: 24, marginBottom: 20, elevation: 8, shadowColor: '#1e293b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  heroValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  badgeText: { color: '#10b981', fontSize: 12, fontWeight: '700' },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  heroStat: { flex: 1 },
  heroStatVal: { color: '#fff', fontSize: 16, fontWeight: '700' },
  heroStatLbl: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  miniStatCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2 },
  miniIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  miniVal: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  miniLbl: { fontSize: 11, color: '#64748b', marginTop: 2 },
  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  sectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAll: { fontSize: 13, color: '#4f46e5', fontWeight: '700' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionItem: { width: '22%', alignItems: 'center', marginBottom: 8 },
  actionIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#475569', textAlign: 'center' },
  activityList: { gap: 12 },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  activityIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activityTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  activitySub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  activityAmount: { fontSize: 14, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: 20, fontStyle: 'italic' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingBottom: 20 },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 10, fontWeight: '700', color: '#64748b', marginTop: 4 }
});
