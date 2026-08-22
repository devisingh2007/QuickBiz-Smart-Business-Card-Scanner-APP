import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ContactCard, ContactData } from '@/components/ui/ContactCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService, UserProfile } from '@/services/api.service';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Reload profile
      setUserProfile(apiService.getUser());
      
      const loadDashboard = async () => {
        setLoading(true);
        try {
          if (apiService.isAuthenticated()) {
            const fetched = await apiService.getContacts();
            setContacts(fetched);
          } else {
            // Default mock for offline dashboard demo
            setContacts([
              {
                id: '1',
                name: 'Rahul Sharma (Offline Demo)',
                company: 'ABC Technologies',
                designation: 'Software Engineer',
                phone: '+91 9876543210',
                email: 'rahul@abc.com',
                category: 'Client',
              },
              {
                id: '2',
                name: 'Priya Patel (Offline Demo)',
                company: 'XYZ Solutions',
                designation: 'Product Manager',
                phone: '+91 9988776655',
                email: 'priya@xyz.com',
                category: 'Business Partner',
              }
            ]);
          }
        } catch (err: any) {
          console.warn('Dashboard fetch failed:', err.message);
        } finally {
          setLoading(false);
        }
      };

      loadDashboard();
    }, [])
  );

  // Compute stats dynamically
  const totalContacts = contacts.length;
  const addedThisWeek = contacts.filter((c: any) => {
    if (!c.createdAt) return true; // Default mock contacts
    const createdDate = new Date(c.createdAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return createdDate >= oneWeekAgo;
  }).length;

  const recentContacts = contacts.slice(0, 2);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {userProfile ? `Welcome Back 👋` : 'Offline Mode 👋'}
          </Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {userProfile ? userProfile.name : 'Guest User'}
          </Text>
        </View>

        {/* Scan Hero Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/scan')}
          style={[styles.heroCard, { backgroundColor: colors.primary }]}
        >
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Scan Business Card</Text>
            <Text style={styles.heroSubtitle}>Extract and save contacts instantly using camera scanning.</Text>
          </View>
          <View style={styles.heroIconContainer}>
            <IconSymbol name="camera.fill" size={32} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalContacts}</Text>
            )}
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Contacts</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.secondary} />
            ) : (
              <Text style={[styles.statValue, { color: colors.secondary }]}>{addedThisWeek}</Text>
            )}
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Added This Week</Text>
          </View>
        </View>

        {/* Recent Contacts Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Contacts</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/contacts')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Contacts List */}
        <View style={styles.recentList}>
          {loading && contacts.length === 0 ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 12 }} />
          ) : recentContacts.length > 0 ? (
            recentContacts.map((contact) => (
              <ContactCard
                key={contact.id || contact.name}
                contact={contact}
                onPress={() => router.push({
                  pathname: '/contact-details',
                  params: { ...contact }
                })}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>No scanned contacts yet.</Text>
            </View>
          )}
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#E0F2FE',
    fontSize: 14,
    lineHeight: 20,
  },
  heroIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentList: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
});
