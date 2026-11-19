import { ReactNode, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Polygon, Rect, Stop } from 'react-native-svg';

import { colors, rng, seed } from './theme';

/** Irregular cut-out polygon: jittered corners and edges. */
function cutPath(w: number, h: number, s: number, rough: number) {
  const r = rng(s);
  const j = () => (r() - 0.5) * rough;
  const pts: [number, number][] = [];
  const step = 28;
  for (let x = 0; x < w; x += step) pts.push([x + j(), Math.abs(j())]);
  pts.push([w - Math.abs(j()), Math.abs(j())]);
  for (let y = step; y < h; y += step) pts.push([w - Math.abs(j()), y + j()]);
  pts.push([w - Math.abs(j()), h - Math.abs(j())]);
  for (let x = w - step; x > 0; x -= step) pts.push([x + j(), h - Math.abs(j())]);
  pts.push([Math.abs(j()), h - Math.abs(j())]);
  for (let y = h - step; y > 0; y -= step) pts.push([Math.abs(j()), y + j()]);
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

type Props = {
  id: string;
  color: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  tape?: boolean;
  shadow?: number;
  rough?: number;
};

/** Paper cut-out with hard offset shadow and optional tape strip. */
export function Paper({ id, color, children, style, contentStyle, tape, shadow = 5, rough = 3.5 }: Props) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const s = seed(id);
  const points = useMemo(() => (size ? cutPath(size.w, size.h, s, rough) : ''), [size, s, rough]);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || Math.abs(size.w - width) > 0.5 || Math.abs(size.h - height) > 0.5) setSize({ w: width, h: height });
  };
  const tapeX = 0.2 + s * 0.5;
  const tapeRot = (s - 0.5) * 14;

  return (
    <View style={style} onLayout={onLayout}>
      {size && (
        <Svg
          width={size.w + shadow + 2}
          height={size.h + shadow + 2}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Polygon points={points} fill={colors.shadow} transform={`translate(${shadow},${shadow})`} />
          <Defs>
            <LinearGradient id={`curl-${id}`} x1="0" y1="0" x2="0.15" y2="1">
              <Stop offset="0.55" stopColor="#000" stopOpacity={0} />
              <Stop offset="1" stopColor="#000" stopOpacity={0.13} />
            </LinearGradient>
          </Defs>
          <Polygon points={points} fill={color} />
          <Polygon points={points} fill={`url(#curl-${id})`} />
          {/* faint paper grain */}
          <Rect x={0} y={0} width={size.w} height={size.h * 0.18} fill="#fff" opacity={0.08} />
        </Svg>
      )}
      <View style={[{ opacity: size ? 1 : 0 }, contentStyle]}>{children}</View>
      {tape && size && (
        <View
          pointerEvents="none"
          style={[
            styles.tape,
            { left: size.w * tapeX - 28, transform: [{ rotate: `${tapeRot}deg` }] },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tape: {
    position: 'absolute',
    top: -9,
    width: 56,
    height: 18,
    backgroundColor: 'rgba(255,255,240,0.38)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
