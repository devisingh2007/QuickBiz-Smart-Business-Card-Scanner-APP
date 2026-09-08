import React, { useState, } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, Text, } from 'react-native';
import { BorderRadius, Typography, Palette, } from '@/constants/theme';
import { useTheme, } from '@/hooks/use-theme';
/**
 * Mistral AI Dark Button
 * Pure Ink #1F1F1F surface (or #202020 in dark mode), 8px radius, white text.
 */
export function DarkButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon
}) {
  const {
    isDark,
    colors
  } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  return <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={() => setIsPressed(true)} onPressOut={() => setIsPressed(false)} disabled={disabled || loading} style={[styles.button, {
    backgroundColor: isDark ? colors.card : Palette.ink,
    borderColor: isDark ? colors.border : 'transparent'
  }, isPressed && {
    backgroundColor: isDark ? colors.elevated : Palette.inkTint
  }, disabled && styles.buttonDisabled, style]}>
      {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <>
          {icon}
          <Text style={[styles.text, icon ? {
        marginLeft: 8
      } : null, textStyle]}>
            {title}
          </Text>
        </>}
    </TouchableOpacity>;
}
const styles = StyleSheet.create({
  button: {
    height: 48,
    minHeight: 44,
    borderRadius: BorderRadius.md,
    // Exact 8px per Mistral design system
    backgroundColor: Palette.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  buttonPressed: {
    backgroundColor: Palette.inkTint // #3D3D3D
  },
  buttonDisabled: {
    backgroundColor: Palette.stone,
    opacity: 0.6
  },
  text: {
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: -0.1
  }
});