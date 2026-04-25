import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { complaintService } from '../../services/dataService';

const categories = ['Maintenance', 'Utilities', 'Cleaning', 'Security'];

export default function TenantSupportScreen({ activeTenant }: { activeTenant?: any }) {
  const navigation = useNavigation<any>();
  const [category, setCategory] = useState('Maintenance');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }
    setSaving(true);
    try {
      await complaintService.create({
        property_id: activeTenant.property_id,
        tenant_id: activeTenant.id,
        title: title.trim(),
        description: description.trim(),
        room_label: activeTenant.room,
        category,
        priority: 'medium',
      });
      Alert.alert('Submitted', 'We will look into it soon.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) { Alert.alert('Error', 'Failed to submit'); }
    finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Support</Text>
            <Text style={styles.subtitle}>Help & Maintenance</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoIcon}>
            <Ionicons name="construct" size={20} color="#4f46e5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Facing an issue?</Text>
            <Text style={styles.infoSub}>Report it here, and our team will get it fixed as soon as possible.</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.chipRow}>
            {categories.map((c) => (
              <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.activeChip]}>
                <Text style={[styles.chipText, category === c && styles.activeChipText]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>WHAT'S THE ISSUE?</Text>
          <TextInput style={styles.input} placeholder="e.g. Tap leaking in bathroom" value={title} onChangeText={setTitle} />

          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Tell us more about the problem..." 
            value={description} 
            onChangeText={setDescription} 
            multiline 
            numberOfLines={4}
          />

          <TouchableOpacity style={[styles.submitBtn, saving && styles.disabledBtn]} onPress={handleSubmit} disabled={saving}>
            <Text style={styles.submitBtnText}>{saving ? 'Submitting...' : 'Send Request'}</Text>
            {!saving && <Ionicons name="paper-plane" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, marginTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  infoBox: { flexDirection: 'row', gap: 16, backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2 },
  infoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  infoSub: { fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 18 },
  formCard: { backgroundColor: '#fff', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#f1f5f9', elevation: 4 },
  label: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9' },
  activeChip: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  activeChipText: { color: '#fff' },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, fontSize: 15, color: '#1e293b', marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  textArea: { height: 120, textAlignVertical: 'top' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#4f46e5', paddingVertical: 18, borderRadius: 16, elevation: 4 },
  disabledBtn: { backgroundColor: '#cbd5e1', elevation: 0 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});
