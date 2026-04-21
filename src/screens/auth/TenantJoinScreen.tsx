import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { TonalCard } from '../../components/ui/TonalCard';
import { propertyService } from '../../services/dataService';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';

const extractInviteCode = (rawValue: string) => {
  const normalized = rawValue.trim().toUpperCase();
  const matched = normalized.match(/RNT-[A-Z0-9]+/);
  if (matched) return matched[0];
  if (normalized.length >= 4 && normalized.length <= 12 && !normalized.includes('-')) {
    return `RNT-${normalized}`;
  }
  return normalized;
};

export default function TenantJoinScreen() {
  const navigation = useNavigation<any>();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleVerify = async (manualCode?: string) => {
    const codeToVerify = manualCode || code;
    const normalizedCode = extractInviteCode(codeToVerify);

    if (normalizedCode.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid property invite code.');
      return;
    }

    setVerifying(true);
    try {
      const property = await propertyService.getByInviteCode(normalizedCode);

      if (!property || property.status !== 'active') {
        Alert.alert('Code Not Found', 'This invite code is invalid or inactive.');
        setIsScanning(false);
        return;
      }

      setIsScanning(false);
      navigation.navigate('TenantRegistration', {
        propertyCode: property.invite_code,
        propertyId: property.id,
        propertyName: property.name,
      });
    } catch (error: any) {
      const message = error?.message || 'Unable to verify the invite code.';
      Alert.alert('Error', message);
    } finally {
      setVerifying(false);
    }
  };

  const startScanner = async () => {
    if (!permission || !permission.granted) {
        const result = await requestPermission();
        if (!result.granted) {
            Alert.alert('Permission Denied', 'Camera access is required to scan QR codes.');
            return;
        }
    }
    setIsScanning(true);
  };

  const onBarCodeScanned = ({ data }: { data: string }) => {
    if (verifying || !data) return;
    
    if (data.startsWith('RENTIFY_JOIN:')) {
      const fullCode = data.split(':')[1].split('|')[0];
      handleVerify(fullCode);
    } else {
      handleVerify(data);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.brand}>Estate Residence</Text>
          </View>

          <TonalCard level="low" style={styles.heroCard} floating={false}>
            <Text style={styles.heroEyebrow}>New Resident</Text>
            <Text style={styles.heroTitle}>Join a Property</Text>
            <Text style={styles.heroText}>Scan the QR code provided by your property manager or enter the invite code manually.</Text>
          </TonalCard>

          <TonalCard level="lowest" style={styles.formCard}>
            <View style={styles.qrPlaceholder}>
              {isScanning ? (
                <View style={styles.cameraOuter}>
                    <View style={styles.cameraContainer}>
                        <CameraView
                            style={StyleSheet.absoluteFill}
                            onBarcodeScanned={onBarCodeScanned}
                            barcodeScannerSettings={{
                                barcodeTypes: ['qr'],
                            }}
                        />
                        <View style={styles.scanOverlay}>
                            <View style={styles.scannerLine} />
                        </View>
                    </View>
                    <TouchableOpacity style={styles.closeScanner} onPress={() => setIsScanning(false)}>
                        <Ionicons name="close-circle" size={36} color="white" />
                    </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.scanIconArea}>
                    <Ionicons name="scan-outline" size={60} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.qrCodeText}>SCAN PROPERTY QR</Text>
                  <RentifyButton 
                    title="Open Scanner" 
                    variant="secondary" 
                    style={styles.scanBtn} 
                    onPress={startScanner} 
                  />
                </>
              )}
            </View>

            <View style={styles.tipCard}>
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.tipText}>
                If you received a QR screenshot, you can still enter the invite code shown below it.
              </Text>
            </View>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>ENTER INVITE CODE</Text>
              <View style={styles.line} />
            </View>

            <Text style={styles.label}>Property Invite Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Paste code or QR text"
              placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
              autoCapitalize="characters"
              value={code}
              onChangeText={(value) => setCode(extractInviteCode(value))}
            />

            <RentifyButton title={verifying ? 'Verifying...' : 'Verify Code'} onPress={handleVerify} disabled={verifying} />

            <View style={styles.stepsWrap}>
              <Text style={styles.stepsTitle}>How it works</Text>
              <Text style={styles.stepLine}>1. Get the QR or invite code from the property owner.</Text>
              <Text style={styles.stepLine}>2. Verify the property and fill your application details.</Text>
            </View>
          </TonalCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl },
  backBtn: { width: 38, height: 38, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  brand: { fontFamily: theme.typography.label.fontFamily, fontSize: 17, color: theme.colors.primary },
  heroCard: { backgroundColor: theme.colors.primaryContainer, marginBottom: theme.spacing.lg, padding: 24, borderRadius: 24 },
  heroEyebrow: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onPrimaryContainer, letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 32, color: theme.colors.onPrimaryContainer, marginTop: 10 },
  heroText: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, lineHeight: 22, color: theme.colors.onPrimaryContainer, marginTop: 10, opacity: 0.8 },
  formCard: { padding: theme.spacing.xl },
  qrPlaceholder: { alignItems: 'center', marginVertical: theme.spacing.lg, width: '100%' },
  qrCodeText: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  scanBtn: { marginTop: 16, minWidth: 180 },
  scanIconArea: { width: 160, height: 160, borderRadius: 28, backgroundColor: theme.colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: theme.colors.primary + '33' },
  cameraOuter: { width: '100%', alignItems: 'center' },
  cameraContainer: { 
    width: '100%', 
    maxWidth: 320, 
    aspectRatio: 1, 
    borderRadius: 24, 
    overflow: 'hidden', 
    backgroundColor: 'black',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scannerLine: {
    width: '80%',
    height: 2,
    backgroundColor: theme.colors.primary,
    opacity: 0.6,
  },
  closeScanner: { 
    marginTop: 16,
    padding: 8,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: theme.colors.occupiedBg,
    borderRadius: 12,
    padding: theme.spacing.md,
  },
  tipText: {
    flex: 1,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.onSurfaceVariant,
  },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing.xl },
  line: { flex: 1, height: 1, backgroundColor: theme.colors.outlineVariant + '44' },
  dividerText: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, paddingHorizontal: 16, letterSpacing: 1 },
  label: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 8 },
  input: { height: 50, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.xl, fontFamily: theme.typography.headline.fontFamily, fontSize: 18, color: theme.colors.onSurface, textAlign: 'center', letterSpacing: 2 },
  stepsWrap: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant + '55',
    gap: 6,
  },
  stepsTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  stepLine: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.onSurfaceVariant,
  },
});
