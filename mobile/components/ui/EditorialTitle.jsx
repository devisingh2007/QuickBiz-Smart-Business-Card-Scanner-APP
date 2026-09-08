import React from 'react';
import { View, Text, StyleSheet, } from 'react-native';
import { Typography, } from '@/constants/theme';
import { useTheme, } from '@/hooks/use-theme';
/**
 * Editorial Title Component
 * Emulates the PP Editorial Old serif voice for titles paired with Inter body.
 */
export function EditorialTitle({
  title,
  subtitle,
  size = 'display',
  style,
  titleStyle,
  subtitleStyle
}) {
  const {
    colors
  } = useTheme();
  const getTitleTypography = () => {
    switch (size) {
      case 'hero':
        return Typography.heroDisplay;
      case 'section':
        return Typography.heading1;
      case 'display':
      default:
        return Typography.displayLg;
    }
  };
  return <View style={[styles.container, style]}>
    <Text style={[styles.title, getTitleTypography(), {
      color: colors.textPrimary
    }, titleStyle]}>
      {title}
    </Text>
    {subtitle && <Text style={[styles.subtitle, Typography.subtitle, {
      color: colors.textSecondary
    }, subtitleStyle]}>
      {subtitle}
    </Text>}
  </View>;
}
const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  title: {},
  subtitle: {
    marginTop: 6
  }
});