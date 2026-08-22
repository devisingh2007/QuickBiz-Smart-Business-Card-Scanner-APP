import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function PermissionScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  // State to simulate permission requests
  const [cameraGranted, setCameraGranted] = useState<boolean | null>(null);
  const [contactsGranted, setContactsGranted] = useState<boolean | null>(null);

  const requestCamera = () => {
    // Mock granting camera permission
    setCameraGranted(true);
  };

  const requestContacts = () => {
    // Mock granting contacts permission
    setContactsGranted(true);
  };

  const handleContinue = () => {
    if (cameraGranted && contactsGranted) {
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
              style={[
                styles.statusBadge,
                cameraGranted === true ? { backgroundColor: colors.primaryLight } : { borderColor: colors.primary, borderWidth: 1 }
              ]}
            >
              <Text style={[styles.badgeText, { color: cameraGranted === true ? colors.primary : colors.primary }]}>
                {cameraGranted === true ? 'Granted ✓' : 'Grant'}
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
              style={[
                styles.statusBadge,
                contactsGranted === true ? { backgroundColor: colors.primaryLight } : { borderColor: colors.primary, borderWidth: 1 }
              ]}
            >
              <Text style={[styles.badgeText, { color: contactsGranted === true ? colors.primary : colors.primary }]}>
                {contactsGranted === true ? 'Granted ✓' : 'Grant'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title={cameraGranted && contactsGranted ? 'Continue' : 'Continue in Limited Mode'}
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
