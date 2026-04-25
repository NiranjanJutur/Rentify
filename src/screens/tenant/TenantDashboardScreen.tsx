import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { paymentService, noticeService, authService } from '../../services/dataService';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TenantDashboardScreen({ activeTenant }: { activeTenant?: any }) {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [dueMonth, setDueMonth] = useState('N/A');
  const [latestNotice, setLatestNotice] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const propertyId = activeTenant.property_id;
      const [payments, notices] = await Promise.all([
        paymentService.getAll(propertyId),
        noticeService.getAll(propertyId)
      ]);
      const myPayments = (payments || []).filter(p => p.tenant_id === activeTenant.id);
      const pending = myPayments.find(p => p.status === 'pending');
      setBalance(pending ? pending.amount : 0);
      setDueMonth(pending ? pending.month : 'No dues');
      setLatestNotice((notices || [])[0] || null);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, [activeTenant]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Logout from Rentify?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => authService.signOut() }
    ]);
  };

  const quickAccess = [
    { title: 'Meals', sub: 'Today\'s Menu', icon: 'restaurant', color: '#f59e0b', route: 'TenantMeal' },
    { title: 'Payments', sub: balance > 0 ? 'Due' : 'Paid', icon: 'wallet', color: '#10b981', route: 'TenantPayment' },
    { title: 'Support', sub: 'Raise Ticket', icon: 'construct', color: '#ef4444', route: 'TenantSupport' },
    { title: 'Profile', sub: `Room ${activeTenant?.room}`, icon: 'person', color: '#6366f1', route: 'TenantProfile' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.name}>{activeTenant?.name?.split(' ')[0] || 'Resident'}</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>CURRENT BALANCE</Text>
              <Text style={styles.heroValue}>₹{balance.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: balance > 0 ? '#fef3c7' : '#dcfce7' }]}>
              <Text style={[styles.statusText, { color: balance > 0 ? '#92400e' : '#166534' }]}>
                {balance > 0 ? 'Pending' : 'All Clear'}
              </Text>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <Text style={styles.dueInfo}>{balance > 0 ? `Due for ${dueMonth}` : 'Great! No upcoming dues.'}</Text>
            <TouchableOpacity style={styles.payBtn} onPress={() => navigation.navigate('TenantPayment')}>
              <Text style={styles.payBtnText}>{balance > 0 ? 'Pay Now' : 'History'}</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.grid}>
          {quickAccess.map((item) => (
            <TouchableOpacity key={item.title} style={styles.gridCard} onPress={() => navigation.navigate(item.route)}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '10' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.gridTitle}>{item.title}</Text>
              <Text style={styles.gridSub}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {latestNotice && (
          <TouchableOpacity style={styles.noticeBar} onPress={() => navigation.navigate('TenantNoticeBoard')}>
            <View style={styles.noticeIcon}>
              <Ionicons name="megaphone" size={18} color="#4f46e5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeLabel}>LATEST NOTICE</Text>
              <Text style={styles.noticeTitle} numberOfLines={1}>{latestNotice.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 10 },
  greeting: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  name: { fontSize: 32, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  logoutBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  heroCard: { borderRadius: 32, padding: 28, marginBottom: 32, elevation: 8, shadowColor: '#1e293b', shadowOpacity: 0.2, shadowRadius: 15 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroValue: { color: '#fff', fontSize: 42, fontWeight: '800', marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  dueInfo: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  gridCard: { width: '47.5%', backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  gridTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  gridSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  noticeBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', gap: 16 },
  noticeIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  noticeLabel: { fontSize: 10, fontWeight: '800', color: '#4f46e5', letterSpacing: 1 },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginTop: 2 }
});
