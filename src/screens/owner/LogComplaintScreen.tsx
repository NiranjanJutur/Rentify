import React, { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { TonalCard } from '../../components/ui/TonalCard';
import { complaintService } from '../../services/dataService';
import { requirePrimaryPropertyId } from '../../services/ownerProperty';
import { theme } from '../../theme/theme';

const categories = ['Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Network', 'General'];
const priorities = ['low', 'medium', 'high', 'urgent'];

export const LogComplaintScreen = () => {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [roomLabel, setRoomLabel] = useState('');
  const [photoData, setPhotoData] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handlePhotoPick = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setMessage('Allow camera access to attach issue photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        setPhotoData(asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri);
        setMessage(null);
      }
    } catch (error: any) {
      setMessage(error.message || 'Could not attach the complaint photo.');
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setMessage('Please enter the maintenance title and description.');
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const propertyId = await requirePrimaryPropertyId();
      await complaintService.create({
        property_id: propertyId,
        title: title.trim(),
        description: description.trim(),
        room_label: roomLabel.trim(),
        photo_data: photoData,
        category: category.trim(),
        priority: priority.trim(),
      });
      Alert.alert('Ticket Created', 'The maintenance ticket is now in the queue.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      setMessage(error.message || 'Could not create the ticket.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={21} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Log Complaint</Text>
            <Text style={styles.subtitle}>MAINTENANCE REQUEST</Text>
          </View>
        </View>

        <TonalCard level="lowest" style={styles.card}>
          <Text style={styles.sectionTitle}>Issue Details</Text>
          <Text style={styles.label}>Issue Title</Text>
          <TextInput style={styles.input} placeholder="Water leak in bathroom" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} value={title} onChangeText={setTitle} />

          <Text style={styles.label}>Room / Area</Text>
          <TextInput style={styles.input} placeholder="A-201 / Common Kitchen" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} value={roomLabel} onChangeText={setRoomLabel} />

          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {categories.map(option => (
              <TouchableOpacity key={option} onPress={() => setCategory(option)} style={[styles.chip, category === option && styles.chipActive]}>
                <Text style={[styles.chipText, category === option && styles.chipTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Priority</Text>
          <View style={styles.chipRow}>
            {priorities.map(option => (
              <TouchableOpacity key={option} onPress={() => setPriority(option)} style={[styles.chip, priority === option && styles.chipActive]}>
                <Text style={[styles.chipText, priority === option && styles.chipTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.bodyInput]} placeholder="Describe the issue..." placeholderTextColor={theme.colors.onSurfaceVariant + '88'} value={description} onChangeText={setDescription} multiline />

          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoButton} onPress={handlePhotoPick}>
              <Ionicons name="camera-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            {photoData ? <Image source={{ uri: photoData }} style={styles.photoPreview} /> : null}
          </View>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <RentifyButton title={saving ? 'Creating Ticket...' : 'Create Ticket'} onPress={handleSave} disabled={saving} />
        </TonalCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl },
  iconButton: { width: 38, height: 38, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontFamily: theme.typography.headline.fontFamily, fontSize: 30, color: theme.colors.onSurface },
  subtitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  card: { padding: theme.spacing.xl },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.primary, marginBottom: theme.spacing.xl },
  label: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 8 },
  input: { minHeight: 50, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, paddingHorizontal: theme.spacing.md, paddingVertical: 14, marginBottom: theme.spacing.lg, fontFamily: theme.typography.body.fontFamily, color: theme.colors.onSurface },
  bodyInput: { minHeight: 130, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: theme.spacing.lg },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: theme.colors.surfaceContainerLow },
  chipActive: { backgroundColor: theme.colors.primary },
  chipText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant },
  chipTextActive: { color: theme.colors.onPrimary },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: theme.spacing.lg },
  photoButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow },
  photoButtonText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.primary },
  photoPreview: { width: 64, height: 64, borderRadius: 8 },
  message: { marginBottom: theme.spacing.md, fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.danger },
});
