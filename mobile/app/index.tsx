import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiService } from '@/services/api.service';

export default function Index() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  useEffect(() => {
    const checkNavigationFlow = async () => {
      try {
        const onboarded = await AsyncStorage.getItem('@quickbiz_onboarded');
        
        // Wait for splash screen display duration (1.5 seconds)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (onboarded !== 'true') {
          router.replace('/onboarding');
        } else {
          if (apiService.isAuthenticated()) {
            router.replace('/(tabs)');
          } else {
            router.replace('/auth');
          }
        }
      } catch (err) {
        console.warn('[INDEX] Navigation flow check failed:', err);
        router.replace('/onboarding');
      }
    };

    checkNavigationFlow();
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.logo, { color: colors.primary }]}>QuickBiz</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Smart Business Contacts</Text>
      
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
