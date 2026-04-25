import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { TonalCard } from '../../components/ui/TonalCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { tenantService } from '../../services/dataService'; 

type TenantAccountScreenProps = {
  navigation?: any;
  onTenantAccess?: (tenantData?: any) => void;
};

export const TenantAccountScreen = ({ navigation, onTenantAccess }: TenantAccountScreenProps) => {
  const [room, setRoom] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTenantAccess = async () => {
    if (!room.trim() || !phone.trim()) {
      Alert.alert('Missing Details', 'Enter your room and registered phone number.');
      return;
    }

    setLoading(true);
    try {
      const matchedTenant = await tenantService.findTenant(room.trim(), phone.trim());

      if (matchedTenant) {
        if (matchedTenant.status === 'pending') {
           Alert.alert('Wait for Approval', 'Your registration was submitted successfully and is waiting for owner approval.');
        } else {
           onTenantAccess?.(matchedTenant);
        }
      } else {
        Alert.alert('Access Denied', 'No active tenant found with that room and phone combination.');
      }
    } catch (e: any) {
      console.log('Login error:', e);
      Alert.alert('Access Error', 'Unable to verify your account. Please ensure your Room and Phone are correct and that you have registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation?.navigate('OwnerLogin');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={21} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.brand}>Estate Residence</Text>
          </View>

          <TonalCard level="low" style={styles.heroCard} floating={false}>
            <Text style={styles.heroEyebrow}>Active Resident</Text>
            <Text style={styles.heroTitle}>Tenant Account</Text>
            <Text style={styles.heroText}>Access rent dues, meals, documents, notices, and support from one resident portal.</Text>
          </TonalCard>

          <TonalCard level="lowest" style={styles.formCard}>
            <View style={styles.formHeader}>
              <View>
                <Text style={styles.formTitle}>Resident Access</Text>
                <Text style={styles.formSubtitle}>Use the same room and phone you submitted during registration</Text>
              </View>
              <StatusBadge status="occupied" label="Secure" />
            </View>

            <View style={styles.infoBanner}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                After the owner approves your request, Rentify verifies your room and phone from Supabase before opening your tenant portal.
              </Text>
            </View>

            <Text style={styles.label}>Room / Suite</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter the same room you registered"
              placeholderTextColor={theme.colors.onSurfaceVariant + '99'}
              value={room}
              onChangeText={setRoom}
            />

            <Text style={styles.label}>Registered Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter the same phone you registered"
              placeholderTextColor={theme.colors.onSurfaceVariant + '99'}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <RentifyButton
              title={loading ? 'Opening Portal...' : 'Enter Tenant Portal'}
              onPress={handleTenantAccess}
              disabled={loading}
              style={styles.submitButton}
            />
          </TonalCard>

          <TouchableOpacity style={styles.joinCard} onPress={() => navigation?.navigate('TenantJoin')} activeOpacity={0.8}>
             <View style={styles.joinIcon}>
                <Ionicons name="qr-code-outline" size={20} color={theme.colors.primaryContainer} />
             </View>
             <View style={styles.joinTextWrap}>
                <Text style={styles.joinTitle}>New Resident? Join Property</Text>
                <Text style={styles.joinSub}>Use a property invite code to register.</Text>
             </View>
             <Ionicons name="chevron-forward" size={18} color={theme.colors.onSurface} style={{ opacity: 0.5 }}/>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  container: { padding: theme.spacing.lg, paddingBottom: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brand: { fontFamily: theme.typography.label.fontFamily, fontSize: 17, color: theme.colors.primary },
  heroCard: { backgroundColor: theme.colors.primary, marginBottom: theme.spacing.lg },
  heroEyebrow: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    color: theme.colors.mint,
    textTransform: 'uppercase',
  },
  heroTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 36, color: theme.colors.onPrimary, marginTop: 10 },
  heroText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.onPrimary,
    opacity: 0.78,
    marginTop: 10,
  },
  formCard: { padding: theme.spacing.xl },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.xl },
  formTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 24, color: theme.colors.onSurface },
  formSubtitle: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: theme.colors.occupiedBg,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  infoText: {
    flex: 1,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.onSurfaceVariant,
  },
  label: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 15,
    color: theme.colors.onSurface,
  },
  submitButton: { marginTop: 4 },
  joinCard: { 
    marginTop: theme.spacing.lg, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.colors.surfaceContainerLowest, 
    borderWidth: 1, 
    borderColor: theme.colors.outlineVariant + '44', 
    borderRadius: 16, 
    padding: 16 
  },
  joinIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: theme.colors.onSurface, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 14 
  },
  joinTextWrap: { flex: 1 },
  joinTitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onSurface },
  joinSub: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 3 },
});
