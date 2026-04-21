import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { StatusBadge, StatusType } from '../../components/ui/StatusBadge';
import { TonalCard } from '../../components/ui/TonalCard';
import { paymentService, tenantService } from '../../services/dataService';
import { theme } from '../../theme/theme';

type TenantDetailRoute = {
  params?: {
    tenant?: any;
    tenantId?: string;
  };
};

export const TenantDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>() as TenantDetailRoute;
  const [tenant, setTenant] = useState<any>(route.params?.tenant || null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(!route.params?.tenant);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    room: '',
    block: '',
    floor: '1',
    rent_amount: '',
    advance_amount: '',
    status: 'occupied',
  });

  const tenantId = route.params?.tenantId || route.params?.tenant?.id;

  const fetchTenantDetails = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const [allTenants, allPayments] = await Promise.all([
        tenantService.getAll(),
        paymentService.getAll(),
      ]);
      const nextTenant = (allTenants || []).find((item: any) => item.id === tenantId);
      const tenantPayments = (allPayments || []).filter((item: any) => item.tenant_id === tenantId);
      setTenant(nextTenant || route.params?.tenant || null);
      setPayments(tenantPayments);
    } catch (error) {
      console.log('Tenant detail fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, route.params?.tenant]);

  useEffect(() => {
    fetchTenantDetails();
  }, [fetchTenantDetails]);

  useEffect(() => {
    if (!tenant) return;

    setForm({
      name: tenant.name || '',
      phone: tenant.phone || '',
      email: tenant.email || '',
      room: tenant.room || '',
      block: tenant.block || '',
      floor: String(tenant.floor || 1),
      rent_amount: String(tenant.rent_amount || ''),
      advance_amount: String(tenant.advance_amount || ''),
      status: tenant.status || 'occupied',
    });
  }, [tenant]);

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!tenant?.id) return;
    if (!form.name.trim() || !form.room.trim()) {
      Alert.alert('Missing Details', 'Tenant name and room are required.');
      return;
    }

    setSaving(true);
    try {
      const updatedTenant = await tenantService.update(tenant.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        room: form.room.trim(),
        block: form.block.trim(),
        floor: Number(form.floor) || 1,
        rent_amount: Number(form.rent_amount) || 0,
        advance_amount: Number(form.advance_amount) || 0,
        status: form.status.trim() || 'occupied',
      });
      setTenant(updatedTenant);
      setEditing(false);
      Alert.alert('Tenant Updated', `${updatedTenant.name} has been updated.`);
    } catch (error: any) {
      Alert.alert('Could Not Update Tenant', error.message || error.details || error.hint || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!tenant?.id) return;

    const performDelete = async () => {
      setDeleting(true);
      try {
        await tenantService.delete(tenant.id);
        if (typeof window !== 'undefined') {
          window.alert(`${tenant.name} has been removed.`);
          navigation.goBack();
        } else {
          Alert.alert('Tenant Deleted', `${tenant.name} has been removed.`, [
            { text: 'Done', onPress: () => navigation.goBack() },
          ]);
        }
      } catch (error: any) {
        if (typeof window !== 'undefined') {
          window.alert(error.message || 'Please try again.');
        } else {
          Alert.alert('Could Not Delete', error.message || 'Please try again.');
        }
      } finally {
        setDeleting(false);
      }
    };

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`Delete ${tenant.name}? This will remove the tenant profile from the property.`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Tenant',
        `Delete ${tenant.name}? This will remove the tenant profile from the property.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const handleApprove = async () => {
    if (!tenant?.id) return;

    setApproving(true);
    try {
      const updatedTenant = await tenantService.update(tenant.id, {
        status: 'occupied',
        paid: false,
        join_date: tenant.join_date || new Date().toISOString().split('T')[0],
      });
      setTenant(updatedTenant);
      setForm((current) => ({ ...current, status: 'occupied' }));
      Alert.alert('Tenant Approved', `${updatedTenant.name} can now log in to the tenant portal.`);
    } catch (error: any) {
      Alert.alert('Approval Failed', error.message || error.details || error.hint || 'Please try again.');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!tenant) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Tenant not found</Text>
          <RentifyButton title="Back to Tenants" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const status = (tenant.status || 'pending') as StatusType;
  const joinDate = tenant.join_date
    ? new Date(tenant.join_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'Not recorded';
  const paidPayments = payments.filter((payment) => payment.status === 'paid');
  const pendingPayments = payments.filter((payment) => payment.status !== 'paid');
  const totalPaid = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalPending = pendingPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const historyRows = [
    `${tenant.name} joined ${tenant.block || 'property'} in ${joinDate}.`,
    tenant.paid ? 'Latest rent status marked paid.' : 'Rent collection is pending.',
    `${payments.length} payment record${payments.length === 1 ? '' : 's'} linked to this tenant.`,
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={21} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Tenant Profile</Text>
            <Text style={styles.subtitle}>DETAILS / TRANSACTIONS / HISTORY</Text>
          </View>
          <TouchableOpacity style={styles.editIconButton} onPress={() => setEditing((value) => !value)} disabled={saving || deleting}>
            <Ionicons name={editing ? 'close-outline' : 'create-outline'} size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteIconButton} onPress={handleDelete} disabled={deleting}>
            <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>

        <TonalCard level="lowest" style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{tenant.name?.charAt(0)?.toUpperCase() || 'T'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{tenant.name}</Text>
              <Text style={styles.room}>{tenant.room} / {tenant.block || 'No block'}</Text>
              <Text style={styles.joined}>Since {joinDate}</Text>
            </View>
            <StatusBadge status={status} />
          </View>
        </TonalCard>

        {tenant.status === 'pending' ? (
          <TonalCard level="low" style={styles.approvalCard} floating={false}>
            <View style={styles.approvalHeader}>
              <View style={styles.approvalIcon}>
                <Ionicons name="hourglass-outline" size={18} color={theme.colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.approvalTitle}>Pending Owner Approval</Text>
                <Text style={styles.approvalText}>
                  Review the tenant details below, then approve this request to let the tenant access their account.
                </Text>
              </View>
            </View>
            <RentifyButton
              title={approving ? 'Approving...' : 'Approve Tenant Access'}
              onPress={handleApprove}
              disabled={approving}
              style={styles.approvalButton}
            />
          </TonalCard>
        ) : null}

        <View style={styles.summaryGrid}>
          <TonalCard level="lowest" style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Monthly Rent</Text>
            <Text style={styles.summaryValue}>Rs {Number(tenant.rent_amount || 0).toLocaleString('en-IN')}</Text>
          </TonalCard>
          <TonalCard level="lowest" style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Advance</Text>
            <Text style={styles.summaryValue}>Rs {Number(tenant.advance_amount || 0).toLocaleString('en-IN')}</Text>
          </TonalCard>
        </View>

        <View style={styles.summaryGrid}>
          <TonalCard level="lowest" style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.danger }]}>Rs {totalPending.toLocaleString('en-IN')}</Text>
          </TonalCard>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Details</Text>
          <TouchableOpacity onPress={() => setEditing((value) => !value)} disabled={saving}>
            <Text style={styles.sectionAction}>{editing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {editing ? (
          <TonalCard level="lowest" style={styles.editCard}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(value) => updateForm('name', value)} />
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput style={styles.input} value={form.phone} keyboardType="phone-pad" onChangeText={(value) => updateForm('phone', value)} />
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput style={styles.input} value={form.email} keyboardType="email-address" autoCapitalize="none" onChangeText={(value) => updateForm('email', value)} />
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Room</Text>
                <TextInput style={styles.input} value={form.room} onChangeText={(value) => updateForm('room', value)} />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Block</Text>
                <TextInput style={styles.input} value={form.block} onChangeText={(value) => updateForm('block', value)} />
              </View>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Floor</Text>
                <TextInput style={styles.input} value={form.floor} keyboardType="numeric" onChangeText={(value) => updateForm('floor', value)} />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Rent</Text>
                <TextInput style={styles.input} value={form.rent_amount} keyboardType="numeric" onChangeText={(value) => updateForm('rent_amount', value)} />
              </View>
            </View>
            <Text style={styles.inputLabel}>Advance Amount</Text>
            <TextInput style={styles.input} value={form.advance_amount} keyboardType="numeric" onChangeText={(value) => updateForm('advance_amount', value)} />
            <Text style={styles.inputLabel}>Status</Text>
            <TextInput style={styles.input} value={form.status} placeholder="occupied / vacant / pending" onChangeText={(value) => updateForm('status', value)} />
            <RentifyButton title={saving ? 'Saving...' : 'Save Updates'} onPress={handleUpdate} disabled={saving} />
          </TonalCard>
        ) : (
          <TonalCard level="lowest" style={styles.detailCard}>
            {[
              ['Phone', tenant.phone || 'Not added'],
              ['Email', tenant.email || 'Not added'],
              ['Room', tenant.room || 'Not added'],
              ['Block', tenant.block || 'Not added'],
              ['Floor', String(tenant.floor || 1)],
              ['Advance', `Rs ${Number(tenant.advance_amount || 0).toLocaleString('en-IN')}`],
              ['Paid Status', tenant.paid ? 'Paid' : 'Pending'],
            ].map(([label, value]) => (
              <View key={label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ))}
          </TonalCard>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <Text style={styles.sectionMeta}>Paid Rs {totalPaid.toLocaleString('en-IN')}</Text>
        </View>
        <TonalCard level="lowest" style={styles.transactionCard}>
          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.</Text>
          ) : (
            payments.map((payment, index) => (
              <View key={payment.id} style={[styles.transactionRow, index !== 0 && styles.rowBorder]}>
                <View style={styles.transactionIcon}>
                  <Ionicons name={payment.status === 'paid' ? 'checkmark-circle' : 'time-outline'} size={18} color={payment.status === 'paid' ? theme.colors.secondary : theme.colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.transactionTitle}>{payment.month || 'Rent Payment'}</Text>
                  <Text style={styles.transactionMeta}>
                    {payment.method || 'Pending'} / {payment.paid_date || payment.due_date || 'No date'}
                  </Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>Rs {Number(payment.amount || 0).toLocaleString('en-IN')}</Text>
                  <StatusBadge status={payment.status === 'paid' ? 'vacant' : 'pending'} label={payment.status} />
                </View>
              </View>
            ))
          )}
        </TonalCard>

        <Text style={styles.sectionTitle}>History</Text>
        <TonalCard level="lowest" style={styles.historyCard}>
          {historyRows.map((item, index) => (
            <View key={item} style={[styles.historyRow, index !== 0 && styles.rowBorder]}>
              <View style={styles.historyDot} />
              <Text style={styles.historyText}>{item}</Text>
            </View>
          ))}
        </TonalCard>

        <RentifyButton title={deleting ? 'Deleting...' : 'Delete Tenant'} onPress={handleDelete} disabled={deleting} variant="secondary" style={styles.deleteButton} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  container: { padding: theme.spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl },
  iconButton: { width: 38, height: 38, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  editIconButton: { width: 38, height: 38, borderRadius: 8, backgroundColor: theme.colors.occupiedBg, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  deleteIconButton: { width: 38, height: 38, borderRadius: 8, backgroundColor: '#fee4e2', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: theme.typography.headline.fontFamily, fontSize: 30, color: theme.colors.onSurface },
  subtitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  profileCard: { marginBottom: theme.spacing.lg },
  approvalCard: { marginBottom: theme.spacing.lg, padding: theme.spacing.lg, backgroundColor: theme.colors.pendingBg },
  approvalHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  approvalIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#fff6e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  approvalTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.pendingText,
  },
  approvalText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  approvalButton: { marginTop: theme.spacing.md },
  profileTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 58, height: 58, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { fontFamily: theme.typography.headline.fontFamily, fontSize: 24, color: theme.colors.onPrimary },
  name: { fontFamily: theme.typography.headline.fontFamily, fontSize: 26, color: theme.colors.onSurface },
  room: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.primary, marginTop: 3 },
  joined: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.xl },
  summaryCard: { flex: 1, padding: theme.spacing.md },
  summaryLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase' },
  summaryValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.primary, marginTop: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  sectionAction: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.primary, marginBottom: theme.spacing.md },
  sectionMeta: { fontFamily: theme.typography.label.fontFamily, fontSize: 12, color: theme.colors.secondary },
  detailCard: { padding: 0, overflow: 'hidden', marginBottom: theme.spacing.xl },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant + '44' },
  detailLabel: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant },
  detailValue: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onSurface },
  editCard: { padding: theme.spacing.xl, marginBottom: theme.spacing.xl },
  inputLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 8 },
  input: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.onSurface,
  },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputHalf: { flex: 1 },
  transactionCard: { padding: 0, overflow: 'hidden', marginBottom: theme.spacing.xl },
  transactionRow: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md },
  transactionIcon: { width: 38, height: 38, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  transactionTitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 15, color: theme.colors.onSurface },
  transactionMeta: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontFamily: theme.typography.headline.fontFamily, fontSize: 15, color: theme.colors.onSurface, marginBottom: 4 },
  rowBorder: { borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant + '44' },
  emptyText: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant, padding: theme.spacing.lg },
  historyCard: { padding: 0, overflow: 'hidden', marginBottom: theme.spacing.xl },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.secondary, marginRight: 12 },
  historyText: { flex: 1, fontFamily: theme.typography.body.fontFamily, fontSize: 14, lineHeight: 20, color: theme.colors.onSurfaceVariant },
  deleteButton: { marginBottom: theme.spacing.xl },
  emptyState: { flex: 1, padding: theme.spacing.xl, justifyContent: 'center' },
  emptyTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 26, color: theme.colors.onSurface, marginBottom: theme.spacing.lg },
});
