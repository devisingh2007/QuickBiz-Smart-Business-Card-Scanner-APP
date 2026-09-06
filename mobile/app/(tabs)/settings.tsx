
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { DangerButton } from '@/components/ui/DangerButton';
import { SunsetStripe } from '@/components/ui/SunsetStripe';
import { apiService, BASE_URL } from '@/services/api.service';
import { contactStore } from '@/services/contact.store';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const [user, setUser] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string>('Offline');

  const checkSyncStatus = async (currentUser: any) => {
    if (!apiService.isAuthenticated() || !currentUser) {
      setSyncStatus('Local Only');
      return;
    }

    setSyncStatus('Syncing');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${BASE_URL}/`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        await contactStore.syncPendingContacts();
        const contacts = contactStore.getContacts();
        const hasUnsynced = contacts.some(
          (c) =>
            c.syncStatus === 'pending' ||
            c.syncStatus === 'failed' ||
            c.syncStatus === 'syncing'
        );

        if (hasUnsynced) {
          setSyncStatus('Unsynced Items');
        } else {
          setSyncStatus('Synced');
        }
      } else {
        setSyncStatus('Sync Failed');
      }
    } catch {
      setSyncStatus('Offline');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const currentUser = apiService.getUser();
      setUser(currentUser);
      checkSyncStatus(currentUser);
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of QuickBiz?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          apiService.logout();
          await contactStore.clearAll();
          router.replace('/auth');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your QuickBiz account? This permanently removes your credentials and cloud backups from the server. This action cannot be reversed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              setSyncStatus('Deleting');
              if (apiService.isAuthenticated()) {
                await apiService.deleteAccount();
              }
              await contactStore.clearAll();
              apiService.logout();
              router.replace('/auth');
              Alert.alert('Account Removed', 'Your profile and remote data have been deleted.');
            } catch (err: any) {
              console.warn(err);
              Alert.alert('Notice', err.message || 'Cleared local data.');
              await contactStore.clearAll();
              apiService.logout();
              router.replace('/auth');
            }
          },
        },
      ]
    );
  };

  const getSyncVariant = (): BadgeVariant => {
    switch (syncStatus) {
      case 'Synced':
        return 'success';
      case 'Syncing':
        return 'orange';
      case 'Unsynced Items':
        return 'cream';
      case 'Local Only':
        return 'neutral';
      case 'Sync Failed':
      case 'Offline':
      default:
        return 'neutral';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Editorial Screen Title */}
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Settings & Account
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            Manage your digital directory, scanning defaults, and account credentials.
          </Text>
        </View>

        {/* Profile Panel: Cream surface with 12px radius & beige border */}
        <View
          style={[
            styles.profilePanel,
            {
              backgroundColor: colors.surfaceCream,
              borderColor: colors.borderBeige,
            },
          ]}
        >
          <View style={styles.profileRow}>
            <Avatar name={user?.name || 'QuickBiz'} size="lg" variant="cream" />
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                {user ? user.name : 'Offline Guest'}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user ? user.email : 'Local device workspace'}
              </Text>

              <View style={styles.badgeRow}>
                <Badge
                  label={user ? 'Authenticated' : 'Offline Mode'}
                  variant={user ? 'orange' : 'neutral'}
                />
                <Badge label={syncStatus} variant={getSyncVariant()} />
              </View>
            </View>
          </View>
        </View>

        {/* Group 1: Scanning Preferences */}
        <Text style={[styles.groupEyebrow, { color: colors.textSecondary }]}>
          SCANNING PREFERENCES
        </Text>
        <View style={[styles.groupSection, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <IconSymbol name="camera.fill" size={17} color={colors.textSecondary} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>OCR Engine</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  Google ML Kit On-Device Text Recognition
                </Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <Badge label="On-Device" variant="dark" />
            </View>
          </View>
        </View>

        {/* Group 2: Synchronization & Storage */}
        <Text style={[styles.groupEyebrow, { color: colors.textSecondary }]}>
          SYNCHRONIZATION & STORAGE
        </Text>
        <View style={[styles.groupSection, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => checkSyncStatus(user)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Check sync status"
          >
            <View style={styles.rowLeft}>
              <IconSymbol name="arrow.triangle.2.circlepath" size={17} color={colors.textSecondary} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Cloud Synchronization</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  Tap to force synchronize with MongoDB backend
                </Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <Badge label={syncStatus} variant={getSyncVariant()} />
              <IconSymbol name="chevron.right" size={14} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <IconSymbol name="person.2.fill" size={17} color={colors.textSecondary} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Native Address Book</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  Contacts automatically export to phone directory
                </Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <Badge label="Enabled" variant="orange" />
            </View>
          </View>
        </View>

        {/* Group 3: Information & Legal */}
        <Text style={[styles.groupEyebrow, { color: colors.textSecondary }]}>
          ABOUT & LEGAL
        </Text>
        <View style={[styles.groupSection, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <IconSymbol name="info.circle.fill" size={17} color={colors.textSecondary} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Application Version</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  Production Build v1.0.0 (Expo SDK 54)
                </Text>
              </View>
            </View>
            <Badge label="Release" variant="neutral" />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {user ? (
            <SecondaryButton
              title="Sign Out of Account"
              onPress={handleLogout}
              variant="outline"
              icon={<IconSymbol name="rectangle.portrait.and.arrow.right" size={16} color={colors.textPrimary} />}
              style={styles.accountBtn}
            />
          ) : (
            <SecondaryButton
              title="Sign In / Register Account"
              onPress={() => router.push('/auth')}
              variant="outline"
              icon={<IconSymbol name="person.fill" size={16} color={colors.textPrimary} />}
              style={styles.accountBtn}
            />
          )}

          <DangerButton
            title="Delete Account & Clear Data"
            onPress={handleDeleteAccount}
            variant="subtle"
            icon={<IconSymbol name="trash.fill" size={15} color={colors.error} />}
            style={styles.deleteBtn}
          />
        </View>

        {/* Sunset Stripe Closing Band */}
        <View style={styles.footerStripe}>
          <SunsetStripe height={4} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            QuickBiz Mobile · Mistral AI Design Recreation
          </Text>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  screenTitle: {
    ...Typography.heading1,
    marginBottom: 4,
  },
  screenSubtitle: {
    ...Typography.bodySm,
    lineHeight: 18,
  },
  profilePanel: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  profileName: {
    ...Typography.heading3,
    fontSize: 17,
  },
  profileEmail: {
    ...Typography.bodySm,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  groupEyebrow: {
    ...Typography.microUppercase,
    marginBottom: 6,
    marginLeft: 2,
  },
  groupSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.xxl,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: Spacing.sm,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowTitle: {
    ...Typography.bodyMdMedium,
    fontSize: 14,
  },
  rowSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 29,
  },
  actionButtonsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  accountBtn: {
    width: '100%',
  },
  deleteBtn: {
    width: '100%',
  },
  footerStripe: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  footerText: {
    ...Typography.micro,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
