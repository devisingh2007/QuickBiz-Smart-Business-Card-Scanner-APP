import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Palette, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BadgeVariant = 'orange' | 'cream' | 'dark' | 'neutral' | 'success';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = 'neutral',
  size = 'md',
  style,
  textStyle,
}: BadgeProps) {
  const { colors, isDark } = useTheme();
  const isSm = size === 'sm';

  const getContainerStyle = () => {
    switch (variant) {
      case 'orange':
        return {
          backgroundColor: Palette.primary,
          borderColor: Palette.primaryDeep,
        };
      case 'cream':
        return {
          backgroundColor: colors.surfaceCream,
          borderColor: colors.borderBeige,
        };
      case 'dark':
        return {
          backgroundColor: isDark ? colors.card : Palette.ink,
          borderColor: isDark ? colors.border : Palette.charcoal,
        };
      case 'success':
        return {
          backgroundColor: colors.successLight,
          borderColor: isDark ? '#1B8755' : '#C6E8D5',
        };
      case 'neutral':
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'orange':
      case 'dark':
        return '#FFFFFF';
      case 'cream':
        return isDark ? colors.textPrimary : Palette.ink;
      case 'success':
        return colors.success;
      case 'neutral':
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        isSm ? styles.badgeSm : styles.badgeMd,
        getContainerStyle(),
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          isSm ? styles.textSm : styles.textMd,
          { color: getTextColor() },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 9999, // Pills allowed strictly for badges per Mistral guidelines
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontFamily: Typography.fontFamily.sans,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 10,
    lineHeight: 13,
  },
  textMd: {
    fontSize: 12,
    lineHeight: 15,
  },
});
