import React, { useState, useEffect, useCallback } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { TonalCard } from '../../components/ui/TonalCard';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { authService, propertyService } from '../../services/dataService';
import { theme } from '../../theme/theme';

export const OwnerProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [propertyName, setPropertyName] = useState('No Property Setup');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const session = await authService.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
      
      const properties = await propertyService.getAll();
      if (properties && properties.length > 0) {
        setPropertyName(properties[0].name);
      }
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
    Alert.alert('Signed Out', 'You have been signed out. Refresh the app to return to login.');
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
              <View style={styles.avatar}><Text style={styles.avatarText}>{userEmail ? userEmail.charAt(0).toUpperCase() : 'P'}</Text></View>
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

            <TonalCard level="low" style={styles.settingsCard} floating={false}>
              <Text style={styles.sectionTitle}>Settings</Text>
              {['Notifications', 'Security', 'Billing', 'Help Center'].map((item) => (
                <TouchableOpacity key={item} style={styles.settingRow} onPress={() => Alert.alert(item, `${item} settings opened.`)}>
                  <Text style={styles.settingText}>{item}</Text>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
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
  settingsCard: { marginBottom: theme.spacing.xl },
  sectionTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 22, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  settingText: { fontFamily: theme.typography.label.fontFamily, fontSize: 15, color: theme.colors.onSurface },
});
