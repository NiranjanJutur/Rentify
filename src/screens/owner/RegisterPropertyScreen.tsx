import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { propertyService } from '../../services/dataService';

const propertyTypes = ['PG / Hostel', 'Apartment', 'Co-Living', 'Villa', 'Dormitory'];
const amenities = [
  { name: 'WiFi', icon: 'wifi' as const, selected: true },
  { name: 'AC', icon: 'snow-outline' as const, selected: false },
  { name: 'Laundry', icon: 'shirt-outline' as const, selected: true },
  { name: 'Parking', icon: 'car-outline' as const, selected: false },
  { name: 'Gym', icon: 'barbell-outline' as const, selected: false },
  { name: 'CCTV', icon: 'videocam-outline' as const, selected: true },
  { name: 'Kitchen', icon: 'restaurant-outline' as const, selected: true },
  { name: 'Geyser', icon: 'flame-outline' as const, selected: false },
];

export const RegisterPropertyScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedType, setSelectedType] = useState(0);
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState('');
  const [totalRooms, setTotalRooms] = useState('');
  const [baseRent, setBaseRent] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState(
    amenities.map(a => a.selected)
  );

  const toggleAmenity = (index: number) => {
    const updated = [...selectedAmenities];
    updated[index] = !updated[index];
    setSelectedAmenities(updated);
  };

  const handleRegister = async () => {
    if (!propertyName || !address || !totalRooms || !baseRent) {
      Alert.alert('Missing Info', 'Please fill all details.');
      return;
    }
    setLoading(true);
    try {
      await propertyService.create({
        name: propertyName,
        address: address,
        property_type: propertyTypes[selectedType],
        total_rooms: parseInt(totalRooms),
        base_rent: parseFloat(baseRent),
        amenities: amenities.filter((_, i) => selectedAmenities[i]).map(a => a.name)
      });
      Alert.alert('Success', 'Property registered successfully!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to register property.');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Register Property</Text>
            <Text style={styles.subtitle}>NEW ESTATE ONBOARDING</Text>
          </View>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {['Details', 'Rooms', 'Amenities', 'Review'].map((step, i) => (
            <View key={i} style={styles.progressStep}>
              <View style={[styles.progressDot, i === 0 && styles.progressDotActive]}>
                <Text style={[styles.progressDotText, i === 0 && styles.progressDotTextActive]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[styles.progressLabel, i === 0 && styles.progressLabelActive]}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Property Type */}
        <Text style={styles.sectionTitle}>Property Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {propertyTypes.map((type, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setSelectedType(i)}
              style={[styles.typeChip, selectedType === i && styles.typeChipActive]}
            >
              <Text style={[styles.typeChipText, selectedType === i && styles.typeChipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Property Details Form */}
        <Text style={styles.sectionTitle}>Property Details</Text>
        <TonalCard level="lowest" style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PROPERTY NAME</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Sunrise Residency"
              placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
              value={propertyName}
              onChangeText={setPropertyName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>FULL ADDRESS</Text>
            <TextInput
              style={[styles.textInput, { minHeight: 60 }]}
              placeholder="123, MG Road, Bangalore 560001"
              placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>TOTAL ROOMS</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0"
                placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                value={totalRooms}
                onChangeText={setTotalRooms}
                keyboardType="numeric"
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>BASE RENT (₹)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0"
                placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                value={baseRent}
                onChangeText={setBaseRent}
                keyboardType="numeric"
              />
            </View>
          </View>
        </TonalCard>

        {/* Amenities */}
        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {amenities.map((amenity, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => toggleAmenity(i)}
              style={[styles.amenityCard, selectedAmenities[i] && styles.amenityCardActive]}
            >
              <Ionicons
                name={amenity.icon}
                size={24}
                color={selectedAmenities[i] ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <Text style={[styles.amenityText, selectedAmenities[i] && styles.amenityTextActive]}>
                {amenity.name}
              </Text>
              {selectedAmenities[i] && (
                <View style={styles.amenityCheck}>
                  <Ionicons name="checkmark" size={12} color={theme.colors.onPrimary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Photo Upload Area */}
        <Text style={styles.sectionTitle}>Property Photos</Text>
        <TouchableOpacity style={styles.uploadArea}>
          <Ionicons name="cloud-upload-outline" size={40} color={theme.colors.primary} />
          <Text style={styles.uploadTitle}>Upload Property Images</Text>
          <Text style={styles.uploadSubtitle}>Tap to select photos or take new ones</Text>
        </TouchableOpacity>

        {/* Submit */}
        <RentifyButton 
          title={loading ? "Registering..." : "Register Property"} 
          onPress={handleRegister} 
          disabled={loading}
          style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl }} 
        />
        <RentifyButton title="Save as Draft" onPress={() => {}} variant="glass" style={{ marginBottom: 40 }} />
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
  progressContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 20, padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    ...theme.elevation.floating,
  },
  progressStep: { alignItems: 'center', flex: 1 },
  progressDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: theme.colors.primary },
  progressDotText: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant },
  progressDotTextActive: { color: theme.colors.onPrimary },
  progressLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, marginTop: 6 },
  progressLabelActive: { color: theme.colors.primary },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  typeScroll: { marginBottom: theme.spacing.xl },
  typeChip: {
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 24, marginRight: 10,
  },
  typeChipActive: { backgroundColor: theme.colors.primary },
  typeChipText: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant },
  typeChipTextActive: { color: theme.colors.onPrimary },
  formCard: { padding: theme.spacing.xl, marginBottom: theme.spacing.xl },
  inputGroup: { marginBottom: theme.spacing.lg },
  inputLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: 8 },
  textInput: {
    fontFamily: theme.typography.body.fontFamily, fontSize: 16, color: theme.colors.onSurface,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  inputRow: { flexDirection: 'row' },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: theme.spacing.xl },
  amenityCard: {
    width: '22%', aspectRatio: 1,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    ...theme.elevation.floating,
  },
  amenityCardActive: { backgroundColor: theme.colors.occupiedBg },
  amenityText: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 6 },
  amenityTextActive: { color: theme.colors.primary },
  amenityCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  uploadArea: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 24, padding: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: theme.colors.outlineVariant + '26',
    borderStyle: 'dashed', marginBottom: theme.spacing.md,
  },
  uploadTitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 16, color: theme.colors.onSurface, marginTop: 12 },
  uploadSubtitle: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 4 },
});
