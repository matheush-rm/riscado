import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useSyncStatus } from '@/sync/engine';
import { useSettings } from '@/store/settings';
import { colors, fonts } from '@/ui/theme';

/** Tiny sync indicator: spins while syncing, "!" on error. Hidden when GitHub not set. */
export function SyncBadge() {
  const repo = useSettings((s) => s.github.repo);
  const { running, lastError } = useSyncStatus();
  const rot = useSharedValue(0);

  useEffect(() => {
    if (running) rot.value = withRepeat(withTiming(360, { duration: 900 }), -1);
    else {
      cancelAnimation(rot);
      rot.value = 0;
    }
  }, [running, rot]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  if (!repo) return null;
  return (
    <Pressable hitSlop={10} onPress={() => router.push('/github')}>
      <Animated.View style={[styles.dot, lastError && !running ? styles.err : null, style]}>
        <Text style={styles.t}>{lastError && !running ? '!' : '⟳'}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  err: { borderColor: colors.accent, backgroundColor: colors.accent },
  t: { fontFamily: fonts.comic, color: colors.text, fontSize: 15, lineHeight: 18 },
});
