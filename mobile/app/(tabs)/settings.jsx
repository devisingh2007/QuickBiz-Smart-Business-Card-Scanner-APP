import { Avatar, } from '@/components/ui/Avatar';
import { IconSymbol, } from '@/components/ui/icon-symbol';
import { CATEGORIES, } from '@/constants/categories';
import { BorderRadius, Spacing, Typography, } from '@/constants/theme';
import { useTheme, } from '@/hooks/use-theme';
import { apiService, } from '@/services/api.service';
import { contactStore, } from '@/services/contact.store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter, } from 'expo-router';
import React, { useCallback, useState, } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';
import { SafeAreaView, } from 'react-native-safe-area-context';
const DEFAULT_CATEGORY_STORAGE_KEY = '@quickbiz_default_category';
export default function SettingsScreen() {
  const router = useRouter();
  const {
    colors,
    isDark,
    themePreference,
    setThemePreference
  } = useTheme();
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Synced');
  const [contacts, setContacts] = useState([]);
  const [defaultCategory, setDefaultCategory] = useState('Client');
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const loadDefaultCategory = async () => {
    try {
      const saved = await AsyncStorage.getItem(DEFAULT_CATEGORY_STORAGE_KEY);
      if (saved && CATEGORIES.includes(saved)) {
        setDefaultCategory(saved);
      }
    } catch {
      // Keep fallback default
    }
  };
  const handleSelectDefaultCategory = async cat => {
    setDefaultCategory(cat);
    setIsCategoryModalVisible(false);
    try {
      await AsyncStorage.setItem(DEFAULT_CATEGORY_STORAGE_KEY, cat);
    } catch (err) {
      console.warn('Failed to save default category:', err);
    }
  };
  const handleSelectTheme = theme => {
    setThemePreference(theme);
    setIsThemeModalVisible(false);
  };
  const getThemeLabel = theme => {
    switch (theme) {
      case 'system':
        return 'System Default';
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
    }
  };
  const checkSyncStatus = async currentUser => {
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
        const hasUnsynced = freshContacts.some(c => c.syncStatus === 'pending' || c.syncStatus === 'failed' || c.syncStatus === 'syncing');
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
  useFocusEffect(useCallback(() => {
    const currentUser = apiService.getUser();
    setUser(currentUser);
    contactStore.initialize().then(() => {
      setContacts(contactStore.getContacts());
    });
    loadDefaultCategory();
    checkSyncStatus(currentUser);
  }, []));
  const handleLogout = () => {
    Alert.alert('Log Out?', 'Sign out of this device?', [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: 'Log Out',
      style: 'destructive',
      onPress: async () => {
        apiService.logout();
        await contactStore.clearAll();
        router.replace('/auth');
      }
    }]);
  };
  const handleDeleteAccount = () => {
    Alert.alert('Delete Account?', 'This permanently removes your account and associated contact records.', [{
      text: 'Cancel',
      style: 'cancel'
    }, {
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
        } catch (err) {
          console.warn(err);
          Alert.alert('Notice', err.message || 'Cleared local data.');
          await contactStore.clearAll();
          apiService.logout();
          router.replace('/auth');
        }
      }
    }]);
  };
  const contactCount = contacts.length;
  const storageSizeKB = (JSON.stringify(contacts).length / 1024).toFixed(1);
  return <SafeAreaView style={[styles.container, {
    backgroundColor: colors.background
  }]} edges={['top', 'left', 'right']}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

    {/* 1. Header */}
    <View style={[styles.header, {
      backgroundColor: colors.surface,
      borderBottomColor: colors.borderSoft
    }]}>
      <View style={styles.headerLeft}>
        <View style={styles.headerOrangeDot} />
        <Text style={[styles.headerTitle, {
          color: colors.textPrimary
        }]}>Settings</Text>
      </View>

      <TouchableOpacity onPress={() => checkSyncStatus(user)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="User profile initials">
        <Avatar name={user?.name || 'QuickBiz'} size="sm" variant="cream" />
      </TouchableOpacity>
    </View>

    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* 2. Main Page Title */}
      <View style={styles.titleSection}>
        <Text style={[styles.mainTitle, {
          color: colors.textPrimary
        }]}>
          Account & Preferences
        </Text>
        <Text style={[styles.mainSubtitle, {
          color: colors.textSecondary
        }]}>
          Manage your QuickBiz profile, appearance, default tags, and synchronization.
        </Text>
      </View>

      {/* 3. Section: ACCOUNT PROFILE */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, {
          color: colors.textMuted
        }]}>ACCOUNT PROFILE</Text>
        <View style={[styles.profileCard, {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder
        }]}>
          <Avatar name={user?.name || 'Offline Guest'} size="md" variant="cream" style={styles.profileAvatar} />
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={[styles.profileName, {
                color: colors.textPrimary
              }]} numberOfLines={1}>
                {user?.name || 'Offline Guest'}
              </Text>
              {user && <View style={[styles.verifiedBadge, {
                backgroundColor: isDark ? 'rgba(27,135,85,0.2)' : '#EDF8F2'
              }]}>
                <IconSymbol name="checkmark.seal.fill" size={12} color="#1B8755" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>}
            </View>

            <Text style={[styles.profileEmail, {
              color: colors.textSecondary
            }]} numberOfLines={1}>
              {user?.email || 'Local device workspace'}
            </Text>

            {user?.id ? <Text style={[styles.profileId, {
              color: colors.textMuted
            }]} numberOfLines={1}>
              QuickBiz ID: {user.id.slice(-6).toUpperCase()}
            </Text> : <Text style={[styles.profileId, {
              color: colors.textMuted
            }]} numberOfLines={1}>
              QuickBiz ID: LOCAL-GUEST
            </Text>}
          </View>

          <IconSymbol name="chevron.right" size={15} color={colors.textMuted} style={styles.chevronIcon} />
        </View>
      </View>

      {/* 4. Section: PREFERENCES */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, {
          color: colors.textMuted
        }]}>PREFERENCES</Text>
        <View style={[styles.groupCard, {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder
        }]}>
          {/* Row 1: Appearance (Theme) */}
          <TouchableOpacity style={styles.groupRow} activeOpacity={0.7} onPress={() => setIsThemeModalVisible(true)} accessibilityRole="button" accessibilityLabel="Change theme appearance">
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconContainer, {
                backgroundColor: isDark ? colors.surface : '#F7F7F8'
              }]}>
                <IconSymbol name={isDark ? 'moon.fill' : 'sun.max.fill'} size={17} color={colors.textPrimary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, {
                  color: colors.textPrimary
                }]}>Appearance</Text>
                <Text style={[styles.rowSubtitle, {
                  color: colors.textSecondary
                }]}>
                  Light mode, dark mode, or system default
                </Text>
              </View>
            </View>

            <View style={styles.rowRight}>
              <View style={[styles.categoryBadge, {
                backgroundColor: isDark ? colors.surface : colors.textPrimary
              }]}>
                <Text style={[styles.categoryBadgeText, {
                  color: isDark ? colors.primary : '#FFFFFF'
                }]}>
                  {getThemeLabel(themePreference)}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={15} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={[styles.rowDivider, {
            backgroundColor: colors.borderSoft
          }]} />

          {/* Row 2: Default Category */}
          <TouchableOpacity style={styles.groupRow} activeOpacity={0.7} onPress={() => setIsCategoryModalVisible(true)} accessibilityRole="button" accessibilityLabel="Change default category">
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconContainer, {
                backgroundColor: isDark ? colors.surface : '#F7F7F8'
              }]}>
                <IconSymbol name="tag" size={17} color={colors.textPrimary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, {
                  color: colors.textPrimary
                }]}>Default Category</Text>
                <Text style={[styles.rowSubtitle, {
                  color: colors.textSecondary
                }]}>
                  Pre-selected tag when saving new cards
                </Text>
              </View>
            </View>

            <View style={styles.rowRight}>
              <View style={[styles.categoryBadge, {
                backgroundColor: isDark ? colors.surface : colors.textPrimary
              }]}>
                <Text style={[styles.categoryBadgeText, {
                  color: isDark ? colors.textPrimary : '#FFFFFF'
                }]}>
                  {defaultCategory}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={15} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Section: DATA & SYNC */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, {
          color: colors.textMuted
        }]}>DATA & SYNC</Text>
        <View style={[styles.groupCard, {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder
        }]}>
          {/* Row 1: Cloud & Native Sync */}
          <TouchableOpacity style={styles.groupRow} activeOpacity={0.7} onPress={() => checkSyncStatus(user)} accessibilityRole="button" accessibilityLabel="Sync status and refresh">
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconContainer, {
                backgroundColor: isDark ? colors.surface : '#F7F7F8'
              }]}>
                <IconSymbol name="arrow.triangle.2.circlepath" size={17} color={colors.textPrimary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, {
                  color: colors.textPrimary
                }]}>Cloud & Native Sync</Text>
                <Text style={[styles.rowSubtitle, {
                  color: colors.textSecondary
                }]}>
                  {contactCount} {contactCount === 1 ? 'card' : 'cards'} digitized • 100% On-device OCR
                </Text>
              </View>
            </View>

            <View style={styles.rowRight}>
              {syncStatus === 'Synced' && <View style={[styles.syncBadgeSuccess, {
                backgroundColor: isDark ? 'rgba(27,135,85,0.2)' : '#EDF8F2'
              }]}>
                <IconSymbol name="checkmark" size={11} color="#1B8755" />
                <Text style={styles.syncBadgeSuccessText}>Synced</Text>
              </View>}
              {syncStatus === 'Syncing' && <View style={[styles.syncBadgeSyncing, {
                backgroundColor: isDark ? 'rgba(250,82,15,0.15)' : '#FFF8E0'
              }]}>
                <ActivityIndicator size="small" color="#FA520F" style={{
                  transform: [{
                    scale: 0.65
                  }]
                }} />
                <Text style={styles.syncBadgeSyncingText}>Syncing</Text>
              </View>}
              {syncStatus === 'Pending' && <View style={[styles.syncBadgePending, {
                backgroundColor: isDark ? 'rgba(217,119,6,0.2)' : '#FEF3C7'
              }]}>
                <Text style={styles.syncBadgePendingText}>Pending</Text>
              </View>}
              {(syncStatus === 'Offline' || syncStatus === 'Local Only') && <View style={[styles.syncBadgeNeutral, {
                backgroundColor: isDark ? colors.surface : '#F3F4F6'
              }]}>
                <Text style={[styles.syncBadgeNeutralText, {
                  color: colors.textSecondary
                }]}>
                  {syncStatus}
                </Text>
              </View>}
              {syncStatus === 'Error' && <View style={[styles.syncBadgeError, {
                backgroundColor: isDark ? 'rgba(220,38,38,0.2)' : '#FEE2E2'
              }]}>
                <Text style={styles.syncBadgeErrorText}>Error</Text>
              </View>}
            </View>
          </TouchableOpacity>

          <View style={[styles.rowDivider, {
            backgroundColor: colors.borderSoft
          }]} />

          {/* Row 2: Local Card Directory */}
          <View style={styles.groupRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconContainer, {
                backgroundColor: isDark ? colors.surface : '#F7F7F8'
              }]}>
                <IconSymbol name="lock.fill" size={17} color={colors.textPrimary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, {
                  color: colors.textPrimary
                }]}>Local Card Directory</Text>
                <Text style={[styles.rowSubtitle, {
                  color: colors.textSecondary
                }]}>
                  Cached offline with high-res scans
                </Text>
              </View>
            </View>

            <View style={styles.rowRight}>
              <Text style={[styles.storageSizeText, {
                color: colors.textMuted
              }]}>
                {storageSizeKB} KB
              </Text>
              <IconSymbol name="chevron.right" size={15} color={colors.textMuted} />
            </View>
          </View>
        </View>
      </View>

      {/* 6. Section: ACCOUNT ACTIONS */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, {
          color: colors.textMuted
        }]}>ACCOUNT ACTIONS</Text>
        <View style={[styles.groupCard, {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder
        }]}>
          {/* Row 1: Log Out */}
          <TouchableOpacity style={styles.groupRow} activeOpacity={0.7} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Log out of this device">
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconContainer, {
                backgroundColor: isDark ? colors.surface : '#F7F7F8'
              }]}>
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={17} color={colors.textPrimary} />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, {
                  color: colors.textPrimary
                }]}>Log Out</Text>
                <Text style={[styles.rowSubtitle, {
                  color: colors.textSecondary
                }]}>
                  Sign out of this device
                </Text>
              </View>
            </View>

            <IconSymbol name="chevron.right" size={15} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, {
            backgroundColor: colors.borderSoft
          }]} />

          {/* Row 2: Delete Account */}
          <TouchableOpacity style={styles.groupRow} activeOpacity={0.7} onPress={handleDeleteAccount} accessibilityRole="button" accessibilityLabel="Delete account and erase records">
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconContainer, {
                backgroundColor: isDark ? 'rgba(220,38,38,0.15)' : '#FEE2E2'
              }]}>
                <IconSymbol name="trash.fill" size={17} color="#DC2626" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, {
                  color: '#DC2626'
                }]}>Delete Account</Text>
                <Text style={[styles.rowSubtitle, {
                  color: colors.textSecondary
                }]}>
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
        <Text style={[styles.footerTextPrimary, {
          color: colors.textMuted
        }]}>
          QuickBiz for Mobile • v{appVersion}
        </Text>
        <Text style={[styles.footerTextSecondary, {
          color: colors.textMuted
        }]}>
          100% On-device ML Kit • End-to-end Local Processing
        </Text>
      </View>
    </ScrollView>

    {/* Theme Appearance Modal */}
    <Modal visible={isThemeModalVisible} transparent animationType="fade" onRequestClose={() => setIsThemeModalVisible(false)}>
      <Pressable style={styles.modalBackdrop} onPress={() => setIsThemeModalVisible(false)}>
        <Pressable style={[styles.modalContent, {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1
        }]} onPress={e => e.stopPropagation()}>
          <View style={[styles.modalHeader, {
            borderBottomColor: colors.borderSoft
          }]}>
            <View>
              <Text style={[styles.modalTitle, {
                color: colors.textPrimary
              }]}>Appearance</Text>
              <Text style={[styles.modalSubtitle, {
                color: colors.textSecondary
              }]}>
                Choose your preferred color theme
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsThemeModalVisible(false)} style={[styles.modalCloseBtn, {
              backgroundColor: colors.surface
            }]} accessibilityRole="button" accessibilityLabel="Close appearance picker">
              <IconSymbol name="xmark" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.categoryList}>
            {['system', 'light', 'dark'].map(themeOpt => {
              const isSelected = themePreference === themeOpt;
              return <TouchableOpacity key={themeOpt} style={[styles.categoryOption, isSelected && {
                backgroundColor: isDark ? colors.surface : '#FFF8E0',
                borderColor: isDark ? colors.primary : '#E6D5A8'
              }]} onPress={() => handleSelectTheme(themeOpt)} activeOpacity={0.7}>
                <View style={styles.categoryOptionLeft}>
                  <View style={[styles.categoryOptionRadio, {
                    borderColor: colors.border
                  }, isSelected && styles.categoryOptionRadioActive]}>
                    {isSelected && <View style={styles.categoryOptionRadioInner} />}
                  </View>
                  <Text style={[styles.categoryOptionText, {
                    color: colors.textPrimary
                  }, isSelected && styles.categoryOptionTextSelected]}>
                    {getThemeLabel(themeOpt)}
                  </Text>
                </View>

                {isSelected && <IconSymbol name="checkmark" size={16} color="#FA520F" />}
              </TouchableOpacity>;
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>

    {/* Category Selection Modal */}
    <Modal visible={isCategoryModalVisible} transparent animationType="fade" onRequestClose={() => setIsCategoryModalVisible(false)}>
      <Pressable style={styles.modalBackdrop} onPress={() => setIsCategoryModalVisible(false)}>
        <Pressable style={[styles.modalContent, {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1
        }]} onPress={e => e.stopPropagation()}>
          <View style={[styles.modalHeader, {
            borderBottomColor: colors.borderSoft
          }]}>
            <View>
              <Text style={[styles.modalTitle, {
                color: colors.textPrimary
              }]}>Default Category</Text>
              <Text style={[styles.modalSubtitle, {
                color: colors.textSecondary
              }]}>
                Choose the default tag applied when scanning business cards
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)} style={[styles.modalCloseBtn, {
              backgroundColor: colors.surface
            }]} accessibilityRole="button" accessibilityLabel="Close category picker">
              <IconSymbol name="xmark" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.categoryList}>
            {CATEGORIES.map(cat => {
              const isSelected = defaultCategory === cat;
              return <TouchableOpacity key={cat} style={[styles.categoryOption, isSelected && {
                backgroundColor: isDark ? colors.surface : '#FFF8E0',
                borderColor: isDark ? colors.primary : '#E6D5A8'
              }]} onPress={() => handleSelectDefaultCategory(cat)} activeOpacity={0.7}>
                <View style={styles.categoryOptionLeft}>
                  <View style={[styles.categoryOptionRadio, {
                    borderColor: colors.border
                  }, isSelected && styles.categoryOptionRadioActive]}>
                    {isSelected && <View style={styles.categoryOptionRadioInner} />}
                  </View>
                  <Text style={[styles.categoryOptionText, {
                    color: colors.textPrimary
                  }, isSelected && styles.categoryOptionTextSelected]}>
                    {cat}
                  </Text>
                </View>

                {isSelected && <IconSymbol name="checkmark" size={16} color="#FA520F" />}
              </TouchableOpacity>;
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerOrangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FA520F'
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl
  },
  titleSection: {
    marginBottom: Spacing.xl
  },
  mainTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 26,
    fontWeight: '400',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 4
  },
  mainSubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 18
  },
  section: {
    marginBottom: Spacing.xl
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2
  },
  profileCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center'
  },
  profileAvatar: {
    marginRight: Spacing.md
  },
  profileInfo: {
    flex: 1
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  profileName: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '600'
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 3
  },
  verifiedText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 10,
    fontWeight: '600',
    color: '#1B8755'
  },
  profileEmail: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    marginTop: 2
  },
  profileId: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500'
  },
  chevronIcon: {
    marginLeft: Spacing.sm
  },
  groupCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden'
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: Spacing.sm
  },
  rowIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  rowTextContainer: {
    flex: 1
  },
  rowTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600'
  },
  rowSubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full
  },
  categoryBadgeText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600'
  },
  syncBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4
  },
  syncBadgeSuccessText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#1B8755'
  },
  syncBadgeSyncing: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4
  },
  syncBadgeSyncingText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#FA520F'
  },
  syncBadgePending: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full
  },
  syncBadgePendingText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706'
  },
  syncBadgeNeutral: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full
  },
  syncBadgeNeutralText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '500'
  },
  syncBadgeError: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full
  },
  syncBadgeErrorText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626'
  },
  storageSizeText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    fontWeight: '500'
  },
  footer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    gap: 4
  },
  footerTextPrimary: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '500'
  },
  footerTextSecondary: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 10,
    textAlign: 'center'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.md
  },
  modalTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2
  },
  modalSubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    maxWidth: 260
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryList: {
    gap: 6
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  categoryOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  categoryOptionRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryOptionRadioActive: {
    borderColor: '#FA520F'
  },
  categoryOptionRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FA520F'
  },
  categoryOptionText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14
  },
  categoryOptionTextSelected: {
    fontWeight: '600',
    color: '#FA520F'
  }
});