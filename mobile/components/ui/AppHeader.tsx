import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Palette, Typography } from '@/constants/theme';

interface AppHeaderProps {
  title?: string;
  rightAction?: React.ReactNode;
  onRightAction?: () => void;
  style?: ViewStyle;
}

/**
 * Mistral AI App Header
 * Restrained branding with subtle typography and sunset signature accent.
 */
export function AppHeader({
  title = 'QuickBiz',
  rightAction,
  onRightAction,
  style,
}: AppHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.brandRow}>
        <Text style={styles.brandTitle}>{title}</Text>
        <View style={styles.orangeDot} />
      </View>
      {rightAction && (
        <TouchableOpacity
          onPress={onRightAction}
          disabled={!onRightAction}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {rightAction}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: Palette.canvas,
    borderBottomWidth: 1,
    borderBottomColor: Palette.hairlineSoft,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 20,
    fontWeight: '700',
    color: Palette.ink,
    letterSpacing: -0.3,
  },
  orangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.primary,
    marginLeft: 3,
    marginTop: 4,
  },
});
