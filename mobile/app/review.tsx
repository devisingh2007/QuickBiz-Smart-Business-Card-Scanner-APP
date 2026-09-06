import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Contacts from 'expo-contacts';
import { Spacing, Typography, BorderRadius, Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { InputField } from '@/components/ui/InputField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Badge } from '@/components/ui/Badge';
import { SunsetStripe } from '@/components/ui/SunsetStripe';
import { contactStore } from '@/services/contact.store';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CATEGORIES } from '@/constants/categories';

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();

  // Initialize fields from router parameters
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
    if (!name.trim()) tempErrors.name = 'Full name is required';

    emails.forEach((email, idx) => {
      if (email.value && !/\S+@\S+\.\S+/.test(email.value)) {
        tempErrors[`email_${idx}`] = 'Please enter a valid email address';
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
        'QuickBiz needs Contacts permissions to save the contact on your phone. You can still backup to cloud.',
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

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const isEditing = !!params.id;
      let nativeId = (params.nativeContactId as string) || null;

      if (isEditing && nativeId) {
        await updateNativeContact(nativeId);
      } else {
        const createdId = await saveNativeContact();
        if (createdId) nativeId = createdId;
      }

      const cleanedPhones = phones.filter((p) => p.value.trim());
      const cleanedEmails = emails.filter((e) => e.value.trim());
      const cleanedWebsites = websites.filter((w) => w.value.trim());

      const contactPayload = {
        id: (params.id as string) || undefined,
        name: name.trim(),
        company: company.trim(),
        designation: designation.trim(),
        officeAddress: officeAddress.trim(),
        category,
        nativeContactId: nativeId || undefined,
        phones: cleanedPhones,
        emails: cleanedEmails,
        websites: cleanedWebsites,
        phone: cleanedPhones.length > 0 ? cleanedPhones[0].value : undefined,
        email: cleanedEmails.length > 0 ? cleanedEmails[0].value : undefined,
        website: cleanedWebsites.length > 0 ? cleanedWebsites[0].value : undefined,
        extractionQualityScore: qualityScore || undefined,
      };

      if (isEditing && params.id) {
        await contactStore.updateContact(params.id as string, contactPayload);
        Alert.alert('Contact Updated', 'Contact information saved successfully.');
      } else {
        await contactStore.saveContact(contactPayload as any);
        Alert.alert('Contact Saved', 'New business contact added to your directory and phonebook.');
      }

      router.replace('/(tabs)/contacts');
    } catch (error: any) {
      Alert.alert('Save Failed', error.message || 'Unable to save contact details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Editorial Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
                {params.id ? 'Edit Contact' : 'Review Contact'}
              </Text>
              {qualityScore !== null && (
                <Badge
                  label={`Quality ${qualityScore}%`}
                  variant={qualityScore >= 80 ? 'orange' : qualityScore >= 50 ? 'cream' : 'neutral'}
                />
              )}
            </View>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
              Verify the parsed business card fields below before committing to your directory.
            </Text>
          </View>

          {/* Mistral Contact Form Panel (Cream surface in light mode, Dark card in dark mode) */}
          <View
            style={[
              styles.formPanel,
              {
                backgroundColor: isDark ? colors.card : colors.surfaceCream,
                borderColor: isDark ? colors.cardBorder : colors.borderBeige,
              },
            ]}
          >
            {/* Category Selector */}
            <View style={styles.categorySection}>
              <Text style={[styles.fieldGroupLabel, { color: colors.textPrimary }]}>
                CATEGORY TAG
              </Text>
              <View style={styles.categoryChips}>
                {categories.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.7}
                      style={[
                        styles.categoryChip,
                        isSelected
                          ? { backgroundColor: Palette.primary, borderColor: Palette.primary }
                          : {
                              backgroundColor: isDark ? colors.surface : colors.surface,
                              borderColor: isDark ? colors.border : colors.borderHairline,
                            },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${cat} category`}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                          isSelected && { fontWeight: '600' },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Basic Information */}
            <Text style={[styles.fieldGroupLabel, { color: colors.textPrimary }]}>
              IDENTITY & ORGANIZATION
            </Text>

            <InputField
              label="Full Name *"
              placeholder="e.g. Eleanor Vance"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
              leftIcon={<IconSymbol name="person.fill" size={16} color={colors.textMuted} />}
            />

            <InputField
              label="Job Designation / Title"
              placeholder="e.g. Chief Executive Officer"
              value={designation}
              onChangeText={setDesignation}
              autoCapitalize="words"
              leftIcon={<IconSymbol name="briefcase.fill" size={16} color={colors.textMuted} />}
            />

            <InputField
              label="Company Name"
              placeholder="e.g. Mistral Technologies"
              value={company}
              onChangeText={setCompany}
              autoCapitalize="words"
              leftIcon={<IconSymbol name="building.2.fill" size={16} color={colors.textMuted} />}
            />

            {/* Phone Numbers Section */}
            <View style={styles.multiHeaderRow}>
              <Text style={[styles.fieldGroupLabel, { color: colors.textPrimary }]}>
                PHONE NUMBERS
              </Text>
              <TouchableOpacity
                onPress={addPhoneField}
                style={styles.addInlineBtn}
                accessibilityRole="button"
                accessibilityLabel="Add another phone number"
              >
                <IconSymbol name="plus" size={13} color={Palette.primary} />
                <Text style={[styles.addInlineBtnText, { color: Palette.primary }]}>
                  Add Phone
                </Text>
              </TouchableOpacity>
            </View>

            {phones.map((phone, idx) => (
              <View key={idx} style={styles.multiRowWrapper}>
                <View style={{ flex: 1 }}>
                  <InputField
                    placeholder="e.g. +1 555 123 4567"
                    value={phone.value}
                    onChangeText={(val) => updatePhoneValue(idx, val)}
                    keyboardType="phone-pad"
                    leftIcon={<IconSymbol name="phone.fill" size={16} color={colors.textMuted} />}
                  />
                </View>
                {phones.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removePhoneField(idx)}
                    style={styles.removeFieldBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Remove this phone field"
                  >
                    <IconSymbol name="trash.fill" size={16} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Emails Section */}
            <View style={styles.multiHeaderRow}>
              <Text style={[styles.fieldGroupLabel, { color: colors.textPrimary }]}>
                EMAIL ADDRESSES
              </Text>
              <TouchableOpacity
                onPress={addEmailField}
                style={styles.addInlineBtn}
                accessibilityRole="button"
                accessibilityLabel="Add another email"
              >
                <IconSymbol name="plus" size={13} color={Palette.primary} />
                <Text style={[styles.addInlineBtnText, { color: Palette.primary }]}>
                  Add Email
                </Text>
              </TouchableOpacity>
            </View>

            {emails.map((email, idx) => (
              <View key={idx} style={styles.multiRowWrapper}>
                <View style={{ flex: 1 }}>
                  <InputField
                    placeholder="e.g. name@mistral.ai"
                    value={email.value}
                    onChangeText={(val) => updateEmailValue(idx, val)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={errors[`email_${idx}`]}
                    leftIcon={<IconSymbol name="envelope.fill" size={16} color={colors.textMuted} />}
                  />
                </View>
                {emails.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeEmailField(idx)}
                    style={styles.removeFieldBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Remove this email field"
                  >
                    <IconSymbol name="trash.fill" size={16} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Websites Section */}
            <View style={styles.multiHeaderRow}>
              <Text style={[styles.fieldGroupLabel, { color: colors.textPrimary }]}>
                WEBSITES
              </Text>
              <TouchableOpacity
                onPress={addWebsiteField}
                style={styles.addInlineBtn}
                accessibilityRole="button"
                accessibilityLabel="Add another website"
              >
                <IconSymbol name="plus" size={13} color={Palette.primary} />
                <Text style={[styles.addInlineBtnText, { color: Palette.primary }]}>
                  Add Website
                </Text>
              </TouchableOpacity>
            </View>

            {websites.map((website, idx) => (
              <View key={idx} style={styles.multiRowWrapper}>
                <View style={{ flex: 1 }}>
                  <InputField
                    placeholder="e.g. https://mistral.ai"
                    value={website.value}
                    onChangeText={(val) => updateWebsiteValue(idx, val)}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                    leftIcon={<IconSymbol name="globe" size={16} color={colors.textMuted} />}
                  />
                </View>
                {websites.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeWebsiteField(idx)}
                    style={styles.removeFieldBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Remove this website field"
                  >
                    <IconSymbol name="trash.fill" size={16} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Address */}
            <Text style={[styles.fieldGroupLabel, { color: colors.textPrimary }]}>
              OFFICE LOCATION
            </Text>

            <InputField
              label="Office Address"
              placeholder="e.g. 15 Boulevard Poissonnière, 75002 Paris"
              value={officeAddress}
              onChangeText={setOfficeAddress}
              autoCapitalize="sentences"
              leftIcon={<IconSymbol name="location.fill" size={16} color={colors.textMuted} />}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <SecondaryButton
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.cancelBtn}
            />
            <PrimaryButton
              title={params.id ? 'Update Contact' : 'Save Contact'}
              onPress={handleSave}
              loading={loading}
              icon={<IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />}
              style={styles.saveBtn}
            />
          </View>

          {/* Sunset Stripe */}
          <View style={styles.closingStripeContainer}>
            <SunsetStripe height={4} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pageTitle: {
    ...Typography.heading1,
    fontSize: 26,
  },
  pageSubtitle: {
    ...Typography.bodySm,
    lineHeight: 18,
  },
  formPanel: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  fieldGroupLabel: {
    ...Typography.microUppercase,
    marginBottom: 10,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryChipText: {
    ...Typography.bodySm,
    fontSize: 12,
  },
  multiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    marginBottom: 6,
  },
  addInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  addInlineBtnText: {
    ...Typography.bodySmMedium,
    fontSize: 12,
  },
  multiRowWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  removeFieldBtn: {
    width: 44,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 1.5,
  },
  closingStripeContainer: {
    alignItems: 'center',
  },
});
