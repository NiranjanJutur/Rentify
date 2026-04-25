import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { TonalCard } from '../../components/ui/TonalCard';
import { propertyService, noticeService } from '../../services/dataService';
import { theme } from '../../theme/theme';

const CATEGORIES = [
  { label: 'Maintenance', icon: 'construct-outline', color: '#0ea5e9' },
  { label: 'Finance', icon: 'wallet-outline', color: '#10b981' },
  { label: 'Event', icon: 'megaphone-outline', color: '#f59e0b' },
  { label: 'Policy', icon: 'document-text-outline', color: '#6366f1' },
  { label: 'Infrastructure', icon: 'business-outline', color: '#ec4899' },
];

const PRIORITIES = [
  { label: 'Normal', value: 'normal', color: '#64748b' },
  { label: 'High', value: 'high', color: '#f59e0b' },
  { label: 'Urgent', value: 'urgent', color: '#ef4444' },
];

export const CreateNoticeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const existingNotice = route.params?.notice || null;

  const [title, setTitle] = useState(existingNotice?.title || '');
  const [body, setBody] = useState(existingNotice?.body || '');
  const [category, setCategory] = useState(existingNotice?.category || 'Maintenance');
  const [priority, setPriority] = useState(existingNotice?.priority || 'normal');
  const [saving, setSaving] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(existingNotice?.property_id || null);

  React.useEffect(() => {
    if (existingNotice?.property_id) {
      return;
    }

    const fetchProps = async () => {
      try {
        const props = await propertyService.getMyProperties();
        if (props && props.length > 0) {
          setPropertyId(props[0].id);
        }
      } catch (err) {
        console.log('Error fetching properties for notice:', err);
      }
    };

    fetchProps();
  }, [existingNotice?.property_id]);

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both the title and the message.');
      return;
    }

    setSaving(true);
    try {
      if (!propertyId) {
        throw new Error('No property found to publish notice for.');
      }

      if (existingNotice?.id) {
        await noticeService.update(existingNotice.id, {
          title: title.trim(),
          body: body.trim(),
          category,
          priority,
          pinned: priority === 'urgent',
        });
      } else {
        await noticeService.create({
          property_id: propertyId,
          title: title.trim(),
          body: body.trim(),
          category,
          priority,
          pinned: priority === 'urgent',
        });
      }

      if (Platform.OS === 'web') {
        alert(existingNotice ? 'Notice updated successfully.' : 'Notice published successfully.');
        navigation.goBack();
      } else {
        Alert.alert(
          existingNotice ? 'Notice Updated' : 'Notice Published',
          existingNotice ? 'Your changes are now live.' : 'Residents can now see this notice.',
          [{ text: 'Done', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      Alert.alert(existingNotice ? 'Could Not Update' : 'Could Not Publish', error.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{existingNotice ? 'Edit Notice' : 'Create Notice'}</Text>
              <Text style={styles.subtitle}>ANNOUNCEMENT CENTER</Text>
            </View>
          </View>

          <TonalCard level="lowest" style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Scheduled lift maintenance"
                placeholderTextColor={theme.colors.onSurfaceVariant + '66'}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.label}
                  onPress={() => setCategory(cat.label)}
                  style={[
                    styles.categoryChip,
                    category === cat.label && { backgroundColor: cat.color + '22', borderColor: cat.color },
                  ]}
                >
                  <Ionicons name={cat.icon as any} size={16} color={category === cat.label ? cat.color : theme.colors.onSurfaceVariant} />
                  <Text style={[styles.chipText, category === cat.label && { color: cat.color, fontWeight: '600' }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Priority Level</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => setPriority(item.value)}
                  style={[
                    styles.priorityChip,
                    priority === item.value && { backgroundColor: item.color, borderColor: item.color },
                  ]}
                >
                  <Text style={[styles.priorityChipText, priority === item.value && { color: '#fff' }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message Body</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Explain the update in detail..."
                placeholderTextColor={theme.colors.onSurfaceVariant + '66'}
                value={body}
                onChangeText={setBody}
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={styles.footer}>
              <RentifyButton
                title={saving ? (existingNotice ? 'Saving Changes...' : 'Publishing Announcement...') : (existingNotice ? 'Save Notice' : 'Publish Notice')}
                onPress={handleSave}
                disabled={saving}
                style={styles.submitBtn}
              />
            </View>
          </TonalCard>

          <View style={styles.previewCard}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.previewText}>This notice will be visible to tenants linked to your active property.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scrollContainer: { flexGrow: 1, alignItems: 'center', paddingVertical: theme.spacing.xl },
  content: {
    width: '100%',
    maxWidth: 800,
    paddingHorizontal: theme.spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xxl },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  subtitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  card: { padding: 32, borderRadius: 28, overflow: 'hidden' },
  inputGroup: { marginBottom: 24 },
  label: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  input: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.onSurface,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: { minHeight: 160, textAlignVertical: 'top', paddingTop: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  chipText: { fontSize: 14, color: theme.colors.onSurfaceVariant },
  priorityChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  priorityChipText: { fontSize: 14, color: theme.colors.onSurfaceVariant, fontWeight: '500' },
  footer: { marginTop: 12 },
  submitBtn: { height: 60, borderRadius: 18 },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.primaryContainer + '33',
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
});
