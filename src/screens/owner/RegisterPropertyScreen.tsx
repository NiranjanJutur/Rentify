import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { theme } from '../../theme/theme';
import { TonalCard } from '../../components/ui/TonalCard';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { propertyService } from '../../services/dataService';

const propertyTypes = ['PG / Hostel', 'Apartment', 'Co-Living', 'Villa', 'Dormitory'] as const;
const steps = ['Details', 'Rooms', 'Amenities', 'Review'] as const;
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

const sharingOptions = [
  { key: 'single', label: '1 Sharing', multiplier: 1 },
  { key: 'double', label: '2 Sharing', multiplier: 2 },
  { key: 'triple', label: '3 Sharing', multiplier: 3 },
  { key: 'quad', label: '4 Sharing', multiplier: 4 },
] as const;

const propertyTypeConfigs = {
  'PG / Hostel': {
    helper: 'Room setup stays here so owners can define occupancy and management clearly.',
    fields: [
      { key: 'genderPreference', label: 'GENDER PREFERENCE', placeholder: 'Boys / Girls / Any' },
      { key: 'messAvailable', label: 'FOOD / MESS', placeholder: 'Included / Optional / No' },
      { key: 'wardenName', label: 'WARDEN NAME', placeholder: 'Hostel warden or manager' },
    ],
  },
  Apartment: {
    helper: 'Useful for apartment towers and unit-based buildings.',
    fields: [
      { key: 'unitSeries', label: 'UNIT SERIES', placeholder: 'A-101 to A-120' },
      { key: 'parkingSlots', label: 'PARKING SLOTS', placeholder: '0' },
      { key: 'furnishing', label: 'FURNISHING', placeholder: 'Unfurnished / Semi / Full' },
    ],
  },
  'Co-Living': {
    helper: 'Add operational details for shared-living management.',
    fields: [
      { key: 'leaseTerm', label: 'LEASE TERM', placeholder: 'Monthly / 6 months / 1 year' },
      { key: 'communityManager', label: 'COMMUNITY MANAGER', placeholder: 'Manager or operator name' },
      { key: 'sharedSpaces', label: 'SHARED SPACES', placeholder: 'Lounge, kitchen, terrace' },
    ],
  },
  Villa: {
    helper: 'Capture the essentials for a floor-wise private house setup.',
    fields: [
      { key: 'parkingSlots', label: 'PARKING SLOTS', placeholder: '0' },
      { key: 'furnishing', label: 'FURNISHING', placeholder: 'Unfurnished / Semi / Full' },
      { key: 'gatedAccess', label: 'GATED ACCESS', placeholder: 'Yes / No / Security hours' },
    ],
  },
  Dormitory: {
    helper: 'Dormitories usually need exact bed counts and a supervisor.',
    fields: [
      { key: 'bedCount', label: 'TOTAL BEDS', placeholder: '0' },
      { key: 'lockerAvailable', label: 'LOCKER STORAGE', placeholder: 'Yes / No' },
      { key: 'supervisorName', label: 'SUPERVISOR NAME', placeholder: 'Supervisor or warden' },
    ],
  },
} as const;

type PropertyType = typeof propertyTypes[number];

