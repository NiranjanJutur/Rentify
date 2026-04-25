import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme/theme';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { paymentService } from '../../services/dataService';
import { requirePrimaryPropertyId } from '../../services/ownerProperty';
import { LinearGradient } from 'expo-linear-gradient';

const WHATSAPP_BIZ_KEY = 'owner_wa_biz_number';

type PaymentRecord = {
  id: string;
  tenant_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  method?: string;
  due_date?: string;
  paid_date?: string;
  month?: string;
  tenants?: { name?: string; room?: string; block?: string; phone?: string; payment_due_day?: number };
};

export const PaymentCollectionScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'pending' | 'received'>('pending');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ownerWaNumber, setOwnerWaNumber] = useState<string>('');
  const [propertyName, setPropertyName] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const propertyId = await requirePrimaryPropertyId();
      const [data, props] = await Promise.all([
        paymentService.getAll(propertyId),
        import('../../services/dataService').then(m => m.propertyService.getMyProperties()),
      ]);
      setPayments(data || []);
      if (props && props.length > 0) setPropertyName(props[0].name || '');
    } catch (err: any) {
      console.log('Error loading payments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    AsyncStorage.getItem(WHATSAPP_BIZ_KEY).then((num) => {
      if (num) setOwnerWaNumber(num);
    });
  }, [fetchPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const summary = useMemo(() => {
    const collected = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pending = payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return { collected, pending, total: collected + pending };
  }, [payments]);

  const pendingPayments = payments.filter(p => p.status !== 'paid');
  const receivedPayments = payments.filter(p => p.status === 'paid');
  const collectionRate = summary.total > 0 ? Math.round((summary.collected / summary.total) * 100) : 0;

  const handleMarkPaid = async (payment: PaymentRecord) => {
    Alert.alert('Confirm Payment', `Mark Rs ${payment.amount} as paid for ${payment.tenants?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Confirm', 
        onPress: async () => {
          try {
            await paymentService.markPaid(payment.id, 'UPI');
            fetchPayments();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        }
      }
    ]);
  };

  const handleGenerateDues = async () => {
    try {
      setGenerating(true);
      const propertyId = await requirePrimaryPropertyId();
      const allTenants = await import('../../services/dataService').then(m => m.tenantService.getAll(propertyId));
      const activeTenants = allTenants.filter((t: any) => t.status === 'occupied');
      
      const now = new Date();
      const monthStr = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      
      let count = 0;
      for (const tenant of activeTenants) {
        if (!payments.some(p => p.tenant_id === tenant.id && p.month === monthStr)) {
          const dueDay = tenant.payment_due_day || 5;
          const dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
          await paymentService.create({
            tenant_id: tenant.id, property_id: propertyId, amount: Number(tenant.rent_amount),
            status: 'pending', month: monthStr, due_date: dueDate
          });
          count++;
        }
      }
      Alert.alert('Success', `Generated dues for ${count} tenants.`);
      fetchPayments();
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReminder = (payment: PaymentRecord) => {
    const text = `Hi ${payment.tenants?.name}, friendly reminder that rent of ₹${payment.amount} for ${payment.month || 'this month'} is due. Please clear it soon!`;
    const phone = payment.tenants?.phone?.replace(/[^0-9]/g, '');
    
    if (phone) {
      Linking.openURL(`whatsapp://send?phone=91${phone}&text=${encodeURIComponent(text)}`);
    } else {
      Share.share({ message: text });
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
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Finance</Text>
            <Text style={styles.subtitle}>{propertyName || 'Revenue Tracking'}</Text>
          </View>
          <TouchableOpacity onPress={handleGenerateDues} disabled={generating} style={styles.actionBtn}>
            <Ionicons name="flash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.revenueCard}
        >
          <View style={styles.revenueTop}>
            <View>
              <Text style={styles.revenueLabel}>TOTAL COLLECTED</Text>
              <Text style={styles.revenueValue}>₹{summary.collected.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.collectionBadge}>
              <Text style={styles.collectionPercent}>{collectionRate}%</Text>
            </View>
          </View>
          
          <View style={styles.revenueDivider} />
          
          <View style={styles.revenueBottom}>
            <View style={{ flex: 1 }}>
              <Text style={styles.revStatVal}>₹{summary.pending.toLocaleString('en-IN')}</Text>
              <Text style={styles.revStatLbl}>Still Pending</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.revStatVal}>₹{summary.total.toLocaleString('en-IN')}</Text>
              <Text style={styles.revStatLbl}>Total Expected</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'received' && styles.activeTab]}
            onPress={() => setActiveTab('received')}
          >
            <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>Received</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          {(activeTab === 'pending' ? pendingPayments : receivedPayments).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No payments found for this section.</Text>
            </View>
          ) : (
            (activeTab === 'pending' ? pendingPayments : receivedPayments).map(payment => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.pCardHeader}>
                  <View style={styles.tenantIcon}>
                    <Text style={styles.iconText}>{(payment.tenants?.name || 'T')[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tenantName}>{payment.tenants?.name || 'Unknown'}</Text>
                    <Text style={styles.tenantMeta}>Room {payment.tenants?.room} • {payment.month}</Text>
                  </View>
                  <Text style={styles.paymentAmt}>₹{payment.amount.toLocaleString('en-IN')}</Text>
                </View>

                {activeTab === 'pending' && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.remindBtn} onPress={() => handleSendReminder(payment)}>
                      <Ionicons name="logo-whatsapp" size={16} color="#10b981" />
                      <Text style={styles.remindText}>Remind</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.paidBtn} onPress={() => handleMarkPaid(payment)}>
                      <Text style={styles.paidBtnText}>Mark Paid</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {activeTab === 'received' && (
                  <View style={styles.receivedInfo}>
                    <View style={styles.dot} />
                    <Text style={styles.receivedText}>Received on {payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : 'Today'}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12, elevation: 2 },
  actionBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  revenueCard: { borderRadius: 24, padding: 24, marginBottom: 24, elevation: 8, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 15 },
  revenueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  revenueLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  revenueValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 4 },
  collectionBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  collectionPercent: { color: '#fff', fontSize: 14, fontWeight: '700' },
  revenueDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  revenueBottom: { flexDirection: 'row' },
  revStatVal: { color: '#fff', fontSize: 16, fontWeight: '700' },
  revStatLbl: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#f8fafc', elevation: 1 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  activeTabText: { color: '#1e293b', fontWeight: '700' },
  listSection: { gap: 16 },
  paymentCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  pCardHeader: { flexDirection: 'row', alignItems: 'center' },
  tenantIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  iconText: { color: '#10b981', fontSize: 18, fontWeight: 'bold' },
  tenantName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  tenantMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  paymentAmt: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  cardActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  remindBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f0fdf4', paddingVertical: 12, borderRadius: 12 },
  remindText: { color: '#16a34a', fontWeight: '700', fontSize: 13 },
  paidBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 12 },
  paidBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  receivedInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 12, backgroundColor: '#f8fafc', borderRadius: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  receivedText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 }
});
