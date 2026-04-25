import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Share, StatusBar } from 'react-native';
import { theme } from '../../theme/theme';
import { StatusBadge, StatusType } from '../../components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { propertyService, tenantService } from '../../services/dataService';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';

interface Tenant {
  id: string;
  name: string;
  room: string;
  block: string;
  floor: number;
  rent_amount: number;
  status: StatusType;
  join_date: string;
  phone: string;
  due_date: string;
  paid: boolean;
}

const blockFilters = ['All', 'Block A', 'Block B', 'Block C', 'Premium Wing'];

export const TenantManagementScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('All');
  const [showQR, setShowQR] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [propertyName, setPropertyName] = useState('Loading...');
  const [totalCapacity, setTotalCapacity] = useState(0);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const props = await propertyService.getMyProperties();
      const currentProp = props?.[0];
      if (!currentProp) return;

      setInviteCode(currentProp.invite_code || '');
      setPropertyName(currentProp.name || 'My Property');
      setTotalCapacity(currentProp.total_capacity || 0);

      const data = await tenantService.getAll(currentProp.id);
      setTenants((data || []).map((t: any) => ({
        ...t,
        rent_amount: Number(t.rent_amount),
      })));
    } catch (err) {
      console.log('Tenants fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  useFocusEffect(
    useCallback(() => {
      fetchTenants();
    }, [fetchTenants])
  );

  const onRefresh = () => { setRefreshing(true); fetchTenants(); };

  const filtered = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.room.includes(searchQuery);
    const matchesBlock = selectedBlock === 'All' || t.block === selectedBlock;
    return matchesSearch && matchesBlock;
  });

  const occupiedCount = tenants.filter(t => t.status === 'occupied').length;
  const pendingCount = tenants.filter(t => t.status === 'pending').length;
  const totalBeds = Math.max(totalCapacity, tenants.length);
  const occupancyRate = Math.round((occupiedCount / totalBeds) * 100) || 0;

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Join ${propertyName} on Rentify.\nInvite code: ${inviteCode}\nOpen the tenant join screen and paste this code.`,
      });
    } catch (error) {
      console.log('Invite share error:', error);
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Tenants</Text>
            <Text style={styles.subtitle}>{propertyName}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddTenant')}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Occupancy Overview */}
        <LinearGradient
          colors={['#4f46e5', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.overviewCard}
        >
          <View style={styles.overviewTop}>
            <View>
              <Text style={styles.overviewLabel}>OCCUPANCY RATE</Text>
              <Text style={styles.overviewValue}>{occupancyRate}%</Text>
              <Text style={styles.overviewSub}>{occupiedCount} of {totalBeds} beds filled</Text>
            </View>
            <TouchableOpacity onPress={() => setShowQR(!showQR)} style={styles.qrToggle}>
              <Ionicons name="qr-code-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${occupancyRate}%` }]} />
          </View>
        </LinearGradient>

        {showQR && (
          <View style={styles.qrCard}>
            <View style={styles.qrFrame}>
              <QRCode value={`RENTIFY_JOIN:${inviteCode}`} size={160} color="#1e293b" />
            </View>
            <Text style={styles.inviteCode}>{inviteCode}</Text>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareInvite}>
              <Ionicons name="share-social" size={18} color="#4f46e5" />
              <Text style={styles.shareText}>Share Invite Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search & Filters */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or room..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {blockFilters.map((block) => (
            <TouchableOpacity
              key={block}
              onPress={() => setSelectedBlock(block)}
              style={[styles.filterChip, selectedBlock === block && styles.activeChip]}
            >
              <Text style={[styles.filterText, selectedBlock === block && styles.activeFilterText]}>{block}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tenant List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>{filtered.length} Tenants Found</Text>
          {filtered.map((tenant) => (
            <TouchableOpacity
              key={tenant.id}
              style={styles.tenantCard}
              onPress={() => navigation.navigate('TenantDetail', { tenantId: tenant.id, tenant })}
            >
              <View style={styles.tenantAvatar}>
                <Text style={styles.avatarText}>{tenant.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tenantName}>{tenant.name}</Text>
                <Text style={styles.tenantRoom}>Room {tenant.room} • {tenant.block}</Text>
              </View>
              <View style={styles.tenantRight}>
                <StatusBadge status={tenant.status} />
                <Text style={styles.tenantRent}>₹{tenant.rent_amount.toLocaleString('en-IN')}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  overviewCard: { borderRadius: 24, padding: 24, marginBottom: 20 },
  overviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  overviewLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  overviewValue: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 4 },
  overviewSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  qrToggle: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  progressContainer: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 20, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  qrCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20, elevation: 3 },
  qrFrame: { padding: 16, backgroundColor: '#f8fafc', borderRadius: 20, marginBottom: 16 },
  inviteCode: { fontSize: 24, fontWeight: '800', color: '#1e293b', letterSpacing: 4, marginBottom: 16 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f5f3ff' },
  shareText: { color: '#4f46e5', fontWeight: '700', fontSize: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1e293b' },
  filterBar: { marginBottom: 24 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  activeChip: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  activeFilterText: { color: '#fff' },
  listSection: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  tenantCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  tenantAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5' },
  tenantName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  tenantRoom: { fontSize: 12, color: '#64748b', marginTop: 2 },
  tenantRight: { alignItems: 'flex-end', gap: 4 },
  tenantRent: { fontSize: 14, fontWeight: '700', color: '#1e293b' }
});
