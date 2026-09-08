import React, { useMemo, } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Linking, } from 'react-native';
import { SafeAreaView, } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Palette, Typography, BorderRadius, } from '@/constants/theme';
import { useTheme, } from '@/hooks/use-theme';
import { IconSymbol, } from '@/components/ui/icon-symbol';
import { Badge, } from '@/components/ui/Badge';
import { Avatar, } from '@/components/ui/Avatar';
import { DangerButton, } from '@/components/ui/DangerButton';
import { contactStore, } from '@/services/contact.store';
export default function ContactDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    colors,
    isDark
  } = useTheme();

  // If navigated with only ID, look up contact in local store
  const storedContact = useMemo(() => {
    if (params.id) {
      return contactStore.getContacts().find(c => c.id === params.id) || null;
    }
    return null;
  }, [params.id]);
  const id = params.id || storedContact?.id || '';
  const name = params.name || storedContact?.name || 'Unnamed Contact';
  const company = params.company || storedContact?.company || '';
  const designation = params.designation || storedContact?.designation || '';
  const officeAddress = params.officeAddress || storedContact?.officeAddress || '';
  const category = params.category || storedContact?.category || '';
  const nativeContactId = params.nativeContactId || storedContact?.nativeContactId || '';

  // Safely parse array structures
  const phones = useMemo(() => {
    if (params.phonesJson) {
      try {
        const parsed = JSON.parse(params.phonesJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (storedContact?.phones && storedContact.phones.length > 0) {
      return storedContact.phones;
    }
    if (params.phone) {
      return [{
        value: params.phone,
        type: 'mobile',
        label: 'Mobile'
      }];
    }
    if (storedContact?.phone) {
      return [{
        value: storedContact.phone,
        type: 'mobile',
        label: 'Mobile'
      }];
    }
    return [];
  }, [params.phonesJson, params.phone, storedContact]);
  const emails = useMemo(() => {
    if (params.emailsJson) {
      try {
        const parsed = JSON.parse(params.emailsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (storedContact?.emails && storedContact.emails.length > 0) {
      return storedContact.emails;
    }
    if (params.email) {
      return [{
        value: params.email,
        type: 'work'
      }];
    }
    if (storedContact?.email) {
      return [{
        value: storedContact.email,
        type: 'work'
      }];
    }
    return [];
  }, [params.emailsJson, params.email, storedContact]);
  const websites = useMemo(() => {
    if (params.websitesJson) {
      try {
        const parsed = JSON.parse(params.websitesJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (storedContact?.websites && storedContact.websites.length > 0) {
      return storedContact.websites;
    }
    if (params.website) {
      return [{
        value: params.website,
        type: 'work'
      }];
    }
    if (storedContact?.website) {
      return [{
        value: storedContact.website,
        type: 'work'
      }];
    }
    return [];
  }, [params.websitesJson, params.website, storedContact]);
  const qualityScore = params.extractionQualityScore ? Number(params.extractionQualityScore) : storedContact?.extractionQualityScore || null;
  const handleCall = number => {
    Linking.openURL(`tel:${number.replace(/[^\d+]/g, '')}`);
  };
  const handleEmail = emailAddress => {
    Linking.openURL(`mailto:${emailAddress}`);
  };
  const handleWebsite = url => {
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(formattedUrl);
  };
  const handleCopy = async (text, label) => {
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
        extractionQualityScore: qualityScore ? String(qualityScore) : undefined
      }
    });
  };
  const handleDelete = () => {
    Alert.alert('Delete Contact', `Are you sure you want to delete ${name}? This will remove the record from QuickBiz and your local address book.`, [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: 'Delete Everywhere',
      style: 'destructive',
      onPress: async () => {
        try {
          if (id) {
            await contactStore.deleteContact(id);
          }
          Alert.alert('Deleted', 'Contact deleted successfully.');
          router.replace('/(tabs)/contacts');
        } catch (err) {
          Alert.alert('Error', err.message || 'Failed to delete contact.');
        }
      }
    }]);
  };
  const primaryPhone = phones.length > 0 ? phones[0].value : null;
  const primaryEmail = emails.length > 0 ? emails[0].value : null;
  const primaryWebsite = websites.length > 0 ? websites[0].value : null;
  return <SafeAreaView style={[styles.safeArea, {
    backgroundColor: colors.background
  }]} edges={['top', 'left', 'right']}>
      {/* Top Editorial Navigation */}
      <View style={[styles.navBar, {
      borderBottomColor: colors.borderSoft
    }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} hitSlop={{
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }}>
          <IconSymbol name="chevron.left" size={20} color={colors.textPrimary} />
          <Text style={[styles.backLabel, {
          color: colors.textPrimary
        }]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleEdit} style={styles.editBtn} hitSlop={{
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }}>
          <Text style={styles.editLabel}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={[styles.profileSection, {
        borderBottomColor: colors.borderSoft
      }]}>
          <Avatar name={name} size="lg" variant="cream" style={styles.avatar} />

          <Text style={[styles.nameText, {
          color: colors.textPrimary
        }]}>{name}</Text>

          {(designation || company) && <Text style={[styles.roleText, {
          color: colors.textSecondary
        }]}>
              {[designation, company].filter(Boolean).join(' · ')}
            </Text>}

          <View style={styles.badgesRow}>
            {category && <Badge label={category} variant="cream" size="md" />}
            {qualityScore !== null && <Badge label={`OCR Quality ${qualityScore}%`} variant={qualityScore >= 80 ? 'orange' : qualityScore >= 50 ? 'cream' : 'neutral'} size="md" />}
          </View>
        </View>

        {/* Quick Action Shortcuts (Mistral Cream/Dark Tiles with 8px radius) */}
        <View style={[styles.shortcutsRow, {
        borderBottomColor: colors.borderSoft
      }]}>
          <TouchableOpacity onPress={() => primaryPhone && handleCall(primaryPhone)} disabled={!primaryPhone} style={[styles.shortcutTile, isDark ? {
          backgroundColor: colors.card,
          borderColor: colors.border
        } : {
          backgroundColor: Palette.cream,
          borderColor: Palette.beigeDeep
        }, !primaryPhone && {
          backgroundColor: colors.surface,
          borderColor: colors.borderSoft
        }]}>
            <IconSymbol name="phone.fill" size={18} color={primaryPhone ? Palette.primary : colors.textMuted} />
            <Text style={[styles.shortcutLabel, {
            color: primaryPhone ? colors.textPrimary : colors.textMuted
          }]}>
              Call
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => primaryEmail && handleEmail(primaryEmail)} disabled={!primaryEmail} style={[styles.shortcutTile, isDark ? {
          backgroundColor: colors.card,
          borderColor: colors.border
        } : {
          backgroundColor: Palette.cream,
          borderColor: Palette.beigeDeep
        }, !primaryEmail && {
          backgroundColor: colors.surface,
          borderColor: colors.borderSoft
        }]}>
            <IconSymbol name="envelope.fill" size={18} color={primaryEmail ? Palette.primary : colors.textMuted} />
            <Text style={[styles.shortcutLabel, {
            color: primaryEmail ? colors.textPrimary : colors.textMuted
          }]}>
              Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => primaryWebsite && handleWebsite(primaryWebsite)} disabled={!primaryWebsite} style={[styles.shortcutTile, isDark ? {
          backgroundColor: colors.card,
          borderColor: colors.border
        } : {
          backgroundColor: Palette.cream,
          borderColor: Palette.beigeDeep
        }, !primaryWebsite && {
          backgroundColor: colors.surface,
          borderColor: colors.borderSoft
        }]}>
            <IconSymbol name="globe" size={18} color={primaryWebsite ? Palette.primary : colors.textMuted} />
            <Text style={[styles.shortcutLabel, {
            color: primaryWebsite ? colors.textPrimary : colors.textMuted
          }]}>
              Website
            </Text>
          </TouchableOpacity>
        </View>

        {/* Detailed Sections with Hairline Dividers */}
        {/* CONTACT SECTION */}
        {(phones.length > 0 || emails.length > 0) && <View style={styles.section}>
            <Text style={[styles.sectionHeader, {
          color: colors.textMuted
        }]}>CONTACT</Text>

            {phones.map((p, idx) => <TouchableOpacity key={`phone-${idx}`} style={[styles.fieldRow, {
          borderBottomColor: colors.borderSoft
        }]} onPress={() => handleCall(p.value)} onLongPress={() => handleCopy(p.value, 'Phone number')}>
                <View style={styles.fieldInfo}>
                  <Text style={[styles.fieldLabel, {
              color: colors.textMuted
            }]}>
                    {p.label || p.type || 'Phone'}
                  </Text>
                  <Text style={[styles.fieldValue, {
              color: colors.textPrimary
            }]}>{p.value}</Text>
                </View>
                <IconSymbol name="phone.fill" size={15} color={Palette.primary} />
              </TouchableOpacity>)}

            {emails.map((e, idx) => <TouchableOpacity key={`email-${idx}`} style={[styles.fieldRow, {
          borderBottomColor: colors.borderSoft
        }]} onPress={() => handleEmail(e.value)} onLongPress={() => handleCopy(e.value, 'Email address')}>
                <View style={styles.fieldInfo}>
                  <Text style={[styles.fieldLabel, {
              color: colors.textMuted
            }]}>
                    Email ({e.type || 'Work'})
                  </Text>
                  <Text style={[styles.fieldValue, {
              color: colors.textPrimary
            }]}>{e.value}</Text>
                </View>
                <IconSymbol name="envelope.fill" size={15} color={Palette.primary} />
              </TouchableOpacity>)}
          </View>}

        {/* BUSINESS SECTION */}
        {(company || designation) && <View style={styles.section}>
            <Text style={[styles.sectionHeader, {
          color: colors.textMuted
        }]}>BUSINESS</Text>

            {company ? <View style={[styles.fieldRow, {
          borderBottomColor: colors.borderSoft
        }]}>
                <View style={styles.fieldInfo}>
                  <Text style={[styles.fieldLabel, {
              color: colors.textMuted
            }]}>Company</Text>
                  <Text style={[styles.fieldValue, {
              color: colors.textPrimary
            }]}>{company}</Text>
                </View>
              </View> : null}

            {designation ? <View style={[styles.fieldRow, {
          borderBottomColor: colors.borderSoft
        }]}>
                <View style={styles.fieldInfo}>
                  <Text style={[styles.fieldLabel, {
              color: colors.textMuted
            }]}>Role / Designation</Text>
                  <Text style={[styles.fieldValue, {
              color: colors.textPrimary
            }]}>{designation}</Text>
                </View>
              </View> : null}
          </View>}

        {/* LOCATION SECTION */}
        {officeAddress ? <View style={styles.section}>
            <Text style={[styles.sectionHeader, {
          color: colors.textMuted
        }]}>LOCATION</Text>
            <TouchableOpacity style={[styles.fieldRow, {
          borderBottomColor: colors.borderSoft
        }]} onLongPress={() => handleCopy(officeAddress, 'Address')}>
              <View style={styles.fieldInfo}>
                <Text style={[styles.fieldLabel, {
              color: colors.textMuted
            }]}>Office Address</Text>
                <Text style={[styles.fieldValue, {
              color: colors.textPrimary
            }]}>{officeAddress}</Text>
              </View>
            </TouchableOpacity>
          </View> : null}

        {/* ONLINE SECTION */}
        {websites.length > 0 && <View style={styles.section}>
            <Text style={[styles.sectionHeader, {
          color: colors.textMuted
        }]}>ONLINE</Text>
            {websites.map((w, idx) => <TouchableOpacity key={`web-${idx}`} style={[styles.fieldRow, {
          borderBottomColor: colors.borderSoft
        }]} onPress={() => handleWebsite(w.value)} onLongPress={() => handleCopy(w.value, 'Website')}>
                <View style={styles.fieldInfo}>
                  <Text style={[styles.fieldLabel, {
              color: colors.textMuted
            }]}>Website</Text>
                  <Text style={[styles.fieldValue, {
              color: Palette.primary
            }]}>
                    {w.value}
                  </Text>
                </View>
                <IconSymbol name="globe" size={15} color={Palette.primary} />
              </TouchableOpacity>)}
          </View>}

        {/* Delete Contact Button */}
        <View style={styles.deleteSection}>
          <DangerButton title="Delete Contact" onPress={handleDelete} variant="subtle" icon={<IconSymbol name="trash.fill" size={15} color={Palette.error} />} />
        </View>
      </ScrollView>
    </SafeAreaView>;
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  navBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500'
  },
  editBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  editLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: Palette.primary,
    fontWeight: '600'
  },
  scrollContent: {
    paddingBottom: 48
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1
  },
  avatar: {
    marginBottom: 16
  },
  nameText: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 26,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6
  },
  roleText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8
  },
  shortcutsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1
  },
  shortcutTile: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shortcutLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24
  },
  sectionHeader: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  fieldInfo: {
    flex: 1
  },
  fieldLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    marginBottom: 2
  },
  fieldValue: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '500'
  },
  deleteSection: {
    paddingHorizontal: 20,
    marginTop: 36
  }
});