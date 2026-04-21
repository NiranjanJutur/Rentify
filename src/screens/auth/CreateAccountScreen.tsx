import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { authService } from '../../services/dataService';
import { RentifyButton } from '../../components/ui/RentifyButton';
import { TonalCard } from '../../components/ui/TonalCard';
import { AUTH_REDIRECT_URL } from '../../utils/supabase';

type CreateAccountScreenProps = {
  navigation?: any;
  onAuthenticated?: (session: any) => void;
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = 12000) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Account request timed out. Check your connection and try again.')), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const getAuthErrorMessage = (error: any) => {
  if (!error) return 'Unable to create the account right now.';
  if (error.code === 'over_email_send_rate_limit') return 'Too many confirmation emails were requested. Wait a few minutes and try again.';
  if (error.code === 'user_already_exists') return 'An account already exists for this email. Please sign in instead.';
  return error.message || 'Unable to create the account right now.';
};

export const CreateAccountScreen = ({ navigation, onAuthenticated }: CreateAccountScreenProps) => {
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const fieldErrors = {
    fullName: !fullName.trim(),
    businessName: !businessName.trim(),
    phone: !phone.trim(),
    email: !normalizedEmail,
    password: !password,
    weakPassword: password.length > 0 && password.length < 6,
  };

  const handleCreateAccount = async () => {
    setAttemptedSubmit(true);
    setFormMessage(null);

    if (fieldErrors.fullName || fieldErrors.businessName || fieldErrors.phone || fieldErrors.email || fieldErrors.password) {
      setFormMessage({ type: 'error', text: 'Please fill all account details before continuing.' });
      return;
    }

    if (fieldErrors.weakPassword) {
      setFormMessage({ type: 'error', text: 'Use at least 6 characters for your password.' });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await withTimeout(
        authService.signUp(normalizedEmail, password, {
          full_name: fullName.trim(),
          business_name: businessName.trim(),
          phone: phone.trim(),
        }, AUTH_REDIRECT_URL)
      );

      if (error) {
        setFormMessage({ type: 'error', text: getAuthErrorMessage(error) });
        return;
      }

      if (data?.session) {
        setFormMessage({ type: 'success', text: 'Account created successfully.' });
        onAuthenticated?.(data.session);
        return;
      }

      setFormMessage({ type: 'success', text: 'Account created. Confirm your email from your inbox, then sign in.' });
      Alert.alert(
        'Verify Your Email',
        'Account created. Confirm your email from your inbox, then return to sign in.',
        [{
          text: 'Back to Login',
          onPress: () => navigation?.navigate('OwnerLogin', {
            prefillEmail: normalizedEmail,
            verificationPending: true,
          }),
        }]
      );
    } catch (error: any) {
      setFormMessage({ type: 'error', text: getAuthErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation?.navigate('OwnerLogin')}>
              <Ionicons name="arrow-back" size={21} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.brand}>Curator Portal</Text>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Onboarding Experience</Text>
            <Text style={styles.title}>Curate your legacy.</Text>
            <Text style={styles.body}>
              Create an owner account for rent collection, occupancy, staff, maintenance, and tenant operations.
            </Text>
          </View>

          <TonalCard level="lowest" style={styles.formCard}>
            <Text style={styles.formTitle}>Register My Property</Text>
            <View style={styles.titleRule} />

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, attemptedSubmit && fieldErrors.fullName && styles.inputError]}
              placeholder="e.g. Aditya Sharma"
              placeholderTextColor={theme.colors.onSurfaceVariant + '99'}
              value={fullName}
              onChangeText={setFullName}
            />
            {attemptedSubmit && fieldErrors.fullName && <Text style={styles.errorText}>Full name is required.</Text>}

            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={[styles.input, attemptedSubmit && fieldErrors.businessName && styles.inputError]}
              placeholder="e.g. Grand Residency"
              placeholderTextColor={theme.colors.onSurfaceVariant + '99'}
              value={businessName}
              onChangeText={setBusinessName}
            />
            {attemptedSubmit && fieldErrors.businessName && <Text style={styles.errorText}>Business name is required.</Text>}

            <Text style={styles.label}>Primary Phone</Text>
            <TextInput
              style={[styles.input, attemptedSubmit && fieldErrors.phone && styles.inputError]}
              placeholder="+91 98765 43210"
              placeholderTextColor={theme.colors.onSurfaceVariant + '99'}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            {attemptedSubmit && fieldErrors.phone && <Text style={styles.errorText}>Phone number is required.</Text>}

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, attemptedSubmit && fieldErrors.email && styles.inputError]}
              placeholder="owner@residency.com"
              placeholderTextColor={theme.colors.onSurfaceVariant + '99'}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            {attemptedSubmit && fieldErrors.email && <Text style={styles.errorText}>Email is required.</Text>}

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, attemptedSubmit && (fieldErrors.password || fieldErrors.weakPassword) && styles.inputError]}
              placeholder="Minimum 6 characters"
              placeholderTextColor={theme.colors.onSurfaceVariant + '99'}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {attemptedSubmit && fieldErrors.password && <Text style={styles.errorText}>Password is required.</Text>}
            {attemptedSubmit && !fieldErrors.password && fieldErrors.weakPassword && <Text style={styles.errorText}>Password must be at least 6 characters.</Text>}

            <View style={styles.identityBox}>
              <Ionicons name="shield-checkmark" size={18} color={theme.colors.primary} />
              <View style={styles.identityCopy}>
                <Text style={styles.identityTitle}>Identity Verification</Text>
                <Text style={styles.identityText}>We keep property and tenant records protected under your owner account.</Text>
              </View>
            </View>

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

            <RentifyButton
              title={loading ? 'Creating Account...' : 'Register My Property'}
              onPress={handleCreateAccount}
              disabled={loading}
              style={styles.submitButton}
            />
          </TonalCard>
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
  hero: { marginBottom: theme.spacing.xl },
  eyebrow: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    color: theme.colors.secondary,
    textTransform: 'uppercase',
  },
  title: { fontFamily: theme.typography.headline.fontFamily, fontSize: 40, color: theme.colors.primary, marginTop: 14 },
  body: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 15,
    lineHeight: 23,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.md,
  },
  formCard: { padding: theme.spacing.xl },
  formTitle: { fontFamily: theme.typography.headline.fontFamily, fontSize: 23, color: theme.colors.onSurface },
  titleRule: { width: 56, height: 3, borderRadius: 2, backgroundColor: theme.colors.secondary, marginTop: 12, marginBottom: theme.spacing.xl },
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    marginTop: -14,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.danger,
  },
  identityBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.occupiedBg,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginTop: 2,
  },
  identityCopy: { flex: 1, marginLeft: 10 },
  identityTitle: { fontFamily: theme.typography.label.fontFamily, fontSize: 13, color: theme.colors.primary },
  identityText: { fontFamily: theme.typography.body.fontFamily, fontSize: 12, color: theme.colors.onSurfaceVariant, lineHeight: 18, marginTop: 2 },
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
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
  submitButton: { marginTop: theme.spacing.xl },
});
