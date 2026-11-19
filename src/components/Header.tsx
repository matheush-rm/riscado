import { useNavigation } from 'expo-router';
import type { DrawerNavigationProp } from 'expo-router/drawer';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/ui/theme';

import { SyncBadge } from './SyncBadge';

function Burger() {
  return (
    <View style={{ gap: 4 }}>
      {[22, 16, 20].map((w, i) => (
        <View key={i} style={{ width: w, height: 3.5, backgroundColor: colors.text, transform: [{ rotate: `${(i - 1) * 2}deg` }] }} />
      ))}
    </View>
  );
}

export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const nav = useNavigation<DrawerNavigationProp<Record<string, undefined>>>();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <Pressable hitSlop={12} onPress={() => nav.openDrawer()} style={styles.burger}>
        <Burger />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <SyncBadge />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 10, gap: 14 },
  burger: { padding: 4 },
  title: {
    fontFamily: fonts.comic,
    fontSize: 34,
    letterSpacing: 1.5,
    color: colors.text,
    textShadowColor: colors.accent,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    transform: [{ rotate: '-1.5deg' }],
  },
  subtitle: { fontFamily: fonts.hand, fontSize: 14, color: colors.muted, marginTop: -2 },
});
