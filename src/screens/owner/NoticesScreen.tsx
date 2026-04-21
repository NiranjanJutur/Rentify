import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { noticeService } from '../../services/dataService';

const categories = ['All', 'Maintenance', 'Finance', 'Event', 'Infrastructure', 'Policy'];

const getCategoryIcon = (cat: string) => {
    switch (cat) {
        case 'Maintenance': return 'construct-outline';
        case 'Finance': return 'wallet-outline';
        case 'Event': return 'megaphone-outline';
        case 'Policy': return 'document-text-outline';
        case 'Infrastructure': return 'business-outline';
        default: return 'notifications-outline';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'urgent': return '#ef4444';
        case 'high': return '#f59e0b';
        default: return theme.colors.primary;
    }
};

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

  const handleDelete = async (id: string) => {
    const performDelete = async () => {
        try {
            await noticeService.delete(id);
            setNotices(prev => prev.filter(n => n.id !== id));
            if (Platform.OS === 'web') alert('Notice removed successfully.');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not delete notice.');
        }
    };

    if (Platform.OS === 'web') {
        if (window.confirm('Are you sure you want to delete this notice? This action cannot be undone.')) {
            await performDelete();
        }
    } else {
        Alert.alert(
            'Delete Notice',
            'Are you sure you want to remove this notice from the bulletin board?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: performDelete }
            ]
        );
    }
  };

  const renderNoticeCard = (notice: any) => (
    <TonalCard key={notice.id} level="lowest" style={styles.noticeCard}>
        <View style={styles.noticeHeader}>
            <View style={[styles.noticeIcon, { backgroundColor: getPriorityColor(notice.priority) + '15' }]}>
                <Ionicons 
                    name={getCategoryIcon(notice.category) as any} 
                    size={22} 
                    color={getPriorityColor(notice.priority)} 
                />
            </View>
            <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                    <Text style={styles.noticeTitle}>{notice.title}</Text>
                    {notice.pinned && <Ionicons name="pin" size={16} color={theme.colors.primary} style={{marginLeft: 8}} />}
                </View>
                <View style={styles.metaRow}>
                    <View style={[styles.categoryTag, { backgroundColor: getPriorityColor(notice.priority) + '10' }]}>
                        <Text style={[styles.categoryTagText, { color: getPriorityColor(notice.priority) }]}>{notice.category}</Text>
                    </View>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.noticeDate}>{new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                </View>
            </View>
        </View>
        
        <Text style={styles.noticeBody}>{notice.body}</Text>
        
        <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {
                if(Platform.OS === 'web') alert('Draft shared with residents!');
                else Alert.alert('Shared', 'Notice shared with residents.');
            }}>
                <Ionicons name="share-social-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {
                if(Platform.OS === 'web') alert('In-line editing soon!');
                else Alert.alert('Edit', 'Opening editor...');
            }}>
                <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(notice.id)}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
            </TouchableOpacity>
        </View>
    </TonalCard>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.webContainer}>
            {/* Header Area */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.pageTitle}>Bulletin Board</Text>
                    <Text style={styles.pageSubtitle}>Update your residents instantly</Text>
                </View>
                <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateNotice')}>
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.createBtnText}>New Notice</Text>
                </TouchableOpacity>
            </View>

            {/* Insight Chips */}
            <View style={styles.statsRow}>
                <View style={[styles.statItem, { backgroundColor: theme.colors.primaryContainer + '44' }]}>
                    <Text style={styles.statValue}>{notices.length}</Text>
                    <Text style={styles.statLabel}>Total Posts</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.statValue, { color: '#d97706' }]}>{notices.filter(n => n.priority === 'urgent' || n.priority === 'high').length}</Text>
                    <Text style={[styles.statLabel, { color: '#d97706' }]}>Priority</Text>
                </View>
            </View>

            {/* Filter Section */}
            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setSelectedCategory(cat)}
                            style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
                        >
                            <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {pinnedNotices.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="pin" size={18} color={theme.colors.primary} />
                        <Text style={styles.sectionTitle}>Pinned Announcements</Text>
                    </View>
                    {pinnedNotices.map(renderNoticeCard)}
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitleStandalone}>Recent Activity</Text>
                {otherNotices.length === 0 && <Text style={styles.emptyText}>No notices in this category.</Text>}
                {otherNotices.map(renderNoticeCard)}
            </View>

            <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Floating Action Button for Mobile / Small Web */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('CreateNotice')}
      >
          <Ionicons name="create" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scrollContainer: { flexGrow: 1 },
  webContainer: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 900,
      padding: theme.spacing.xl,
  },
  header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: 32,
      marginTop: Platform.OS === 'web' ? 20 : 0,
  },
  backButton: {
      width: 44, height: 44, borderRadius: 12,
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center', justifyContent: 'center',
      marginRight: 16,
  },
  pageTitle: {
      fontFamily: theme.typography.headline.fontFamily,
      fontSize: 34, fontWeight: '800', color: theme.colors.onSurface,
  },
  pageSubtitle: {
      fontSize: 14, color: theme.colors.onSurfaceVariant,
      marginTop: 4, letterSpacing: 0.5,
  },
  createBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20, paddingVertical: 12,
      borderRadius: 14, ...theme.elevation.medium,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statItem: {
      flex: 1, padding: 20, borderRadius: 20,
      justifyContent: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: theme.colors.onSurface },
  statLabel: { fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 4, fontWeight: '600' },
  filterSection: { marginBottom: 32 },
  filterChip: {
      paddingHorizontal: 20, paddingVertical: 12,
      borderRadius: 14, backgroundColor: theme.colors.surfaceContainerLow,
      marginRight: 12, borderWidth: 1, borderColor: 'transparent',
  },
  filterChipActive: {
      backgroundColor: theme.colors.primary,
  },
  filterChipText: { fontSize: 14, color: theme.colors.onSurfaceVariant, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.onSurface },
  sectionTitleStandalone: { fontSize: 20, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 20 },
  noticeCard: {
      padding: 24, borderRadius: 24, marginBottom: 16,
      borderWidth: 1, borderColor: theme.colors.outlineVariant + '22',
  },
  noticeHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  noticeIcon: {
      width: 52, height: 52, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  noticeTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.onSurface, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  categoryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryTagText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  dot: { marginHorizontal: 8, color: theme.colors.onSurfaceVariant, opacity: 0.5 },
  noticeDate: { fontSize: 12, color: theme.colors.onSurfaceVariant, fontWeight: '500' },
  noticeBody: { 
      fontSize: 15, color: theme.colors.onSurfaceVariant, 
      lineHeight: 24, marginBottom: 20,
  },
  actionRow: {
      flexDirection: 'row', gap: 20, paddingTop: 16,
      borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant + '22',
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
  emptyText: { fontSize: 15, color: theme.colors.onSurfaceVariant, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
  fab: {
      position: 'absolute', bottom: 30, right: 30,
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: theme.colors.primary,
      alignItems: 'center', justifyContent: 'center',
      ...theme.elevation.high,
      display: Platform.OS === 'web' ? 'none' : 'flex',
  }
});
