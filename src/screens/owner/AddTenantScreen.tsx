import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { TonalCard } from '../../components/ui/TonalCard';
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  React.useEffect(() => {
    const fetchProps = async () => {
      try {
        const props = await propertyService.getMyProperties();
        if (props && props.length > 0) {
          setPropertyId(props[0].id);
        }
      } catch (err) {
        console.log('Error fetching properties for add tenant:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProps();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !room.trim()) {
      Alert.alert('Missing Details', 'Tenant name and room are required.');
      return;
    }

    setSaving(true);
    setSaved(false);
    setErrorText('');
    try {
      if (!propertyId) {
        throw new Error('No property found to add tenant to. Please register a property first.');
      }

      await tenantService.create({
        property_id: propertyId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        room: room.trim(),
        block: block.trim(),
        rent_amount: Number(rent) || 0,
        advance_amount: Number(advance) || 0,
        status: 'occupied',
      });
      setSaved(true);
      setTimeout(() => navigation.goBack(), 900);
    } catch (error: any) {
      console.log('Add tenant error:', error);
      setErrorText(error.message || error.details || error.hint || 'Please try again.');
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
            <Text style={styles.title}>Add Tenant</Text>
            <Text style={styles.subtitle}>RESIDENT ONBOARDING</Text>
          </View>
        </View>

        <TonalCard level="lowest" style={styles.card}>
          <Text style={styles.sectionTitle}>Tenant Details</Text>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} placeholder="e.g. Aakash Mehta" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} value={name} onChangeText={setName} />

          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} placeholder="+91 98765 43210" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="tenant@example.com" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Room</Text>
              <TextInput style={styles.input} placeholder="304B" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} value={room} onChangeText={setRoom} />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Block</Text>
              <TextInput style={styles.input} placeholder="Block A" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} value={block} onChangeText={setBlock} />
            </View>
          </View>

          <Text style={styles.label}>Monthly Rent</Text>
          <TextInput style={styles.input} placeholder="12500" placeholderTextColor={theme.colors.onSurfaceVariant + '88'} keyboardType="numeric" value={rent} onChangeText={setRent} />

          <Text style={styles.label}>Advance Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="25000"
            placeholderTextColor={theme.colors.onSurfaceVariant + '88'}
            keyboardType="numeric"
            value={advance}
            onChangeText={setAdvance}
          />

          {saved ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.secondary} />
              <Text style={styles.successText}>Saved. Returning to tenant list...</Text>
            </View>
          ) : null}

          {errorText ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.danger} />
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          ) : null}

          <RentifyButton
            title={saved ? 'Saved' : saving ? 'Saving Tenant...' : 'Add Tenant'}
            onPress={handleSave}
            disabled={saving || saved}
            style={styles.submit}
          />
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
  input: { height: 50, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.lg, fontFamily: theme.typography.body.fontFamily, color: theme.colors.onSurface },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.vacantBg,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  successText: {
    flex: 1,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.vacantText,
    marginLeft: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee4e2',
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    flex: 1,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.danger,
    marginLeft: 8,
  },
  submit: { marginTop: theme.spacing.sm },
});
