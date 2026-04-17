import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge, StatusType } from '../../components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { tenantService } from '../../services/dataService';

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTenants = useCallback(async () => {
    try {
      const data = await tenantService.getAll();
      setTenants((data || []).map((t: any) => ({
        ...t,
        rent_amount: Number(t.rent_amount),
      })));
    } catch (err) {
      console.log('Tenants fetch error (tables may not exist yet):', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const onRefresh = () => { setRefreshing(true); fetchTenants(); };

  const filtered = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.room.includes(searchQuery);
    const matchesBlock = selectedBlock === 'All' || t.block === selectedBlock;
    return matchesSearch && matchesBlock;
  });

  const occupiedCount = tenants.filter(t => t.status === 'occupied').length;
  const pendingCount = tenants.filter(t => t.status === 'pending').length;
  const vacantCount = tenants.filter(t => t.status === 'vacant').length;
  const occupancyRate = tenants.length > 0 ? Math.round((occupiedCount / tenants.length) * 100) : 0;

  const formatRent = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Tenants</Text>
            <Text style={styles.subtitle}>OCCUPANCY MANAGEMENT</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
            <Ionicons name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} size={22} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="person-add-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Occupancy Overview */}
        <TonalCard level="lowest" style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View>
              <Text style={styles.overviewLabel}>OCCUPANCY RATE</Text>
              <Text style={styles.overviewValue}>{occupancyRate}%</Text>
            </View>
            <View style={styles.ringContainer}>
              <View style={styles.ringOuter}>
                <View style={styles.ringInner}>
                  <Text style={styles.ringText}>{occupiedCount}/{tenants.length}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.overviewStatsRow}>
            <View style={styles.overviewStat}>
              <View style={[styles.dotIndicator, { backgroundColor: theme.colors.primary }]} />
              <Text style={styles.overviewStatLabel}>Occupied</Text>
              <Text style={styles.overviewStatValue}>{occupiedCount}</Text>
            </View>
            <View style={styles.overviewStat}>
              <View style={[styles.dotIndicator, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.overviewStatLabel}>Pending</Text>
              <Text style={styles.overviewStatValue}>{pendingCount}</Text>
            </View>
            <View style={styles.overviewStat}>
              <View style={[styles.dotIndicator, { backgroundColor: theme.colors.secondary }]} />
              <Text style={styles.overviewStatLabel}>Vacant</Text>
              <Text style={styles.overviewStatValue}>{vacantCount}</Text>
            </View>
          </View>
        </TonalCard>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={theme.colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tenant or room..."
            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Block Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {blockFilters.map((block, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setSelectedBlock(block)}
              style={[styles.filterChip, selectedBlock === block && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, selectedBlock === block && styles.filterTextActive]}>
                {block}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tenant List */}
        <Text style={styles.sectionTitle}>
          {filtered.length} {filtered.length === 1 ? 'Result' : 'Results'}
        </Text>

        <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
          {filtered.map((tenant) => (
            <TonalCard
              key={tenant.id}
              level="lowest"
              style={viewMode === 'grid' ? styles.gridCard : styles.listCard}
            >
              {viewMode === 'grid' ? (
                // Grid View
                <View style={styles.gridContent}>
                  <View style={[styles.avatarCircle, tenant.status === 'vacant' && styles.avatarVacant]}>
                    <Text style={styles.avatarText}>
                      {tenant.status === 'vacant' ? '—' : tenant.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.gridRoom}>{tenant.room}</Text>
                  <Text style={styles.gridName} numberOfLines={1}>{tenant.name}</Text>
                  <StatusBadge status={tenant.status} />
                  {tenant.status !== 'vacant' && (
                    <Text style={styles.gridRent}>{formatRent(tenant.rent_amount)}</Text>
                  )}
                </View>
              ) : (
                // List View
                <View style={styles.listRow}>
                  <View style={[styles.avatarCircleSmall, tenant.status === 'vacant' && styles.avatarVacant]}>
                    <Text style={styles.avatarTextSmall}>
                      {tenant.status === 'vacant' ? '—' : tenant.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>{tenant.name}</Text>
                    <Text style={styles.listRoom}>{tenant.room} • {tenant.block}</Text>
                    {tenant.join_date ? (
                      <Text style={styles.listJoin}>Since {new Date(tenant.join_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</Text>
                    ) : null}
                  </View>
                  <View style={styles.listRight}>
                    <StatusBadge status={tenant.status} />
                    {tenant.status !== 'vacant' && (
                      <Text style={styles.listRent}>{formatRent(tenant.rent_amount)}</Text>
                    )}
                    {tenant.paid && (
                      <View style={styles.paidBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={theme.colors.secondary} />
                        <Text style={styles.paidText}>Paid</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </TonalCard>
          ))}
        </View>
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
  iconBtn: { padding: 8, marginLeft: 4 },
  overviewCard: { padding: theme.spacing.xl, marginBottom: theme.spacing.xl },
  overviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overviewLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, letterSpacing: 1.5 },
  overviewValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 48, color: theme.colors.primary, marginTop: 4 },
  ringContainer: { marginRight: 8 },
  ringOuter: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 6, borderColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  ringInner: { alignItems: 'center' },
  ringText: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onSurface },
  overviewStatsRow: { flexDirection: 'row', marginTop: theme.spacing.xl, gap: 24 },
  overviewStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dotIndicator: { width: 8, height: 8, borderRadius: 4 },
  overviewStatLabel: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant },
  overviewStatValue: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onSurface },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: theme.spacing.md,
  },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: theme.typography.body.fontFamily, fontSize: 15, color: theme.colors.onSurface },
  filterScroll: { marginBottom: theme.spacing.xl },
  filterChip: {
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 20, marginRight: 8,
  },
  filterChipActive: { backgroundColor: theme.colors.primary },
  filterText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant },
  filterTextActive: { color: theme.colors.onPrimary },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 20, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  listContainer: { gap: 10 },
  gridCard: { width: '47%', padding: theme.spacing.md },
  listCard: { padding: theme.spacing.md },
  gridContent: { alignItems: 'center' },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  avatarVacant: { backgroundColor: theme.colors.surfaceContainerHigh },
  avatarText: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.onPrimary },
  avatarCircleSmall: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  avatarTextSmall: { fontFamily: theme.typography.headline.fontFamily, fontSize: 18, color: theme.colors.onPrimary },
  gridRoom: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.primary },
  gridName: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onSurface, marginTop: 2, marginBottom: 8 },
  gridRent: { fontFamily: theme.typography.headline.fontFamily, fontSize: 16, color: theme.colors.onSurface, marginTop: 8 },
  listRow: { flexDirection: 'row', alignItems: 'center' },
  listInfo: { flex: 1 },
  listName: { fontFamily: theme.typography.label.fontFamily, fontSize: 16, color: theme.colors.onSurface },
  listRoom: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  listJoin: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  listRight: { alignItems: 'flex-end', gap: 4 },
  listRent: { fontFamily: theme.typography.headline.fontFamily, fontSize: 16, color: theme.colors.onSurface },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  paidText: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.secondary },
});
