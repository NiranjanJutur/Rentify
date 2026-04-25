import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Linking, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBadge, StatusType } from '../../components/ui/StatusBadge';
import { paymentService, tenantService } from '../../services/dataService';
import { theme } from '../../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

export const TenantDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [tenant, setTenant] = useState<any>(route.params?.tenant || null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(!route.params?.tenant);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', room: '', block: '', floor: '1', rent_amount: '', advance_amount: '', payment_due_day: '5', status: 'occupied',
  });

  const tenantId = route.params?.tenantId || route.params?.tenant?.id;
  const propertyId = route.params?.tenant?.property_id || tenant?.property_id;

  const fetchDetails = useCallback(async () => {
    if (!tenantId || !propertyId) return;
    try {
      setLoading(true);
      const [allTenants, allPayments] = await Promise.all([
        tenantService.getAll(propertyId),
        paymentService.getAll(propertyId),
      ]);
      const nextTenant = (allTenants || []).find((item: any) => item.id === tenantId);
      setTenant(nextTenant || tenant);
      setPayments((allPayments || []).filter((p: any) => p.tenant_id === tenantId));
    } finally {
      setLoading(false);
    }
  }, [tenantId, propertyId]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  useEffect(() => {
    if (!tenant) return;
    setForm({
      name: tenant.name || '', phone: tenant.phone || '', email: tenant.email || '',
      room: tenant.room || '', block: tenant.block || '', floor: String(tenant.floor || 1),
      rent_amount: String(tenant.rent_amount || ''), advance_amount: String(tenant.advance_amount || ''),
      payment_due_day: String(tenant.payment_due_day || 5), status: tenant.status || 'occupied',
    });
  }, [tenant]);

  const handleUpdate = async () => {
    if (!tenant?.id) return;
    setSaving(true);
    try {
      const updated = await tenantService.update(tenant.id, {
        ...form, floor: Number(form.floor), rent_amount: Number(form.rent_amount),
        advance_amount: Number(form.advance_amount), payment_due_day: Number(form.payment_due_day)
      });
      setTenant(updated);
      setEditing(false);
      Alert.alert('Success', 'Tenant profile updated');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const updated = await tenantService.update(tenant.id, { status: 'occupied' });
      setTenant(updated);
      Alert.alert('Approved', 'Tenant now has access');
    } finally {
      setApproving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Tenant Management</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(!editing)}>
            <Ionicons name={editing ? "close" : "create-outline"} size={22} color={editing ? "#ef4444" : "#4f46e5"} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient colors={['#4f46e5', '#6366f1']} style={styles.avatar}>
              <Text style={styles.avatarText}>{tenant.name[0]}</Text>
            </LinearGradient>
          </View>
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Text style={styles.name}>{tenant.name}</Text>
            <View style={styles.roomBadge}>
              <Text style={styles.roomText}>Room {tenant.room} • {tenant.block}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionCircle} onPress={() => Linking.openURL(`tel:${tenant.phone}`)}>
              <Ionicons name="call" size={20} color="#4f46e5" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCircle} onPress={() => Linking.openURL(`https://wa.me/${tenant.phone}`)}>
              <Ionicons name="logo-whatsapp" size={20} color="#10b981" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCircle} onPress={() => Linking.openURL(`mailto:${tenant.email}`)}>
              <Ionicons name="mail" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        {tenant.status === 'pending' && (
          <LinearGradient colors={['#fff7ed', '#ffedd5']} style={styles.approvalBox}>
            <Ionicons name="alert-circle" size={24} color="#ea580c" />
            <View style={{ flex: 1 }}>
              <Text style={styles.approvalTitle}>Pending Approval</Text>
              <Text style={styles.approvalSub}>This tenant is waiting for property access.</Text>
            </View>
            <TouchableOpacity style={styles.approveBtn} onPress={handleApprove} disabled={approving}>
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.mLabel}>MONTHLY RENT</Text>
            <Text style={styles.mValue}>₹{Number(tenant.rent_amount).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.mLabel}>ADVANCE</Text>
            <Text style={styles.mValue}>₹{Number(tenant.advance_amount).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {editing ? (
          <View style={styles.formCard}>
            <Text style={styles.formHeader}>Edit Details</Text>
            <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={v => setForm({...form, name: v})} />
            <TextInput style={styles.input} placeholder="Phone" value={form.phone} keyboardType="phone-pad" onChangeText={v => setForm({...form, phone: v})} />
            <View style={styles.row}>
              <TextInput style={[styles.input, {flex: 1}]} placeholder="Room" value={form.room} onChangeText={v => setForm({...form, room: v})} />
              <TextInput style={[styles.input, {flex: 1}]} placeholder="Block" value={form.block} onChangeText={v => setForm({...form, block: v})} />
            </View>
            <View style={styles.row}>
              <TextInput style={[styles.input, {flex: 1}]} placeholder="Rent" keyboardType="numeric" value={form.rent_amount} onChangeText={v => setForm({...form, rent_amount: v})} />
              <TextInput style={[styles.input, {flex: 1}]} placeholder="Due Day" keyboardType="numeric" value={form.payment_due_day} onChangeText={v => setForm({...form, payment_due_day: v})} />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoSection}>
            <Text style={styles.sectionHeader}>History & Payments</Text>
            {payments.length === 0 ? (
              <Text style={styles.emptyText}>No transactions yet.</Text>
            ) : (
              payments.map(p => (
                <View key={p.id} style={styles.payRow}>
                  <View style={styles.payIcon}>
                    <Ionicons name={p.status === 'paid' ? "checkmark-circle" : "time"} size={18} color={p.status === 'paid' ? "#10b981" : "#f59e0b"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payMonth}>{p.month}</Text>
                    <Text style={styles.payMeta}>{p.method || 'Pending'} • {new Date(p.due_date).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[styles.payAmt, { color: p.status === 'paid' ? "#10b981" : "#1e293b" }]}>₹{p.amount}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, marginTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12, elevation: 2 },
  editBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  profileSection: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { width: 100, height: 100, borderRadius: 32, padding: 4, backgroundColor: '#fff', elevation: 4 },
  avatar: { flex: 1, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 42, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  roomBadge: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#f1f5f9', borderRadius: 8, marginTop: 8 },
  roomText: { fontSize: 13, color: '#4f46e5', fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 24 },
  actionCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  approvalBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 24, gap: 12 },
  approvalTitle: { fontSize: 14, fontWeight: '800', color: '#9a3412' },
  approvalSub: { fontSize: 12, color: '#c2410c', marginTop: 2 },
  approveBtn: { backgroundColor: '#ea580c', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  approveText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  metricsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  metricCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  mLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  mValue: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 6 },
  infoSection: { gap: 12 },
  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  payRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  payIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  payMonth: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  payMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  payAmt: { fontSize: 14, fontWeight: '700' },
  formCard: { backgroundColor: '#fff', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  formHeader: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, fontSize: 15, color: '#1e293b', marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  row: { flexDirection: 'row', gap: 12 },
  saveBtn: { backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20, fontStyle: 'italic' }
});
