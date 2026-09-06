import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Palette, Typography } from '@/constants/theme';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { IconSymbol } from './icon-symbol';

export interface ContactRowData {
  id?: string;
  name: string;
  phone?: string;
  phones?: { value: string; type?: string; label?: string }[];
  email?: string;
  emails?: { value: string; type?: string }[];
  company?: string;
  designation?: string;
  category?: string;
  syncStatus?: string;
}

interface ContactRowProps {
  contact: ContactRowData;
  onPress: () => void;
  showDivider?: boolean;
  style?: ViewStyle;
}

/**
 * Mistral AI Restrained Contact Row
 * Clean row hierarchy: Name in medium weight, designation/company in slate,
 * initials avatar with cream surface, subtle hairline divider.
 */
export function ContactRow({
  contact,
  onPress,
  showDivider = true,
  style,
}: ContactRowProps) {
  const primaryPhone =
    contact.phones && contact.phones.length > 0
      ? contact.phones[0].value
      : contact.phone;

  const subtitleParts = [contact.designation, contact.company].filter(Boolean);
  const subtitle = subtitleParts.join(' · ');

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <View style={styles.innerRow}>
        <Avatar name={contact.name || 'Anonymous'} size="md" variant="cream" />
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {contact.name || 'Unnamed Contact'}
            </Text>
            {contact.category && (
              <Badge label={contact.category} variant="cream" size="sm" />
            )}
          </View>
          {subtitle.length > 0 && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          {primaryPhone && (
            <Text style={styles.phone} numberOfLines={1}>
              {primaryPhone}
            </Text>
          )}
        </View>
        <IconSymbol
          name="chevron.right"
          size={14}
          color={Palette.stone}
          style={styles.chevron}
        />
      </View>
      {showDivider && <View style={styles.divider} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    backgroundColor: Palette.canvas,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    color: Palette.ink,
    flexShrink: 1,
    marginRight: 6,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: Palette.slate,
    marginBottom: 2,
  },
  phone: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    color: Palette.stone,
  },
  chevron: {
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.hairlineSoft,
    marginLeft: 56, // Inset aligned with text
  },
});
