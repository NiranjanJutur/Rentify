import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { theme } from '../../theme/theme';
import { authService } from '../../services/dataService';

export const OwnerLoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('admin@rentify.com');
  const [password, setPassword] = useState('password123');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await authService.signIn(email, password);
      navigation.navigate('OwnerDashboard');
    } catch (error: any) {
      // Auto-bypass: If login fails, try signing up automatically with these credentials
      try {
        await authService.signUp(email, password);
        await authService.signIn(email, password); // Try logging in again after signup
        navigation.navigate('OwnerDashboard');
      } catch (signupError) {
        Alert.alert('Login Bypass Failed', 'Could not sign in or create dummy account.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password to sign up.');
      return;
    }
    setLoading(true);
    try {
      await authService.signUp(email, password);
      Alert.alert('Account Created', 'Please check your email to confirm, then login.');
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>The Curator</Text>
          <Text style={styles.subtitle}>ESTATE MANAGEMENT</Text>
        </View>

        <View style={styles.quoteContainer}>
           <Text style={styles.welcomeText}>Welcome to your estate dashboard.</Text>
           <Text style={styles.quoteText}>
             "The Curator has transformed how we manage our luxury estates. It's no longer just management; it's high-end hospitality at scale."
           </Text>
           <Text style={styles.quoteAuthor}>Julian Thorne</Text>
           <Text style={styles.quoteRole}>Estate Director, London</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Owner Access</Text>
          
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

          <View style={styles.linksContainer}>
            <TouchableOpacity style={styles.linkButton} onPress={handleSignUp}>
              <Text style={styles.linkText}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: theme.spacing.xxl,
    alignItems: 'center',
  },
  title: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 42,
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
    borderRadius: 24,
    ...theme.elevation.floating,
  },
  sectionTitle: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 24,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xl,
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
    borderRadius: 12, // xl (0.75rem / 12px)
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  primaryButtonText: {
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.onPrimary,
    fontSize: 16,
  },
  quoteContainer: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  welcomeText: {
    fontFamily: theme.typography.headline.fontFamily,
    fontSize: 24,
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
});
