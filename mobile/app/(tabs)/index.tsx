import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Palette, Typography, BorderRadius } from '@/constants/theme';
import { AppHeader } from '@/components/ui/AppHeader';
import { EditorialTitle } from '@/components/ui/EditorialTitle';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ContactRow } from '@/components/ui/ContactRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { SunsetStripe } from '@/components/ui/SunsetStripe';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService, UserProfile } from '@/services/api.service';
import { contactStore, ContactData } from '@/services/contact.store';

export default function HomeScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      await contactStore.initialize();

      // Sync pending contacts if authenticated and online
      if (apiService.isAuthenticated()) {
        try {
          await contactStore.syncPendingContacts();
        } catch (err) {
          console.warn('Sync pending contacts failed:', err);
        }
      }

      setContacts(contactStore.getContacts());
    } catch (err: any) {
      console.warn('Dashboard fetch failed:', err.message || err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setUserProfile(apiService.getUser());
      setLoading(true);
      loadDashboard().finally(() => setLoading(false));
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const recentContacts = contacts.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader
        title="QuickBiz"
        rightAction={
          <View style={styles.headerAction}>
            <IconSymbol
              name="gearshape.fill"
              size={18}
              color={Palette.slate}
            />
          </View>
        }
        onRightAction={() => router.push('/(tabs)/settings')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Palette.primary}
            colors={[Palette.primary]}
          />
        }
      >
        {/* Editorial Introduction & Hero Banner */}
        <View style={styles.heroSection}>
          <EditorialTitle
            title="Your business contacts,&#10;organized."
            subtitle={
              userProfile?.name
                ? `Logged in as ${userProfile.name}. Scan and archive physical business cards with on-device precision.`
                : 'Scan and digitize physical business cards with on-device optical character recognition.'
            }
            size="hero"
          />

          <View style={styles.actionRow}>
            <PrimaryButton
              title="Scan Business Card"
              onPress={() => router.push('/(tabs)/scan')}
              icon={<IconSymbol name="camera.fill" size={16} color="#FFFFFF" />}
              style={styles.scanButton}
            />
          </View>
        </View>

        {/* Sunset Signature Stripe Accent */}
        <SunsetStripe height={3} style={styles.sunsetStripe} />

        {/* Directory Snapshot & Recents */}
        <View style={styles.recentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Contacts</Text>
            {contacts.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/contacts')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.viewAllText}>
                  View all ({contacts.length}) →
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Palette.primary} size="small" />
              <Text style={styles.loadingText}>Loading directory...</Text>
            </View>
          ) : recentContacts.length > 0 ? (
            <View style={styles.contactsCard}>
              {recentContacts.map((contact, index) => (
                <ContactRow
                  key={contact.id || index.toString()}
                  contact={contact}
                  onPress={() =>
                    router.push({
                      pathname: '/contact-details',
                      params: { id: contact.id },
                    })
                  }
                  showDivider={index < recentContacts.length - 1}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              title="No Contacts Yet"
              description="Capture your first card or enter details manually to start building your directory."
              actionTitle="Scan Your First Card"
              onAction={() => router.push('/(tabs)/scan')}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    backgroundColor: Palette.canvas,
  },
  actionRow: {
    marginTop: 8,
  },
  scanButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
  },
  sunsetStripe: {
    marginVertical: 4,
  },
  recentsSection: {
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    color: Palette.ink,
    letterSpacing: -0.2,
  },
  viewAllText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    fontWeight: '500',
    color: Palette.primary,
  },
  contactsCard: {
    backgroundColor: Palette.canvas,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Palette.hairlineSoft,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: Palette.stone,
    marginTop: 10,
  },
});
