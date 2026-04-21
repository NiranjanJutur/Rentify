import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { theme } from '../../theme/theme';
import { authService } from '../../services/dataService';
import { AUTH_REDIRECT_URL } from '../../utils/supabase';

const demoEmail = 'admin@rentify.com';
const demoPassword = 'password123';

type OwnerLoginScreenProps = {
  navigation?: any;
  route?: any;
  onAuthenticated?: (session: any) => void;
  onDemoLogin?: () => void;
};

const getAuthErrorMessage = (error: any) => {
  if (!error) return 'Unable to authenticate right now. Please try again.';

  if (error.code === 'email_not_confirmed') {
    return 'Your email is not confirmed. Open your inbox and confirm the account, then try again.';
  }

  if (error.code === 'invalid_credentials') {
    return 'Invalid email or password. Check your credentials and try again.';
  }

  if (error.code === 'over_email_send_rate_limit') {
    return 'Too many confirmation emails were requested. Wait a few minutes before trying sign up again.';
  }

  return error.message || 'Unable to authenticate right now. Please try again.';
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = 12000) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Login request timed out. Check your connection and try again.')), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

export const OwnerLoginScreen = ({ navigation, route, onAuthenticated, onDemoLogin }: OwnerLoginScreenProps) => {
  const prefillEmail = route?.params?.prefillEmail || '';
  const verificationPending = !!route?.params?.verificationPending;
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResendConfirmation = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert('Email Required', 'Enter your email first so we can resend the confirmation link.');
      return;
    }

    setResending(true);
    try {
      const { error } = await authService.resendSignupConfirmation(
        normalizedEmail,
        AUTH_REDIRECT_URL
      );

      if (error) {
        Alert.alert('Could Not Resend', getAuthErrorMessage(error));
        return;
      }

      Alert.alert('Confirmation Sent', 'We sent a fresh confirmation email. Open it, confirm the account, then return here to sign in.');
    } catch (error: any) {
      Alert.alert('Could Not Resend', getAuthErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Attempting login for:', normalizedEmail);

    if (!normalizedEmail || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      if (normalizedEmail === demoEmail && password === demoPassword && onDemoLogin) {
        onDemoLogin();
        return;
      }

      const { data, error } = await withTimeout(authService.signIn(normalizedEmail, password));
      console.log('Login response data:', data);
      console.log('Login response error:', error);

      if (error) {
        Alert.alert('Login Failed', getAuthErrorMessage(error));
        return;
      }

      if (!data?.session) {
        Alert.alert('Login Incomplete', 'Login acknowledged but no session returned. This usually means your email is not confirmed. Please check your inbox.');
        return;
      }

      onAuthenticated?.(data.session);
    } catch (error: any) {
      console.error('Login catch error:', error);
      Alert.alert('Connection Error', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Rentify</Text>
            <Text style={styles.subtitle}>ESTATE MANAGEMENT</Text>
          </View>

          <View style={styles.quoteContainer}>
             <Text style={styles.welcomeText}>Welcome to your estate dashboard.</Text>
             <Text style={styles.quoteText}>
               "Rentify has transformed how we manage our luxury estates. It's no longer just management; it's high-end hospitality at scale."
             </Text>
             <Text style={styles.quoteAuthor}>Julian Thorne</Text>
             <Text style={styles.quoteRole}>Estate Director, London</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Owner Access</Text>

            {verificationPending ? (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeTitle}>Verify Your Email First</Text>
                <Text style={styles.noticeText}>
                  Your owner account was created. Open the Supabase confirmation email, complete verification, then sign in here with the same email and password.
                </Text>
                <TouchableOpacity style={styles.noticeButton} onPress={handleResendConfirmation} disabled={resending}>
                  <Text style={styles.noticeButtonText}>{resending ? 'Sending...' : 'Resend Confirmation Email'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            
            <View style={[styles.inputContainer, isEmailFocused && styles.inputContainerFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>

            <View style={[styles.inputContainer, isPasswordFocused && styles.inputContainerFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
            </View>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Authenticating...' : 'Access Authority'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoButton} onPress={() => {
              setEmail(demoEmail);
              setPassword(demoPassword);
            }}>
              <Text style={styles.demoButtonText}>Use demo credentials</Text>
            </TouchableOpacity>

            <View style={styles.linksContainer}>
              <TouchableOpacity style={styles.linkButton} onPress={() => navigation?.navigate('CreateAccount')}>
                <Text style={styles.linkText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>RESIDENT PORTAL</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => navigation?.navigate('TenantJoin')}
            >
              <Text style={styles.secondaryButtonText}>Register as New Resident</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.tenantLink} 
              onPress={() => navigation?.navigate('TenantAccount')}
            >
              <Text style={styles.tenantLinkText}>Already registered? Access Portal</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: { flex: 1 },
  scrollContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 60,
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: theme.spacing.xl,
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 34,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 2,
  },
  formContainer: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: theme.spacing.xl,
    borderRadius: 8,
    ...theme.elevation.floating,
  },
  sectionTitle: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 24,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xl,
  },
  noticeCard: {
    backgroundColor: theme.colors.occupiedBg,
    borderRadius: 10,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  noticeTitle: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 13,
    color: theme.colors.primary,
  },
  noticeText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  noticeButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noticeButtonText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    color: theme.colors.onPrimary,
  },
  inputContainer: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: theme.spacing.lg,
  },
  inputContainerFocused: {
    borderBottomColor: theme.colors.primary,
  },
  input: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 16,
    color: theme.colors.onSurface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  primaryButtonText: {
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.onPrimary,
    fontSize: 16,
  },
  demoButton: {
    marginTop: theme.spacing.md,
    alignSelf: 'center',
  },
  demoButtonText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 13,
    color: theme.colors.primary,
  },
  quoteContainer: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: 0,
  },
  welcomeText: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 38,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  quoteText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
  },
  quoteAuthor: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  quoteRole: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 12,
    color: theme.colors.primary,
  },
  linksContainer: {
    marginTop: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  linkButton: {
    padding: theme.spacing.sm,
  },
  linkText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    color: theme.colors.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outlineVariant + '44',
  },
  dividerText: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: 12,
    letterSpacing: 1,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.primary,
    fontSize: 15,
  },
  tenantLink: {
    marginTop: theme.spacing.md,
    alignSelf: 'center',
  },
  tenantLinkText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
  },
});
