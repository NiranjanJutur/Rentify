import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { propertyService, tenantService } from '../../services/dataService';
import { TonalCard } from '../../components/ui/TonalCard';

interface RoomStatus {
  label: string;
  occupancy: number;
  max: number;
  tenants: any[];
  status: 'empty' | 'partial' | 'full';
}

export const RoomOverviewScreen = () => {
  const navigation = useNavigation<any>();
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
      const occupiedTenants = (allTenants || []).filter(t => t.status === 'occupied');

      const config = currentProp.property_config || {};
      const sharingMix = config.sharingMix || null;
      const totalRoomsCount = currentProp.total_rooms || 0;
      const prefix = currentProp.room_label_prefix || '';

      const generatedRooms: RoomStatus[] = [];
      
      if (sharingMix) {
        // If we have a sharing mix, we categorize rooms by sharing type
        let roomCounter = 1;
        const sharingOptions = [
          { key: 'single', label: '1 Sharing', max: 1 },
          { key: 'double', label: '2 Sharing', max: 2 },
          { key: 'triple', label: '3 Sharing', max: 3 },
          { key: 'quad', label: '4 Sharing', max: 4 },
        ];

        sharingOptions.forEach(opt => {
          const count = parseInt(sharingMix[opt.key] || '0', 10);
          for (let i = 0; i < count; i++) {
            const roomLabel = `${prefix}${roomCounter++}`;
            const roomTenants = occupiedTenants.filter(t => t.room === roomLabel);
            const occupancy = roomTenants.length;
            
            let status: 'empty' | 'partial' | 'full' = 'empty';
            if (occupancy >= opt.max) status = 'full';
            else if (occupancy > 0) status = 'partial';

            generatedRooms.push({
              label: roomLabel,
              occupancy,
              max: opt.max,
              tenants: roomTenants,
              status
            });
          }
        });
      } else {
        // Fallback to simple sequential rooms if no sharing mix
        const maxOccupancy = currentProp.max_occupancy_per_room || 1;
        for (let i = 1; i <= totalRoomsCount; i++) {
          const roomLabel = `${prefix}${i}`;
          const roomTenants = occupiedTenants.filter(t => t.room === roomLabel);
          const occupancy = roomTenants.length;
          
          let status: 'empty' | 'partial' | 'full' = 'empty';
          if (occupancy >= maxOccupancy) status = 'full';
          else if (occupancy > 0) status = 'partial';

          generatedRooms.push({
            label: roomLabel,
            occupancy,
            max: maxOccupancy,
            tenants: roomTenants,
            status
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

  const getStatusColor = (status: 'empty' | 'partial' | 'full') => {
    switch (status) {
      case 'full': return theme.colors.danger; 
      case 'partial': return theme.colors.warning;
      case 'empty': return theme.colors.secondary;
    }
  };

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Room Profile</Text>
          <Text style={styles.subtitle}>{property.name.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <TonalCard level="lowest" style={styles.legendCard}>
            <Text style={styles.legendTitle}>OCCUPANCY KEY</Text>
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
        </TonalCard>

        {rooms.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No rooms configured for this property.</Text>
          </View>
        ) : (
          (() => {
            const groups: Record<number, RoomStatus[]> = {};
            rooms.forEach(r => {
              if (!groups[r.max]) groups[r.max] = [];
              groups[r.max].push(r);
            });

            return Object.keys(groups).sort((a,b) => Number(a) - Number(b)).map(max => (
              <View key={max} style={styles.groupSection}>
                <Text style={styles.groupTitle}>{max} SHARING ROOMS</Text>
                <View style={styles.grid}>
                  {groups[Number(max)].map((room, i) => (
                    <TouchableOpacity 
                      key={i} 
                      style={[styles.roomCard, { borderColor: getStatusColor(room.status) + '44' }]}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (room.occupancy > 0) {
                          // For occupied rooms, go to Tenant Details
                          // If multiple tenants, the detail screen handles the list/navigation
                          navigation.navigate('TenantDetail', { 
                            tenantId: room.tenants[0].id, 
                            tenant: room.tenants[0],
                            roomLabel: room.label 
                          });
                        } else {
                          navigation.navigate('AddTenant', { initialRoom: room.label });
                        }
                      }}
                    >
                      <View style={[styles.statusTab, { backgroundColor: getStatusColor(room.status) }]} />
                      <Text style={styles.roomLabel}>{room.label}</Text>
                      <Text style={styles.occupancyText}>
                        {room.occupancy}/{room.max}
                      </Text>
                      <View style={styles.capacityBar}>
                        <View style={[
                          styles.capacityFill, 
                          { 
                            width: `${(room.occupancy / room.max) * 100}%`,
                            backgroundColor: getStatusColor(room.status) 
                          }
                        ]} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ));
          })()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.lg, paddingTop: 60 },
  backBtn: { padding: 8, marginRight: 12, backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 12 },
  title: { fontFamily: theme.typography.headline.fontFamily, fontSize: 28, color: theme.colors.onSurface },
  subtitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.primary, letterSpacing: 1.5, marginTop: 2 },
  scrollContent: { padding: theme.spacing.lg, paddingBottom: 100 },
  legendCard: { padding: theme.spacing.md, marginBottom: theme.spacing.xl, alignItems: 'center' },
  legendTitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, marginBottom: 12, letterSpacing: 1 },
  legendRow: { flexDirection: 'row', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurface },
  groupSection: { marginBottom: 30 },
  groupTitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 16, letterSpacing: 1.5, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  roomCard: { 
    width: '30.5%', 
    backgroundColor: theme.colors.surfaceContainerLowest, 
    borderRadius: 16, 
    padding: 12, 
    borderWidth: 1,
    ...theme.elevation.floating,
    overflow: 'hidden'
  },
  statusTab: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  roomLabel: { fontFamily: theme.typography.headline.fontFamily, fontSize: 18, color: theme.colors.onSurface },
  occupancyText: { fontFamily: theme.typography.label.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  capacityBar: { height: 4, backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  capacityFill: { height: '100%', borderRadius: 2 },
  emptyText: { fontFamily: theme.typography.body.fontFamily, fontSize: 16, color: theme.colors.onSurfaceVariant, textAlign: 'center' },
});
