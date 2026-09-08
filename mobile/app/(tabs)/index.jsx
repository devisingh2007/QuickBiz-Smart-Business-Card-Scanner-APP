import { ContactRow, } from '@/components/ui/ContactRow';
import { SunsetStripe, } from '@/components/ui/SunsetStripe';
import { IconSymbol, } from '@/components/ui/icon-symbol';
import { BorderRadius, Palette, Typography, } from '@/constants/theme';
import { useTheme, } from '@/hooks/use-theme';
import { apiService, } from '@/services/api.service';
import { contactStore, } from '@/services/contact.store';
import { useFocusEffect, useRouter, } from 'expo-router';
import React, { useCallback, useState, } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';
import { SafeAreaView, } from 'react-native-safe-area-context';
export default function HomeScreen() {
  const router = useRouter();
  const {
    colors,
    isDark
  } = useTheme();
  const [contacts, setContacts] = useState([]);
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
    } catch (err) {
      console.warn('Dashboard fetch failed:', err.message || err);
    }
  };
  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadDashboard().finally(() => setLoading(false));
  }, []));
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };
  const recentContacts = contacts.slice(0, 5);
  return <SafeAreaView style={[styles.safeArea, {
    backgroundColor: colors.background
  }]} edges={['top', 'left', 'right']}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

    {/* 1. Top Header */}
    <View style={[styles.header, {
      backgroundColor: colors.surface,
      borderBottomColor: colors.borderSoft
    }]}>
      <View style={styles.brandRow}>
        <Text style={[styles.brandTitle, {
          color: colors.textPrimary
        }]}>QuickBiz</Text>
        <View style={styles.brandOrangeDot} />
      </View>

      <TouchableOpacity style={[styles.settingsButton, {
        backgroundColor: colors.card,
        borderColor: colors.border
      }]} onPress={() => router.push('/(tabs)/settings')} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Open settings">
        <IconSymbol name="gearshape.fill" size={19} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>

    <ScrollView contentContainerStyle={[styles.scrollContent, {
      backgroundColor: colors.background
    }]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Palette.primary} colors={[Palette.primary]} />}>
      {/* 2. Hero Section */}
      <View style={[styles.heroSection, {
        backgroundColor: isDark ? colors.surface : '#F8F7FF'
      }]}>
        <Text style={styles.heroEyebrow}>INTELLIGENT OCR DIRECTORY</Text>

        <Text style={[styles.heroHeading, {
          color: colors.textPrimary
        }]}>
          Your business{'\n'}contacts, organised.
        </Text>

        <Text style={[styles.heroDescription, {
          color: colors.textSecondary
        }]}>
          Scan and digitise physical business cards with privacy-preserving,
          lightning-fast on-device optical character recognition.
        </Text>

        {/* Primary Action Button */}
        <TouchableOpacity style={styles.primaryScanButton} onPress={() => router.push('/(tabs)/scan')} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Scan business card">
          <IconSymbol name="camera.fill" size={18} color="#FFFFFF" />
          <Text style={styles.primaryScanButtonText}>Scan Business Card</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Hero Sunset Divider */}
      <SunsetStripe height={3} style={styles.sunsetDivider} />

      {/* 4. Recent Contacts Section */}
      <View style={styles.recentsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {
            color: colors.textPrimary
          }]}>Recent Contacts</Text>
          <Text style={[styles.totalCountText, {
            color: colors.textTertiary
          }]}>{contacts.length} Total</Text>
        </View>

        {loading && !refreshing ? <View style={styles.loadingContainer}>
          <ActivityIndicator color={Palette.primary} size="small" />
          <Text style={[styles.loadingText, {
            color: colors.textTertiary
          }]}>Loading directory...</Text>
        </View> : recentContacts.length > 0 ? <View style={[styles.contactsCard, {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder
        }]}>
          {recentContacts.map((contact, index) => <ContactRow key={contact.id || index.toString()} contact={contact} onPress={() => router.push({
            pathname: '/contact-details',
            params: {
              id: contact.id
            }
          })} showDivider={index < recentContacts.length - 1} />)}

          {contacts.length > 5 && <TouchableOpacity style={[styles.viewAllFooter, {
            backgroundColor: colors.surface,
            borderTopColor: colors.borderSoft
          }]} onPress={() => router.push('/(tabs)/contacts')} activeOpacity={0.7}>
            <Text style={styles.viewAllFooterText}>
              View all {contacts.length} contacts →
            </Text>
          </TouchableOpacity>}
        </View> : (/* 5. Empty State Card */
          <View style={[styles.emptyCard, {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder
          }]}>
            <View style={[styles.emptyIconCircle, {
              backgroundColor: colors.surfaceCream,
              borderColor: colors.borderBeige
            }]}>
              <IconSymbol name="person.2.fill" size={24} color={Palette.primary} />
            </View>

            <Text style={[styles.emptyTitle, {
              color: colors.textPrimary
            }]}>No Contacts Yet</Text>

            <Text style={[styles.emptySubtitle, {
              color: colors.textSecondary
            }]}>
              Capture your first physical card or enter details manually to start
              building your directory.
            </Text>

            {/* Empty State Primary Action */}
            <TouchableOpacity style={styles.emptyPrimaryButton} onPress={() => router.push('/(tabs)/scan')} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Scan your first card">
              <IconSymbol name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.emptyPrimaryButtonText}>
                Scan Your First Card
              </Text>
            </TouchableOpacity>

            {/* Empty State Secondary Action */}
            <TouchableOpacity style={[styles.emptySecondaryButton, {
              backgroundColor: colors.surface,
              borderColor: colors.border
            }]} onPress={() => router.push({
              pathname: '/review',
              params: {
                category: 'Other'
              }
            })} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Enter contact manually">
              <IconSymbol name="pencil" size={15} color={colors.textPrimary} />
              <Text style={[styles.emptySecondaryButtonText, {
                color: colors.textPrimary
              }]}>Enter Manually</Text>
            </TouchableOpacity>

            {/* Trust / Privacy Badge */}
            <View style={styles.trustBadge}>
              <IconSymbol name="lock.fill" size={12} color={colors.textTertiary} />
              <Text style={[styles.trustText, {
                color: colors.textTertiary
              }]}>
                100% On-device ML • Private & Offline-ready
              </Text>
            </View>
          </View>)}
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end'
  },
  brandTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4
  },
  brandOrangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.primary,
    marginLeft: 2,
    marginBottom: 4
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  scrollContent: {
    paddingBottom: 40
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22
  },
  heroEyebrow: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Palette.primary,
    marginBottom: 8
  },
  heroHeading: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 38,
    letterSpacing: -0.6,
    marginBottom: 10
  },
  heroDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 20
  },
  primaryScanButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: Palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Palette.primary,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  primaryScanButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  sunsetDivider: {
    width: '100%'
  },
  recentsSection: {
    paddingHorizontal: 20,
    paddingTop: 22
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2
  },
  totalCountText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    fontWeight: '500'
  },
  contactsCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden'
  },
  viewAllFooter: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth
  },
  viewAllFooterText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    color: Palette.primary
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    marginTop: 10
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6
  },
  emptySubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 270,
    marginBottom: 20
  },
  emptyPrimaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: Palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: Palette.primary,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  emptyPrimaryButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  emptySecondaryButton: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10
  },
  emptySecondaryButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600'
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18
  },
  trustText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11
  }
});