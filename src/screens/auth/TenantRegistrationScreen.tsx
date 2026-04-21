import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { TonalCard } from '../../components/ui/TonalCard';
import { tenantService } from '../../services/dataService';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../utils/supabase';

export default function TenantRegistrationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const propertyCode = route.params?.propertyCode || 'UNKNOWN';
  const propertyId = route.params?.propertyId || 'a0000000-0000-0000-0000-000000000001';
  const propertyName = route.params?.propertyName || 'Selected Property';

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    room: '',
    block: '',
    advance: '',
  });
  const [aadhaarId, setAadhaarId] = useState('');
  const [aadhaarFront, setAadhaarFront] = useState<{ uri: string; base64?: string } | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<{ uri: string; base64?: string } | null>(null);
  const [tenantPhoto, setTenantPhoto] = useState<{ uri: string; base64?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'ok' | 'failed'>('testing');

  React.useEffect(() => {
    // Check if we can reach Supabase at all
    const checkConn = async () => {
      try {
        const { error } = await supabase.from('properties').select('count', { count: 'exact', head: true }).limit(1);
        if (error) throw error;
        setConnectionStatus('ok');
      } catch (e) {
        console.error('Supabase connectivity check failed:', e);
        setConnectionStatus('failed');
      }
    };
    checkConn();
  }, []);

  const updateForm = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const pickImage = async (setter: (data: { uri: string; base64?: string }) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos to upload documents.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      setter({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64 || undefined
      });
    }
  };

  const uploadImage = async (imageData: { uri: string; base64?: string }, path: string) => {
    try {
      let uploadData: any;
      
      if (imageData.base64) {
          const binary = atob(imageData.base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          uploadData = bytes.buffer;
      } else {
          const response = await fetch(imageData.uri);
          uploadData = await response.arrayBuffer();
      }
      
      // Attempt upload 1: Library method
      const { error, data } = await supabase.storage.from('tenant-docs').upload(path, uploadData, { 
        upsert: true,
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });

      if (error) {
        // If library fails with network error, it might be the library's internal fetch handling.
        // We'll throw and handle it in the catch block where we could try a raw fetch if needed,
        // but first let's provide a very clear error message.
        if (error.message.toLowerCase().includes('network request failed')) {
            throw new Error('The storage server is unreachable. Please ensure you have created a "tenant-docs" bucket in Supabase and set its policies to Public.');
        }
        throw error;
      }
      
      const { data: urlData } = supabase.storage.from('tenant-docs').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) {
      console.error('Upload Error 상세:', err);
      throw new Error(`Upload Failed: ${err.message}`);
    }
  };

  const handleSubmit = async () => {
    if (connectionStatus === 'failed') {
      Alert.alert('Connection Error', 'Cannot reach Supabase. Please check your internet or Supabase URL configuration.');
      return;
    }

    if (!propertyId) {
      Alert.alert('Missing Property', 'Please verify your invite code again before submitting.');
      return;
    }

    if (!form.name || !form.phone || !form.room) {
      Alert.alert('Missing Info', 'Please provide at least your Name, Phone, and Room number.');
      return;
    }

    if (!aadhaarId || !aadhaarFront || !aadhaarBack || !tenantPhoto) {
      Alert.alert('Missing Documents', 'Please add your Aadhaar ID and upload all required photos.');
      return;
    }

    setLoading(true);
    try {
      const stamp = Date.now();
      const basePath = `tenant_${propertyCode}_${stamp}`;
      
      // Upload one by one with specific error tracking
      let aadhaarFrontUrl, aadhaarBackUrl, tenantPhotoUrl;
      
      try {
        aadhaarFrontUrl = await uploadImage(aadhaarFront, `${basePath}/aadhaar_front.jpg`);
        aadhaarBackUrl = await uploadImage(aadhaarBack, `${basePath}/aadhaar_back.jpg`);
        tenantPhotoUrl = await uploadImage(tenantPhoto, `${basePath}/tenant_photo.jpg`);
      } catch (uploadErr: any) {
        throw new Error(uploadErr.message || 'Network disrupted during document upload.');
      }

      const { error: dbError } = await supabase.from('tenants').insert([{
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        room: form.room.trim(),
        block: form.block.trim(),
        status: 'pending',
        property_id: propertyId,
        rent_amount: 0,
        advance_amount: Number(form.advance) || 0,
        aadhaar_id: aadhaarId.trim(),
        aadhaar_front_url: aadhaarFrontUrl,
        aadhaar_back_url: aadhaarBackUrl,
        tenant_photo_url: tenantPhotoUrl,
      }]);

      if (dbError) {
        throw new Error(`Database Error: ${dbError.message}`);
      }
      
      Alert.alert(
        'Request Submitted',
        `Your registration has been sent to ${propertyName}. The owner must approve it from the Tenants screen before you can log in.`,
        [{ text: 'Return to Login', onPress: () => navigation.navigate('TenantAccount') }]
      );
    } catch (e: any) {
      console.error('Registration full error:', e);
      const message = e?.message || 'A network error occurred while submitting. Please check your connection and try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
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
            <Text style={styles.title}>Registration</Text>
          </View>

          <TonalCard level="lowest" style={styles.formCard}>
            <View style={styles.propRow}>
              <Text style={styles.propCodeText}>Code: {propertyCode}</Text>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.mint} />
            </View>
            <Text style={styles.propertyTitle}>{propertyName}</Text>
            <Text style={styles.formTitle}>Your Details</Text>
            <Text style={styles.formSub}>The owner will verify these to approve your account.</Text>

            <View style={styles.checklistCard}>
              <Text style={styles.checklistTitle}>Before you submit</Text>
              <Text style={styles.checklistItem}>1. Keep your room number and phone number ready.</Text>
              <Text style={styles.checklistItem}>2. Enter the advance amount shared by the owner, if applicable.</Text>
              <Text style={styles.checklistItem}>3. Upload Aadhaar front, Aadhaar back, and one profile photo.</Text>
              <Text style={styles.checklistItem}>4. Use the same details you want the owner to approve.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor={theme.colors.onSurfaceVariant+'80'} value={form.name} onChangeText={(v) => updateForm('name', v)} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput style={styles.input} placeholder="+91 00000 00000" keyboardType="phone-pad" placeholderTextColor={theme.colors.onSurfaceVariant+'80'} value={form.phone} onChangeText={(v) => updateForm('phone', v)} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address (Optional)</Text>
              <TextInput style={styles.input} placeholder="john@example.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={theme.colors.onSurfaceVariant+'80'} value={form.email} onChangeText={(v) => updateForm('email', v)} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Aadhaar ID</Text>
              <TextInput style={styles.input} placeholder="XXXX XXXX XXXX" keyboardType="number-pad" placeholderTextColor={theme.colors.onSurfaceVariant+'80'} value={aadhaarId} onChangeText={setAadhaarId} />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Room / Unit</Text>
                <TextInput style={styles.input} placeholder="101" placeholderTextColor={theme.colors.onSurfaceVariant+'80'} value={form.room} onChangeText={(v) => updateForm('room', v)} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Block / Wing</Text>
              <TextInput style={styles.input} placeholder="A" placeholderTextColor={theme.colors.onSurfaceVariant+'80'} value={form.block} onChangeText={(v) => updateForm('block', v)} />
            </View>
          </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Advance Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter advance or security deposit"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.onSurfaceVariant+'80'}
                value={form.advance}
                onChangeText={(v) => updateForm('advance', v.replace(/[^0-9]/g, ''))}
              />
            </View>

            <Text style={styles.sectionLabel}>Upload Documents</Text>
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage((data) => setAadhaarFront(data))}>
                {aadhaarFront ? (
                  <Image source={{ uri: aadhaarFront.uri }} style={styles.uploadPreview} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="image-outline" size={22} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.uploadText}>Aadhaar Front</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage((data) => setAadhaarBack(data))}>
                {aadhaarBack ? (
                  <Image source={{ uri: aadhaarBack.uri }} style={styles.uploadPreview} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="image-outline" size={22} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.uploadText}>Aadhaar Back</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
 
            <TouchableOpacity style={styles.uploadWide} onPress={() => pickImage((data) => setTenantPhoto(data))}>
              {tenantPhoto ? (
                <Image source={{ uri: tenantPhoto.uri }} style={styles.uploadWidePreview} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="person-circle-outline" size={26} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.uploadText}>Tenant Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <RentifyButton title={loading ? "Submitting..." : "Submit Registration"} disabled={loading} onPress={handleSubmit} style={styles.submitBtn} />
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
  title: { fontFamily: theme.typography.headline.fontFamily, fontSize: 24, color: theme.colors.onSurface },
  formCard: { padding: theme.spacing.xl },
  propRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceContainerHigh, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 16 },
  propCodeText: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurface, marginRight: 6, letterSpacing: 1 },
  propertyTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 24, color: theme.colors.primary },
  formTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.onSurface },
  formSub: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.onSurfaceVariant, marginBottom: 24, marginTop: 4 },
  checklistCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 14,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    gap: 4,
  },
  checklistTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  checklistItem: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.onSurfaceVariant,
  },
  inputGroup: { marginBottom: theme.spacing.lg },
  label: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 6 },
  input: { height: 48, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, paddingHorizontal: theme.spacing.md, fontFamily: theme.typography.body.fontFamily, fontSize: 15, color: theme.colors.onSurface },
  row: { flexDirection: 'row' },
  submitBtn: { marginTop: theme.spacing.md },
  sectionLabel: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 10 },
  uploadRow: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.md },
  uploadCard: { flex: 1, height: 120, borderRadius: 10, backgroundColor: theme.colors.surfaceContainerLow, overflow: 'hidden' },
  uploadWide: { height: 120, borderRadius: 10, backgroundColor: theme.colors.surfaceContainerLow, overflow: 'hidden', marginBottom: theme.spacing.lg },
  uploadPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  uploadText: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant },
  uploadPreview: { width: '100%', height: '100%' },
  uploadWidePreview: { width: '100%', height: '100%' },
});
