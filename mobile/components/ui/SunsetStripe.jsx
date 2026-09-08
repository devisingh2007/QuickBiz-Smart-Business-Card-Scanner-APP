import React from 'react';
import { View, StyleSheet, } from 'react-native';
import { Palette, } from '@/constants/theme';

export function SunsetStripe({
  height = 4,
  style
}) {
  const spectrum = [Palette.primary,
  // #FA520F
  Palette.sunshine800,
  // #FF8105
  Palette.sunshine700,
  // #FFA110
  Palette.sunshine500,
  // #FFB83E
  Palette.block5,
  // #FFE295
  Palette.yellowSaturated,
  // #FFD900
  Palette.cream // #FFF8E0
  ];
  return <View style={[styles.container, {
    height
  }, style]}>
      {spectrum.map((color, idx) => <View key={idx} style={[styles.block, {
      backgroundColor: color
    }]} />)}
    </View>;
}
const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    overflow: 'hidden'
  },
  block: {
    flex: 1,
    height: '100%'
  }
});