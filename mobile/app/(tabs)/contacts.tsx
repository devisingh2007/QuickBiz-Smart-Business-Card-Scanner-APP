import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ContactCard, ContactData } from '@/components/ui/ContactCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService } from '@/services/api.service';

export default function ContactsScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = ['All', 'Client', 'Recruiter', 'Investor', 'Developer', 'Business Partner', 'Customer', 'Friend', 'Other'];

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      if (apiService.isAuthenticated()) {
        const fetched = await apiService.getContacts(selectedCategory, searchQuery);
        setContacts(fetched);
      } else {
        // Fallback for offline demo
        const offlineMock: ContactData[] = [
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
        ];

        // Filter offline mocks locally
        const filtered = offlineMock.filter(contact => {
          const matchesSearch = 
            contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.company.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCategory = selectedCategory === 'All' || contact.category === selectedCategory;
          return matchesSearch && matchesCategory;
        });

        setContacts(filtered);
      }
    } catch (err: any) {
      console.warn('Failed to load contacts:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, [fetchContacts])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Contacts</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search contacts..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="chevron.left" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryTab,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: colors.textSecondary },
                    isSelected && { color: '#FFFFFF', fontWeight: '600' },
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Contacts List */}
      {loading && contacts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id || item.name}
          renderItem={({ item }) => (
            <ContactCard
              contact={item}
              onPress={() => router.push({
                pathname: '/contact-details',
                params: { ...item }
              })}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No contacts found</Text>
            </View>
          }
        />
      )}
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
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
