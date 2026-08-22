import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiService } from '@/services/api.service';
import { contactStore } from '@/services/contact.store';

export default function ContactDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const {
    id,
    name,
    phone,
    email,
    company,
    designation,
    officeAddress,
    category,
    nativeContactId,
  } = params as {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    company?: string;
    designation?: string;
    officeAddress?: string;
    category?: string;
    nativeContactId?: string;
  };

  const handleCall = () => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
  };

  const handleEmail = () => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`);
  };

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard!`);
  };

  const handleEdit = () => {
    // Navigate back to review screen in edit mode by passing fields and the ID
    router.push({
      pathname: '/review',
      params: {
        id,
        name,
        phone,
        email,
        company,
        designation,
        officeAddress,
        category,
        nativeContactId,
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
        {/* Profile Card Header */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {name ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() : '??'}
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

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleCall}
            disabled={!phone}
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }, !phone && styles.disabledBtn]}
          >
            <IconSymbol name="phone.fill" size={20} color={phone ? colors.primary : colors.textMuted} />
            <Text style={[styles.actionBtnText, { color: phone ? colors.text : colors.textMuted }]}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEmail}
            disabled={!email}
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }, !email && styles.disabledBtn]}
          >
            <IconSymbol name="envelope.fill" size={20} color={email ? colors.primary : colors.textMuted} />
            <Text style={[styles.actionBtnText, { color: email ? colors.text : colors.textMuted }]}>Email</Text>
          </TouchableOpacity>
        </View>

        {/* Info Cards */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CONTACT INFORMATION</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Phone Row */}
          {phone && (
            <TouchableOpacity
              onLongPress={() => handleCopy(phone, 'Phone number')}
              style={[styles.infoRow, styles.borderBottom, { borderBottomColor: colors.border }]}
            >
              <View style={styles.infoIcon}>
                <IconSymbol name="phone.fill" size={16} color={colors.textMuted} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Mobile Phone</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{phone}</Text>
              </View>
              <TouchableOpacity onPress={() => handleCopy(phone, 'Phone number')}>
                <IconSymbol name="doc.on.doc.fill" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {/* Email Row */}
          {email && (
            <TouchableOpacity
              onLongPress={() => handleCopy(email, 'Email address')}
              style={[styles.infoRow, phone ? styles.borderBottom : null, { borderBottomColor: colors.border }]}
            >
              <View style={styles.infoIcon}>
                <IconSymbol name="envelope.fill" size={16} color={colors.textMuted} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email Address</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{email}</Text>
              </View>
              <TouchableOpacity onPress={() => handleCopy(email, 'Email address')}>
                <IconSymbol name="doc.on.doc.fill" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {/* Address Row */}
          {officeAddress && (
            <TouchableOpacity
              onLongPress={() => handleCopy(officeAddress, 'Office address')}
              style={[styles.infoRow, (phone || email) ? styles.borderBottom : null, { borderBottomColor: colors.border }]}
            >
              <View style={styles.infoIcon}>
                <IconSymbol name="building.2.fill" size={16} color={colors.textMuted} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Office Address</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{officeAddress}</Text>
              </View>
              <TouchableOpacity onPress={() => handleCopy(officeAddress, 'Office address')}>
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
});
