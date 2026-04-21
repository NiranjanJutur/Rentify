import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Share } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge, StatusType } from '../../components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { propertyService, tenantService } from '../../services/dataService';
import QRCode from 'react-native-qrcode-svg';

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
  const [showQR, setShowQR] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [propertyName, setPropertyName] = useState('Loading...');
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const props = await propertyService.getMyProperties();
      
      const currentProp = props?.[0];
      if (!currentProp) {
        setTenants([]);
        setPropertyName('No Property Found');
        setInviteCode('');
        return;
      }

      setActivePropertyId(currentProp.id);
      setInviteCode(currentProp.invite_code || '');
      setPropertyName(currentProp.name || 'My Property');

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
  const pendingTenants = tenants.filter(t => t.status === 'pending');
  const pendingCount = pendingTenants.length;
  const vacantCount = tenants.filter(t => t.status === 'vacant').length;
  const occupancyRate = tenants.length > 0 ? Math.round((occupiedCount / tenants.length) * 100) : 0;

  const formatRent = (amount: number) => `Rs ${amount.toLocaleString('en-IN')}`;
  const qrPayload = `RENTIFY_JOIN:${inviteCode}|${propertyName}`;

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Join ${propertyName} on Rentify.\nInvite code: ${inviteCode}\nOpen the tenant join screen, paste this code, and submit your details.`,
      });
    } catch (error) {
      console.log('Invite share error:', error);
    }
  };

  const handleDeleteTenant = (id: string, name: string) => {
    const performDelete = async () => {
      try {
        await tenantService.delete(id);
        setTenants(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        if (typeof window !== 'undefined') {
          window.alert('Could not delete tenant. Please try again.');
        } else {
          Alert.alert('Error', 'Could not delete tenant. Please try again.');
        }
      }
    };

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`Are you sure you want to remove ${name}?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Tenant',
        `Are you sure you want to remove ${name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

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
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.subtitle}>OCCUPANCY MANAGEMENT</Text>
              <TouchableOpacity onPress={() => setShowQR(!showQR)} style={{marginLeft: 12, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: theme.colors.primaryContainer, borderRadius: 4}}>
                <Text style={{fontSize: 10, color: theme.colors.onPrimaryContainer, fontWeight: 'bold'}}>INVITE CODE</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
            <Ionicons name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} size={22} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AddTenant')}>
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

        {pendingCount > 0 && (
          <TonalCard level="lowest" style={styles.pendingQueueCard}>
            <View style={styles.pendingQueueTop}>
              <View>
                <Text style={styles.pendingQueueTitle}>Pending Approvals</Text>
                <Text style={styles.pendingQueueText}>
                  {pendingCount} tenant request{pendingCount === 1 ? '' : 's'} waiting for owner approval.
                </Text>
              </View>
              <StatusBadge status="pending" label={`${pendingCount} Pending`} />
            </View>

            <TouchableOpacity
              style={styles.pendingQueueAction}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('TenantDetail', { tenantId: pendingTenants[0].id, tenant: pendingTenants[0] })}
            >
              <View>
                <Text style={styles.pendingQueueName}>{pendingTenants[0].name}</Text>
                <Text style={styles.pendingQueueMeta}>
                  {pendingTenants[0].room} / {pendingTenants[0].block || 'No block'} / tap to review and approve
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </TonalCard>
        )}

        {/* Block Filters */}
        {showQR && (
          <TonalCard level="low" style={styles.inviteCard}>
            <Text style={styles.inviteEyebrow}>Tenant Join Pass</Text>
            <Text style={styles.inviteProperty}>{propertyName}</Text>

            <View style={styles.inviteQrFrame}>
              <QRCode value={qrPayload} size={164} color={theme.colors.primary} backgroundColor="transparent" />
            </View>

            <Text style={styles.inviteCode}>{inviteCode}</Text>
            <Text style={styles.inviteHelp}>
              Tenants can scan this QR or simply type the invite code on the join screen. A screenshot of this card is enough to share.
            </Text>

            <View style={styles.inviteActionRow}>
              <TouchableOpacity style={styles.inviteAction} onPress={handleShareInvite} activeOpacity={0.8}>
                <Ionicons name="share-social-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.inviteActionText}>Share Code</Text>
              </TouchableOpacity>
              <View style={styles.inviteMiniSteps}>
                <Text style={styles.inviteStep}>1. Send QR or code</Text>
                <Text style={styles.inviteStep}>2. Tenant opens Join Property</Text>
                <Text style={styles.inviteStep}>3. Tenant fills their details</Text>
              </View>
            </View>
          </TonalCard>
        )}

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
            <TouchableOpacity
              key={tenant.id}
              activeOpacity={0.78}
              onPress={() => navigation.navigate('TenantDetail', { tenantId: tenant.id, tenant })}
            >
              <TonalCard
                level="lowest"
                style={viewMode === 'grid' ? styles.gridCard : styles.listCard}
              >
              {viewMode === 'grid' ? (
                // Grid View
                <View style={styles.gridContent}>
                  <View style={[styles.avatarCircle, tenant.status === 'vacant' && styles.avatarVacant]}>
                    <Text style={styles.avatarText}>
                      {tenant.status === 'vacant' ? '-' : tenant.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.gridRoom}>{tenant.room}</Text>
                  <Text style={styles.gridName} numberOfLines={1}>{tenant.name}</Text>
                  <StatusBadge status={tenant.status} />
                  {tenant.status !== 'vacant' && (
                    <View style={styles.gridFooter}>
                      <Text style={styles.gridRent}>{formatRent(tenant.rent_amount)}</Text>
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteTenant(tenant.id, tenant.name);
                        }}
                        style={styles.deleteCircle}
                      >
                        <Ionicons name="trash-outline" size={14} color={theme.colors.danger} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                // List View
                <View style={styles.listRow}>
                  <View style={[styles.avatarCircleSmall, tenant.status === 'vacant' && styles.avatarVacant]}>
                    <Text style={styles.avatarTextSmall}>
                      {tenant.status === 'vacant' ? '-' : tenant.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>{tenant.name}</Text>
                    <Text style={styles.listRoom}>{tenant.room} / {tenant.block}</Text>
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
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteTenant(tenant.id, tenant.name);
                      }}
                      style={styles.listDeleteBtn}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              </TonalCard>
            </TouchableOpacity>
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
  pendingQueueCard: { marginBottom: theme.spacing.lg, padding: theme.spacing.lg },
  pendingQueueTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  pendingQueueTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 20, color: theme.colors.onSurface },
  pendingQueueText: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  pendingQueueAction: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
  },
  pendingQueueName: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onSurface },
  pendingQueueMeta: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 3 },
  filterScroll: { marginBottom: theme.spacing.xl },
  filterChip: {
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 20, marginRight: 8,
  },
  filterChipActive: { backgroundColor: theme.colors.primary },
  filterText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant },
  filterTextActive: { color: theme.colors.onPrimary },
  inviteCard: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
  },
  inviteEyebrow: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.colors.onPrimaryContainer,
  },
  inviteProperty: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 24,
    color: theme.colors.onPrimaryContainer,
    marginTop: 8,
    textAlign: 'center',
  },
  inviteQrFrame: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: 16,
    borderRadius: 24,
  },
  inviteCode: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 30,
    letterSpacing: 4,
    color: theme.colors.primary,
  },
  inviteHelp: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.onPrimaryContainer,
    opacity: 0.9,
    marginTop: 10,
    textAlign: 'center',
  },
  inviteActionRow: {
    width: '100%',
    marginTop: theme.spacing.lg,
    gap: 12,
  },
  inviteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.surfaceContainerLowest,
    paddingVertical: 14,
    borderRadius: 14,
  },
  inviteActionText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.primary,
  },
  inviteMiniSteps: {
    backgroundColor: theme.colors.onPrimary + '16',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  inviteStep: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.onPrimaryContainer,
  },
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
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  deleteCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee4e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listDeleteBtn: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fee4e2',
  },
  deleteText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 10,
    color: theme.colors.danger,
  }
});
