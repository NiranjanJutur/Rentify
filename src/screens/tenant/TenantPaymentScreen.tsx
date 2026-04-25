import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { paymentService } from '../../services/dataService';
import { LinearGradient } from 'expo-linear-gradient';

export default function TenantPaymentScreen({ activeTenant }: { activeTenant?: any }) {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amountDue, setAmountDue] = useState(0);
  const [activeDuePayment, setActiveDuePayment] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const all = await paymentService.getAll(activeTenant.property_id);
      const my = (all || []).filter(p => p.tenant_id === activeTenant.id);
      my.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setTransactions(my);
      const due = my.find(p => p.status === 'pending');
      setAmountDue(due ? due.amount : 0);
      setActiveDuePayment(due || null);
    } finally {
      setLoading(false);
    }
  }, [activeTenant]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handlePay = () => {
    if (!activeDuePayment) return;
    Alert.alert('Confirm Payment', `Pay ₹${amountDue.toLocaleString('en-IN')} via UPI?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Pay Now', onPress: async () => {
        try {
          await paymentService.markPaid(activeDuePayment.id, 'UPI');
          fetchData();
          Alert.alert('Success', 'Payment confirmed!');
        } catch (e) { Alert.alert('Error', 'Failed to process'); }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Payments</Text>
            <Text style={styles.subtitle}>History & Dues</Text>
          </View>
        </View>

        <LinearGradient colors={['#4f46e5', '#6366f1']} style={styles.dueCard}>
          <View style={styles.dueTop}>
            <View>
              <Text style={styles.dueLabel}>TOTAL AMOUNT DUE</Text>
              <Text style={styles.dueValue}>₹{amountDue.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>{amountDue > 0 ? 'Pending' : 'Cleared'}</Text>
            </View>
          </View>
          
          <View style={styles.dueBottom}>
            <Text style={styles.dueDate}>
              {amountDue > 0 ? `Due by ${activeDuePayment?.due_date ? new Date(activeDuePayment.due_date).toLocaleDateString() : activeDuePayment?.month}` : 'No upcoming dues'}
            </Text>
            {amountDue > 0 && (
              <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
                <Text style={styles.payBtnText}>Settle Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Transaction History</Text>
        <View style={styles.list}>
          {loading ? (
            <ActivityIndicator color="#4f46e5" style={{ marginTop: 20 }} />
          ) : transactions.length === 0 ? (
            <Text style={styles.emptyText}>No payments recorded yet.</Text>
          ) : (
            transactions.map((tx) => (
              <View key={tx.id} style={styles.txCard}>
                <View style={styles.txIcon}>
                  <Ionicons name={tx.status === 'paid' ? "checkmark-circle" : "time"} size={20} color={tx.status === 'paid' ? "#10b981" : "#f59e0b"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txTitle}>{tx.month || 'Rent Payment'}</Text>
                  <Text style={styles.txMeta}>{new Date(tx.created_at).toLocaleDateString()} • {tx.method || 'UPI'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.txAmt, { color: tx.status === 'paid' ? "#10b981" : "#1e293b" }]}>₹{tx.amount}</Text>
                  <Text style={[styles.txStatus, { color: tx.status === 'paid' ? "#10b981" : "#f59e0b" }]}>{tx.status.toUpperCase()}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#6366f1" />
          <Text style={styles.infoText}>All payments are encrypted and processed securely through our partners.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, marginTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  dueCard: { borderRadius: 32, padding: 28, marginBottom: 32, elevation: 8, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 15 },
  dueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dueLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  dueValue: { color: '#fff', fontSize: 38, fontWeight: '800', marginTop: 4 },
  dueBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  dueBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dueBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  dueDate: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  payBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  payBtnText: { color: '#4f46e5', fontWeight: '800', fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  list: { gap: 12, marginBottom: 24 },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  txIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  txTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  txMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  txAmt: { fontSize: 15, fontWeight: '800' },
  txStatus: { fontSize: 10, fontWeight: '800', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 30, fontStyle: 'italic' },
  infoBox: { flexDirection: 'row', gap: 12, backgroundColor: '#eef2ff', padding: 16, borderRadius: 20, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 12, color: '#4338ca', lineHeight: 18 }
});