export const RegisterPropertyScreen = () => {
  const navigation = useNavigation<any>();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedType, setSelectedType] = useState(0);
  const [propertyName, setPropertyName] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [address, setAddress] = useState('');
  const [baseRent, setBaseRent] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [totalRooms, setTotalRooms] = useState('');
  const [roomLabelPrefix, setRoomLabelPrefix] = useState('');
  const [maxOccupancyPerRoom, setMaxOccupancyPerRoom] = useState('');
  const [totalCapacity, setTotalCapacity] = useState('');
  const [sharingMix, setSharingMix] = useState<Record<(typeof sharingOptions)[number]['key'], string>>({
    single: '',
    double: '',
    triple: '',
    quad: '',
  });
  const [activeSharingTypes, setActiveSharingTypes] = useState<Array<(typeof sharingOptions)[number]['key']>>([]);
  const [caretakerName, setCaretakerName] = useState('');
  const [caretakerPhone, setCaretakerPhone] = useState('');
  const [buildingNotes, setBuildingNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [formMessage, setFormMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [propertySpecificDetails, setPropertySpecificDetails] = useState<Record<string, string>>({});
  const [selectedAmenities, setSelectedAmenities] = useState(
    amenities.map(a => a.selected)
  );

  const selectedPropertyType = propertyTypes[selectedType] as PropertyType;
  const propertyTypeConfig = propertyTypeConfigs[selectedPropertyType];

  const selectedAmenityNames = useMemo(
    () => amenities.filter((_, i) => selectedAmenities[i]).map(a => a.name),
    [selectedAmenities]
  );

  const isSharingMixProperty = selectedPropertyType === 'PG / Hostel';
  const parseCount = (value: string) => parseInt(value || '0', 10) || 0;

  const sharingTotals = useMemo(() => {
    const totalRoomsFromMix = sharingOptions.reduce((sum, option) => sum + parseCount(sharingMix[option.key]), 0);
    const totalCapacityFromMix = sharingOptions.reduce(
      (sum, option) => sum + parseCount(sharingMix[option.key]) * option.multiplier,
      0
    );
    const highestOccupancy = [...sharingOptions].reverse().find(option => parseCount(sharingMix[option.key]) > 0)?.multiplier || 1;
    return { totalRoomsFromMix, totalCapacityFromMix, highestOccupancy };
  }, [sharingMix]);

  const suggestedCapacity = useMemo(() => {
    if (isSharingMixProperty && sharingTotals.totalCapacityFromMix > 0) {
      return String(sharingTotals.totalCapacityFromMix);
    }
    const rooms = parseInt(totalRooms || '0', 10);
    const occupancy = parseInt(maxOccupancyPerRoom || '0', 10);
    if (!rooms || !occupancy) return '';
    return String(rooms * occupancy);
  }, [isSharingMixProperty, maxOccupancyPerRoom, sharingTotals.totalCapacityFromMix, totalRooms]);

  const derivedRoomsValue = isSharingMixProperty && sharingTotals.totalRoomsFromMix > 0
    ? String(sharingTotals.totalRoomsFromMix)
    : totalRooms;
  const derivedCapacityValue = isSharingMixProperty && sharingTotals.totalCapacityFromMix > 0
    ? String(sharingTotals.totalCapacityFromMix)
    : totalCapacity;
  const derivedMaxOccupancyValue = isSharingMixProperty
    ? String(sharingTotals.highestOccupancy)
    : maxOccupancyPerRoom;

  const detailsErrors = {
    propertyName: !propertyName.trim(),
    address: !address.trim(),
    baseRent: !baseRent.trim(),
    ownerName: !ownerName.trim(),
    ownerPhone: !ownerPhone.trim(),
  };

  const roomErrors = {
    totalFloors: !totalFloors.trim(),
    totalRooms: isSharingMixProperty ? sharingTotals.totalRoomsFromMix === 0 : !totalRooms.trim(),
    roomLabelPrefix: !roomLabelPrefix.trim(),
    maxOccupancyPerRoom: isSharingMixProperty ? false : !maxOccupancyPerRoom.trim(),
    totalCapacity: isSharingMixProperty ? sharingTotals.totalCapacityFromMix === 0 : !totalCapacity.trim(),
    caretakerName: !caretakerName.trim(),
    caretakerPhone: !caretakerPhone.trim(),
    buildingNotes: !buildingNotes.trim(),
  };

  const toggleAmenity = (index: number) => {
    const updated = [...selectedAmenities];
    updated[index] = !updated[index];
    setSelectedAmenities(updated);
  };

  const updatePropertySpecificField = (key: string, value: string) => {
    setPropertySpecificDetails(prev => ({ ...prev, [key]: value }));
  };

  const updateSharingMix = (key: (typeof sharingOptions)[number]['key'], value: string) => {
    setSharingMix(prev => ({ ...prev, [key]: value.replace(/[^0-9]/g, '') }));
  };

  const toggleSharingType = (key: (typeof sharingOptions)[number]['key']) => {
    setActiveSharingTypes(prev => {
      if (prev.includes(key)) {
        setSharingMix(current => ({ ...current, [key]: '' }));
        return prev.filter(item => item !== key);
      }
      return [...prev, key];
    });
  };

  const validateDetailsStep = () => {
    setAttemptedStep(0);
    if (Object.values(detailsErrors).some(Boolean)) {
      setFormMessage({ type: 'error', text: 'Please fill property name, address, base rent, owner name, and owner phone.' });
      return false;
    }
    setFormMessage(null);
    return true;
  };

  const validateRoomsStep = () => {
    setAttemptedStep(1);
    const missingSpecificField = propertyTypeConfig.fields.find(field => !propertySpecificDetails[field.key]?.trim());
    if (
      Object.values(roomErrors).some(Boolean) ||
      missingSpecificField
    ) {
      setFormMessage({
        type: 'error',
        text: missingSpecificField
          ? `Please fill ${missingSpecificField.label.toLowerCase()}.`
          : 'Please complete the room setup and accountability details.',
      });
      return false;
    }
    setFormMessage(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 0 && !validateDetailsStep()) return;
    if (currentStep === 1 && !validateRoomsStep()) return;
    setAttemptedStep(null);
    setFormMessage(null);
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setFormMessage(null);
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleRegister = async () => {
    if (!validateDetailsStep() || !validateRoomsStep()) {
      return;
    }

    setLoading(true);
    try {
      await propertyService.create({
        name: propertyName,
        address,
        property_type: selectedPropertyType,
        total_rooms: parseInt(derivedRoomsValue || '0', 10),
        total_floors: parseInt(totalFloors, 10),
        base_rent: parseFloat(baseRent),
        room_label_prefix: roomLabelPrefix,
        max_occupancy_per_room: parseInt(derivedMaxOccupancyValue || '1', 10),
        total_capacity: parseInt(derivedCapacityValue || '0', 10),
        owner_name: ownerName,
        owner_phone: ownerPhone,
        owner_email: ownerEmail,
        caretaker_name: caretakerName,
        caretaker_phone: caretakerPhone,
        building_notes: `Building: ${buildingName || propertyName}\n${buildingNotes}`,
        property_config: {
          buildingName,
          ...(isSharingMixProperty ? { sharingMix } : {}),
          ...propertySpecificDetails,
        },
        amenities: selectedAmenityNames,
      });
      setFormMessage({ type: 'success', text: 'Property registered successfully!' });
      Alert.alert('Success', 'Property registered successfully!');
      navigation.goBack();
    } catch (err: any) {
      const errorText = err?.message || err?.details || err?.hint || 'Failed to register property.';
      setFormMessage({ type: 'error', text: errorText });
      Alert.alert('Error', errorText);
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const showDetailsErrors = currentStep === 0 && attemptedStep === 0;
  const showRoomErrors = currentStep === 1 && attemptedStep === 1;
  const missingSpecificFieldKey = propertyTypeConfig.fields.find(field => !propertySpecificDetails[field.key]?.trim())?.key;

  const getInputStyle = (hasError: boolean) => [
    styles.textInput,
    hasError && styles.textInputError,
  ];

  const renderDetailsStep = () => (
    <>
      <Text style={styles.sectionTitle}>Property Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
        {propertyTypes.map((type, i) => (
          <TouchableOpacity
            key={type}
            onPress={() => setSelectedType(i)}
            style={[styles.typeChip, selectedType === i && styles.typeChipActive]}
          >
            <Text style={[styles.typeChipText, selectedType === i && styles.typeChipTextActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Basic Details</Text>
      <TonalCard level="lowest" style={styles.formCard}>
        <Text style={styles.helperText}>Keep the first step light. Add the room and floor breakdown on the next page.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>PROPERTY NAME</Text>
          <TextInput
            style={getInputStyle(showDetailsErrors && detailsErrors.propertyName)}
            placeholder="e.g. Sunrise Residency"
            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
            value={propertyName}
            onChangeText={setPropertyName}
          />
          {showDetailsErrors && detailsErrors.propertyName && <Text style={styles.errorText}>Property name is required.</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>BUILDING / BLOCK NAME</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Optional: Tower A, Block B"
            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
            value={buildingName}
            onChangeText={setBuildingName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>FULL ADDRESS</Text>
          <TextInput
            style={[...getInputStyle(showDetailsErrors && detailsErrors.address), styles.multilineInput]}
            placeholder="123, MG Road, Bangalore 560001"
            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
            value={address}
            onChangeText={setAddress}
            multiline
          />
          {showDetailsErrors && detailsErrors.address && <Text style={styles.errorText}>Address is required.</Text>}
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.flexOne]}>
            <Text style={styles.inputLabel}>BASE RENT (Rs)</Text>
            <TextInput
              style={getInputStyle(showDetailsErrors && detailsErrors.baseRent)}
              placeholder="0"
              placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
              value={baseRent}
              onChangeText={setBaseRent}
              keyboardType="numeric"
            />
            {showDetailsErrors && detailsErrors.baseRent && <Text style={styles.errorText}>Base rent is required.</Text>}
          </View>
          <View style={styles.rowGap} />
          <View style={[styles.inputGroup, styles.flexOne]}>
            <Text style={styles.inputLabel}>OWNER NAME</Text>
            <TextInput
              style={getInputStyle(showDetailsErrors && detailsErrors.ownerName)}
              placeholder="Owner full name"
              placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
              value={ownerName}
              onChangeText={setOwnerName}
            />
            {showDetailsErrors && detailsErrors.ownerName && <Text style={styles.errorText}>Owner name is required.</Text>}
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.flexOne]}>
            <Text style={styles.inputLabel}>OWNER PHONE</Text>
            <TextInput
              style={getInputStyle(showDetailsErrors && detailsErrors.ownerPhone)}
              placeholder="+91 98765 43210"
              placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
              value={ownerPhone}
              onChangeText={setOwnerPhone}
              keyboardType="phone-pad"
            />
            {showDetailsErrors && detailsErrors.ownerPhone && <Text style={styles.errorText}>Owner phone is required.</Text>}
          </View>
          <View style={styles.rowGap} />
          <View style={[styles.inputGroup, styles.flexOne]}>
            <Text style={styles.inputLabel}>OWNER EMAIL</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Optional"
              placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
              value={ownerEmail}
              onChangeText={setOwnerEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>
      </TonalCard>
    </>
  );

  const renderRoomsStep = () => (
    <>
      <Text style={styles.sectionTitle}>Room Details</Text>
      <TonalCard level="lowest" style={styles.formCard}>
        <Text style={styles.helperText}>{propertyTypeConfig.helper}</Text>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.flexOne]}>
            <Text style={styles.inputLabel}>TOTAL FLOORS</Text>
            <TextInput
              style={getInputStyle(showRoomErrors && roomErrors.totalFloors)}
              placeholder="0"
              placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
              value={totalFloors}
              onChangeText={setTotalFloors}
              keyboardType="numeric"
            />
            {showRoomErrors && roomErrors.totalFloors && <Text style={styles.errorText}>Total floors is required.</Text>}
          </View>
          <View style={styles.rowGap} />
          <View style={[styles.inputGroup, styles.flexOne]}>
            <Text style={styles.inputLabel}>TOTAL ROOMS</Text>
            {isSharingMixProperty ? (
              <View style={[styles.summaryStatCard, showRoomErrors && roomErrors.totalRooms && styles.summaryStatCardError]}>
                <Text style={styles.summaryStatValue}>{derivedRoomsValue || '0'}</Text>
                <Text style={styles.summaryStatLabel}>Auto-calculated from sharing mix</Text>
              </View>
            ) : (
              <TextInput
                style={getInputStyle(showRoomErrors && roomErrors.totalRooms)}
                placeholder="0"
                placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                value={totalRooms}
                onChangeText={setTotalRooms}
                keyboardType="numeric"
              />
            )}
            {showRoomErrors && roomErrors.totalRooms && (
              <Text style={styles.errorText}>
                {isSharingMixProperty ? 'Add at least one sharing room count.' : 'Total rooms is required.'}
              </Text>
            )}
          </View>
        </View>

        {isSharingMixProperty && (
          <>
            <Text style={styles.subsectionTitle}>Sharing Mix</Text>
            <Text style={styles.helperText}>Tap a sharing type, then enter how many rooms belong to that type.</Text>
            <View style={styles.sharingTypeRow}>
              {sharingOptions.map(option => {
                const isActive = activeSharingTypes.includes(option.key);
                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => toggleSharingType(option.key)}
                    style={[styles.sharingTypeChip, isActive && styles.sharingTypeChipActive]}
                  >
                    <Text style={[styles.sharingTypeChipText, isActive && styles.sharingTypeChipTextActive]}>
                      {option.multiplier}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.sharingInputStack}>
              {activeSharingTypes.map(key => {
                const option = sharingOptions.find(item => item.key === key)!;
                return (
                  <View key={option.key} style={styles.sharingPromptCard}>
                    <Text style={styles.sharingPromptTitle}>How many {option.label.toLowerCase()} rooms?</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="0"
                      placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                      value={sharingMix[option.key]}
                      onChangeText={(value) => updateSharingMix(option.key, value)}
                      keyboardType="numeric"
                    />
                    <Text style={styles.sharingHint}>Each room adds {option.multiplier} bed{option.multiplier > 1 ? 's' : ''} to capacity.</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStatCard}>
                <Text style={styles.summaryStatValue}>{derivedRoomsValue || '0'}</Text>
                <Text style={styles.summaryStatLabel}>Total Rooms</Text>
              </View>
              <View style={styles.summaryStatCard}>
                <Text style={styles.summaryStatValue}>{derivedCapacityValue || '0'}</Text>
                <Text style={styles.summaryStatLabel}>Total Capacity</Text>
              </View>
              <View style={styles.summaryStatCard}>
                <Text style={styles.summaryStatValue}>{derivedMaxOccupancyValue}</Text>
                <Text style={styles.summaryStatLabel}>Highest Sharing</Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.flexOne]}>
            <Text style={styles.inputLabel}>ROOM NUMBER PREFIX</Text>
            <TextInput
              style={getInputStyle(showRoomErrors && roomErrors.roomLabelPrefix)}
              placeholder="A / B / FLR-"
              placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
              value={roomLabelPrefix}
              onChangeText={setRoomLabelPrefix}
            />
            {showRoomErrors && roomErrors.roomLabelPrefix && <Text style={styles.errorText}>Room prefix is required.</Text>}
          </View>
          <View style={styles.rowGap} />
          <View style={[styles.inputGroup, styles.flexOne]}>
            <Text style={styles.inputLabel}>{isSharingMixProperty ? 'HIGHEST SHARING' : 'MAX STAY PER ROOM'}</Text>
            {isSharingMixProperty ? (
              <View style={styles.summaryStatCard}>
                <Text style={styles.summaryStatValue}>{derivedMaxOccupancyValue}</Text>
                <Text style={styles.summaryStatLabel}>Auto from sharing mix</Text>
              </View>
            ) : (
              <TextInput
                style={getInputStyle(showRoomErrors && roomErrors.maxOccupancyPerRoom)}
                placeholder="0"
                placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                value={maxOccupancyPerRoom}
                onChangeText={setMaxOccupancyPerRoom}
                keyboardType="numeric"
              />
            )}
            {showRoomErrors && roomErrors.maxOccupancyPerRoom && <Text style={styles.errorText}>Max stay per room is required.</Text>}
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.flexOne]}>
            <Text style={styles.inputLabel}>TOTAL CAPACITY</Text>
            {isSharingMixProperty ? (
              <View style={[styles.summaryStatCard, showRoomErrors && roomErrors.totalCapacity && styles.summaryStatCardError]}>
                <Text style={styles.summaryStatValue}>{derivedCapacityValue || '0'}</Text>
                <Text style={styles.summaryStatLabel}>Auto-calculated from sharing mix</Text>
              </View>
            ) : (
              <TextInput
                style={getInputStyle(showRoomErrors && roomErrors.totalCapacity)}
                placeholder={suggestedCapacity || 'How many people can stay'}
                placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                value={totalCapacity}
                onChangeText={setTotalCapacity}
                keyboardType="numeric"
              />
            )}
            {showRoomErrors && roomErrors.totalCapacity && <Text style={styles.errorText}>Total capacity is required.</Text>}
          </View>
          <View style={styles.rowGap} />
          <View style={[styles.inputGroup, styles.flexOne]}>
            <Text style={styles.inputLabel}>CARETAKER / MANAGER</Text>
            <TextInput
              style={getInputStyle(showRoomErrors && roomErrors.caretakerName)}
              placeholder="Manager or caretaker name"
              placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
              value={caretakerName}
              onChangeText={setCaretakerName}
            />
            {showRoomErrors && roomErrors.caretakerName && <Text style={styles.errorText}>Caretaker name is required.</Text>}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>CARETAKER PHONE</Text>
          <TextInput
            style={getInputStyle(showRoomErrors && roomErrors.caretakerPhone)}
            placeholder="+91 98765 43210"
            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
            value={caretakerPhone}
            onChangeText={setCaretakerPhone}
            keyboardType="phone-pad"
          />
          {showRoomErrors && roomErrors.caretakerPhone && <Text style={styles.errorText}>Caretaker phone is required.</Text>}
        </View>

        <Text style={styles.subsectionTitle}>Building-Specific Details</Text>
        {propertyTypeConfig.fields.map(field => (
          <View style={styles.inputGroup} key={field.key}>
            <Text style={styles.inputLabel}>{field.label}</Text>
            <TextInput
              style={getInputStyle(showRoomErrors && missingSpecificFieldKey === field.key)}
              placeholder={field.placeholder}
              placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
              value={propertySpecificDetails[field.key] || ''}
              onChangeText={(value) => updatePropertySpecificField(field.key, value)}
            />
            {showRoomErrors && missingSpecificFieldKey === field.key && <Text style={styles.errorText}>{field.label} is required.</Text>}
          </View>
        ))}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>ROOM / BUILDING NOTES</Text>
          <TextInput
            style={[...getInputStyle(showRoomErrors && roomErrors.buildingNotes), styles.largeMultilineInput]}
            placeholder="Room numbering logic, entry rules, document checks, water timing, or owner instructions."
            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
            value={buildingNotes}
            onChangeText={setBuildingNotes}
            multiline
          />
          {showRoomErrors && roomErrors.buildingNotes && <Text style={styles.errorText}>Room or building notes are required.</Text>}
        </View>
      </TonalCard>
    </>
  );

  const renderAmenitiesStep = () => (
    <>
      <Text style={styles.sectionTitle}>Amenities</Text>
      <View style={styles.amenitiesGrid}>
        {amenities.map((amenity, i) => (
          <TouchableOpacity
            key={amenity.name}
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
    </>
  );

  const renderReviewStep = () => (
    <>
      <Text style={styles.sectionTitle}>Review</Text>
      <TonalCard level="lowest" style={styles.formCard}>
        <Text style={styles.subsectionTitle}>Basic</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Type</Text>
          <Text style={styles.summaryValue}>{selectedPropertyType}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Property</Text>
          <Text style={styles.summaryValue}>{propertyName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Building</Text>
          <Text style={styles.summaryValue}>{buildingName || 'Not specified'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Rent</Text>
          <Text style={styles.summaryValue}>Rs {baseRent || '0'}</Text>
        </View>

        <Text style={styles.subsectionTitle}>Rooms</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Floors</Text>
          <Text style={styles.summaryValue}>{totalFloors}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Rooms</Text>
          <Text style={styles.summaryValue}>{derivedRoomsValue}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Capacity</Text>
          <Text style={styles.summaryValue}>{derivedCapacityValue}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Caretaker</Text>
          <Text style={styles.summaryValue}>{caretakerName}</Text>
        </View>
        {isSharingMixProperty && (
          <>
            <Text style={styles.subsectionTitle}>Sharing Mix</Text>
            <Text style={styles.reviewText}>
              {sharingOptions
                .filter(option => parseCount(sharingMix[option.key]) > 0)
                .map(option => `${option.label}: ${sharingMix[option.key]} room(s)`)
                .join(', ') || 'No sharing mix added'}
            </Text>
          </>
        )}

        <Text style={styles.subsectionTitle}>Amenities</Text>
        <Text style={styles.reviewText}>
          {selectedAmenityNames.length ? selectedAmenityNames.join(', ') : 'No amenities selected'}
        </Text>

        <Text style={styles.subsectionTitle}>Property Photos</Text>
        <TouchableOpacity style={styles.uploadArea}>
          <Ionicons name="cloud-upload-outline" size={40} color={theme.colors.primary} />
          <Text style={styles.uploadTitle}>Upload Property Images</Text>
          <Text style={styles.uploadSubtitle}>Tap to select photos or take new ones</Text>
        </TouchableOpacity>
      </TonalCard>
    </>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderDetailsStep();
      case 1:
        return renderRoomsStep();
      case 2:
        return renderAmenitiesStep();
      case 3:
      default:
        return renderReviewStep();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Register Property</Text>
            <Text style={styles.subtitle}>NEW ESTATE ONBOARDING</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          {steps.map((step, i) => (
            <View key={step} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  i === currentStep && styles.progressDotActive,
                  i < currentStep && styles.progressDotDone,
                ]}
              >
                <Text
                  style={[
                    styles.progressDotText,
                    (i === currentStep || i < currentStep) && styles.progressDotTextActive,
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
              <Text style={[styles.progressLabel, i === currentStep && styles.progressLabelActive]}>{step}</Text>
            </View>
          ))}
        </View>

        {renderStepContent()}

        {formMessage && (
          <View style={[styles.messageBanner, formMessage.type === 'error' ? styles.messageError : styles.messageSuccess]}>
            <Ionicons
              name={formMessage.type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
              size={18}
              color={formMessage.type === 'error' ? theme.colors.danger : theme.colors.secondary}
            />
            <Text style={[styles.messageText, formMessage.type === 'error' ? styles.messageTextError : styles.messageTextSuccess]}>
              {formMessage.text}
            </Text>
          </View>
        )}

        <View style={styles.footerActions}>
          {currentStep > 0 && (
            <RentifyButton
              title="Back"
              onPress={handleBack}
              variant="glass"
              style={[styles.footerButton, styles.secondaryFooterButton]}
            />
          )}
          {currentStep < steps.length - 1 ? (
            <RentifyButton
              title={currentStep === 0 ? 'Continue to Rooms' : 'Continue'}
              onPress={handleNext}
              style={styles.footerButton}
            />
          ) : (
            <RentifyButton
              title={loading ? 'Registering...' : 'Register Property'}
              onPress={handleRegister}
              disabled={loading}
              style={styles.footerButton}
            />
          )}
        </View>

        {currentStep === 0 && (
          <RentifyButton
            title="Save as Draft"
            onPress={() => Alert.alert('Draft Saved', 'Property draft saved locally for review.')}
            variant="glass"
            style={{ marginBottom: 40 }}
          />
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    ...theme.elevation.floating,
  },
  progressStep: { alignItems: 'center', flex: 1 },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: theme.colors.primary },
  progressDotDone: { backgroundColor: theme.colors.secondary },
  progressDotText: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant },
  progressDotTextActive: { color: theme.colors.onPrimary },
  progressLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, marginTop: 6 },
  progressLabelActive: { color: theme.colors.primary },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  subsectionTitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 16, color: theme.colors.onSurface, marginBottom: theme.spacing.sm, marginTop: theme.spacing.sm },
  helperText: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.md },
  typeScroll: { marginBottom: theme.spacing.xl },
  typeChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 24,
    marginRight: 10,
  },
  typeChipActive: { backgroundColor: theme.colors.primary },
  typeChipText: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant },
  typeChipTextActive: { color: theme.colors.onPrimary },
  formCard: { padding: theme.spacing.xl, marginBottom: theme.spacing.xl },
  inputGroup: { marginBottom: theme.spacing.lg },
  inputLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: 8 },
  textInput: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 16,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  textInputError: {
    borderBottomColor: theme.colors.danger,
    borderBottomWidth: 2,
  },
  multilineInput: { minHeight: 60 },
  largeMultilineInput: { minHeight: 90, textAlignVertical: 'top' },
  errorText: {
    marginTop: 6,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.danger,
  },
  inputRow: { flexDirection: 'row' },
  flexOne: { flex: 1 },
  rowGap: { width: 16 },
  sharingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  sharingTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  sharingTypeChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  sharingTypeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sharingTypeChipText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 15,
    color: theme.colors.onSurface,
  },
  sharingTypeChipTextActive: {
    color: theme.colors.onPrimary,
  },
  sharingInputStack: {
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  sharingCard: {
    width: '48%',
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 8,
    padding: theme.spacing.md,
    ...theme.elevation.floating,
  },
  sharingTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 13,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },
  sharingHint: {
    marginTop: 6,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  sharingPromptCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 8,
    padding: theme.spacing.md,
    ...theme.elevation.floating,
  },
  sharingPromptTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  summaryStatCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 8,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  summaryStatCardError: {
    borderColor: theme.colors.danger,
  },
  summaryStatValue: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 20,
    color: theme.colors.onSurface,
  },
  summaryStatLabel: {
    marginTop: 4,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: theme.spacing.xl },
  amenityCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.floating,
  },
  amenityCardActive: { backgroundColor: theme.colors.occupiedBg },
  amenityText: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 6 },
  amenityTextActive: { color: theme.colors.primary },
  amenityCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadArea: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.outlineVariant + '26',
    borderStyle: 'dashed',
    marginBottom: theme.spacing.md,
  },
  uploadTitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 16, color: theme.colors.onSurface, marginTop: 12 },
  uploadSubtitle: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  summaryLabel: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant },
  summaryValue: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onSurface, flexShrink: 1, textAlign: 'right' },
  reviewText: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant, lineHeight: 20 },
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  messageError: {
    backgroundColor: '#fdecec',
  },
  messageSuccess: {
    backgroundColor: '#e8f7ef',
  },
  messageText: {
    flex: 1,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
  },
  messageTextError: {
    color: theme.colors.danger,
  },
  messageTextSuccess: {
    color: theme.colors.secondary,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  footerButton: { flex: 1 },
  secondaryFooterButton: { flex: 0.6 },
});
