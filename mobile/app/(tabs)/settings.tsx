import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/ui/Avatar';
import { CATEGORIES, ContactCategory } from '@/constants/categories';
import { apiService, UserProfile } from '@/services/api.service';
import { contactStore, ContactData } from '@/services/contact.store';

const DEFAULT_CATEGORY_STORAGE_KEY = '@quickbiz_default_category';

export default function SettingsScreen() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing' | 'Pending' | 'Offline' | 'Error' | 'Local Only'>('Synced');
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [defaultCategory, setDefaultCategory] = useState<ContactCategory>('Client');
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState<boolean>(false);

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const loadDefaultCategory = async () => {
    try {
      const saved = await AsyncStorage.getItem(DEFAULT_CATEGORY_STORAGE_KEY);
      if (saved && CATEGORIES.includes(saved as ContactCategory)) {
        setDefaultCategory(saved as ContactCategory);
      }
    } catch {
      // Keep fallback default
    }
  };

  const handleSelectDefaultCategory = async (cat: ContactCategory) => {
    setDefaultCategory(cat);
    setIsCategoryModalVisible(false);
    try {
      await AsyncStorage.setItem(DEFAULT_CATEGORY_STORAGE_KEY, cat);
    } catch (err) {
      console.warn('Failed to save default category:', err);
    }
  };

  const checkSyncStatus = async (currentUser: UserProfile | null) => {
    if (!apiService.isAuthenticated() || !currentUser) {
      setSyncStatus('Local Only');
      return;
    }

    setSyncStatus('Syncing');

    try {
      const isOnline = await apiService.ping();

      if (isOnline) {
        await contactStore.syncPendingContacts();
        const freshContacts = contactStore.getContacts();
        setContacts(freshContacts);

        const hasUnsynced = freshContacts.some(
          (c) =>
            c.syncStatus === 'pending' ||
            c.syncStatus === 'failed' ||
            c.syncStatus === 'syncing'
        );

        if (hasUnsynced) {
          setSyncStatus('Pending');
        } else {
          setSyncStatus('Synced');
        }
      } else {
        setSyncStatus('Offline');
      }
    } catch {
      setSyncStatus('Offline');
    }
  };

  useFocusEffect(
    useCallback(() => {
      const currentUser = apiService.getUser();
      setUser(currentUser);
      contactStore.initialize().then(() => {
        setContacts(contactStore.getContacts());
      });
      loadDefaultCategory();
      checkSyncStatus(currentUser);
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Log Out?', 'Sign out of this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
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
      'Delete Account?',
      'This permanently removes your account and associated contact records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
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

  const contactCount = contacts.length;
  const storageSizeKB = (JSON.stringify(contacts).length / 1024).toFixed(1);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerOrangeDot} />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <TouchableOpacity
          onPress={() => checkSyncStatus(user)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="User profile initials"
        >
          <Avatar
            name={user?.name || 'QuickBiz'}
            size="sm"
            variant="cream"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Main Page Title */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Account & Preferences</Text>
          <Text style={styles.mainSubtitle}>
            Manage your QuickBiz profile, default tags, and local synchronization.
          </Text>
        </View>

        {/* 3. Section: ACCOUNT PROFILE */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT PROFILE</Text>
          <View style={styles.profileCard}>
            <Avatar
              name={user?.name || 'Offline Guest'}
              size="md"
              variant="cream"
              style={styles.profileAvatar}
            />
            <View style={styles.profileInfo}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user?.name || 'Offline Guest'}
                </Text>
                {user && (
                  <View style={styles.verifiedBadge}>
                    <IconSymbol name="checkmark.seal.fill" size={12} color="#1B8755" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>

              <Text style={styles.profileEmail} numberOfLines={1}>
                {user?.email || 'Local device workspace'}
              </Text>

              {user?.id ? (
                <Text style={styles.profileId} numberOfLines={1}>
                  QuickBiz ID: {user.id.slice(-6).toUpperCase()}
                </Text>
              ) : (
                <Text style={styles.profileId} numberOfLines={1}>
                  QuickBiz ID: LOCAL-GUEST
                </Text>
              )}
            </View>

            <IconSymbol name="chevron.right" size={15} color="#A8A8A8" style={styles.chevronIcon} />
          </View>
        </View>

        {/* 4. Section: PREFERENCES */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <TouchableOpacity
            style={styles.cardSingleRow}
            activeOpacity={0.7}
            onPress={() => setIsCategoryModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Change default category"
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconContainer}>
                <IconSymbol name="tag" size={17} color="#4A4A4A" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Default Category</Text>
                <Text style={styles.rowSubtitle}>
                  Pre-selected tag when saving new cards
                </Text>
              </View>
            </View>

            <View style={styles.rowRight}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{defaultCategory}</Text>
              </View>
              <IconSymbol name="chevron.right" size={15} color="#A8A8A8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 5. Section: DATA & SYNC */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATA & SYNC</Text>
          <View style={styles.groupCard}>
            {/* Row 1: Cloud & Native Sync */}
            <TouchableOpacity
              style={styles.groupRow}
              activeOpacity={0.7}
              onPress={() => checkSyncStatus(user)}
              accessibilityRole="button"
              accessibilityLabel="Sync status and refresh"
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIconContainer}>
                  <IconSymbol name="arrow.triangle.2.circlepath" size={17} color="#4A4A4A" />
                </View>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowTitle}>Cloud & Native Sync</Text>
                  <Text style={styles.rowSubtitle}>
                    {contactCount} {contactCount === 1 ? 'card' : 'cards'} digitized • 100% On-device OCR
                  </Text>
                </View>
              </View>

              <View style={styles.rowRight}>
                {syncStatus === 'Synced' && (
                  <View style={styles.syncBadgeSuccess}>
                    <IconSymbol name="checkmark" size={11} color="#1B8755" />
                    <Text style={styles.syncBadgeSuccessText}>Synced</Text>
                  </View>
                )}
                {syncStatus === 'Syncing' && (
                  <View style={styles.syncBadgeSyncing}>
                    <ActivityIndicator size="small" color="#FA520F" style={{ transform: [{ scale: 0.65 }] }} />
                    <Text style={styles.syncBadgeSyncingText}>Syncing</Text>
                  </View>
                )}
                {syncStatus === 'Pending' && (
                  <View style={styles.syncBadgePending}>
                    <Text style={styles.syncBadgePendingText}>Pending</Text>
                  </View>
                )}
                {(syncStatus === 'Offline' || syncStatus === 'Local Only') && (
                  <View style={styles.syncBadgeNeutral}>
                    <Text style={styles.syncBadgeNeutralText}>{syncStatus}</Text>
                  </View>
                )}
                {syncStatus === 'Error' && (
                  <View style={styles.syncBadgeError}>
                    <Text style={styles.syncBadgeErrorText}>Error</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* Row 2: Local Card Directory */}
            <View style={styles.groupRow}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconContainer}>
                  <IconSymbol name="lock.fill" size={17} color="#4A4A4A" />
                </View>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowTitle}>Local Card Directory</Text>
                  <Text style={styles.rowSubtitle}>
                    Cached offline with high-res scans
                  </Text>
                </View>
              </View>

              <View style={styles.rowRight}>
                <Text style={styles.storageSizeText}>{storageSizeKB} KB</Text>
                <IconSymbol name="chevron.right" size={15} color="#A8A8A8" />
              </View>
            </View>
          </View>
        </View>

        {/* 6. Section: ACCOUNT ACTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT ACTIONS</Text>
          <View style={styles.groupCard}>
            {/* Row 1: Log Out */}
            <TouchableOpacity
              style={styles.groupRow}
              activeOpacity={0.7}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Log out of this device"
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIconContainer}>
                  <IconSymbol name="rectangle.portrait.and.arrow.right" size={17} color="#1F1F1F" />
                </View>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowTitle}>Log Out</Text>
                  <Text style={styles.rowSubtitle}>
                    Sign out of this device
                  </Text>
                </View>
              </View>

              <IconSymbol name="chevron.right" size={15} color="#A8A8A8" />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* Row 2: Delete Account */}
            <TouchableOpacity
              style={styles.groupRow}
              activeOpacity={0.7}
              onPress={handleDeleteAccount}
              accessibilityRole="button"
              accessibilityLabel="Delete account and erase records"
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <IconSymbol name="trash.fill" size={17} color="#DC2626" />
                </View>
                <View style={styles.rowTextContainer}>
                  <Text style={[styles.rowTitle, { color: '#DC2626' }]}>Delete Account</Text>
                  <Text style={styles.rowSubtitle}>
                    Permanently erase cards and contact records
                  </Text>
                </View>
              </View>

              <IconSymbol name="chevron.right" size={15} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTextPrimary}>
            QuickBiz for Mobile • v{appVersion}
          </Text>
          <Text style={styles.footerTextSecondary}>
            100% On-device ML Kit • End-to-end Local Processing
          </Text>
        </View>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={isCategoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsCategoryModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Default Category</Text>
                <Text style={styles.modalSubtitle}>
                  Choose the default tag applied when scanning business cards
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCategoryModalVisible(false)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Close category picker"
              >
                <IconSymbol name="xmark" size={16} color="#6A6A6A" />
              </TouchableOpacity>
            </View>

            <View style={styles.categoryList}>
              {CATEGORIES.map((cat) => {
                const isSelected = defaultCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      isSelected && styles.categoryOptionSelected,
                    ]}
                    onPress={() => handleSelectDefaultCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryOptionLeft}>
                      <View
                        style={[
                          styles.categoryOptionRadio,
                          isSelected && styles.categoryOptionRadioActive,
                        ]}
                      >
                        {isSelected && <View style={styles.categoryOptionRadioInner} />}
                      </View>
                      <Text
                        style={[
                          styles.categoryOptionText,
                          isSelected && styles.categoryOptionTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </View>

                    {isSelected && (
                      <IconSymbol name="checkmark" size={16} color="#FA520F" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerOrangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FA520F',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 17,
    fontWeight: '600',
    color: '#1F1F1F',
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  mainTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 26,
    fontWeight: '400',
    lineHeight: 32,
    letterSpacing: -0.5,
    color: '#1F1F1F',
    marginBottom: 4,
  },
  mainSubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
    color: '#6A6A6A',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: '#8A8A8A',
    marginBottom: 8,
    marginLeft: 2,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF8F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  verifiedText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 10,
    fontWeight: '600',
    color: '#1B8755',
  },
  profileEmail: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: '#6A6A6A',
    marginTop: 2,
  },
  profileId: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: '#A8A8A8',
    marginTop: 3,
    fontWeight: '500',
  },
  chevronIcon: {
    marginLeft: Spacing.sm,
  },
  cardSingleRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: Spacing.sm,
  },
  rowIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F7F7F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  rowSubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    color: '#6A6A6A',
    marginTop: 2,
    lineHeight: 16,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F0',
    marginLeft: 56,
  },
  categoryBadge: {
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  syncBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF8F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  syncBadgeSuccessText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#1B8755',
  },
  syncBadgeSyncing: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  syncBadgeSyncingText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#FA520F',
  },
  syncBadgePending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  syncBadgePendingText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  syncBadgeNeutral: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  syncBadgeNeutralText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '500',
    color: '#6A6A6A',
  },
  syncBadgeError: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  syncBadgeErrorText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  storageSizeText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    fontWeight: '500',
    color: '#6A6A6A',
  },
  footer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  footerTextPrimary: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '500',
    color: '#A8A8A8',
  },
  footerTextSecondary: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 10,
    color: '#A8A8A8',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
    paddingBottom: Spacing.md,
  },
  modalTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 17,
    fontWeight: '600',
    color: '#1F1F1F',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    color: '#6A6A6A',
    maxWidth: 260,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryList: {
    gap: 6,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    backgroundColor: '#FFF8E0',
    borderColor: '#E6D5A8',
  },
  categoryOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryOptionRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#A8A8A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryOptionRadioActive: {
    borderColor: '#FA520F',
  },
  categoryOptionRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FA520F',
  },
  categoryOptionText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: '#1F1F1F',
  },
  categoryOptionTextSelected: {
    fontWeight: '600',
    color: '#FA520F',
  },
});
