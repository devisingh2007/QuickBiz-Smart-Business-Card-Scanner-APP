import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, } from 'react-native';
import { Palette, Typography, } from '@/constants/theme';
import { useTheme, } from '@/hooks/use-theme';
import { Avatar, } from './Avatar';
import { Badge, } from './Badge';
import { IconSymbol, } from './icon-symbol';
export function ContactRow({
  contact,
  onPress,
  showDivider = true,
  style
}) {
  const {
    colors
  } = useTheme();
  const primaryPhone = contact.phones && contact.phones.length > 0 ? contact.phones[0].value : contact.phone;
  const subtitleParts = [contact.designation, contact.company].filter(Boolean);
  const subtitle = subtitleParts.join(' · ');
  return <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[styles.container, {
    backgroundColor: colors.surface
  }, style]}>
      <View style={styles.innerRow}>
        <Avatar name={contact.name || 'Anonymous'} size="md" variant="cream" />
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, {
            color: colors.textPrimary
          }]} numberOfLines={1}>
              {contact.name || 'Unnamed Contact'}
            </Text>
            {contact.category && <Badge label={contact.category} variant="cream" size="sm" />}
          </View>
          {subtitle.length > 0 && <Text style={[styles.subtitle, {
          color: colors.textSecondary
        }]} numberOfLines={1}>
              {subtitle}
            </Text>}
          {primaryPhone && <Text style={[styles.phone, {
          color: colors.textTertiary
        }]} numberOfLines={1}>
              {primaryPhone}
            </Text>}
        </View>
        <IconSymbol name="chevron.right" size={14} color={colors.textTertiary} style={styles.chevron} />
      </View>
      {showDivider && <View style={[styles.divider, {
      backgroundColor: colors.borderSoft
    }]} />}
    </TouchableOpacity>;
}
const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    backgroundColor: Palette.canvas,
    paddingHorizontal: 20,
    justifyContent: 'center'
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  name: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    color: Palette.ink,
    flexShrink: 1,
    marginRight: 6
  },
  subtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: Palette.slate,
    marginBottom: 2
  },
  phone: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    color: Palette.stone
  },
  chevron: {
    marginLeft: 4
  },
  divider: {
    height: 1,
    backgroundColor: Palette.hairlineSoft,
    marginLeft: 56 // Inset aligned with text
  }
});