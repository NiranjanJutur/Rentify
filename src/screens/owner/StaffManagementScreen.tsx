import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge, StatusType } from '../../components/ui/StatusBadge';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { propertyService, staffService } from '../../services/dataService';

type StaffMember = {
  id: string;
  name: string;
  role: string;
  shift?: string;
  status?: 'active' | 'late' | 'off_duty';
  clocked_in?: string;
  phone?: string;
  salary?: number;
  duty_days?: string[];
  payment_due_day?: number;
  notes?: string;
  photo_data?: string;
};

const mapStaffStatus = (status?: string): { badge: StatusType; label: string } => {
  if (status === 'active') return { badge: 'occupied', label: 'Active' };
  if (status === 'late') return { badge: 'pending', label: 'Late' };
  return { badge: 'vacant', label: 'Off Duty' };
};

export const StaffManagementScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const props = await propertyService.getMyProperties();
      const currentProp = props?.[0];
      
      if (!currentProp) {
        setStaff([]);
        setLoading(false);
        return;
      }
      
      setActivePropertyId(currentProp.id);
      const data = await staffService.getAll(currentProp.id);
      setStaff(data || []);
    } catch (err: any) {
      console.log('Error fetching staff:', err);
      setMessage(err.message || 'Could not load staff records.');
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

  const filteredStaff = useMemo(
    () =>
      staff.filter(member =>
        [member.name, member.role, member.phone, member.shift]
          .filter(Boolean)
          .some(value => value!.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [searchQuery, staff]
  );

  const metrics = useMemo(() => {
    const active = staff.filter(member => member.status === 'active').length;
    const late = staff.filter(member => member.status === 'late').length;
    const offDuty = staff.filter(member => member.status === 'off_duty').length;
    const payroll = staff.reduce((sum, member) => sum + Number(member.salary || 0), 0);
    const shiftCounts = ['Morning', 'Evening', 'Night', 'Split', 'Full Day'].map(shift => ({
      shift,
      count: staff.filter(member => member.shift === shift).length,
    }));
    return { active, late, offDuty, payroll, shiftCounts };
  }, [staff]);

  const handleStatusUpdate = async (member: StaffMember, status: 'active' | 'late' | 'off_duty') => {
    try {
      await staffService.update(member.id, { status });
      setMessage(`${member.name} updated to ${status.replace('_', ' ')}.`);
      fetchStaff();
    } catch (error: any) {
      setMessage(error.message || 'Could not update worker duty status.');
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
            <Text style={styles.title}>Staff Management</Text>
            <Text style={styles.subtitle}>WORKFORCE OPERATIONS</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AddWorker')}>
            <Ionicons name="add-circle-outline" size={26} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.metricsRow}>
          <TonalCard level="lowest" style={styles.metricCard}>
            <Text style={styles.metricValue}>{staff.length}</Text>
            <Text style={styles.metricLabel}>TOTAL STAFF</Text>
          </TonalCard>
          <TonalCard level="lowest" style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: theme.colors.secondary }]}>{metrics.active}</Text>
            <Text style={styles.metricLabel}>ACTIVE</Text>
          </TonalCard>
          <TonalCard level="lowest" style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: theme.colors.warning }]}>{metrics.late}</Text>
            <Text style={styles.metricLabel}>LATE</Text>
          </TonalCard>
          <TonalCard level="lowest" style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: theme.colors.danger }]}>{metrics.offDuty}</Text>
            <Text style={styles.metricLabel}>OFF DUTY</Text>
          </TonalCard>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={theme.colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by worker, role, phone, or shift..."
            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Text style={styles.sectionTitle}>Shift Coverage</Text>
        <View style={styles.shiftRow}>
          {metrics.shiftCounts.map(item => (
            <TonalCard key={item.shift} level="lowest" style={styles.shiftCard} floating={false}>
              <Text style={styles.shiftCount}>{item.count}</Text>
              <Text style={styles.shiftLabel}>{item.shift}</Text>
            </TonalCard>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Payroll Summary</Text>
        <TonalCard level="lowest" style={styles.payrollCard}>
          <Text style={styles.payrollValue}>Rs {metrics.payroll.toLocaleString('en-IN')}</Text>
          <Text style={styles.payrollLabel}>Monthly payroll committed across the current staff roster.</Text>
        </TonalCard>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Text style={styles.sectionTitle}>Staff Directory</Text>
        <View style={styles.staffList}>
          {filteredStaff.map(member => {
            const status = mapStaffStatus(member.status);
            return (
              <TonalCard key={member.id} level="lowest" style={styles.staffCard}>
                <View style={styles.staffRow}>
                  <View style={styles.avatarCircle}>
                    {member.photo_data ? (
                      <Image source={{ uri: member.photo_data }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
                    )}
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{member.name}</Text>
                    <Text style={styles.staffRole}>{member.role}</Text>
                    <Text style={styles.staffMeta}>{member.shift || 'Shift pending'} / Clock in: {member.clocked_in || 'Not marked'}</Text>
                    <Text style={styles.staffMeta}>Phone: {member.phone || 'Not added'} / Salary: Rs {Number(member.salary || 0).toLocaleString('en-IN')}</Text>
                    <Text style={styles.staffMeta}>Duty: {(member.duty_days || []).join(', ') || 'Not assigned'} / Pay day: {member.payment_due_day || 1}</Text>
                    {member.notes ? <Text style={styles.staffNotes}>{member.notes}</Text> : null}
                  </View>
                  <StatusBadge status={status.badge} label={status.label} />
                </View>
                <View style={styles.staffFooter}>
                  <TouchableOpacity style={styles.staffActionBtn} onPress={() => handleStatusUpdate(member, 'active')}>
                    <Text style={styles.staffActionText}>Clock In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.staffActionBtn} onPress={() => handleStatusUpdate(member, 'late')}>
                    <Text style={styles.staffActionText}>Late</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.staffActionBtn} onPress={() => handleStatusUpdate(member, 'off_duty')}>
                    <Text style={styles.staffActionText}>Off Duty</Text>
                  </TouchableOpacity>
                </View>
              </TonalCard>
            );
          })}
        </View>

        <RentifyButton title="Add New Worker" onPress={() => navigation.navigate('AddWorker')} style={{ marginBottom: 40 }} />
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
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: theme.spacing.xl },
  metricCard: { width: '48%', alignItems: 'center', padding: theme.spacing.md },
  metricValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 28, color: theme.colors.primary },
  metricLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, letterSpacing: 1, marginTop: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, marginBottom: theme.spacing.xl },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: theme.typography.body.fontFamily, fontSize: 15, color: theme.colors.onSurface },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  shiftRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: theme.spacing.xl },
  shiftCard: { width: '31%', alignItems: 'center', padding: theme.spacing.md },
  shiftCount: { fontFamily: theme.typography.headline.fontFamily, fontSize: 24, color: theme.colors.onSurface },
  shiftLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  payrollCard: { marginBottom: theme.spacing.lg },
  payrollValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 30, color: theme.colors.primary },
  payrollLabel: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 6 },
  message: { marginBottom: theme.spacing.md, fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.danger },
  staffList: { gap: 12, marginBottom: theme.spacing.xl },
  staffCard: { padding: theme.spacing.md },
  staffRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontFamily: theme.typography.headline.fontFamily, fontSize: 20, color: theme.colors.onPrimary },
  staffInfo: { flex: 1 },
  staffName: { fontFamily: theme.typography.label.fontFamily, fontSize: 16, color: theme.colors.onSurface },
  staffRole: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  staffMeta: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  staffNotes: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurface, marginTop: 8 },
  staffFooter: { flexDirection: 'row', gap: 8, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant + '26' },
  staffActionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow },
  staffActionText: { fontFamily: theme.typography.label.fontFamily, fontSize: 12, color: theme.colors.primary },
});
