import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { propertyService, tenantService } from '../../services/dataService';
import { theme } from '../../theme/theme';

export const AddTenantScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialRoom = route.params?.initialRoom || '';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [room, setRoom] = useState(initialRoom);
  const [block, setBlock] = useState('Block A');
  const [rent, setRent] = useState('');
  const [advance, setAdvance] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('5');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [validRooms, setValidRooms] = useState<string[]>([]);
  const [roomCapacities, setRoomCapacities] = useState<Record<string, number>>({});

  React.useEffect(() => {
    const fetchProps = async () => {
      try {
        const props = await propertyService.getMyProperties();
        if (props && props.length > 0) {
          const prop = props[0];
          setPropertyId(prop.id);
          const config = prop.property_config || {};
          const sharingMix = config.sharingMix || null;
          const totalRoomsCount = prop.total_rooms || 0;
          const prefix = prop.room_label_prefix || '';
          const labels: string[] = [];
          const capacities: Record<string, number> = {};

          if (sharingMix) {
            let counter = 1;
            const sharingOptions = [{ key: 'single', max: 1 }, { key: 'double', max: 2 }, { key: 'triple', max: 3 }, { key: 'quad', max: 4 }];
            sharingOptions.forEach((option) => {
              const count = parseInt(sharingMix[option.key] || '0', 10);
              for (let i = 0; i < count; i++) {
                const label = `${prefix}${counter++}`;
                labels.push(label);
                capacities[label] = option.max;
              }
            });
          } else {
            const maxOcc = prop.max_occupancy_per_room || 1;
            for (let i = 1; i <= totalRoomsCount; i++) {
              const label = `${prefix}${i}`;
              labels.push(label);
              capacities[label] = maxOcc;
            }
          }
          setValidRooms(labels);
          setRoomCapacities(capacities);
        }
      } catch (err) {
        console.log('Error fetching properties:', err);
      }
    };
    fetchProps();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !room.trim() || !propertyId) {
      Alert.alert('Missing Details', 'Tenant name and room are required.');
      return;
    }

    if (validRooms.length > 0 && !validRooms.includes(room.trim())) {
      Alert.alert('Invalid Room', `Room "${room.trim()}" does not exist in this property.`);
      return;
    }

    setSaving(true);
    try {
      const dueDay = parseInt(paymentDueDay, 10);
      await tenantService.create({
        property_id: propertyId, name: name.trim(), phone: phone.trim(), email: email.trim().toLowerCase(),
        room: room.trim(), block: block.trim(), rent_amount: Number(rent) || 0,
        advance_amount: Number(advance) || 0, payment_due_day: dueDay, status: 'occupied',
      });
      setSaved(true);
      setTimeout(() => navigation.goBack(), 1000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not add tenant');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Onboard Tenant</Text>
            <Text style={styles.subtitle}>Add a new resident</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput style={styles.input} placeholder="e.g. Aakash Mehta" value={name} onChangeText={setName} />

          <Text style={styles.label}>CONTACT DETAILS</Text>
          <View style={styles.row}>
            <TextInput style={[styles.input, { flex: 1.2 }]} placeholder="Phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Ionicons name="home-outline" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>Room Allocation</Text>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>ROOM NO</Text>
              <TextInput style={styles.input} placeholder="e.g. R101" value={room} onChangeText={setRoom} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>BLOCK</Text>
              <TextInput style={styles.input} placeholder="Block A" value={block} onChangeText={setBlock} />
            </View>
          </View>
          
          {validRooms.length > 0 && (
            <Text style={styles.hint}>Property contains rooms {validRooms[0]} to {validRooms[validRooms.length - 1]}</Text>
          )}

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>Financials</Text>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>MONTHLY RENT</Text>
              <TextInput style={styles.input} placeholder="₹" keyboardType="numeric" value={rent} onChangeText={setRent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>ADVANCE</Text>
              <TextInput style={styles.input} placeholder="₹" keyboardType="numeric" value={advance} onChangeText={setAdvance} />
            </View>
          </View>

          <Text style={styles.label}>RENT DUE DAY</Text>
          <TextInput style={styles.input} placeholder="e.g. 5" keyboardType="numeric" value={paymentDueDay} onChangeText={setPaymentDueDay} />
          <Text style={styles.hint}>Rent collection reminders will be sent on this day of each month.</Text>

          <TouchableOpacity 
            style={[styles.submitBtn, (saving || saved) && styles.disabledBtn]} 
            onPress={handleSave} 
            disabled={saving || saved}
          >
            {saved ? (
              <Ionicons name="checkmark" size={24} color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>{saving ? 'Onboarding...' : 'Complete Onboarding'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, marginTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  formCard: { backgroundColor: '#fff', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#f1f5f9', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  label: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, fontSize: 15, color: '#1e293b', marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  row: { flexDirection: 'row', gap: 12 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 24 },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: -10, marginBottom: 16 },
  submitBtn: { backgroundColor: '#4f46e5', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, elevation: 8, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 10 },
  disabledBtn: { backgroundColor: '#cbd5e1', elevation: 0 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});
