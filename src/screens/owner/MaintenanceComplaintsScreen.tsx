import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar, Alert } from 'react-native';
import { theme } from '../../theme/theme';
import { StatusBadge, StatusType } from '../../components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { complaintService } from '../../services/dataService';
import { requirePrimaryPropertyId } from '../../services/ownerProperty';
import { LinearGradient } from 'expo-linear-gradient';

const filterTabs = ['All', 'Open', 'In Progress', 'Resolved'] as const;

type ComplaintRecord = {
  id: string;
  title: string;
  description?: string;
  room_label?: string;
  photo_data?: string;
  category?: string;
  status?: 'open' | 'assigned' | 'in_progress' | 'resolved';
  priority?: string;
  created_at?: string;
  tenants?: { name?: string; room?: string };
};

const mapComplaintStatus = (status?: string): { label: string; badge: StatusType } => {
  if (status === 'resolved') return { label: 'Resolved', badge: 'vacant' };
  if (status === 'assigned' || status === 'in_progress') return { label: 'In Progress', badge: 'pending' };
  return { label: 'Open', badge: 'occupied' };
};

export const MaintenanceComplaintsScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<(typeof filterTabs)[number]>('All');
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = useCallback(async () => {
    try {
      const propertyId = await requirePrimaryPropertyId();
      const data = await complaintService.getAll(propertyId);
      setComplaints(data || []);
    } catch (err: any) {
      console.log('Error fetching complaints:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const filtered = useMemo(() => {
    if (activeTab === 'All') return complaints;
    return complaints.filter(item => mapComplaintStatus(item.status).label === activeTab);
  }, [activeTab, complaints]);

  const metrics = useMemo(() => {
    const open = complaints.filter(item => item.status === 'open').length;
    const inProgress = complaints.filter(item => item.status === 'assigned' || item.status === 'in_progress').length;
    const resolved = complaints.filter(item => item.status === 'resolved').length;
    return { open, inProgress, resolved };
  }, [complaints]);

  const advanceComplaint = async (complaint: ComplaintRecord) => {
    const nextStatus =
      complaint.status === 'open' ? 'assigned' :
      complaint.status === 'assigned' ? 'in_progress' :
      complaint.status === 'in_progress' ? 'resolved' :
      'resolved';

    try {
      await complaintService.updateStatus(complaint.id, nextStatus);
      fetchComplaints();
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
            <Text style={styles.title}>Complaints</Text>
            <Text style={styles.subtitle}>Maintenance & Support</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('LogComplaint')} style={styles.addBtn}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{metrics.open}</Text>
            <Text style={styles.statLbl}>Open</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#f59e0b' }]}>{metrics.inProgress}</Text>
            <Text style={styles.statLbl}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#10b981' }]}>{metrics.resolved}</Text>
            <Text style={styles.statLbl}>Resolved</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          {filterTabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)} 
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.listSection}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No tickets found in this category.</Text>
            </View>
          ) : (
            filtered.map(complaint => {
              const status = mapComplaintStatus(complaint.status);
              return (
                <View key={complaint.id} style={styles.complaintCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketTitle}>{complaint.title}</Text>
                      <View style={styles.ticketMeta}>
                        <Ionicons name="location-outline" size={12} color="#64748b" />
                        <Text style={styles.metaText}>Room {complaint.room_label || complaint.tenants?.room || '?'}</Text>
                        <Text style={styles.metaSep}>•</Text>
                        <Text style={styles.metaText}>{complaint.category || 'General'}</Text>
                      </View>
                    </View>
                    <StatusBadge status={status.badge} label={status.label} />
                  </View>

                  <Text style={styles.description}>{complaint.description}</Text>

                  {complaint.photo_data && (
                    <Image source={{ uri: complaint.photo_data }} style={styles.ticketPhoto} />
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.priorityBox}>
                      <Text style={styles.priorityLabel}>Priority: </Text>
                      <Text style={[styles.priorityValue, { color: complaint.priority === 'high' ? '#ef4444' : '#64748b' }]}>
                        {(complaint.priority || 'medium').toUpperCase()}
                      </Text>
                    </View>
                    {complaint.status !== 'resolved' && (
                      <TouchableOpacity style={styles.nextBtn} onPress={() => advanceComplaint(complaint)}>
                        <Text style={styles.nextBtnText}>Advance Status</Text>
                        <Ionicons name="arrow-forward" size={14} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
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
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  statVal: { fontSize: 24, fontWeight: '800', color: '#ef4444' },
  statLbl: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#f8fafc', elevation: 1 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  activeTabText: { color: '#1e293b', fontWeight: '700' },
  listSection: { gap: 16 },
  complaintCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  ticketTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  metaText: { fontSize: 12, color: '#64748b' },
  metaSep: { color: '#cbd5e1' },
  description: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 16 },
  ticketPhoto: { width: '100%', height: 180, borderRadius: 16, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  priorityBox: { flexDirection: 'row', alignItems: 'center' },
  priorityLabel: { fontSize: 12, color: '#94a3b8' },
  priorityValue: { fontSize: 12, fontWeight: '800' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  nextBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 }
});
