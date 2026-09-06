import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Palette, BorderRadius, Typography } from '@/constants/theme';
import { PrimaryButton } from './PrimaryButton';
import { IconSymbol } from './icon-symbol';

interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: any;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

/**
 * Mistral AI Clean Empty State
 * Restrained typography, cream icon container, no bloated illustrations.
 */
export function EmptyState({
  title,
  description,
  iconName = 'person.2.fill',
  actionTitle,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconTile}>
        <IconSymbol name={iconName} size={28} color={Palette.primary} />
      </View>
      <Text style={[styles.title, Typography.heading3]}>{title}</Text>
      <Text style={[styles.description, Typography.bodySm]}>{description}</Text>
      {actionTitle && onAction && (
        <PrimaryButton
          title={actionTitle}
          onPress={onAction}
          style={styles.actionBtn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg, // 12px radius
    backgroundColor: Palette.cream,
    borderWidth: 1,
    borderColor: Palette.beigeDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: Palette.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: Palette.stone,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 20,
  },
  actionBtn: {
    minWidth: 180,
  },
});
