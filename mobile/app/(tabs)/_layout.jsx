import { Tabs, } from 'expo-router';
import React from 'react';
import { Platform, } from 'react-native';
import { useSafeAreaInsets, } from 'react-native-safe-area-context';
import { HapticTab, } from '@/components/haptic-tab';
import { IconSymbol, } from '@/components/ui/icon-symbol';
import { Typography, } from '@/constants/theme';
import { useTheme, } from '@/hooks/use-theme';
export default function TabLayout() {
  const {
    colors,
    isDark
  } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const tabPaddingBottom = bottomInset > 0 ? bottomInset : Platform.OS === 'android' ? 12 : 8;
  const tabHeight = 60 + tabPaddingBottom;
  return <Tabs screenOptions={{
    tabBarActiveTintColor: colors.tint,
    tabBarInactiveTintColor: colors.tabIconDefault,
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarHideOnKeyboard: true,
    tabBarStyle: {
      backgroundColor: colors.tabBarBackground || colors.surface,
      borderTopColor: colors.tabBarBorder || colors.border,
      borderTopWidth: 1,
      height: tabHeight,
      paddingBottom: tabPaddingBottom,
      paddingTop: 6,
      elevation: 8,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: -2
      },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 4
    },
    tabBarLabelStyle: {
      fontFamily: Typography.fontFamily.sans,
      fontSize: 11,
      fontWeight: '500',
      marginTop: 2,
      marginBottom: 2
    },
    tabBarItemStyle: {
      paddingVertical: 0,
      justifyContent: 'center',
      alignItems: 'center'
    }
  }}>
      <Tabs.Screen name="index" options={{
      title: 'Home',
      tabBarIcon: ({
        color
      }) => <IconSymbol size={24} name="house.fill" color={color} />
    }} />
      <Tabs.Screen name="contacts" options={{
      title: 'Contacts',
      tabBarIcon: ({
        color
      }) => <IconSymbol size={24} name="person.2.fill" color={color} />
    }} />
      <Tabs.Screen name="scan" options={{
      title: 'Scan',
      tabBarIcon: ({
        color
      }) => <IconSymbol size={24} name="camera.fill" color={color} />
    }} />
      <Tabs.Screen name="settings" options={{
      title: 'Settings',
      tabBarIcon: ({
        color
      }) => <IconSymbol size={24} name="gearshape.fill" color={color} />
    }} />
    </Tabs>;
}