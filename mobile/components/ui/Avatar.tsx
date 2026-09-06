import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Palette, Typography } from '@/constants/theme';

export interface AvatarProps {
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'cream' | 'orange' | 'dark' | 'neutral';
  style?: ViewStyle;
}

export function Avatar({
  name = 'QuickBiz',
  size = 'md',
  variant = 'cream',
  style,
}: AvatarProps) {
  const getInitials = (str: string) => {
    if (!str) return 'Q';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { width: 32, height: 32, fontSize: 12 };
      case 'lg':
        return { width: 64, height: 64, fontSize: 22 };
      case 'md':
      default:
        return { width: 44, height: 44, fontSize: 16 };
    }
  };

  const getColors = () => {
    switch (variant) {
      case 'orange':
        return {
          backgroundColor: Palette.primary,
          borderColor: Palette.primaryDeep,
          textColor: Palette.onPrimary,
        };
      case 'dark':
        return {
          backgroundColor: Palette.ink,
          borderColor: Palette.charcoal,
          textColor: Palette.onDark,
        };
      case 'neutral':
        return {
          backgroundColor: Palette.surface,
          borderColor: Palette.hairline,
          textColor: Palette.slate,
        };
      case 'cream':
      default:
        return {
          backgroundColor: Palette.cream,
          borderColor: Palette.beigeDeep,
          textColor: Palette.ink,
        };
    }
  };

  const dims = getDimensions();
  const clrs = getColors();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: dims.width,
          height: dims.height,
          borderRadius: dims.width / 2,
          backgroundColor: clrs.backgroundColor,
          borderColor: clrs.borderColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            fontSize: dims.fontSize,
            color: clrs.textColor,
          },
        ]}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: Typography.fontFamily.sans,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
