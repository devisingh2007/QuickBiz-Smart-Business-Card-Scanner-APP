import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Palette, Typography, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DangerButton } from '@/components/ui/DangerButton';
import { contactStore } from '@/services/contact.store';

export default function ContactDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // If navigated with only ID, look up contact in local store
  const storedContact = useMemo(() => {
    if (params.id) {
      return contactStore.getContacts().find((c) => c.id === params.id) || null;
    }
    return null;
  }, [params.id]);

  const id = (params.id as string) || storedContact?.id || '';
  const name = (params.name as string) || storedContact?.name || 'Unnamed Contact';
  const company = (params.company as string) || storedContact?.company || '';
  const designation =
    (params.designation as string) || storedContact?.designation || '';
  const officeAddress =
    (params.officeAddress as string) || storedContact?.officeAddress || '';
  const category = (params.category as string) || storedContact?.category || '';
  const nativeContactId =
    (params.nativeContactId as string) || storedContact?.nativeContactId || '';

  // Safely parse array structures
  const phones: { value: string; type?: string; label?: string }[] = useMemo(() => {
    if (params.phonesJson) {
      try {
        const parsed = JSON.parse(params.phonesJson as string);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (storedContact?.phones && storedContact.phones.length > 0) {
      return storedContact.phones;
    }
    if (params.phone) {
      return [{ value: params.phone as string, type: 'mobile', label: 'Mobile' }];
    }
    if (storedContact?.phone) {
      return [{ value: storedContact.phone, type: 'mobile', label: 'Mobile' }];
    }
    return [];
  }, [params.phonesJson, params.phone, storedContact]);

  const emails: { value: string; type?: string }[] = useMemo(() => {
    if (params.emailsJson) {
      try {
        const parsed = JSON.parse(params.emailsJson as string);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (storedContact?.emails && storedContact.emails.length > 0) {
      return storedContact.emails;
    }
    if (params.email) {
      return [{ value: params.email as string, type: 'work' }];
    }
    if (storedContact?.email) {
      return [{ value: storedContact.email, type: 'work' }];
    }
    return [];
  }, [params.emailsJson, params.email, storedContact]);

  const websites: { value: string; type?: string }[] = useMemo(() => {
    if (params.websitesJson) {
      try {
        const parsed = JSON.parse(params.websitesJson as string);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (storedContact?.websites && storedContact.websites.length > 0) {
      return storedContact.websites;
    }
    if (params.website) {
      return [{ value: params.website as string, type: 'work' }];
    }
    if (storedContact?.website) {
      return [{ value: storedContact.website, type: 'work' }];
    }
    return [];
  }, [params.websitesJson, params.website, storedContact]);

  const qualityScore = params.extractionQualityScore
    ? Number(params.extractionQualityScore)
    : storedContact?.extractionQualityScore || null;

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number.replace(/[^\d+]/g, '')}`);
  };

  const handleEmail = (emailAddress: string) => {
    Linking.openURL(`mailto:${emailAddress}`);
  };

  const handleWebsite = (url: string) => {
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(formattedUrl);
  };

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  };

  const handleEdit = () => {
    router.push({
      pathname: '/review',
      params: {
        id,
        name,
        company,
        designation,
        officeAddress,
        category,
        nativeContactId,
        phonesJson: JSON.stringify(phones),
        emailsJson: JSON.stringify(emails),
        websitesJson: JSON.stringify(websites),
        extractionQualityScore: qualityScore ? String(qualityScore) : undefined,
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${name}? This will remove the record from QuickBiz and your local address book.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everywhere',
          style: 'destructive',
          onPress: async () => {
            try {
              if (id) {
                await contactStore.deleteContact(id);
              }
              Alert.alert('Deleted', 'Contact deleted successfully.');
              router.replace('/(tabs)/contacts');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete contact.');
            }
          },
        },
      ]
    );
  };

  const primaryPhone = phones.length > 0 ? phones[0].value : null;
  const primaryEmail = emails.length > 0 ? emails[0].value : null;
  const primaryWebsite = websites.length > 0 ? websites[0].value : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Editorial Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="chevron.left" size={20} color={Palette.ink} />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleEdit}
          style={styles.editBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.editLabel}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={styles.profileSection}>
          <Avatar name={name} size="lg" variant="cream" style={styles.avatar} />

          <Text style={styles.nameText}>{name}</Text>

          {(designation || company) && (
            <Text style={styles.roleText}>
              {[designation, company].filter(Boolean).join(' · ')}
            </Text>
          )}

          <View style={styles.badgesRow}>
            {category && <Badge label={category} variant="cream" size="md" />}
            {qualityScore !== null && (
              <Badge
                label={`OCR Quality ${qualityScore}%`}
                variant={
                  qualityScore >= 80
                    ? 'orange'
                    : qualityScore >= 50
                    ? 'cream'
                    : 'neutral'
                }
                size="md"
              />
            )}
          </View>
        </View>

        {/* Quick Action Shortcuts (Mistral Cream Tiles with 8px radius) */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            onPress={() => primaryPhone && handleCall(primaryPhone)}
            disabled={!primaryPhone}
            style={[
              styles.shortcutTile,
              !primaryPhone && styles.shortcutTileDisabled,
            ]}
          >
            <IconSymbol
              name="phone.fill"
              size={18}
              color={primaryPhone ? Palette.primary : Palette.stone}
            />
            <Text
              style={[
                styles.shortcutLabel,
                !primaryPhone && styles.shortcutLabelDisabled,
              ]}
            >
              Call
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => primaryEmail && handleEmail(primaryEmail)}
            disabled={!primaryEmail}
            style={[
              styles.shortcutTile,
              !primaryEmail && styles.shortcutTileDisabled,
            ]}
          >
            <IconSymbol
              name="envelope.fill"
              size={18}
              color={primaryEmail ? Palette.primary : Palette.stone}
            />
            <Text
              style={[
                styles.shortcutLabel,
                !primaryEmail && styles.shortcutLabelDisabled,
              ]}
            >
              Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => primaryWebsite && handleWebsite(primaryWebsite)}
            disabled={!primaryWebsite}
            style={[
              styles.shortcutTile,
              !primaryWebsite && styles.shortcutTileDisabled,
            ]}
          >
            <IconSymbol
              name="globe"
              size={18}
              color={primaryWebsite ? Palette.primary : Palette.stone}
            />
            <Text
              style={[
                styles.shortcutLabel,
                !primaryWebsite && styles.shortcutLabelDisabled,
              ]}
            >
              Website
            </Text>
          </TouchableOpacity>
        </View>

        {/* Detailed Sections with Hairline Dividers */}
        {/* CONTACT SECTION */}
        {(phones.length > 0 || emails.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>CONTACT</Text>

            {phones.map((p, idx) => (
              <TouchableOpacity
                key={`phone-${idx}`}
                style={styles.fieldRow}
                onPress={() => handleCall(p.value)}
                onLongPress={() => handleCopy(p.value, 'Phone number')}
              >
                <View style={styles.fieldInfo}>
                  <Text style={styles.fieldLabel}>
                    {p.label || p.type || 'Phone'}
                  </Text>
                  <Text style={styles.fieldValue}>{p.value}</Text>
                </View>
                <IconSymbol
                  name="phone.fill"
                  size={15}
                  color={Palette.primary}
                />
              </TouchableOpacity>
            ))}

            {emails.map((e, idx) => (
              <TouchableOpacity
                key={`email-${idx}`}
                style={styles.fieldRow}
                onPress={() => handleEmail(e.value)}
                onLongPress={() => handleCopy(e.value, 'Email address')}
              >
                <View style={styles.fieldInfo}>
                  <Text style={styles.fieldLabel}>Email ({e.type || 'Work'})</Text>
                  <Text style={styles.fieldValue}>{e.value}</Text>
                </View>
                <IconSymbol
                  name="envelope.fill"
                  size={15}
                  color={Palette.primary}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* BUSINESS SECTION */}
        {(company || designation) && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>BUSINESS</Text>

            {company ? (
              <View style={styles.fieldRow}>
                <View style={styles.fieldInfo}>
                  <Text style={styles.fieldLabel}>Company</Text>
                  <Text style={styles.fieldValue}>{company}</Text>
                </View>
              </View>
            ) : null}

            {designation ? (
              <View style={styles.fieldRow}>
                <View style={styles.fieldInfo}>
                  <Text style={styles.fieldLabel}>Role / Designation</Text>
                  <Text style={styles.fieldValue}>{designation}</Text>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* LOCATION SECTION */}
        {officeAddress ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>LOCATION</Text>
            <TouchableOpacity
              style={styles.fieldRow}
              onLongPress={() => handleCopy(officeAddress, 'Address')}
            >
              <View style={styles.fieldInfo}>
                <Text style={styles.fieldLabel}>Office Address</Text>
                <Text style={styles.fieldValue}>{officeAddress}</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ONLINE SECTION */}
        {websites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>ONLINE</Text>
            {websites.map((w, idx) => (
              <TouchableOpacity
                key={`web-${idx}`}
                style={styles.fieldRow}
                onPress={() => handleWebsite(w.value)}
                onLongPress={() => handleCopy(w.value, 'Website')}
              >
                <View style={styles.fieldInfo}>
                  <Text style={styles.fieldLabel}>Website</Text>
                  <Text style={[styles.fieldValue, { color: Palette.primary }]}>
                    {w.value}
                  </Text>
                </View>
                <IconSymbol name="globe" size={15} color={Palette.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Delete Contact Button */}
        <View style={styles.deleteSection}>
          <DangerButton
            title="Delete Contact"
            onPress={handleDelete}
            variant="subtle"
            icon={
              <IconSymbol name="trash.fill" size={15} color={Palette.error} />
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  navBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.hairlineSoft,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: Palette.ink,
    marginLeft: 4,
    fontWeight: '500',
  },
  editBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: Palette.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 48,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: Palette.hairlineSoft,
  },
  avatar: {
    marginBottom: 16,
  },
  nameText: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 26,
    fontWeight: '400',
    color: Palette.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  roleText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: Palette.slate,
    textAlign: 'center',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shortcutsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.hairlineSoft,
  },
  shortcutTile: {
    flex: 1,
    height: 52,
    backgroundColor: Palette.cream,
    borderWidth: 1,
    borderColor: Palette.beigeDeep,
    borderRadius: BorderRadius.md, // 8px radius
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTileDisabled: {
    backgroundColor: Palette.surface,
    borderColor: Palette.hairline,
  },
  shortcutLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.ink,
    marginTop: 4,
  },
  shortcutLabelDisabled: {
    color: Palette.stone,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.stone,
    letterSpacing: 1,
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.hairlineSoft,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    color: Palette.stone,
    marginBottom: 2,
  },
  fieldValue: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    color: Palette.ink,
    fontWeight: '500',
  },
  deleteSection: {
    paddingHorizontal: 20,
    marginTop: 36,
  },
});
