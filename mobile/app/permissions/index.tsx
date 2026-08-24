import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Alert, Platform, Linking, AppState, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera } from 'expo-camera';
import * as Contacts from 'expo-contacts';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function PermissionScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

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
        'Camera access is blocked. Please enable it in your device system settings to scan business cards.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
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
        'Contacts access is blocked. Please enable it in your device system settings to save business cards to your phone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
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
        'QuickBiz needs Camera and Contacts permissions to scan business cards and save them to your phone. Would you like to proceed anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue in Limited Mode', onPress: () => router.replace('/(tabs)') }
        ]
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontWeight: '500' }}>Checking permissions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Permissions Setup</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          QuickBiz requires the following permissions to provide the core experience.
        </Text>

        <View style={styles.permissionList}>
          {/* Camera Permission Row */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
              <IconSymbol name="camera.fill" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Camera Access</Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                Required to capture and scan business cards using the OCR scanner.
              </Text>
            </View>
            <TouchableOpacity
              onPress={requestCamera}
              disabled={cameraStatus === 'granted'}
              style={[
                styles.statusBadge,
                cameraStatus === 'granted'
                  ? { backgroundColor: colors.primaryLight }
                  : cameraStatus === 'denied' && !cameraCanAskAgain
                  ? { borderColor: colors.warning, borderWidth: 1 }
                  : { borderColor: colors.primary, borderWidth: 1 }
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: cameraStatus === 'granted'
                      ? colors.primary
                      : cameraStatus === 'denied' && !cameraCanAskAgain
                      ? colors.warning
                      : colors.primary
                  }
                ]}
              >
                {cameraStatus === 'granted'
                  ? 'Granted ✓'
                  : cameraStatus === 'denied' && !cameraCanAskAgain
                  ? 'Blocked'
                  : 'Grant'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contacts Permission Row */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
              <IconSymbol name="person.2.fill" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Contacts Integration</Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                {"Required to save digitized contacts directly to your phone's address book."}
              </Text>
            </View>
            <TouchableOpacity
              onPress={requestContacts}
              disabled={contactsStatus === 'granted'}
              style={[
                styles.statusBadge,
                contactsStatus === 'granted'
                  ? { backgroundColor: colors.primaryLight }
                  : contactsStatus === 'denied' && !contactsCanAskAgain
                  ? { borderColor: colors.warning, borderWidth: 1 }
                  : { borderColor: colors.primary, borderWidth: 1 }
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: contactsStatus === 'granted'
                      ? colors.primary
                      : contactsStatus === 'denied' && !contactsCanAskAgain
                      ? colors.warning
                      : colors.primary
                  }
                ]}
              >
                {contactsStatus === 'granted'
                  ? 'Granted ✓'
                  : contactsStatus === 'denied' && !contactsCanAskAgain
                  ? 'Blocked'
                  : 'Grant'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title={cameraStatus === 'granted' && contactsStatus === 'granted' ? 'Continue' : 'Continue in Limited Mode'}
          onPress={handleContinue}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionList: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
  },
  button: {
    width: '100%',
  },
});
