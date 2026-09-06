import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Palette } from '@/constants/theme';

interface SunsetStripeProps {
  height?: number;
  style?: ViewStyle;
}

/**
 * Mistral AI Signature Sunset Stripe Band
 * Sequential spectrum blocks: #FA520F -> #FF8105 -> #FFA110 -> #FFB83E -> #FFE295 -> #FFD900 -> #FFF8E0
 * Anchors the bottom of key screens and editorial sections without external gradient dependencies.
 */
export function SunsetStripe({ height = 4, style }: SunsetStripeProps) {
  const spectrum = [
    Palette.primary,       // #FA520F
    Palette.sunshine800,   // #FF8105
    Palette.sunshine700,   // #FFA110
    Palette.sunshine500,   // #FFB83E
    Palette.block5,        // #FFE295
    Palette.yellowSaturated,// #FFD900
    Palette.cream,         // #FFF8E0
  ];

  return (
    <View style={[styles.container, { height }, style]}>
      {spectrum.map((color, idx) => (
        <View key={idx} style={[styles.block, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  block: {
    flex: 1,
    height: '100%',
  },
});
