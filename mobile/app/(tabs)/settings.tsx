import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService, BASE_URL } from '@/services/api.service';
import { contactStore } from '@/services/contact.store';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const [user, setUser] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string>('Offline');
  const [defaultCategory, setDefaultCategory] = useState<string>('Other');

  const checkSyncStatus = async (currentUser: any) => {
    if (!apiService.isAuthenticated() || !currentUser) {
      setSyncStatus('Not authenticated');
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
          (c) => c.syncStatus === 'pending' || c.syncStatus === 'failed' || c.syncStatus === 'syncing'
        );

        if (hasUnsynced) {
          setSyncStatus('Failed');
        } else {
          setSyncStatus('Synced');
        }
      } else {
        setSyncStatus('Failed');
      }
    } catch {
      setSyncStatus('Offline');
    }
  };

  const loadDefaultCategory = async () => {
    try {
      const cat = await AsyncStorage.getItem('@quickbiz_default_category');
      if (cat) {
        setDefaultCategory(cat);
      }
    } catch (err) {
      console.warn('Failed to load default category:', err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const currentUser = apiService.getUser();
      setUser(currentUser);
      checkSyncStatus(currentUser);
      loadDefaultCategory();
    }, [])
  );

  const saveCategory = async (cat: string) => {
    try {
      await AsyncStorage.setItem('@quickbiz_default_category', cat);
      setDefaultCategory(cat);
      Alert.alert('Success', `Default category updated to ${cat}`);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleSelectCategory = () => {
    Alert.alert(
      'Default Category (1/2)',
      'Select a category:',
      [
        { text: 'Client', onPress: () => saveCategory('Client') },
        { text: 'Investor', onPress: () => saveCategory('Investor') },
        { text: 'More Options...', onPress: () => selectCategoryPage2() },
      ]
    );
  };

  const selectCategoryPage2 = () => {
    Alert.alert(
      'Default Category (2/2)',
      'Select a category:',
      [
        { text: 'Developer', onPress: () => saveCategory('Developer') },
        { text: 'Friend', onPress: () => saveCategory('Friend') },
        { text: 'Other', onPress: () => saveCategory('Other') },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of QuickBiz?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        onPress: async () => {
          apiService.logout();
          await contactStore.clearAll();
          router.replace('/auth');
        },
      },
    ]);
  };

  const handleTerms = () => {
    Alert.alert(
      'Terms & Conditions',
      `QuickBiz Smart Business Card Scanner Terms of Service:\n\n1. Acceptance of Terms: By using QuickBiz, you agree to these terms.\n\n2. Privacy & Personal Data: QuickBiz processes contact information extracted from scanned business cards. No PII is shared with third parties.\n\n3. Local vs Cloud Storage: Contacts are saved on your local device and synced with your secure MongoDB cloud database.\n\n4. License: QuickBiz is provided "as is" for professional networking usage.`,
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to delete your QuickBiz account? This will permanently delete your user profile and all associated contacts from the MongoDB Cloud. This action CANNOT be undone.',
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
              Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
            } catch (err: any) {
              console.warn(err);
              Alert.alert('Error', err.message || 'Failed to delete account from cloud. Clearing local data only.');
              await contactStore.clearAll();
              apiService.logout();
              router.replace('/auth');
            }
          }
        }
      ]
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'G';
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'Synced':
        return colors.success;
      case 'Syncing':
        return colors.info || '#0EA5E9';
      case 'Failed':
        return colors.error;
      case 'Offline':
        return '#64748B';
      default:
        return colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card Summary */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user ? getInitials(user.name) : 'G'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user ? user.name : 'Guest User'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {user ? user.email : 'Not signed in'}
            </Text>
          </View>
        </View>

        {/* Settings Group 1: General */}
        <Text style={[styles.groupLabel, { color: colors.textMuted }]}>PREFERENCES</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleSelectCategory}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#E0F2FE' }]}>
              <IconSymbol name="person.2.fill" size={18} color="#0284C7" />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>Default Category</Text>
            <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{defaultCategory}</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Settings Group 2: System */}
        <Text style={[styles.groupLabel, { color: colors.textMuted }]}>SYSTEM</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.menuItem, styles.borderBottom]}
            onPress={() => router.push('/permissions')}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#F3E8FF' }]}>
              <IconSymbol name="camera.fill" size={18} color="#8B5CF6" />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>Manage Permissions</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => checkSyncStatus(user)}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#DCFCE7' }]}>
              <IconSymbol name="globe" size={18} color="#10B981" />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>Cloud Sync Status</Text>
            <Text style={[styles.menuValue, { color: getSyncStatusColor() }]}>{syncStatus}</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Settings Group 3: About */}
        <Text style={[styles.groupLabel, { color: colors.textMuted }]}>ABOUT</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.menuItem, styles.borderBottom]} onPress={handleTerms}>
            <Text style={[styles.menuText, { color: colors.text, marginLeft: 0 }]}>Terms & Conditions</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={[styles.menuText, { color: colors.text, marginLeft: 0 }]}>QuickBiz Version</Text>
            <Text style={[styles.menuValue, { color: colors.textSecondary }]}>v1.0.0 (MVP)</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={[styles.actionButton, { borderColor: colors.primary }]}
        >
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleDeleteAccount}
          style={[styles.actionButton, { borderColor: colors.error, marginTop: 12 }]}
        >
          <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 28,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  },
  menuValue: {
    fontSize: 14,
    marginRight: 8,
  },
  actionButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
