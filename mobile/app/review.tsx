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
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CATEGORIES } from '@/constants/categories';

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  // Initialize fields from router parameters (extracted via OCR)
  const [name, setName] = useState((params.name as string) || '');
  const [company, setCompany] = useState((params.company as string) || '');
  const [designation, setDesignation] = useState((params.designation as string) || '');
  const [officeAddress, setOfficeAddress] = useState((params.officeAddress as string) || '');
  const [category, setCategory] = useState<any>((params.category as string) || 'Other');

  // Load and format multi-value parameter arrays
  const [phones, setPhones] = useState<{ value: string; type: string; label: string }[]>(() => {
    if (params.phonesJson) {
      try {
        const parsed = JSON.parse(params.phonesJson as string);
        if (parsed.length > 0) return parsed;
      } catch {}
    }
    if (params.phone) {
      return [{ value: params.phone as string, type: 'mobile', label: 'Mobile' }];
    }
    return [{ value: '', type: 'mobile', label: 'Mobile' }];
  });

  const [emails, setEmails] = useState<{ value: string; type: string }[]>(() => {
    if (params.emailsJson) {
      try {
        const parsed = JSON.parse(params.emailsJson as string);
        if (parsed.length > 0) return parsed;
      } catch {}
    }
    if (params.email) {
      return [{ value: params.email as string, type: 'work' }];
    }
    return [{ value: '', type: 'work' }];
  });

  const [websites, setWebsites] = useState<{ value: string; type: string }[]>(() => {
    if (params.websitesJson) {
      try {
        const parsed = JSON.parse(params.websitesJson as string);
        if (parsed.length > 0) return parsed;
      } catch {}
    }
    if (params.website) {
      return [{ value: params.website as string, type: 'work' }];
    }
    return [{ value: '', type: 'work' }];
  });

  const qualityScore = params.extractionQualityScore ? Number(params.extractionQualityScore) : null;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = CATEGORIES;

  const validate = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!name) tempErrors.name = 'Name is required';
    
    // Validate email inputs
    emails.forEach((email, idx) => {
      if (email.value && !/\S+@\S+\.\S+/.test(email.value)) {
        tempErrors[`email_${idx}`] = 'Invalid email format';
      }
    });

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Add/Remove multi-value fields helpers
  const addPhoneField = () => setPhones([...phones, { value: '', type: 'office', label: 'Office' }]);
  const removePhoneField = (index: number) => setPhones(phones.filter((_, idx) => idx !== index));
  const updatePhoneValue = (index: number, val: string) => {
    const next = [...phones];
    next[index].value = val;
    setPhones(next);
  };

  const addEmailField = () => setEmails([...emails, { value: '', type: 'work' }]);
  const removeEmailField = (index: number) => setEmails(emails.filter((_, idx) => idx !== index));
  const updateEmailValue = (index: number, val: string) => {
    const next = [...emails];
    next[index].value = val;
    setEmails(next);
  };

  const addWebsiteField = () => setWebsites([...websites, { value: '', type: 'work' }]);
  const removeWebsiteField = (index: number) => setWebsites(websites.filter((_, idx) => idx !== index));
  const updateWebsiteValue = (index: number, val: string) => {
    const next = [...websites];
    next[index].value = val;
    setWebsites(next);
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
        phoneNumbers: phones.filter((p) => p.value).map((p) => ({ label: p.label.toLowerCase(), number: p.value })),
        emails: emails.filter((e) => e.value).map((e) => ({ label: e.type.toLowerCase(), email: e.value })),
        company: company || '',
        jobTitle: designation || '',
        addresses: officeAddress ? [{ label: 'work', street: officeAddress }] : [],
        urlAddresses: websites.filter((w) => w.value).map((w) => ({ label: w.type.toLowerCase(), url: w.value })),
      };

      const contactId = await Contacts.addContactAsync(contactFields);
      return contactId;
    } catch (err: any) {
      console.warn('Native contact creation failed:', err.message || err);
      return null;
    }
  };

  const updateNativeContact = async (nativeId: string): Promise<boolean> => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      const contactFields: any = {
        id: nativeId,
        firstName: name.split(' ')[0] || '',
        lastName: name.split(' ').slice(1).join(' ') || '',
        phoneNumbers: phones.filter((p) => p.value).map((p) => ({ label: p.label.toLowerCase(), number: p.value })),
        emails: emails.filter((e) => e.value).map((e) => ({ label: e.type.toLowerCase(), email: e.value })),
        company: company || '',
        jobTitle: designation || '',
        addresses: officeAddress ? [{ label: 'work', street: officeAddress }] : [],
        urlAddresses: websites.filter((w) => w.value).map((w) => ({ label: w.type.toLowerCase(), url: w.value })),
      };

      await Contacts.updateContactAsync(contactFields);
      return true;
    } catch (err: any) {
      console.warn('Native contact update failed:', err.message || err);
      return false;
    }
  };

  const nativeContactExists = async (nativeId: string): Promise<boolean> => {
    try {
      const contact = await Contacts.getContactByIdAsync(nativeId);
      return !!contact;
    } catch {
      return false;
    }
  };

  const proceedSave = async (nativeContactId: string | undefined, force: boolean) => {
    setLoading(true);
    try {
      const contactData = {
        id: (params.id as string) || undefined,
        name,
        phones: phones.filter((p) => p.value),
        emails: emails.filter((e) => e.value),
        company,
        designation,
        officeAddress,
        websites: websites.filter((w) => w.value),
        category,
        nativeContactId: nativeContactId || undefined,
        syncStatus: 'pending' as any,
        extractionQualityScore: qualityScore || undefined,
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
          Alert.alert(
            'Duplicate Contact',
            result.message || 'This contact might already exist in your directory. Do you want to save it anyway?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Save Anyway', onPress: () => proceedSave(nativeContactId, true) }
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
      Alert.alert('Save Error', error.message || 'Failed to save contact.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (force = false) => {
    if (!validate()) return;
    setLoading(true);

    try {
      let nativeContactId = (params.nativeContactId as string) || undefined;
      
      if (Platform.OS !== 'web') {
        if (params.id && nativeContactId) {
          const updated = await updateNativeContact(nativeContactId);
          if (!updated) {
            setLoading(false);
            const exists = await nativeContactExists(nativeContactId);
            if (!exists) {
              Alert.alert(
                'Link Broken',
                'The linked contact on your device no longer exists. Create a new one or continue without link?',
                [
                  {
                    text: 'Create New Link',
                    onPress: async () => {
                      setLoading(true);
                      const newNativeId = await saveNativeContact();
                      await proceedSave(newNativeId || undefined, force);
                    }
                  },
                  {
                    text: 'Continue Without Link',
                    onPress: async () => {
                      await proceedSave(undefined, force);
                    }
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  }
                ]
              );
              return;
            } else {
              Alert.alert(
                'Device Update Failed',
                'Failed to update the contact on your device. Please verify contacts permissions.',
                [
                  { text: 'Save Locally Only', onPress: () => proceedSave(nativeContactId, force) },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
              return;
            }
          }
        } else {
          nativeContactId = await saveNativeContact() || undefined;
        }
      }

      await proceedSave(nativeContactId, force);
    } catch (error: any) {
      Alert.alert('Save Error', error.message || 'Failed to save contact.');
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const renderQualityScoreBadge = () => {
    if (qualityScore === null) return null;
    let scoreColor = '#10B981'; // Green
    if (qualityScore < 50) scoreColor = '#EF4444'; // Red
    else if (qualityScore < 75) scoreColor = '#F59E0B'; // Orange

    return (
      <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
        <Text style={styles.scoreText}>Extraction Quality Score: {qualityScore}%</Text>
      </View>
    );
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
          {renderQualityScoreBadge()}

          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CONTACT DETAILS</Text>
          
          <InputField
            label="Full Name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
          />

          {/* Multiple Phone Numbers */}
          <View style={styles.multiValueSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phone Number(s)</Text>
              <TouchableOpacity onPress={addPhoneField}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>+ Add Phone</Text>
              </TouchableOpacity>
            </View>
            {phones.map((phone, idx) => (
              <View key={idx} style={styles.multiValueRow}>
                <View style={{ flex: 1 }}>
                  <InputField
                    label={`Phone #${idx + 1}`}
                    value={phone.value}
                    onChangeText={(val) => updatePhoneValue(idx, val)}
                    keyboardType="phone-pad"
                  />
                </View>
                {phones.length > 1 && (
                  <TouchableOpacity onPress={() => removePhoneField(idx)} style={styles.removeBtn}>
                    <IconSymbol name="minus.circle.fill" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Multiple Email Addresses */}
          <View style={styles.multiValueSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address(es)</Text>
              <TouchableOpacity onPress={addEmailField}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>+ Add Email</Text>
              </TouchableOpacity>
            </View>
            {emails.map((email, idx) => (
              <View key={idx} style={styles.multiValueRow}>
                <View style={{ flex: 1 }}>
                  <InputField
                    label={`Email #${idx + 1}`}
                    value={email.value}
                    onChangeText={(val) => updateEmailValue(idx, val)}
                    error={errors[`email_${idx}`]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {emails.length > 1 && (
                  <TouchableOpacity onPress={() => removeEmailField(idx)} style={styles.removeBtn}>
                    <IconSymbol name="minus.circle.fill" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Multiple Websites */}
          <View style={styles.multiValueSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Website Link(s)</Text>
              <TouchableOpacity onPress={addWebsiteField}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>+ Add Website</Text>
              </TouchableOpacity>
            </View>
            {websites.map((website, idx) => (
              <View key={idx} style={styles.multiValueRow}>
                <View style={{ flex: 1 }}>
                  <InputField
                    label={`Website #${idx + 1}`}
                    value={website.value}
                    onChangeText={(val) => updateWebsiteValue(idx, val)}
                    autoCapitalize="none"
                  />
                </View>
                {websites.length > 1 && (
                  <TouchableOpacity onPress={() => removeWebsiteField(idx)} style={styles.removeBtn}>
                    <IconSymbol name="minus.circle.fill" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <InputField
            label="Company Name"
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
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
  scoreBadge: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  multiValueSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  multiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeBtn: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});
