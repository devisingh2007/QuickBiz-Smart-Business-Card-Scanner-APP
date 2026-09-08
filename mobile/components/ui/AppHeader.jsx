import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, } from 'react-native';
import { Palette, Typography, } from '@/constants/theme';
import { useTheme, } from '@/hooks/use-theme';
export function AppHeader({
  title = 'QuickBiz',
  rightAction,
  onRightAction,
  style
}) {
  const {
    colors
  } = useTheme();
  return <View style={[styles.header, {
    backgroundColor: colors.surface,
    borderBottomColor: colors.borderSoft
  }, style]}>
      <View style={styles.brandRow}>
        <Text style={[styles.brandTitle, {
        color: colors.textPrimary
      }]}>{title}</Text>
        <View style={styles.orangeDot} />
      </View>
      {rightAction && <TouchableOpacity onPress={onRightAction} disabled={!onRightAction} hitSlop={{
      top: 10,
      bottom: 10,
      left: 10,
      right: 10
    }}>
          {rightAction}
        </TouchableOpacity>}
    </View>;
}
const styles = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  brandTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3
  },
  orangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.primary,
    marginLeft: 3,
    marginTop: 4
  }
});