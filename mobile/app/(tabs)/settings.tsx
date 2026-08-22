import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of QuickBiz?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', onPress: () => router.replace('/onboarding') },
    ]);
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
            <Text style={[styles.avatarText, { color: colors.primary }]}>DR</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>Devisingh Rajput</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>devisingh@example.com</Text>
          </View>
        </View>

        {/* Settings Group 1: General */}
        <Text style={[styles.groupLabel, { color: colors.textMuted }]}>PREFERENCES</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#E0F2FE' }]}>
              <IconSymbol name="person.2.fill" size={18} color="#0284C7" />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>Default Category</Text>
            <Text style={[styles.menuValue, { color: colors.textSecondary }]}>Client</Text>
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

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#DCFCE7' }]}>
              <IconSymbol name="globe" size={18} color="#10B981" />
            </View>
            <Text style={[styles.menuText, { color: colors.text }]}>Cloud Sync Status</Text>
            <Text style={[styles.menuValue, { color: colors.success }]}>Connected</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Settings Group 3: About */}
        <Text style={[styles.groupLabel, { color: colors.textMuted }]}>ABOUT</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.menuItem, styles.borderBottom]}>
            <Text style={[styles.menuText, { color: colors.text, marginLeft: 0 }]}>Terms & Conditions</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={[styles.menuText, { color: colors.text, marginLeft: 0 }]}>QuickBiz Version</Text>
            <Text style={[styles.menuValue, { color: colors.textSecondary }]}>v1.0.0 (MVP)</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={[styles.logoutButton, { borderColor: colors.error }]}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
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
  logoutButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
