import React from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ContactCard, ContactData } from '@/components/ui/ContactCard';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const recentContacts: ContactData[] = [
    {
      id: '1',
      name: 'Rahul Sharma',
      company: 'ABC Technologies',
      designation: 'Software Engineer',
      phone: '+91 9876543210',
      email: 'rahul@abc.com',
      category: 'Client',
    },
    {
      id: '2',
      name: 'Priya Patel',
      company: 'XYZ Solutions',
      designation: 'Product Manager',
      phone: '+91 9988776655',
      email: 'priya@xyz.com',
      category: 'Business Partner',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Good Morning 👋</Text>
          <Text style={[styles.title, { color: colors.text }]}>Devisingh Rajput</Text>
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
            <Text style={[styles.statValue, { color: colors.primary }]}>24</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Contacts</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.secondary }]}>8</Text>
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
          {recentContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onPress={() => {
                // Future contact detail modal/navigation
                alert(`Viewing details for ${contact.name}`);
              }}
            />
          ))}
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
});
