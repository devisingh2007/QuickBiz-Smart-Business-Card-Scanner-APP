import React, { useState, } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Image, } from 'react-native';
import { SafeAreaView, } from 'react-native-safe-area-context';
import { useRouter, } from 'expo-router';
import { Spacing, Typography, BorderRadius, Palette, } from '@/constants/theme';
import { useTheme, } from '@/hooks/use-theme';
import { InputField, } from '@/components/ui/InputField';
import { PrimaryButton, } from '@/components/ui/PrimaryButton';
import { SunsetStripe, } from '@/components/ui/SunsetStripe';
import { IconSymbol, } from '@/components/ui/icon-symbol';
import { apiService, } from '@/services/api.service';
import { contactStore, } from '@/services/contact.store';
export default function AuthScreen() {
  const router = useRouter();
  const {
    colors,
    isDark
  } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const validate = () => {
    const tempErrors = {};
    if (!email) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    if (!isLogin && !name.trim()) {
      tempErrors.name = 'Full name is required';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      if (isLogin) {
        await apiService.login(email.trim(), password);
        await contactStore.handleLoginSync();
        router.replace('/permissions');
      } else {
        await apiService.register(name.trim(), email.trim(), password);
        await contactStore.handleLoginSync();
        Alert.alert('Account Created', 'Your QuickBiz account has been successfully created!');
        router.replace('/permissions');
      }
    } catch (error) {
      Alert.alert('Authentication Error', error.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleSkip = async () => {
    // Proceed to permissions and run in offline mode
    await apiService.setSession(null, null);
    router.replace('/permissions');
  };
  return <SafeAreaView style={[styles.container, {
    backgroundColor: colors.background
  }]} edges={['top', 'left', 'right']}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{
      flex: 1
    }}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Image source={require('@/assets/images/icon.png')} style={styles.brandBadge} resizeMode="contain" />

          <Text style={[styles.editorialTitle, {
            color: colors.textPrimary
          }]}>
            {isLogin ? 'Sign in to QuickBiz' : 'Create your account'}
          </Text>

          <Text style={[styles.editorialSubtitle, {
            color: colors.textSecondary
          }]}>
            {isLogin ? 'Access your digitized contacts and synchronization services.' : 'Safely backup and organize your scanned business cards.'}
          </Text>
        </View>

        {/* Form Panel (Cream surface in Light Mode, Dark Card in Dark Mode) */}
        <View style={[styles.formPanel, {
          backgroundColor: isDark ? colors.card : colors.surfaceCream,
          borderColor: isDark ? colors.cardBorder : colors.borderBeige
        }]}>
          {/* Segmented Switch */}
          <View style={[styles.segmentContainer, {
            backgroundColor: colors.surface,
            borderColor: isDark ? colors.border : colors.borderBeige
          }]}>
            <TouchableOpacity style={[styles.segmentBtn, isLogin && {
              backgroundColor: isDark ? colors.card : Palette.ink,
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? colors.primary : 'transparent'
            }]} onPress={() => {
              setIsLogin(true);
              setErrors({});
            }} accessibilityRole="button" accessibilityLabel="Sign In tab">
              <Text style={[styles.segmentText, {
                color: isLogin ? isDark ? colors.primary : '#FFFFFF' : colors.textMuted
              }, isLogin && {
                fontWeight: '600'
              }]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.segmentBtn, !isLogin && {
              backgroundColor: isDark ? colors.card : Palette.ink,
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? colors.primary : 'transparent'
            }]} onPress={() => {
              setIsLogin(false);
              setErrors({});
            }} accessibilityRole="button" accessibilityLabel="Create Account tab">
              <Text style={[styles.segmentText, {
                color: !isLogin ? isDark ? colors.primary : '#FFFFFF' : colors.textMuted
              }, !isLogin && {
                fontWeight: '600'
              }]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {!isLogin && <InputField label="Full Name" placeholder="e.g. Sarah Connor" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" leftIcon={<IconSymbol name="person.2.fill" size={16} color={colors.textMuted} />} />}

          <InputField 
          label="Email Address" 
          placeholder="e.g. name@company.com" 
          value={email} onChangeText={setEmail} 
          error={errors.email}
           keyboardType="email-address" 
           autoCapitalize="none" 
           autoCorrect={false} 
           leftIcon={<IconSymbol name="envelope.fill" size={16} color={colors.textMuted} />} />

          <InputField label="Password" placeholder="Minimum 6 characters" value={password} onChangeText={setPassword} error={errors.password} secureTextEntry autoCapitalize="none" autoCorrect={false} leftIcon={<IconSymbol name="lock.fill" size={16} color={colors.textMuted} />} />

          <PrimaryButton title={isLogin ? 'Sign In' : 'Create Account'} onPress={handleSubmit} loading={loading} style={styles.submitBtn} />
        </View>

        {/* Offline Option */}
        <View style={styles.footer}>
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, {
              backgroundColor: colors.border
            }]} />
            <Text style={[styles.orText, {
              color: colors.textMuted
            }]}>OR</Text>
            <View style={[styles.dividerLine, {
              backgroundColor: colors.border
            }]} />
          </View>

          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} accessibilityRole="button">
            <Text style={[styles.skipText, {
              color: Palette.primary
            }]}>
              Continue in Offline Mode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sunset Stripe */}
        <View style={styles.closingStripe}>
          <SunsetStripe height={4} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    justifyContent: 'center',
    flexGrow: 1
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl
  },
  brandBadge: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md
  },
  editorialTitle: {
    ...Typography.heading1,
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 4
  },
  editorialSubtitle: {
    ...Typography.bodySm,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    lineHeight: 19
  },
  formPanel: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.lg
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 3,
    marginBottom: Spacing.xl
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm
  },
  segmentText: {
    ...Typography.bodySm,
    fontSize: 13
  },
  submitBtn: {
    marginTop: Spacing.sm
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%'
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth
  },
  orText: {
    ...Typography.caption,
    marginHorizontal: Spacing.md
  },
  skipBtn: {
    paddingVertical: Spacing.xs
  },
  skipText: {
    ...Typography.bodySmMedium,
    textDecorationLine: 'underline'
  },
  closingStripe: {
    alignItems: 'center'
  }
});