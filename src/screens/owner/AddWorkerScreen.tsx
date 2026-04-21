import React, { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { TonalCard } from '../../components/ui/TonalCard';
import { requirePrimaryPropertyId } from '../../services/ownerProperty';
import { staffService } from '../../services/dataService';
import { theme } from '../../theme/theme';

const roleOptions = ['Housekeeping', 'Security', 'Maintenance', 'Cook', 'Warden'];
const shiftOptions = ['Morning', 'Evening', 'Night', 'Split', 'Full Day'];
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AddWorkerScreen = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [role, setRole] = useState('Housekeeping');
  const [shift, setShift] = useState('Morning');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('30');
  const [notes, setNotes] = useState('');
  const [dutyDays, setDutyDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [photoData, setPhotoData] = useState('');
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const toggleDutyDay = (day: string) => {
    setDutyDays(prev => (prev.includes(day) ? prev.filter(item => item !== day) : [...prev, day]));
  };

  const handlePhotoPick = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setFormMessage('Allow camera access to capture worker photos.');
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
        setFormMessage(null);
      }
    } catch (error: any) {
      setFormMessage(error.message || 'Could not pick the worker photo.');
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !role.trim() || !phone.trim() || !salary.trim() || dutyDays.length === 0) {
      setFormMessage('Please fill name, role, phone, salary, and duty days.');
      return;
    }

    setSaving(true);
    setFormMessage(null);
    try {
      const propertyId = await requirePrimaryPropertyId();
      await staffService.create({
        property_id: propertyId,
        name: name.trim(),
        role: role.trim(),
        shift: shift.trim(),
        duty_days: dutyDays,
        payment_due_day: Number(paymentDueDay) || 30,
        notes: notes.trim(),
        photo_data: photoData,
        phone: phone.trim(),
        salary: Number(salary) || 0,
      });
      Alert.alert('Worker Added', `${name.trim()} is now in the staff directory.`, [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      setFormMessage(error.message || 'Could not add the worker.');
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
            <Text style={styles.title}>Add Worker</Text>
            <Text style={styles.subtitle}>STAFF ONBOARDING</Text>
          </View>
        </View>

        <TonalCard level="lowest" style={styles.card}>
          <View style={styles.photoRow}>
            <View style={styles.photoFrame}>
              {photoData ? (
                <Image source={{ uri: photoData }} style={styles.photoPreview} />
              ) : (
                <Text style={styles.photoFallback}>{name.trim() ? name.trim().charAt(0).toUpperCase() : 'W'}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Worker Profile</Text>
              <Text style={styles.helperText}>Capture the worker photo, role, duty days, and payroll details in one place.</Text>
              <RentifyButton title="Take Photo" onPress={handlePhotoPick} variant="glass" />
            </View>
          </View>

          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} placeholder="e.g. Marcus Vale" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} value={name} onChangeText={setName} />

          <Text style={styles.label}>Role</Text>
          <View style={styles.chipRow}>
            {roleOptions.map(option => (
              <TouchableOpacity key={option} onPress={() => setRole(option)} style={[styles.chip, role === option && styles.chipActive]}>
                <Text style={[styles.chipText, role === option && styles.chipTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Shift</Text>
          <View style={styles.chipRow}>
            {shiftOptions.map(option => (
              <TouchableOpacity key={option} onPress={() => setShift(option)} style={[styles.chip, shift === option && styles.chipActive]}>
                <Text style={[styles.chipText, shift === option && styles.chipTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Duty Days</Text>
          <View style={styles.dayRow}>
            {weekDays.map(day => (
              <TouchableOpacity key={day} onPress={() => toggleDutyDay(day)} style={[styles.dayChip, dutyDays.includes(day) && styles.dayChipActive]}>
                <Text style={[styles.dayChipText, dutyDays.includes(day) && styles.dayChipTextActive]}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} placeholder="+91 98765 43210" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

          <View style={styles.inputRow}>
            <View style={styles.flexOne}>
              <Text style={styles.label}>Monthly Salary</Text>
              <TextInput style={styles.input} placeholder="18500" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} keyboardType="numeric" value={salary} onChangeText={setSalary} />
            </View>
            <View style={styles.rowGap} />
            <View style={styles.flexOne}>
              <Text style={styles.label}>Payment Day</Text>
              <TextInput style={styles.input} placeholder="30" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} keyboardType="numeric" value={paymentDueDay} onChangeText={setPaymentDueDay} />
            </View>
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Add duty notes, reporting instructions, or payroll remarks."
            placeholderTextColor={theme.colors.onSurfaceVariant + '88'}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {formMessage ? <Text style={styles.message}>{formMessage}</Text> : null}

          <RentifyButton title={saving ? 'Adding Worker...' : 'Add Worker'} onPress={handleSave} disabled={saving} style={styles.submit} />
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
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: theme.spacing.xl },
  photoFrame: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoFallback: { fontFamily: theme.typography.headline.fontFamily, fontSize: 34, color: theme.colors.onPrimary },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.primary },
  helperText: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, lineHeight: 20, color: theme.colors.onSurfaceVariant, marginTop: 6, marginBottom: 12 },
  label: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 8 },
  input: { minHeight: 50, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, paddingHorizontal: theme.spacing.md, paddingVertical: 14, marginBottom: theme.spacing.lg, fontFamily: theme.typography.body.fontFamily, color: theme.colors.onSurface },
  notesInput: { minHeight: 96, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: theme.spacing.lg },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: theme.colors.surfaceContainerLow },
  chipActive: { backgroundColor: theme.colors.primary },
  chipText: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant },
  chipTextActive: { color: theme.colors.onPrimary },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.lg },
  dayChip: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  dayChipActive: { backgroundColor: theme.colors.secondary },
  dayChipText: { fontFamily: theme.typography.label.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant },
  dayChipTextActive: { color: theme.colors.onPrimary },
  inputRow: { flexDirection: 'row' },
  flexOne: { flex: 1 },
  rowGap: { width: 12 },
  message: { marginBottom: theme.spacing.md, fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.danger },
  submit: { marginTop: theme.spacing.sm },
});
