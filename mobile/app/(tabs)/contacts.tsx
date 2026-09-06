import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Palette, Typography } from '@/constants/theme';
import { SearchInput } from '@/components/ui/SearchInput';
import { ContactRow } from '@/components/ui/ContactRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService } from '@/services/api.service';
import { contactStore, ContactData } from '@/services/contact.store';
import { CATEGORIES } from '@/constants/categories';

export default function ContactsScreen() {
  const router = useRouter();
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

      if (apiService.isAuthenticated()) {
        try {
          await contactStore.syncPendingContacts();
        } catch (err) {
          console.warn('Sync pending contacts failed:', err);
        }
      }

      const storedContacts = contactStore.getContacts();
      setAllContacts(storedContacts);
    } catch (err: any) {
      console.warn('Failed to load contacts:', err.message || err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const query = debouncedSearchQuery.toLowerCase().trim();
    const filtered = allContacts.filter((contact) => {
      const matchesSearch =
        !query ||
        contact.name.toLowerCase().includes(query) ||
        (contact.company && contact.company.toLowerCase().includes(query)) ||
        (contact.designation &&
          contact.designation.toLowerCase().includes(query)) ||
        (contact.emails || []).some((e) => e.value.toLowerCase().includes(query)) ||
        (contact.phones || []).some((p) => p.value.toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === 'All' || contact.category === selectedCategory;
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Editorial Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Contacts</Text>
          <Text style={styles.countBadge}>
            {contacts.length} {contacts.length === 1 ? 'record' : 'records'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newContactBtn}
          onPress={() =>
            router.push({
              pathname: '/review',
              params: {
                category: selectedCategory !== 'All' ? selectedCategory : 'Other',
              },
            })
          }
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Add new contact"
        >
          <IconSymbol name="plus" size={14} color="#FFFFFF" />
          <Text style={styles.newContactBtnText}>New Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar with 8px radius */}
      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search name, company, email..."
        />
      </View>

      {/* Mistral Category Filter Pills */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.8}
                style={[
                  styles.categoryPill,
                  isSelected ? styles.categoryPillActive : styles.categoryPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected ? styles.categoryTextActive : styles.categoryTextInactive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Contact List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Palette.primary} size="small" />
          <Text style={styles.loadingText}>Refreshing directory...</Text>
        </View>
      ) : contacts.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No Matching Contacts' : 'No Contacts Yet'}
          description={
            searchQuery
              ? `No contacts found matching "${searchQuery}". Try searching with a different term or category.`
              : 'Your contact library is empty. Scan a business card or enter details manually to start building your directory.'
          }
          actionTitle={searchQuery ? 'Clear Search' : 'Scan Business Card'}
          onAction={
            searchQuery
              ? () => setSearchQuery('')
              : () => router.push('/(tabs)/scan')
          }
          secondaryActionTitle={searchQuery ? undefined : 'Enter Manually'}
          onSecondaryAction={
            searchQuery
              ? undefined
              : () =>
                  router.push({
                    pathname: '/review',
                    params: { category: 'Other' },
                  })
          }
        />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <ContactRow
              contact={item}
              onPress={() =>
                router.push({
                  pathname: '/contact-details',
                  params: { id: item.id },
                })
              }
              showDivider={index < contacts.length - 1}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 28,
    fontWeight: '400',
    color: Palette.ink,
    letterSpacing: -0.6,
  },
  countBadge: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    color: Palette.stone,
    fontWeight: '500',
    marginTop: 2,
  },
  newContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  newContactBtnText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.hairlineSoft,
    paddingBottom: 10,
    marginBottom: 4,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 9999, // Pill geometry permitted for category filter tags
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillActive: {
    backgroundColor: Palette.ink,
    borderColor: Palette.ink,
  },
  categoryPillInactive: {
    backgroundColor: Palette.canvas,
    borderColor: Palette.hairline,
  },
  categoryText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  categoryTextInactive: {
    color: Palette.slate,
  },
  listContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
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
