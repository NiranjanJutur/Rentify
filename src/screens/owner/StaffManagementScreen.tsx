import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge, StatusType } from '../../components/ui/StatusBadge';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { staffService } from '../../services/dataService';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  shift: string;
  status: StatusType;
  clocked_in: string;
  phone: string;
}

export const StaffManagementScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      const data = await staffService.getAll();
      setStaff(data || []);
    } catch (err) {
      console.log('Staff fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStaff();
  };

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = staff.filter(s => s.status === 'occupied').length;

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Staff Management</Text>
            <Text style={styles.subtitle}>WORKFORCE OPERATIONS</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="add-circle-outline" size={26} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Overview Metrics */}
        <View style={styles.metricsRow}>
          <TonalCard level="lowest" style={styles.metricCard}>
            <Text style={styles.metricValue}>{staffData.length}</Text>
            <Text style={styles.metricLabel}>TOTAL STAFF</Text>
          </TonalCard>
          <TonalCard level="lowest" style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: theme.colors.secondary }]}>{activeCount}</Text>
            <Text style={styles.metricLabel}>CLOCKED IN</Text>
          </TonalCard>
          <TonalCard level="lowest" style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#ba1a1a' }]}>{staffData.length - activeCount}</Text>
            <Text style={styles.metricLabel}>ABSENT</Text>
          </TonalCard>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={theme.colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or role..."
            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Shift Overview */}
        <Text style={styles.sectionTitle}>Today's Shifts</Text>
        <View style={styles.shiftRow}>
          {[
            { shift: 'Morning', count: 3, icon: 'sunny-outline' as const },
            { shift: 'Night', count: 1, icon: 'moon-outline' as const },
            { shift: 'Split', count: 1, icon: 'swap-horizontal' as const },
          ].map((item, i) => (
            <TonalCard key={i} level="low" style={styles.shiftCard} floating={false}>
              <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
              <Text style={styles.shiftCount}>{item.count}</Text>
              <Text style={styles.shiftLabel}>{item.shift}</Text>
            </TonalCard>
          ))}
        </View>

        {/* Staff List */}
        <Text style={styles.sectionTitle}>Staff Directory</Text>
        <View style={styles.staffList}>
          {filteredStaff.map((staff) => (
            <TonalCard key={staff.id} level="lowest" style={styles.staffCard}>
              <View style={styles.staffRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{staff.name.charAt(0)}</Text>
                </View>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{staff.name}</Text>
                  <Text style={styles.staffRole}>{staff.role}</Text>
                  <Text style={styles.staffShift}>
                    <Ionicons name="time-outline" size={12} color={theme.colors.onSurfaceVariant} />
                    {' '}{staff.shift} Shift • Clocked in: {staff.clockedIn}
                  </Text>
                </View>
                <View style={styles.staffActions}>
                  <StatusBadge
                    status={staff.status}
                    label={staff.status === 'occupied' ? 'Active' : staff.status === 'pending' ? 'Late' : 'Off Duty'}
                  />
                </View>
              </View>
              <View style={styles.staffFooter}>
                <TouchableOpacity style={styles.staffActionBtn}>
                  <Ionicons name="call-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.staffActionText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.staffActionBtn}>
                  <Ionicons name="chatbubble-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.staffActionText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.staffActionBtn}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.staffActionText}>Schedule</Text>
                </TouchableOpacity>
              </View>
            </TonalCard>
          ))}
        </View>

        {/* Payroll Summary */}
        <Text style={styles.sectionTitle}>Payroll Summary</Text>
        <TonalCard level="lowest" style={styles.payrollCard}>
          <View style={styles.payrollRow}>
            <View>
              <Text style={styles.payrollLabel}>TOTAL MONTHLY PAYROLL</Text>
              <Text style={styles.payrollValue}>₹1,24,500</Text>
            </View>
            <View>
              <Text style={styles.payrollLabel}>NEXT PAYOUT</Text>
              <Text style={styles.payrollDate}>Oct 30, 2026</Text>
            </View>
          </View>
          <RentifyButton title="Process Salaries" onPress={() => {}} style={{ marginTop: 20 }} />
        </TonalCard>
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
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.xl },
  metricCard: { flex: 1, alignItems: 'center', padding: theme.spacing.md },
  metricValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 32, color: theme.colors.primary },
  metricLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, letterSpacing: 1, marginTop: 4 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: theme.spacing.xl,
  },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: theme.typography.body.fontFamily, fontSize: 15, color: theme.colors.onSurface },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  shiftRow: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.xl },
  shiftCard: { flex: 1, alignItems: 'center', padding: theme.spacing.md },
  shiftCount: { fontFamily: theme.typography.headline.fontFamily, fontSize: 24, color: theme.colors.onSurface, marginTop: 8 },
  shiftLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  staffList: { gap: 12, marginBottom: theme.spacing.xl },
  staffCard: { padding: theme.spacing.md },
  staffRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  avatarText: { fontFamily: theme.typography.headline.fontFamily, fontSize: 20, color: theme.colors.onPrimary },
  staffInfo: { flex: 1 },
  staffName: { fontFamily: theme.typography.label.fontFamily, fontSize: 16, color: theme.colors.onSurface },
  staffRole: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  staffShift: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  staffActions: { marginLeft: 8 },
  staffFooter: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant + '26',
  },
  staffActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  staffActionText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.primary },
  payrollCard: { padding: theme.spacing.xl, marginBottom: theme.spacing.xl },
  payrollRow: { flexDirection: 'row', justifyContent: 'space-between' },
  payrollLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, letterSpacing: 1 },
  payrollValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 28, color: theme.colors.primary, marginTop: 4 },
  payrollDate: { fontFamily: theme.typography.headline.fontFamily, fontSize: 18, color: theme.colors.onSurface, marginTop: 4 },
});
