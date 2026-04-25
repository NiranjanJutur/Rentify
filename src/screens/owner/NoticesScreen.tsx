import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Share, View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, StatusBar } from 'react-native';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { noticeService } from '../../services/dataService';
import { requirePrimaryPropertyId } from '../../services/ownerProperty';

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
    default: return '#4f46e5';
  }
};

export const NoticesScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const propertyId = await requirePrimaryPropertyId();
      const data = await noticeService.getAll(propertyId);
      setNotices(data || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const filtered = selectedCategory === 'All' ? notices : notices.filter(n => n.category === selectedCategory);
  const pinned = filtered.filter(n => n.pinned);
  const others = filtered.filter(n => !n.pinned);

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Notice', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await noticeService.delete(id);
          setNotices(n => n.filter(item => item.id !== id));
        } catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  const handleShare = async (notice: any) => {
    try {
      await Share.share({ message: `${notice.title}\n\n${notice.body}` });
    } catch (e) {}
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;

  const renderCard = (notice: any) => (
    <View key={notice.id} style={styles.noticeCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: getPriorityColor(notice.priority) + '10' }]}>
          <Ionicons name={getCategoryIcon(notice.category) as any} size={22} color={getPriorityColor(notice.priority)} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.noticeTitle}>{notice.title}</Text>
            {notice.pinned && <Ionicons name="pin" size={16} color="#4f46e5" style={{ marginLeft: 6 }} />}
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.categoryText, { color: getPriorityColor(notice.priority) }]}>{notice.category.toUpperCase()}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.dateText}>{new Date(notice.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.bodyText}>{notice.body}</Text>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(notice)}>
          <Ionicons name="share-social-outline" size={18} color="#64748b" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreateNotice', { notice })}>
          <Ionicons name="create-outline" size={18} color="#64748b" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(notice.id)}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Announcements</Text>
            <Text style={styles.subtitle}>Bulletin Board</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateNotice')}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{notices.length}</Text>
            <Text style={styles.statLbl}>Total Posts</Text>
          </View>
          <View style={[styles.statCard, { borderLeftWidth: 1, borderLeftColor: '#f1f5f9' }]}>
            <Text style={[styles.statVal, { color: '#ef4444' }]}>{notices.filter(n => n.priority === 'urgent').length}</Text>
            <Text style={styles.statLbl}>Urgent</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroller} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
          {categories.map(c => (
            <TouchableOpacity key={c} onPress={() => setSelectedCategory(c)} style={[styles.filterChip, selectedCategory === c && styles.activeFilter]}>
              <Text style={[styles.filterText, selectedCategory === c && styles.activeFilterText]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {pinned.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PINNED</Text>
            {pinned.map(renderCard)}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          {others.length === 0 ? <Text style={styles.emptyText}>No announcements found.</Text> : others.map(renderCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, marginTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12, elevation: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: '#f1f5f9' },
  statCard: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  statLbl: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginTop: 4 },
  filterScroller: { marginBottom: 32 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9' },
  activeFilter: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  activeFilterText: { color: '#fff' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 16 },
  noticeCard: { backgroundColor: '#fff', borderRadius: 28, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  noticeTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b', flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  categoryText: { fontSize: 10, fontWeight: '800' },
  metaDot: { marginHorizontal: 8, color: '#cbd5e1' },
  dateText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  bodyText: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 20 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 40, fontStyle: 'italic' }
});
