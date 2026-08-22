import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Contacts from 'expo-contacts';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { InputField } from '@/components/ui/InputField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { apiService } from '@/services/api.service';
import { contactStore } from '@/services/contact.store';

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  // Initialize fields from router parameters (extracted via OCR)
  const [name, setName] = useState((params.name as string) || '');
  const [phone, setPhone] = useState((params.phone as string) || '');
  const [email, setEmail] = useState((params.email as string) || '');
  const [company, setCompany] = useState((params.company as string) || '');
  const [designation, setDesignation] = useState((params.designation as string) || '');
  const [officeAddress, setOfficeAddress] = useState((params.officeAddress as string) || '');
  const [category, setCategory] = useState<any>((params.category as string) || 'Client');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = ['Client', 'Recruiter', 'Investor', 'Developer', 'Business Partner', 'Customer', 'Friend', 'Other'];

  const validate = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!name) tempErrors.name = 'Name is required';
    if (email && !/\S+@\S+\.\S+/.test(email)) tempErrors.email = 'Invalid email format';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Create native device contact
  const saveNativeContact = async (): Promise<string | null> => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Contacts Permission Denied',
        'QuickBiz needs Contacts permissions to save the contact on your phone. You can still backup to MongoDB.',
        [{ text: 'OK' }]
      );
      return null;
    }

    try {
      const contactFields: any = {
        firstName: name.split(' ')[0] || '',
        lastName: name.split(' ').slice(1).join(' ') || '',
        phoneNumbers: phone ? [{ label: 'mobile', number: phone }] : [],
        emails: email ? [{ label: 'work', email }] : [],
        company: company || '',
        jobTitle: designation || '',
        addresses: officeAddress ? [{ label: 'work', street: officeAddress }] : [],
      };

      const contactId = await Contacts.addContactAsync(contactFields);
      return contactId;
    } catch (err: any) {
      console.warn('Native contact creation failed:', err.message || err);
      return null;
    }
  };

  const handleSave = async (force = false) => {
    if (!validate()) return;
    setLoading(true);

    try {
      let nativeContactId: string | null = null;
      
      // 1. Try to save native contact first (local-first approach)
      if (Platform.OS !== 'web') {
        nativeContactId = await saveNativeContact();
      }

      const contactData = {
        id: (params.id as string) || undefined,
        name,
        phone,
        email,
        company,
        designation,
        officeAddress,
        category,
        nativeContactId: nativeContactId || undefined,
        syncStatus: 'pending' as any,
      };

      if (params.id) {
        // Edit mode
        await contactStore.updateContact(params.id as string, contactData);
        Alert.alert('Success', 'Contact updated successfully!');
        router.replace('/(tabs)');
      } else {
        // Create mode
        const result = await contactStore.saveContact(contactData, force);
        if (result.duplicate) {
          setLoading(false);
          // If it is a duplicate, prompt user to force save or cancel
          Alert.alert(
            'Duplicate Contact',
            result.message || 'This contact might already exist in your directory. Do you want to save it anyway?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Save Anyway', onPress: () => handleSave(true) }
            ]
          );
          return;
        }

        if (apiService.isAuthenticated()) {
          Alert.alert('Success', 'Contact saved and synced successfully!');
        } else {
          Alert.alert(
            'Offline Mode',
            'Contact saved locally. Sign in later to backup to MongoDB Cloud.',
            [{ text: 'OK' }]
          );
        }
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Save Error', error.message || 'Failed to save contact. Stored locally.');
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Review Contact</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>EXTRACTED DETAILS</Text>
          
          <InputField
            label="Full Name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
          />

          <InputField
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <InputField
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField
            label="Company"
            value={company}
            onChangeText={setCompany}
            autoCapitalize="words"
          />

          <InputField
            label="Designation (Job Title)"
            value={designation}
            onChangeText={setDesignation}
            autoCapitalize="words"
          />

          <InputField
            label="Office Address"
            value={officeAddress}
            onChangeText={setOfficeAddress}
            multiline
            numberOfLines={3}
            style={styles.addressInput}
          />

          {/* Category Selector */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
            style={styles.categoryContainer}
          >
            {categories.map((cat) => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
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
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <PrimaryButton
            title="Save Contact"
            onPress={() => handleSave(false)}
            loading={loading}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingVertical: 8,
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  addressInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  categoryContainer: {
    marginBottom: 28,
  },
  categoryScroll: {
    gap: 8,
    paddingRight: 16,
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
  saveBtn: {
    marginTop: 12,
  },
});
