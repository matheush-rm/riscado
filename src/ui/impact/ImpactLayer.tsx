import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, fonts } from '../theme';
import { Impact, useImpacts } from './store';

const WORDS = ['POW!', 'BAM!', 'FEITO!', 'TCHAU!', 'ZÁS!', 'PLAFT!', 'VUPT!'];
const BURST = 132;

function burstPoints(size: number, spikes: number, seed: number) {
  const c = size / 2;
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (Math.PI * i) / spikes;
    const jitter = 0.82 + ((Math.sin(seed * 31 + i * 7.1) + 1) / 2) * 0.18;
    const r = i % 2 === 0 ? c * jitter : c * 0.52;
    pts.push(`${(c + Math.cos(a) * r).toFixed(1)},${(c + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
}

function Bit({ p, side, color, i, y }: { p: SharedValue<number>; side: 1 | -1; color: string; i: number; y: number }) {
  const { width } = useWindowDimensions();
  const cfg = useMemo(() => {
    const r = (k: number) => (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1;
    const a = Math.abs;
    return {
      dx: 30 + a(r(1)) * 120,
      dy: (r(2) - 0) * 90 - 50,
      rot: r(3) * 540,
      w: 8 + a(r(4)) * 14,
      h: 6 + a(r(5)) * 10,
    };
  }, [i]);
  const style = useAnimatedStyle(() => {
    const t = p.value;
    const x = side === 1 ? width - 6 - cfg.dx * t : 6 + cfg.dx * t;
    return {
      opacity: interpolate(t, [0, 0.1, 0.75, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: x - cfg.w / 2 },
        { translateY: y + cfg.dy * t + 140 * t * t - cfg.h / 2 },
        { rotate: `${cfg.rot * t}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[styles.bit, { width: cfg.w, height: cfg.h, backgroundColor: i % 3 === 0 ? colors.text : color }, style]}
    />
  );
}

function OneImpact({ impact }: { impact: Impact }) {
  const { width } = useWindowDimensions();
  const done = useImpacts((s) => s.done);
  const p = useSharedValue(0);
  const word = useMemo(() => WORDS[impact.id % WORDS.length], [impact.id]);
  const points = useMemo(() => burstPoints(BURST, 11, impact.id), [impact.id]);

  useEffect(() => {
    p.value = withTiming(1, { duration: 850, easing: Easing.out(Easing.quad) }, (fin) => {
      if (fin) scheduleOnRN(done, impact.id);
    });
  }, [p, done, impact.id]);

  const edge = impact.side === 1 ? width : 0;
  const burstStyle = useAnimatedStyle(() => {
    const t = p.value;
    const s = interpolate(t, [0, 0.12, 0.25, 1], [0.2, 1.25, 1, 0.95]);
    return {
      opacity: interpolate(t, [0, 0.05, 0.7, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: edge - BURST / 2 - impact.side * 34 },
        { translateY: impact.y - BURST / 2 },
        { scale: s },
        { rotate: `${impact.side * (-12 + t * 8)}deg` },
      ],
    };
  });
  const flash = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.04, 0.3], [0, 0.9, 0], 'clamp'),
    transform: [{ translateY: impact.y - 90 }, { scaleY: interpolate(p.value, [0, 0.3], [0.4, 1.4], 'clamp') }],
  }));

  return (
    <>
      <Animated.View style={[styles.flash, impact.side === 1 ? { right: 0 } : { left: 0 }, flash]} />
      {Array.from({ length: 9 }, (_, i) => (
        <Bit key={i} i={i + impact.id * 9} p={p} side={impact.side} color={impact.color} y={impact.y} />
      ))}
      <Animated.View style={[styles.burst, burstStyle]}>
        <Svg width={BURST} height={BURST} style={StyleSheet.absoluteFill}>
          <Polygon points={points} fill={colors.ink} transform="translate(4,5)" />
          <Polygon points={points} fill={colors.accent} stroke={colors.ink} strokeWidth={3} />
          <Polygon points={burstPoints(BURST * 0.62, 9, impact.id + 1)} fill="#FFE066" transform={`translate(${BURST * 0.19},${BURST * 0.19})`} />
        </Svg>
        <Text style={styles.word}>{word}</Text>
      </Animated.View>
    </>
  );
}

/** Full-screen overlay where thrown cards "hit" the screen edge. */
export function ImpactLayer() {
  const impacts = useImpacts((s) => s.impacts);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {impacts.map((i) => (
        <OneImpact key={i.id} impact={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  burst: { position: 'absolute', left: 0, top: 0, width: BURST, height: BURST, alignItems: 'center', justifyContent: 'center' },
  word: {
    fontFamily: fonts.comic,
    fontSize: 26,
    color: colors.ink,
    transform: [{ rotate: '-8deg' }],
    textShadowColor: '#fff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  flash: { position: 'absolute', top: 0, width: 10, height: 180, backgroundColor: '#FFF6D6', borderRadius: 6 },
  bit: { position: 'absolute', left: 0, top: 0, borderWidth: 1.5, borderColor: colors.ink },
});
