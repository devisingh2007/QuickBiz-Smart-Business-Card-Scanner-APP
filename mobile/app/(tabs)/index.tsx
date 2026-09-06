import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Typography, BorderRadius } from '@/constants/theme';
import { ContactRow } from '@/components/ui/ContactRow';
import { SunsetStripe } from '@/components/ui/SunsetStripe';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService } from '@/services/api.service';
import { contactStore, ContactData } from '@/services/contact.store';

export default function HomeScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactData[]>([]);
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>QuickBiz</Text>
          <View style={styles.brandOrangeDot} />
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/(tabs)/settings')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <IconSymbol name="gearshape.fill" size={19} color="#4A4A4A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FA520F"
            colors={['#FA520F']}
          />
        }
      >
        {/* 2. Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEyebrow}>INTELLIGENT OCR DIRECTORY</Text>

          <Text style={styles.heroHeading}>
            Your business{'\n'}contacts, organised.
          </Text>

          <Text style={styles.heroDescription}>
            Scan and digitise physical business cards with privacy-preserving,
            lightning-fast on-device optical character recognition.
          </Text>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.primaryScanButton}
            onPress={() => router.push('/(tabs)/scan')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Scan business card"
          >
            <IconSymbol name="camera.fill" size={18} color="#FFFFFF" />
            <Text style={styles.primaryScanButtonText}>Scan Business Card</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Hero Sunset Divider */}
        <SunsetStripe height={3} style={styles.sunsetDivider} />

        {/* 4. Recent Contacts Section */}
        <View style={styles.recentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Contacts</Text>
            <Text style={styles.totalCountText}>{contacts.length} Total</Text>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FA520F" size="small" />
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

              {contacts.length > 5 && (
                <TouchableOpacity
                  style={styles.viewAllFooter}
                  onPress={() => router.push('/(tabs)/contacts')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllFooterText}>
                    View all {contacts.length} contacts →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* 5. Empty State Card */
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <IconSymbol name="person.2.fill" size={24} color="#FA520F" />
              </View>

              <Text style={styles.emptyTitle}>No Contacts Yet</Text>

              <Text style={styles.emptySubtitle}>
                Capture your first physical card or enter details manually to start
                building your directory.
              </Text>

              {/* Empty State Primary Action */}
              <TouchableOpacity
                style={styles.emptyPrimaryButton}
                onPress={() => router.push('/(tabs)/scan')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Scan your first card"
              >
                <IconSymbol name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.emptyPrimaryButtonText}>
                  Scan Your First Card
                </Text>
              </TouchableOpacity>

              {/* Empty State Secondary Action */}
              <TouchableOpacity
                style={styles.emptySecondaryButton}
                onPress={() =>
                  router.push({
                    pathname: '/review',
                    params: { category: 'Other' },
                  })
                }
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Enter contact manually"
              >
                <IconSymbol name="pencil" size={15} color="#1F1F1F" />
                <Text style={styles.emptySecondaryButtonText}>Enter Manually</Text>
              </TouchableOpacity>

              {/* Trust / Privacy Badge */}
              <View style={styles.trustBadge}>
                <IconSymbol name="lock.fill" size={12} color="#8A8A8A" />
                <Text style={styles.trustText}>
                  100% On-device ML • Private & Offline-ready
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 22,
    fontWeight: '700',
    color: '#1F1F1F',
    letterSpacing: -0.4,
  },
  brandOrangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FA520F',
    marginLeft: 2,
    marginBottom: 4,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  scrollContent: {
    paddingBottom: 40,
    backgroundColor: '#F8F7FF',
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    backgroundColor: '#F8F7FF',
  },
  heroEyebrow: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#FA520F',
    marginBottom: 8,
  },
  heroHeading: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 38,
    letterSpacing: -0.6,
    color: '#1F1F1F',
    marginBottom: 10,
  },
  heroDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#6A6A6A',
    marginBottom: 20,
  },
  primaryScanButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FA520F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FA520F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryScanButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sunsetDivider: {
    width: '100%',
  },
  recentsSection: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F1F1F',
    letterSpacing: -0.2,
  },
  totalCountText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8A8A',
  },
  contactsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  viewAllFooter: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
  },
  viewAllFooterText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    color: '#FA520F',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: '#8A8A8A',
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 24,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF8E0',
    borderWidth: 1,
    borderColor: '#E6D5A8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 17,
    fontWeight: '600',
    color: '#1F1F1F',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 19,
    color: '#6A6A6A',
    textAlign: 'center',
    maxWidth: 270,
    marginBottom: 20,
  },
  emptyPrimaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FA520F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#FA520F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyPrimaryButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptySecondaryButton: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  emptySecondaryButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  trustText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: '#8A8A8A',
  },
});
