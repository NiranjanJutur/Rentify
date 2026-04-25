import React, { useState, useCallback } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { TonalCard } from '../../components/ui/TonalCard';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { authService, propertyService } from '../../services/dataService';
import { theme } from '../../theme/theme';

export const WHATSAPP_BIZ_KEY = 'rentify_whatsapp_biz_number';

export const OwnerProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [propertyName, setPropertyName] = useState('No Property Setup');

  // WhatsApp Business number state
  const [waNumber, setWaNumber] = useState('');
  const [waEditing, setWaEditing] = useState(false);
  const [waSaving, setWaSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const session = await authService.getSession();
      if (session?.user?.email) setUserEmail(session.user.email);

      const properties = await propertyService.getMyProperties();
      if (properties && properties.length > 0) setPropertyName(properties[0].name);

      // Load saved WhatsApp Business number
      const saved = await AsyncStorage.getItem(WHATSAPP_BIZ_KEY);
      if (saved) setWaNumber(saved);
    } catch (e) {
      console.log('Error fetching owner profile', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleSignOut = async () => {
    await authService.signOut();
    Alert.alert('Signed Out', 'You have been signed out successfully.');
  };

  const handleSaveWaNumber = async () => {
    const cleaned = waNumber.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    if (cleaned.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid WhatsApp Business number with country code (e.g. +919876543210).');
      return;
    }
    setWaSaving(true);
    try {
      await AsyncStorage.setItem(WHATSAPP_BIZ_KEY, cleaned);
      setWaNumber(cleaned);
      setWaEditing(false);
      Alert.alert('Saved', 'WhatsApp Business number saved. Rent reminders will now be sent via WhatsApp.');
    } catch (e) {
      Alert.alert('Error', 'Could not save number. Please try again.');
    } finally {
      setWaSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={21} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.brand}>Property Curator</Text>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : (
          <>
            <View style={styles.identity}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userEmail ? userEmail.charAt(0).toUpperCase() : 'P'}</Text>
              </View>
              <Text style={styles.name}>{userEmail ? userEmail.split('@')[0] : 'Owner'}</Text>
              <Text style={styles.meta}>Owner / Estate Administrator</Text>
            </View>

            <TonalCard level="lowest" style={styles.card}>
              {[
                ['Business', propertyName],
                ['Email', userEmail || 'admin@rentify.com'],
                ['Plan', 'Premium Estate'],
              ].map(([label, value]) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
            </TonalCard>

            {/* ─── WhatsApp Business Number ─── */}
            <TonalCard level="lowest" style={styles.waCard}>
              <View style={styles.waHeader}>
                <View style={styles.waIconWrap}>
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.waTitle}>WhatsApp Business</Text>
                  <Text style={styles.waSub}>Rent reminders will be sent to tenants via this number</Text>
                </View>
                {!waEditing && (
                  <TouchableOpacity onPress={() => setWaEditing(true)} style={styles.editBtn}>
                    <Ionicons name={waNumber ? 'pencil' : 'add'} size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {waNumber && !waEditing ? (
                <View style={styles.waNumberRow}>
                  <Text style={styles.waNumber}>{waNumber}</Text>
                  <View style={styles.waBadge}>
                    <Text style={styles.waBadgeText}>ACTIVE</Text>
                  </View>
                </View>
              ) : null}

              {!waNumber && !waEditing ? (
                <TouchableOpacity style={styles.waAddPrompt} onPress={() => setWaEditing(true)}>
                  <Text style={styles.waAddText}>+ Tap to add your WhatsApp Business number</Text>
                </TouchableOpacity>
              ) : null}

              {waEditing ? (
                <View style={styles.waEditWrap}>
                  <TextInput
                    style={styles.waInput}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={theme.colors.onSurfaceVariant + '88'}
                    keyboardType="phone-pad"
                    value={waNumber}
                    onChangeText={setWaNumber}
                    autoFocus
                  />
                  <Text style={styles.waHint}>Include country code, e.g. +919876543210</Text>
                  <View style={styles.waActions}>
                    <TouchableOpacity
                      style={styles.waCancelBtn}
                      onPress={() => { setWaEditing(false); }}
                    >
                      <Text style={styles.waCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.waSaveBtn}
                      onPress={handleSaveWaNumber}
                      disabled={waSaving}
                    >
                      <Text style={styles.waSaveText}>{waSaving ? 'Saving...' : 'Save Number'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </TonalCard>

            <TonalCard level="low" style={styles.settingsCard} floating={false}>
              <Text style={styles.sectionTitle}>Settings</Text>
              {['Notifications', 'Security', 'Billing', 'Help Center'].map((item) => (
                <View key={item} style={styles.settingRow}>
                  <View>
                    <Text style={styles.settingText}>{item}</Text>
                    <Text style={styles.settingMeta}>Available in a future update</Text>
                  </View>
                  <Text style={styles.settingBadge}>Soon</Text>
                </View>
              ))}
            </TonalCard>

            <RentifyButton title="Sign Out" onPress={handleSignOut} variant="secondary" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl },
  iconButton: { width: 38, height: 38, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  brand: { fontFamily: theme.typography.label.fontFamily, fontSize: 17, color: theme.colors.primary },
  identity: { marginBottom: theme.spacing.xl },
  avatar: { width: 64, height: 64, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.onPrimary, textTransform: 'uppercase' },
  name: { fontFamily: theme.typography.headline.fontFamily, fontSize: 32, color: theme.colors.onSurface },
  meta: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  card: { marginBottom: theme.spacing.lg },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant + '44' },
  infoLabel: { fontFamily: theme.typography.body.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant },
  infoValue: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onSurface },

  // WhatsApp Card
  waCard: { marginBottom: theme.spacing.lg, padding: theme.spacing.lg },
  waHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  waIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#25D36618', alignItems: 'center', justifyContent: 'center' },
  waTitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 15, color: theme.colors.onSurface },
  waSub: { fontFamily: theme.typography.body.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  editBtn: { padding: 8 },
  waNumberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 },
  waNumber: { fontFamily: theme.typography.headline.fontFamily, fontSize: 18, color: '#25D366' },
  waBadge: { backgroundColor: '#25D36618', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  waBadgeText: { fontFamily: theme.typography.label.fontFamily, fontSize: 10, color: '#25D366', letterSpacing: 1 },
  waAddPrompt: { marginTop: 14, paddingVertical: 10 },
  waAddText: { fontFamily: theme.typography.body.fontFamily, fontSize: 13, color: theme.colors.primary },
  waEditWrap: { marginTop: 14 },
  waInput: { height: 50, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, paddingHorizontal: theme.spacing.md, fontFamily: theme.typography.body.fontFamily, color: theme.colors.onSurface },
  waHint: { fontFamily: theme.typography.body.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 6 },
  waActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  waCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: theme.colors.surfaceContainerLow, alignItems: 'center' },
  waCancelText: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant },
  waSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#25D366', alignItems: 'center' },
  waSaveText: { fontFamily: theme.typography.label.fontFamily, fontSize: 14, color: '#fff' },

  settingsCard: { marginBottom: theme.spacing.xl },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  settingText: { fontFamily: theme.typography.label.fontFamily, fontSize: 15, color: theme.colors.onSurface },
  settingMeta: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  settingBadge: { fontFamily: theme.typography.label.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, backgroundColor: theme.colors.surfaceContainerLow, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
});
