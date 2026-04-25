import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, useWindowDimensions } from 'react-native';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { propertyService, tenantService } from '../../services/dataService';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface RoomStatus {
  label: string;
  occupancy: number;
  max: number;
  tenants: any[];
  status: 'empty' | 'partial' | 'full';
}

const getStatusColor = (status: 'empty' | 'partial' | 'full') => {
  switch (status) {
    case 'full':
      return theme.colors.danger;
    case 'partial':
      return theme.colors.warning;
    case 'empty':
      return theme.colors.secondary;
  }
};

const getStatusMeta = (status: 'empty' | 'partial' | 'full') => {
  switch (status) {
    case 'full':
      return {
        badgeStatus: 'occupied' as const,
        label: 'Full',
        hint: 'Fully occupied',
      };
    case 'partial':
      return {
        badgeStatus: 'pending' as const,
        label: 'Partial',
        hint: 'Beds still available',
      };
    case 'empty':
      return {
        badgeStatus: 'vacant' as const,
        label: 'Vacant',
        hint: 'Ready for move-in',
      };
  }
};

export const RoomOverviewScreen = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [rooms, setRooms] = useState<RoomStatus[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const props = await propertyService.getMyProperties();
      const currentProp = props?.[0];
      if (!currentProp) {
        setLoading(false);
        return;
      }
      setProperty(currentProp);

      const allTenants = await tenantService.getAll(currentProp.id);
      const occupiedTenants = (allTenants || []).filter((tenant) => tenant.status === 'occupied');

      const config = currentProp.property_config || {};
      const sharingMix = config.sharingMix || null;
      const totalRoomsCount = currentProp.total_rooms || 0;
      const prefix = currentProp.room_label_prefix || '';

      const generatedRooms: RoomStatus[] = [];

      if (sharingMix) {
        let roomCounter = 1;
        const sharingOptions = [
          { key: 'single', max: 1 },
          { key: 'double', max: 2 },
          { key: 'triple', max: 3 },
          { key: 'quad', max: 4 },
        ];

        sharingOptions.forEach((option) => {
          const count = parseInt(sharingMix[option.key] || '0', 10);
          for (let i = 0; i < count; i += 1) {
            const roomLabel = `${prefix}${roomCounter++}`;
            const roomTenants = occupiedTenants.filter((tenant) => tenant.room === roomLabel);
            const occupancy = roomTenants.length;

            let status: 'empty' | 'partial' | 'full' = 'empty';
            if (occupancy >= option.max) status = 'full';
            else if (occupancy > 0) status = 'partial';

            generatedRooms.push({
              label: roomLabel,
              occupancy,
              max: option.max,
              tenants: roomTenants,
              status,
            });
          }
        });
      } else {
        const maxOccupancy = currentProp.max_occupancy_per_room || 1;
        for (let i = 1; i <= totalRoomsCount; i += 1) {
          const roomLabel = `${prefix}${i}`;
          const roomTenants = occupiedTenants.filter((tenant) => tenant.room === roomLabel);
          const occupancy = roomTenants.length;

          let status: 'empty' | 'partial' | 'full' = 'empty';
          if (occupancy >= maxOccupancy) status = 'full';
          else if (occupancy > 0) status = 'partial';

          generatedRooms.push({
            label: roomLabel,
            occupancy,
            max: maxOccupancy,
            tenants: roomTenants,
            status,
          });
        }
      }

      setRooms(generatedRooms);
    } catch (err) {
      console.log('Error fetching room data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const cardsPerRow = width >= 1480 ? 4 : width >= 1080 ? 3 : width >= 680 ? 2 : 1;
  const roomCardWidth = cardsPerRow === 4 ? '23.8%' : cardsPerRow === 3 ? '31.9%' : cardsPerRow === 2 ? '48.6%' : '100%';

  const summary = useMemo(() => {
    const totalBeds = rooms.reduce((sum, room) => sum + room.max, 0);
    const occupiedBeds = rooms.reduce((sum, room) => sum + room.occupancy, 0);
    const partialRooms = rooms.filter((room) => room.status === 'partial').length;
    const vacantRooms = rooms.filter((room) => room.status === 'empty').length;
    const availableBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      totalBeds,
      occupiedBeds,
      partialRooms,
      vacantRooms,
      availableBeds,
      occupancyRate,
    };
  }, [rooms]);

  const groupedRooms = useMemo(() => {
    const groups: Record<number, RoomStatus[]> = {};
    rooms.forEach((room) => {
      if (!groups[room.max]) groups[room.max] = [];
      groups[room.max].push(room);
    });
    return Object.keys(groups)
      .sort((a, b) => Number(a) - Number(b))
      .map((max) => ({ max: Number(max), rooms: groups[Number(max)] }));
  }, [rooms]);

  if (loading) {
    return (
      <View style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No property found. Please register a property first.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>Room Intelligence</Text>
            <Text style={styles.title}>Room Overview</Text>
            <Text style={styles.subtitle}>{property.name}</Text>
          </View>
        </View>

        <TonalCard level="lowest" style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroLabel}>Live Occupancy</Text>
              <Text style={styles.heroValue}>{summary.occupancyRate}%</Text>
              <Text style={styles.heroText}>
                {summary.occupiedBeds} of {summary.totalBeds} beds occupied across {rooms.length} rooms.
              </Text>
            </View>

            <View style={styles.heroKeyWrap}>
              <Text style={styles.heroKeyTitle}>Occupancy Key</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: theme.colors.secondary }]} />
                  <Text style={styles.legendLabel}>Vacant</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: theme.colors.warning }]} />
                  <Text style={styles.legendLabel}>Partial</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: theme.colors.danger }]} />
                  <Text style={styles.legendLabel}>Full</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text style={styles.statValueOnDark}>{rooms.length}</Text>
              <Text style={styles.statLabelOnDark}>Total Rooms</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceContainerLow }]}>
              <Text style={styles.statValue}>{summary.availableBeds}</Text>
              <Text style={styles.statLabel}>Beds Available</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.pendingBg }]}>
              <Text style={[styles.statValue, { color: theme.colors.pendingText }]}>{summary.partialRooms}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.pendingText }]}>Partial Rooms</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.vacantBg }]}>
              <Text style={[styles.statValue, { color: theme.colors.vacantText }]}>{summary.vacantRooms}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.vacantText }]}>Vacant Rooms</Text>
            </View>
          </View>
        </TonalCard>

        {rooms.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No rooms configured for this property.</Text>
          </View>
        ) : (
          groupedRooms.map((group) => {
            const groupOccupiedBeds = group.rooms.reduce((sum, room) => sum + room.occupancy, 0);
            const groupTotalBeds = group.rooms.reduce((sum, room) => sum + room.max, 0);

            return (
              <View key={group.max} style={styles.groupSection}>
                <View style={styles.groupHeader}>
                  <View>
                    <Text style={styles.groupTitle}>{group.max} Sharing Rooms</Text>
                    <Text style={styles.groupMeta}>{`${group.rooms.length} rooms • ${groupOccupiedBeds}/${groupTotalBeds} beds occupied`}</Text>
                  </View>
                  <View style={styles.groupPill}>
                    <Text style={styles.groupPillText}>{Math.round(groupTotalBeds > 0 ? (groupOccupiedBeds / groupTotalBeds) * 100 : 0)}% filled</Text>
                  </View>
                </View>

                <View style={styles.grid}>
                  {group.rooms.map((room) => {
                    const statusMeta = getStatusMeta(room.status);
                    const statusColor = getStatusColor(room.status);
                    const availableBeds = room.max - room.occupancy;
                    const tenantNames = room.tenants.map((tenant) => tenant.name).filter(Boolean);

                    return (
                      <TouchableOpacity
                        key={room.label}
                        style={[styles.roomCard, { width: roomCardWidth, borderColor: statusColor + '20' }]}
                        activeOpacity={0.82}
                        onPress={() => {
                          if (room.occupancy > 0) {
                            navigation.navigate('TenantDetail', {
                              tenantId: room.tenants[0].id,
                              tenant: room.tenants[0],
                              roomLabel: room.label,
                            });
                          } else {
                            navigation.navigate('AddTenant', { initialRoom: room.label });
                          }
                        }}
                      >
                        <View style={[styles.roomAccent, { backgroundColor: statusColor }]} />

                        <View style={styles.roomTopRow}>
                          <View>
                            <Text style={styles.roomLabel}>{room.label}</Text>
                            <Text style={styles.roomHint}>{statusMeta.hint}</Text>
                          </View>
                          <StatusBadge status={statusMeta.badgeStatus} label={statusMeta.label} />
                        </View>

                        <View style={styles.roomMetricRow}>
                          <Text style={styles.occupancyValue}>
                            {room.occupancy}
                            <Text style={styles.occupancyTotal}>/{room.max}</Text>
                          </Text>
                          <Text style={styles.occupancyCaption}>occupied beds</Text>
                        </View>

                        <View style={styles.capacityTrack}>
                          <View
                            style={[
                              styles.capacityFill,
                              {
                                width: `${(room.occupancy / room.max) * 100}%`,
                                backgroundColor: statusColor,
                              },
                            ]}
                          />
                        </View>

                        <Text style={styles.availabilityText}>
                          {availableBeds === 0 ? 'No beds left' : `${availableBeds} bed${availableBeds === 1 ? '' : 's'} available`}
                        </Text>

                        <View style={styles.tenantList}>
                          {tenantNames.length > 0 ? (
                            tenantNames.slice(0, 3).map((name) => (
                              <View key={name} style={styles.tenantPill}>
                                <Ionicons name="person-outline" size={12} color={theme.colors.primary} />
                                <Text style={styles.tenantPillText} numberOfLines={1}>
                                  {name}
                                </Text>
                              </View>
                            ))
                          ) : (
                            <View style={styles.emptyTenantPill}>
                              <Ionicons name="sparkles-outline" size={12} color={theme.colors.secondary} />
                              <Text style={styles.emptyTenantText}>Ready for a new tenant</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.roomFooter}>
                          <View style={styles.roomFooterLeft}>
                            <View style={[styles.footerDot, { backgroundColor: statusColor }]} />
                            <Text style={styles.roomFooterText}>
                              {room.occupancy > 0 ? 'Tap to view resident details' : 'Tap to assign a tenant'}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={theme.colors.onSurfaceVariant} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: 56,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  backBtn: {
    padding: 10,
    marginRight: 14,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    ...theme.elevation.floating,
  },
  headerCopy: {
    flex: 1,
  },
  headerEyebrow: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: theme.colors.onSurfaceVariant,
  },
  title: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 34,
    color: theme.colors.onSurface,
    marginTop: 6,
  },
  subtitle: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 4,
  },
  heroCard: {
    borderRadius: 28,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  heroTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  heroCopy: {
    flex: 1,
    minWidth: 260,
  },
  heroLabel: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: theme.colors.onSurfaceVariant,
  },
  heroValue: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 58,
    color: theme.colors.primary,
    marginTop: 10,
    lineHeight: 64,
  },
  heroText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
    maxWidth: 520,
  },
  heroKeyWrap: {
    minWidth: 260,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignSelf: 'flex-start',
  },
  heroKeyTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 7,
  },
  legendLabel: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    color: theme.colors.onSurface,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: theme.spacing.xl,
  },
  statCard: {
    flexGrow: 1,
    minWidth: 160,
    borderRadius: 20,
    padding: 18,
  },
  statValue: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 28,
    color: theme.colors.onSurface,
  },
  statLabel: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.onSurfaceVariant,
    marginTop: 6,
  },
  statValueOnDark: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 28,
    color: theme.colors.onPrimary,
  },
  statLabelOnDark: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.onPrimary,
    opacity: 0.8,
    marginTop: 6,
  },
  groupSection: {
    marginBottom: 34,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  groupTitle: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 22,
    color: theme.colors.onSurface,
  },
  groupMeta: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  groupPill: {
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  groupPillText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  roomCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    ...theme.elevation.floating,
  },
  roomAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  roomTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  roomLabel: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 30,
    color: theme.colors.onSurface,
  },
  roomHint: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  roomMetricRow: {
    marginTop: theme.spacing.lg,
  },
  occupancyValue: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 28,
    color: theme.colors.onSurface,
  },
  occupancyTotal: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 18,
    color: theme.colors.onSurfaceVariant,
  },
  occupancyCaption: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  capacityTrack: {
    height: 8,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 999,
    marginTop: 14,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 999,
  },
  availabilityText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 10,
  },
  tenantList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  tenantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    backgroundColor: theme.colors.primaryContainer + '16',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tenantPillText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: 6,
    maxWidth: 160,
  },
  emptyTenantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.vacantBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  emptyTenantText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    color: theme.colors.vacantText,
    marginLeft: 6,
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant + '40',
  },
  roomFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  footerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  roomFooterText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  emptyText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
