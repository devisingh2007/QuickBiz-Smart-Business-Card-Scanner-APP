import React, { useState, } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, } from 'react-native';
import { SafeAreaView, } from 'react-native-safe-area-context';
import { useRouter, } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Palette, Typography, BorderRadius, } from '@/constants/theme';
import { useTheme, } from '@/hooks/use-theme';
import { PrimaryButton, } from '@/components/ui/PrimaryButton';
import { SunsetStripe, } from '@/components/ui/SunsetStripe';
import { IconSymbol, } from '@/components/ui/icon-symbol';
export default function OnboardingScreen() {
  const router = useRouter();
  const {
    colors,
    isDark
  } = useTheme();
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
  const slides = [{
    title: 'Turn Business Cards into Living Contacts',
    description: 'Capture any printed card with your camera. Transform paper into organized directory records without manual typing.',
    icon: 'camera.fill'
  }, {
    title: 'On-Device Optical Extraction',
    description: 'Intelligent ML Kit OCR identifies names, direct phones, emails, company roles, and web domains with high accuracy.',
    icon: 'doc.text.viewfinder'
  }, {
    title: 'Native Contacts & Cloud Redundancy',
    description: 'Direct synchronization with your device address book plus secure cloud backup for cross-device access.',
    icon: 'arrow.triangle.2.circlepath'
  }];
  return <SafeAreaView style={[styles.container, {
    backgroundColor: colors.background
  }]} edges={['top', 'left', 'right']}>
      {/* Top Header with Skip */}
      <View style={styles.header}>
        {currentSlide > 0 ? <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }}>
            <IconSymbol name="chevron.left" size={18} color={colors.textPrimary} />
            <Text style={[styles.backText, {
          color: colors.textSecondary
        }]}>Back</Text>
          </TouchableOpacity> : <View style={{
        width: 60
      }} />}

        {currentSlide < 2 ? <TouchableOpacity onPress={handleSkip} hitSlop={{
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }}>
            <Text style={[styles.skipText, {
          color: colors.primary
        }]}>Skip</Text>
          </TouchableOpacity> : <View style={{
        width: 40
      }} />}
      </View>

      {/* Slide Content */}
      <View style={styles.slideContainer}>
        <View style={[styles.iconTile, isDark ? {
        backgroundColor: colors.card,
        borderColor: colors.border
      } : {
        backgroundColor: Palette.cream,
        borderColor: Palette.beigeDeep
      }]}>
          <IconSymbol name={slides[currentSlide].icon} size={40} color={Palette.primary} />
        </View>

        <Text style={[styles.title, {
        color: colors.textPrimary
      }]}>
          {slides[currentSlide].title}
        </Text>
        <Text style={[styles.description, {
        color: colors.textSecondary
      }]}>
          {slides[currentSlide].description}
        </Text>
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        {/* Step Indicators */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => <View key={index} style={[styles.indicator, {
          backgroundColor: colors.border
        }, currentSlide === index && [styles.indicatorActive, {
          backgroundColor: colors.primary
        }]]} />)}
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <PrimaryButton title={currentSlide === 2 ? 'Get Started' : 'Continue'} onPress={handleNext} style={styles.actionBtn} />
        </View>
      </View>

      {/* Signature Sunset Stripe */}
      <SunsetStripe height={4} />
    </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    marginLeft: 4
  },
  skipText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '500'
  },
  slideContainer: {
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconTile: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32
  },
  title: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 26,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 14
  },
  description: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  indicatorActive: {
    width: 24
  },
  buttonContainer: {
    width: '100%'
  },
  actionBtn: {
    width: '100%'
  }
});