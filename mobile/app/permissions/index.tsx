import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  AppState,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera } from 'expo-camera';
import * as Contacts from 'expo-contacts';
import { Palette, Typography, BorderRadius } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Badge } from '@/components/ui/Badge';
import { SunsetStripe } from '@/components/ui/SunsetStripe';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function PermissionScreen() {
  const router = useRouter();

  const [cameraStatus, setCameraStatus] = useState<string>('undetermined');
  const [cameraCanAskAgain, setCameraCanAskAgain] = useState(true);

  const [contactsStatus, setContactsStatus] = useState<string>('undetermined');
  const [contactsCanAskAgain, setContactsCanAskAgain] = useState(true);

  const [loading, setLoading] = useState(true);

  const checkPermissions = async () => {
    if (Platform.OS === 'web') {
      setCameraStatus('granted');
      setContactsStatus('granted');
      setLoading(false);
      return;
    }

    try {
      const cam = await Camera.getCameraPermissionsAsync();
      setCameraStatus(cam.status);
      setCameraCanAskAgain(cam.canAskAgain);

      const con = await Contacts.getPermissionsAsync();
      setContactsStatus(con.status);
      setContactsCanAskAgain(con.canAskAgain);
    } catch (err) {
      console.warn('[PERMISSIONS] checkPermissions failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPermissions();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const requestCamera = async () => {
    if (Platform.OS === 'web') return;

    if (cameraStatus === 'denied' && !cameraCanAskAgain) {
      Alert.alert(
        'Camera Permission Blocked',
        'Camera access is blocked. Please enable it in system settings to scan business cards.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    try {
      const res = await Camera.requestCameraPermissionsAsync();
      setCameraStatus(res.status);
      setCameraCanAskAgain(res.canAskAgain);
    } catch (err) {
      console.warn('[PERMISSIONS] requestCamera failed:', err);
      Alert.alert('Error', 'Failed to request camera permission.');
    }
  };

  const requestContacts = async () => {
    if (Platform.OS === 'web') return;

    if (contactsStatus === 'denied' && !contactsCanAskAgain) {
      Alert.alert(
        'Contacts Permission Blocked',
        'Contacts access is blocked. Please enable it in system settings to save business cards to your phone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    try {
      const res = await Contacts.requestPermissionsAsync();
      setContactsStatus(res.status);
      setContactsCanAskAgain(res.canAskAgain);
    } catch (err) {
      console.warn('[PERMISSIONS] requestContacts failed:', err);
      Alert.alert('Error', 'Failed to request contacts permission.');
    }
  };

  const handleContinue = () => {
    if (cameraStatus === 'granted' && contactsStatus === 'granted') {
      router.replace('/(tabs)');
    } else {
      Alert.alert(
        'Permissions Required',
        'QuickBiz needs Camera and Contacts access to scan cards and save records to your phone. Continue anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue in Limited Mode',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="small" color={Palette.primary} />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Device Permissions</Text>
          <Text style={styles.description}>
            QuickBiz requires access to your camera and local contacts to provide on-device scanning and saving.
          </Text>
        </View>

        <View style={styles.list}>
          {/* Camera Card */}
          <View style={styles.permissionCard}>
            <View style={styles.iconTile}>
              <IconSymbol name="camera.fill" size={22} color={Palette.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Camera Scanner</Text>
              <Text style={styles.cardDescription}>
                Captures high-resolution frames of business cards for on-device OCR parsing.
              </Text>
            </View>
            {cameraStatus === 'granted' ? (
              <Badge label="Granted ✓" variant="success" size="sm" />
            ) : (
              <TouchableOpacity
                onPress={requestCamera}
                style={styles.grantBtn}
              >
                <Text style={styles.grantBtnText}>Grant</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Contacts Card */}
          <View style={styles.permissionCard}>
            <View style={styles.iconTile}>
              <IconSymbol name="person.2.fill" size={22} color={Palette.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Address Book</Text>
              <Text style={styles.cardDescription}>
                Directly writes parsed contact records to your phone native contact directory.
              </Text>
            </View>
            {contactsStatus === 'granted' ? (
              <Badge label="Granted ✓" variant="success" size="sm" />
            ) : (
              <TouchableOpacity
                onPress={requestContacts}
                style={styles.grantBtn}
              >
                <Text style={styles.grantBtnText}>Grant</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.actionContainer}>
          <PrimaryButton
            title="Continue to QuickBiz"
            onPress={handleContinue}
            style={styles.continueBtn}
          />
        </View>
      </View>

      <SunsetStripe height={4} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.canvas,
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: Palette.stone,
    marginTop: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 28,
    fontWeight: '400',
    color: Palette.ink,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  description: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: Palette.slate,
    lineHeight: 22,
  },
  list: {
    gap: 16,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.canvas,
    borderWidth: 1,
    borderColor: Palette.hairlineSoft,
    borderRadius: BorderRadius.lg, // 12px
    padding: 16,
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md, // 8px
    backgroundColor: Palette.cream,
    borderWidth: 1,
    borderColor: Palette.beigeDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    color: Palette.ink,
    marginBottom: 2,
  },
  cardDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    color: Palette.slate,
    lineHeight: 17,
  },
  grantBtn: {
    height: 32,
    paddingHorizontal: 12,
    backgroundColor: Palette.cream,
    borderWidth: 1,
    borderColor: Palette.beigeDeep,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantBtnText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.ink,
  },
  actionContainer: {
    paddingBottom: 28,
  },
  continueBtn: {
    width: '100%',
  },
});
