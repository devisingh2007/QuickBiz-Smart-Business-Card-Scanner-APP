import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from './icon-symbol';

export interface ContactData {
  id?: string;
  name: string;
  phone?: string; // Legacy fallback
  phones?: { value: string; type?: string; label?: string }[];
  email?: string; // Legacy fallback
  emails?: { value: string; type?: string }[];
  company: string;
  designation: string;
  officeAddress?: string;
  website?: string; // Legacy fallback
  websites?: { value: string; type?: string }[];
  category?: 'Client' | 'Recruiter' | 'Investor' | 'Developer' | 'Business Partner' | 'Customer' | 'Friend' | 'Other';
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
  syncOperation?: 'create' | 'update' | 'delete';
  localUpdatedAt?: string;
  serverUpdatedAt?: string;
  nativeContactId?: string;
  createdAt?: string;
  updatedAt?: string;
  extractionQualityScore?: number;
}

interface ContactCardProps {
  contact: ContactData;
  onPress?: () => void;
}

export function ContactCard({ contact, onPress }: ContactCardProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  // Resolve primary phone and email from arrays or legacy properties
  const primaryPhone = contact.phones && contact.phones.length > 0
    ? contact.phones[0].value
    : contact.phone;

  const primaryEmail = contact.emails && contact.emails.length > 0
    ? contact.emails[0].value
    : contact.email;

  // Get initials for avatar placeholder
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Get color for category badges
  const getCategoryStyles = (category?: string) => {
    switch (category) {
      case 'Client':
        return { bg: '#E0F2FE', text: '#0369A1' }; // Light Blue / Blue
      case 'Recruiter':
        return { bg: '#F3E8FF', text: '#7E22CE' }; // Light Purple / Purple
      case 'Investor':
        return { bg: '#DCFCE7', text: '#15803D' }; // Light Green / Green
      case 'Developer':
        return { bg: '#FEF9C3', text: '#A16207' }; // Light Yellow / Yellow
      default:
        return { bg: '#F1F5F9', text: '#475569' }; // Light Slate / Slate
    }
  };

  const badge = getCategoryStyles(contact.category);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {getInitials(contact.name || 'Anonymous')}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {contact.name || 'Unnamed Contact'}
          </Text>
          <Text style={[styles.designation, { color: colors.textSecondary }]} numberOfLines={1}>
            {contact.designation || 'No title'}
          </Text>
          <Text style={[styles.company, { color: colors.textMuted }]} numberOfLines={1}>
            {contact.company || 'No company'}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.body}>
        {primaryPhone && (
          <View style={styles.detailRow}>
            <IconSymbol name="phone.fill" size={14} color={colors.textMuted} style={styles.icon} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{primaryPhone}</Text>
          </View>
        )}
        {primaryEmail && (
          <View style={styles.detailRow}>
            <IconSymbol name="envelope.fill" size={14} color={colors.textMuted} style={styles.icon} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>{primaryEmail}</Text>
          </View>
        )}
      </View>

      {(contact.category || contact.syncStatus === 'pending' || contact.syncStatus === 'failed') && (
        <View style={styles.footer}>
          {contact.category && (
            <View style={[styles.badge, { backgroundColor: badge.bg, marginRight: 8 }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>
                {contact.category}
              </Text>
            </View>
          )}
          {(contact.syncStatus === 'pending' || contact.syncStatus === 'failed') && (
            <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.badgeText, { color: '#D97706' }]}>
                ⚠️ Local Only (Pending Backup)
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
  },
  designation: {
    fontSize: 14,
    marginTop: 2,
  },
  company: {
    fontSize: 13,
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  body: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
