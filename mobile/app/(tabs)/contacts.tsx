import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ContactCard, ContactData } from '@/components/ui/ContactCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService } from '@/services/api.service';
import { contactStore } from '@/services/contact.store';
import { CATEGORIES } from '@/constants/categories';

export default function ContactsScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [allContacts, setAllContacts] = useState<ContactData[]>([]);
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = ['All', ...CATEGORIES];

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      await contactStore.initialize();

      // Trigger automatic background synchronization if online and logged in
      if (apiService.isAuthenticated()) {
        try {
          await contactStore.syncPendingContacts();
        } catch (err) {
          console.warn('Sync pending contacts failed:', err);
        }
      }

      // Fetch from persistent local/sync database cache
      const storedContacts = contactStore.getContacts();
      setAllContacts(storedContacts);
    } catch (err: any) {
      console.warn('Failed to load contacts:', err.message || err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Perform in-memory filtering of contacts
  useEffect(() => {
    const query = debouncedSearchQuery.toLowerCase().trim();
    const filtered = allContacts.filter(contact => {
      const matchesSearch = !query || 
        contact.name.toLowerCase().includes(query) ||
        (contact.company && contact.company.toLowerCase().includes(query)) ||
        (contact.designation && contact.designation.toLowerCase().includes(query)) ||
        (contact.emails || []).some(e => e.value.toLowerCase().includes(query)) ||
        (contact.phones || []).some(p => p.value.toLowerCase().includes(query));

      const matchesCategory = selectedCategory === 'All' || contact.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setContacts(filtered);
  }, [allContacts, selectedCategory, debouncedSearchQuery]);

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
                params: {
                  id: item.id || '',
                  name: item.name || '',
                  company: item.company || '',
                  designation: item.designation || '',
                  officeAddress: item.officeAddress || '',
                  category: item.category || 'Other',
                  nativeContactId: item.nativeContactId || '',
                  phonesJson: JSON.stringify(item.phones || []),
                  emailsJson: JSON.stringify(item.emails || []),
                  websitesJson: JSON.stringify(item.websites || []),
                  extractionQualityScore: item.extractionQualityScore ? String(item.extractionQualityScore) : ''
                }
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
