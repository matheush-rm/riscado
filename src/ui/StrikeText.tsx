import { useState } from 'react';
import { StyleProp, Text, TextLayoutEvent, TextStyle, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, rng, seed } from './theme';

type Line = { x: number; y: number; width: number; height: number };

/** Text with a hand-drawn marker strike over each line. */
export function StrikeText({
  id,
  children,
  style,
  color = colors.strike,
}: {
  id: string;
  children: string;
  style?: StyleProp<TextStyle>;
  color?: string;
}) {
  const [textLines, setLines] = useState<Line[]>([]);
  const [box, setBox] = useState<Line | null>(null);
  const onTextLayout = (e: TextLayoutEvent) => setLines(e.nativeEvent.lines);
  // onTextLayout is native only; fall back to one strike over the whole box
  const lines = textLines.length ? textLines : box ? [box] : [];

  const r = rng(seed(id + 's'));
  const paths = lines.map((l) => {
    const y = l.y + l.height * 0.55;
    const x0 = l.x - 4;
    const x1 = l.x + l.width + 4;
    const wob = () => (r() - 0.5) * 4;
    const mid = (x0 + x1) / 2;
    return `M${x0},${y + wob()} Q${mid},${y + wob() * 1.5} ${x1},${y + wob()} ` +
      // second pass, like a marker going back
      `M${x1 - 6},${y + 2 + wob()} Q${mid},${y + 3 + wob()} ${x0 + 8},${y + 1 + wob()}`;
  });

  return (
    <View>
      <Text
        style={style}
        onTextLayout={onTextLayout}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setBox({ x: 0, y: 0, width, height });
        }}
      >
        {children}
      </Text>
      {lines.length > 0 && (
        <Svg style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} pointerEvents="none">
          {paths.map((d, i) => (
            <Path key={i} d={d} stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.9} />
          ))}
        </Svg>
      )}
    </View>
  );
}
