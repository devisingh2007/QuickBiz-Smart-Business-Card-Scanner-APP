import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { InputField } from '@/components/ui/InputField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { apiService } from '@/services/api.service';
import { contactStore } from '@/services/contact.store';

export default function AuthScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!email) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Invalid email address';
    }
    
    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin && !name) {
      tempErrors.name = 'Name is required';
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
    } catch (error: any) {
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo and Greeting */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.primary }]}>QuickBiz</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isLogin ? 'Sign in to sync your professional network' : 'Create an account to backup scanned cards'}
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.form}>
          {!isLogin && (
            <InputField
              label="Full Name"
              placeholder="e.g. John Doe"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
            />
          )}

          <InputField
            label="Email Address"
            placeholder="e.g. john@company.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <InputField
            label="Password"
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <PrimaryButton
            title={isLogin ? 'Sign In' : 'Sign Up'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>

        {/* Tab switcher */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleBtn}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>
              Skip & Use Offline Mode
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 24,
  },
  submitBtn: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    gap: 16,
  },
  toggleBtn: {
    padding: 8,
  },
  skipBtn: {
    padding: 8,
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
