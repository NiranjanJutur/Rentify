import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge, StatusType } from '../../components/ui/StatusBadge';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { complaintService } from '../../services/dataService';

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
  const [message, setMessage] = useState<string | null>(null);

  const fetchComplaints = useCallback(async () => {
    try {
      const data = await complaintService.getAll();
      setComplaints(data || []);
    } catch (err: any) {
      setMessage(err.message || 'Could not load maintenance tickets.');
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
      setMessage(`${complaint.title} moved to ${mapComplaintStatus(nextStatus).label.toLowerCase()}.`);
      fetchComplaints();
    } catch (error: any) {
      setMessage(error.message || 'Could not update complaint status.');
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
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Maintenance</Text>
            <Text style={styles.subtitle}>COMPLAINTS & REQUESTS</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <TonalCard level="lowest" style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics.open}</Text>
            <Text style={styles.metricLabel}>OPEN</Text>
          </TonalCard>
          <TonalCard level="lowest" style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: theme.colors.warning }]}>{metrics.inProgress}</Text>
            <Text style={styles.metricLabel}>IN PROGRESS</Text>
          </TonalCard>
          <TonalCard level="lowest" style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: theme.colors.secondary }]}>{metrics.resolved}</Text>
            <Text style={styles.metricLabel}>RESOLVED</Text>
          </TonalCard>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.tabRow}>
          {filterTabs.map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.complaintsList}>
          {filtered.map(complaint => {
            const status = mapComplaintStatus(complaint.status);
            const createdAt = complaint.created_at ? new Date(complaint.created_at) : null;
            const daysOpen = createdAt ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))) : 0;

            return (
              <TonalCard key={complaint.id} level="lowest" style={styles.complaintCard}>
                <View style={styles.complaintHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.complaintTitle}>{complaint.title}</Text>
                    <Text style={styles.complaintSub}>{complaint.category || 'General'} / Priority: {complaint.priority || 'medium'}</Text>
                  </View>
                  <StatusBadge status={status.badge} label={status.label} />
                </View>
                <Text style={styles.complaintBody}>{complaint.description || 'No description added.'}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>Room: {complaint.room_label || complaint.tenants?.room || 'Not set'}</Text>
                  <Text style={styles.metaText}>Reported: {createdAt ? createdAt.toLocaleDateString() : 'Unknown'}</Text>
                </View>
                {complaint.photo_data ? <Image source={{ uri: complaint.photo_data }} style={styles.complaintPhoto} /> : null}
                <View style={styles.complaintFooter}>
                  <Text style={styles.daysText}>{daysOpen} day(s) open</Text>
                  {complaint.status !== 'resolved' ? (
                    <TouchableOpacity style={styles.footerBtn} onPress={() => advanceComplaint(complaint)}>
                      <Text style={styles.footerBtnText}>Move Next</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </TonalCard>
            );
          })}
        </View>

        <RentifyButton title="Log New Complaint" onPress={() => navigation.navigate('LogComplaint')} style={{ marginBottom: 40 }} />
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
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: theme.spacing.lg },
  metricCard: { flex: 1, alignItems: 'center', padding: theme.spacing.md },
  metricValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 28, marginTop: 6, color: theme.colors.primary },
  metricLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 9, color: theme.colors.onSurfaceVariant, letterSpacing: 1, marginTop: 4 },
  message: { marginBottom: theme.spacing.md, fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.danger },
  tabRow: { flexDirection: 'row', backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 8, padding: 4, marginBottom: theme.spacing.xl },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: theme.colors.surfaceContainerLowest, ...theme.elevation.floating },
  tabText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant },
  tabTextActive: { color: theme.colors.primary },
  complaintsList: { gap: 12, marginBottom: theme.spacing.xl },
  complaintCard: { padding: theme.spacing.lg },
  complaintHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  complaintTitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 16, color: theme.colors.onSurface },
  complaintSub: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  complaintBody: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant, lineHeight: 22, marginBottom: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metaText: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant },
  complaintPhoto: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12 },
  complaintFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant + '26' },
  daysText: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant },
  footerBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.primary },
  footerBtnText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.onPrimary },
});
