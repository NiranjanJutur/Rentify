import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CuratorButton } from '../../components/ui/CuratorButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { complaintService } from '../../services/dataService';

const filterTabs = ['All', 'Open', 'In Progress', 'Resolved'];

export const MaintenanceComplaintsScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('All');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = useCallback(async () => {
    try {
      const data = await complaintService.getAll();
      setComplaints(data || []);
    } catch (err) {
      console.log('Complaints fetch error:', err);
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'assigned': return 'Assigned';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      default: return status;
    }
  };

  const getStatusType = (status: string): any => {
    switch (status) {
      case 'open': return 'occupied';
      case 'assigned':
      case 'in_progress': return 'pending';
      case 'resolved': return 'vacant';
      default: return 'pending';
    }
  };

  const filtered = activeTab === 'All'
    ? complaints
    : complaints.filter(c => getStatusLabel(c.status) === activeTab);

  const openCount = complaints.filter(c => c.status === 'open').length;
  const inProgressCount = complaints.filter(c => c.status === 'in_progress' || c.status === 'assigned').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Maintenance</Text>
            <Text style={styles.subtitle}>COMPLAINTS & REQUESTS</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="filter-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Overview Metrics */}
        <View style={styles.metricsRow}>
          <TonalCard level="lowest" style={[styles.metricCard, { backgroundColor: theme.colors.pendingBg }]}>
            <Ionicons name="alert-circle" size={22} color={theme.colors.pendingText} />
            <Text style={[styles.metricValue, { color: theme.colors.pendingText }]}>{openCount}</Text>
            <Text style={styles.metricLabel}>OPEN</Text>
          </TonalCard>
          <TonalCard level="lowest" style={[styles.metricCard, { backgroundColor: theme.colors.occupiedBg }]}>
            <Ionicons name="hammer" size={22} color={theme.colors.occupiedText} />
            <Text style={[styles.metricValue, { color: theme.colors.occupiedText }]}>{inProgressCount}</Text>
            <Text style={styles.metricLabel}>IN PROGRESS</Text>
          </TonalCard>
          <TonalCard level="lowest" style={[styles.metricCard, { backgroundColor: theme.colors.vacantBg }]}>
            <Ionicons name="checkmark-circle" size={22} color={theme.colors.vacantText} />
            <Text style={[styles.metricValue, { color: theme.colors.vacantText }]}>{resolvedCount}</Text>
            <Text style={styles.metricLabel}>RESOLVED</Text>
          </TonalCard>
        </View>

        {/* Resolution Stats */}
        <TonalCard level="lowest" style={styles.resolutionCard}>
          <Text style={styles.resolutionLabel}>AVERAGE RESOLUTION TIME</Text>
          <View style={styles.resolutionRow}>
            <Text style={styles.resolutionValue}>2.4 days</Text>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-down" size={14} color={theme.colors.secondary} />
              <Text style={styles.trendText}>12% faster</Text>
            </View>
          </View>
          {/* Simple progress bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '78%' }]} />
          </View>
          <Text style={styles.progressText}>78% resolution rate this month</Text>
        </TonalCard>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          {filterTabs.map((tab, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Complaints List */}
        <View style={styles.complaintsList}>
          {filtered.map((complaint) => (
            <TonalCard key={complaint.id} level="lowest" style={styles.complaintCard}>
              <View style={styles.complaintHeader}>
                <View style={styles.complaintIconContainer}>
                  <Ionicons name={complaint.icon} size={22} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.complaintTitle}>{complaint.title}</Text>
                  <Text style={styles.complaintId}>{complaint.id} • {complaint.category}</Text>
                </View>
                <StatusBadge
                  status={complaint.status}
                  label={complaint.statusLabel}
                />
              </View>
              <Text style={styles.complaintBody}>{complaint.description}</Text>
              <View style={styles.complaintMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={14} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.metaText}>{complaint.tenant}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.metaText}>{complaint.room}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.metaText}>{complaint.date}</Text>
                </View>
              </View>
              {complaint.daysOpen > 0 && (
                <View style={styles.complaintFooter}>
                  <Text style={styles.daysText}>
                    <Ionicons name="time-outline" size={12} color={complaint.daysOpen > 4 ? '#ba1a1a' : theme.colors.onSurfaceVariant} />
                    {' '}{complaint.daysOpen} days open
                  </Text>
                  <View style={styles.footerActions}>
                    <TouchableOpacity style={styles.footerBtn}>
                      <Text style={styles.footerBtnText}>Assign</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.footerBtn, styles.footerBtnPrimary]}>
                      <Text style={[styles.footerBtnText, { color: theme.colors.onPrimary }]}>Update</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TonalCard>
          ))}
        </View>

        {/* Log New Complaint */}
        <CuratorButton title="Log New Complaint" onPress={() => {}} style={{ marginBottom: 40 }} />
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
  iconBtn: { padding: 8 },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: theme.spacing.lg },
  metricCard: { flex: 1, alignItems: 'center', padding: theme.spacing.md, borderRadius: 20 },
  metricValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 28, marginTop: 6 },
  metricLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 9, color: theme.colors.onSurfaceVariant, letterSpacing: 1, marginTop: 4 },
  resolutionCard: { padding: theme.spacing.xl, marginBottom: theme.spacing.xl },
  resolutionLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, letterSpacing: 1.5 },
  resolutionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  resolutionValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 32, color: theme.colors.primary },
  trendBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.colors.vacantBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  trendText: { fontFamily: theme.typography.label.fontFamily, fontSize: 12, color: theme.colors.secondary },
  progressBarBg: {
    height: 6, backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 3, marginTop: 20, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.secondary, borderRadius: 3 },
  progressText: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 8 },
  tabRow: {
    flexDirection: 'row', backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16, padding: 4, marginBottom: theme.spacing.xl,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: theme.colors.surfaceContainerLowest, ...theme.elevation.floating },
  tabText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant },
  tabTextActive: { color: theme.colors.primary },
  complaintsList: { gap: 12, marginBottom: theme.spacing.xl },
  complaintCard: { padding: theme.spacing.lg },
  complaintHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  complaintIconContainer: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.occupiedBg,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  complaintTitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 16, color: theme.colors.onSurface },
  complaintId: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  complaintBody: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant, lineHeight: 22, marginBottom: 12 },
  complaintMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant },
  complaintFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant + '26',
  },
  daysText: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant },
  footerActions: { flexDirection: 'row', gap: 8 },
  footerBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  footerBtnPrimary: { backgroundColor: theme.colors.primary },
  footerBtnText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.primary },
});
