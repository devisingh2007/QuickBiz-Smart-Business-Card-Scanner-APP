import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [currentSlide, setCurrentSlide] = useState(0);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@quickbiz_onboarded', 'true');
    } catch (e) {
      console.warn('Failed to save onboarding state:', e);
    }
    router.push('/auth');
  };

  const handleNext = () => {
    if (currentSlide < 2) {
      setCurrentSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slides = [
    {
      title: 'Turn Business Cards into Digital Contacts',
      description: 'Simply point your camera at any physical business card to digitize it immediately. No more typing manual contact info.',
      icon: 'camera.fill',
    },
    {
      title: 'Scan & Extract Automatically',
      description: 'Our smart OCR engine reads the card and extracts the full name, phone number, email, company, title, and address in seconds.',
      icon: 'paperplane.fill',
    },
    {
      title: 'Save & Backup Your Contacts',
      description: 'Save extracted contacts directly to your phone\'s native Address Book and automatically back them up to your MongoDB cloud database.',
      icon: 'globe',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {currentSlide < 2 && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.slideContainer}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <IconSymbol name={slides[currentSlide].icon as any} size={64} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {slides[currentSlide].title}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {slides[currentSlide].description}
        </Text>
      </View>

      <View style={styles.footer}>
        {/* Indicators */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                { backgroundColor: colors.border },
                currentSlide === index && { backgroundColor: colors.primary, width: 24 },
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {currentSlide > 0 ? (
            <SecondaryButton
              title="Back"
              onPress={handleBack}
              style={styles.halfButton}
            />
          ) : (
            <View style={styles.emptyButtonSpace} />
          )}

          <PrimaryButton
            title={currentSlide === 2 ? 'Get Started' : 'Next'}
            onPress={handleNext}
            style={currentSlide > 0 ? styles.halfButton : styles.fullButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  indicator: {
    height: 6,
    width: 6,
    borderRadius: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  fullButton: {
    flex: 1,
  },
  halfButton: {
    flex: 1,
  },
  emptyButtonSpace: {
    flex: 0,
    width: 0,
  },
});
