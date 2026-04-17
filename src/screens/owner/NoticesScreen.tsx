import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CuratorButton } from '../../components/ui/CuratorButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { noticeService } from '../../services/dataService';

const categories = ['All', 'Maintenance', 'Finance', 'Event', 'Infrastructure', 'Policy'];

export const NoticesScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotices = useCallback(async () => {
    try {
      const data = await noticeService.getAll();
      setNotices(data || []);
    } catch (err) {
      console.log('Notices fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotices();
  };

  const filtered = selectedCategory === 'All'
    ? notices
    : notices.filter(n => n.category === selectedCategory);

  const pinnedNotices = filtered.filter(n => n.pinned);
  const otherNotices = filtered.filter(n => !n.pinned);

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Notices</Text>
            <Text style={styles.subtitle}>ANNOUNCEMENTS & ALERTS</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{notices.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{pinnedNotices.length}</Text>
            <Text style={styles.statLabel}>Pinned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
              {notices.filter(n => n.priority === 'urgent' || n.priority === 'high').length}
            </Text>
            <Text style={styles.statLabel}>Urgent</Text>
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {categories.map((cat, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pinned Notices */}
        {pinnedNotices.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="pin" size={16} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Pinned</Text>
            </View>
            {pinnedNotices.map((notice) => (
              <TonalCard key={notice.id} level="lowest" style={styles.noticeCard}>
                <View style={styles.noticeHeader}>
                  <View style={[styles.noticeIcon, { backgroundColor: theme.colors.occupiedBg }]}>
                    <Ionicons 
                      name={notice.category === 'Maintenance' ? 'water-outline' : notice.category === 'Finance' ? 'wallet-outline' : 'megaphone-outline'} 
                      size={20} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.noticeTitleRow}>
                      <Text style={styles.noticeTitle}>{notice.title}</Text>
                      <Ionicons name="pin" size={14} color={theme.colors.primary} />
                    </View>
                    <View style={styles.noticeMeta}>
                      <StatusBadge status={notice.priority === 'urgent' ? 'pending' : notice.priority === 'high' ? 'occupied' : 'vacant'} label={notice.category} />
                      <Text style={styles.noticeDate}>{new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.noticeBody}>{notice.body}</Text>
                <View style={styles.noticeActions}>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="share-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="pencil-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={16} color="#ba1a1a" />
                    <Text style={[styles.actionText, { color: '#ba1a1a' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TonalCard>
            ))}
          </>
        )}

        {/* Other Notices */}
        <Text style={styles.sectionTitleStandalone}>Recent</Text>
        {otherNotices.map((notice) => (
          <TonalCard key={notice.id} level="lowest" style={styles.noticeCard}>
            <View style={styles.noticeHeader}>
              <View style={[styles.noticeIcon, { backgroundColor: theme.colors.vacantBg }]}>
                <Ionicons 
                  name={notice.category === 'Maintenance' ? 'water-outline' : notice.category === 'Finance' ? 'wallet-outline' : 'megaphone-outline'} 
                  size={20} 
                  color={theme.colors.secondary} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>{notice.title}</Text>
                <View style={styles.noticeMeta}>
                  <StatusBadge status={notice.priority === 'urgent' ? 'pending' : notice.priority === 'high' ? 'occupied' : 'vacant'} label={notice.category} />
                  <Text style={styles.noticeDate}>{new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.noticeBody}>{notice.body}</Text>
          </TonalCard>
        ))}

        {/* Create Notice CTA */}
        <CuratorButton title="Create New Notice" onPress={() => {}} style={{ marginTop: theme.spacing.md, marginBottom: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scrollContainer: { padding: theme.spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg },
  backBtn: { padding: 8, marginRight: 12 },
  title: { fontFamily: theme.typography.headline.fontFamily, fontSize: 28, color: theme.colors.onSurface },
  subtitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, letterSpacing: 2, marginTop: 2 },
  iconBtn: { padding: 8 },
  statsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: 20,
    paddingVertical: theme.spacing.md, marginBottom: theme.spacing.lg,
    ...theme.elevation.floating,
  },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: theme.typography.headline.fontFamily, fontSize: 24, color: theme.colors.onSurface },
  statLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: theme.colors.outlineVariant + '40' },
  filterScroll: { marginBottom: theme.spacing.xl },
  filterChip: {
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 20, marginRight: 8,
  },
  filterChipActive: { backgroundColor: theme.colors.primary },
  filterText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant },
  filterTextActive: { color: theme.colors.onPrimary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.md },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 20, color: theme.colors.onSurface },
  sectionTitleStandalone: { fontFamily: theme.typography.headline.fontFamily, fontSize: 20, color: theme.colors.onSurface, marginTop: theme.spacing.lg, marginBottom: theme.spacing.md },
  noticeCard: { padding: theme.spacing.lg, marginBottom: 12 },
  noticeHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  noticeIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  noticeTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noticeTitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 16, color: theme.colors.onSurface, flex: 1 },
  noticeMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  noticeDate: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant },
  noticeBody: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant, lineHeight: 22 },
  noticeActions: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant + '26',
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.primary },
});
