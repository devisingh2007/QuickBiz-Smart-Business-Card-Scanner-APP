import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Palette, Typography } from '@/constants/theme';
import { SunsetStripe } from '@/components/ui/SunsetStripe';
import { apiService } from '@/services/api.service';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkNavigationFlow = async () => {
      try {
        const onboarded = await AsyncStorage.getItem('@quickbiz_onboarded');

        // Allow splash screen display duration (1.2 seconds)
        await new Promise((resolve) => setTimeout(resolve, 1200));

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
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <View style={styles.brandRow}>
          <Text style={styles.logo}>QuickBiz</Text>
          <View style={styles.orangeDot} />
        </View>
        <Text style={styles.subtitle}>Smart Business Contacts</Text>

        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={Palette.primary} />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </View>

      <SunsetStripe height={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.canvas,
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 38,
    fontWeight: '700',
    color: Palette.ink,
    letterSpacing: -0.8,
  },
  orangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.primary,
    marginLeft: 4,
    marginTop: 6,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: Palette.slate,
    marginTop: 6,
    letterSpacing: 0.1,
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 36,
  },
  loadingText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: Palette.stone,
    marginLeft: 8,
  },
});
