import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { contactStore } from '@/services/contact.store';

export default function ContactDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const {
    id,
    name,
    company,
    designation,
    officeAddress,
    category,
    nativeContactId,
  } = params as {
    id: string;
    name: string;
    company?: string;
    designation?: string;
    officeAddress?: string;
    category?: string;
    nativeContactId?: string;
  };

  // Safely parse array structures
  const phones: { value: string; type: string; label: string }[] = (() => {
    if (params.phonesJson) {
      try {
        const parsed = JSON.parse(params.phonesJson as string);
        if (parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (params.phone) {
      return [{ value: params.phone as string, type: 'mobile', label: 'Mobile' }];
    }
    return [];
  })();

  const emails: { value: string; type: string }[] = (() => {
    if (params.emailsJson) {
      try {
        const parsed = JSON.parse(params.emailsJson as string);
        if (parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (params.email) {
      return [{ value: params.email as string, type: 'work' }];
    }
    return [];
  })();

  const websites: { value: string; type: string }[] = (() => {
    if (params.websitesJson) {
      try {
        const parsed = JSON.parse(params.websitesJson as string);
        if (parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (params.website) {
      return [{ value: params.website as string, type: 'work' }];
    }
    return [];
  })();

  const qualityScore = params.extractionQualityScore ? Number(params.extractionQualityScore) : null;

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
    Alert.alert('Copied', `${label} copied to clipboard!`);
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
        extractionQualityScore: qualityScore ? String(qualityScore) : undefined
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${name} from QuickBiz?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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

  const renderQualityBadge = () => {
    if (qualityScore === null) return null;
    let badgeColor = '#10B981'; // Green
    if (qualityScore < 50) badgeColor = '#EF4444'; // Red
    else if (qualityScore < 75) badgeColor = '#F59E0B'; // Orange

    return (
      <View style={[styles.qualityBadge, { backgroundColor: badgeColor }]}>
        <Text style={styles.qualityText}>QuickBiz Quality Score: {qualityScore}%</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Contact Details</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editHeaderBtn}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderQualityBadge()}

        {/* Profile Card Header */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {name ? name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() : '??'}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          {designation && <Text style={[styles.designation, { color: colors.textSecondary }]}>{designation}</Text>}
          {company && <Text style={[styles.company, { color: colors.textMuted }]}>{company}</Text>}
          
          {category && (
            <View style={[styles.badge, { backgroundColor: colors.primaryLight, marginTop: 12 }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{category}</Text>
            </View>
          )}
        </View>

        {/* Action Call/Email Row (Trigger on primary item) */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => phones.length > 0 && handleCall(phones[0].value)}
            disabled={phones.length === 0}
            style={[
              styles.actionBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              phones.length === 0 && styles.disabledBtn,
            ]}
          >
            <IconSymbol name="phone.fill" size={20} color={phones.length > 0 ? colors.primary : colors.textMuted} />
            <Text style={[styles.actionBtnText, { color: phones.length > 0 ? colors.text : colors.textMuted }]}>Call Primary</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => emails.length > 0 && handleEmail(emails[0].value)}
            disabled={emails.length === 0}
            style={[
              styles.actionBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              emails.length === 0 && styles.disabledBtn,
            ]}
          >
            <IconSymbol name="envelope.fill" size={20} color={emails.length > 0 ? colors.primary : colors.textMuted} />
            <Text style={[styles.actionBtnText, { color: emails.length > 0 ? colors.text : colors.textMuted }]}>Email Primary</Text>
          </TouchableOpacity>
        </View>

        {/* Info Cards */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CONTACT INFORMATION</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {/* Phones List */}
          {phones.map((phone, idx) => (
            <TouchableOpacity
              key={`phone_${idx}`}
              onLongPress={() => handleCopy(phone.value, `${phone.label} Phone`)}
              style={[styles.infoRow, styles.borderBottom, { borderBottomColor: colors.border }]}
            >
              <View style={styles.infoIcon}>
                <IconSymbol name="phone.fill" size={16} color={colors.textMuted} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{phone.label} Phone</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{phone.value}</Text>
              </View>
              <View style={styles.actionIcons}>
                <TouchableOpacity onPress={() => handleCall(phone.value)} style={styles.iconPadding}>
                  <IconSymbol name="phone.fill" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCopy(phone.value, 'Phone number')} style={styles.iconPadding}>
                  <IconSymbol name="doc.on.doc.fill" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {/* Emails List */}
          {emails.map((email, idx) => (
            <TouchableOpacity
              key={`email_${idx}`}
              onLongPress={() => handleCopy(email.value, 'Email Address')}
              style={[styles.infoRow, styles.borderBottom, { borderBottomColor: colors.border }]}
            >
              <View style={styles.infoIcon}>
                <IconSymbol name="envelope.fill" size={16} color={colors.textMuted} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email ({email.type})</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{email.value}</Text>
              </View>
              <View style={styles.actionIcons}>
                <TouchableOpacity onPress={() => handleEmail(email.value)} style={styles.iconPadding}>
                  <IconSymbol name="envelope.fill" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCopy(email.value, 'Email address')} style={styles.iconPadding}>
                  <IconSymbol name="doc.on.doc.fill" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {/* Websites List */}
          {websites.map((web, idx) => (
            <TouchableOpacity
              key={`web_${idx}`}
              onLongPress={() => handleCopy(web.value, 'Website Link')}
              style={[styles.infoRow, styles.borderBottom, { borderBottomColor: colors.border }]}
            >
              <View style={styles.infoIcon}>
                <IconSymbol name="globe" size={16} color={colors.textMuted} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Website ({web.type})</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{web.value}</Text>
              </View>
              <View style={styles.actionIcons}>
                <TouchableOpacity onPress={() => handleWebsite(web.value)} style={styles.iconPadding}>
                  <IconSymbol name="arrow.up.right.square" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCopy(web.value, 'Website Link')} style={styles.iconPadding}>
                  <IconSymbol name="doc.on.doc.fill" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {/* Address Row */}
          {officeAddress && (
            <TouchableOpacity
              onLongPress={() => handleCopy(officeAddress, 'Office address')}
              style={[styles.infoRow, { minHeight: 64 }]}
            >
              <View style={styles.infoIcon}>
                <IconSymbol name="building.2.fill" size={16} color={colors.textMuted} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Office Address</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{officeAddress}</Text>
              </View>
              <TouchableOpacity onPress={() => handleCopy(officeAddress, 'Office address')} style={styles.iconPadding}>
                <IconSymbol name="doc.on.doc.fill" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </View>

        {/* Delete Contact Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleDelete}
          style={[styles.deleteBtn, { borderColor: colors.error }]}
        >
          <Text style={[styles.deleteBtnText, { color: colors.error }]}>Delete Contact</Text>
        </TouchableOpacity>
      </ScrollView>
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
  editHeaderBtn: {
    paddingVertical: 8,
    width: 60,
    alignItems: 'flex-end',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  designation: {
    fontSize: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  company: {
    fontSize: 14,
    marginTop: 2,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 24,
  },
  actionBtn: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 64,
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoIcon: {
    width: 32,
  },
  infoTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  deleteBtn: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  qualityBadge: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  qualityText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPadding: {
    padding: 8,
  },
});
