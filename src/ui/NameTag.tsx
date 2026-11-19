import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, fonts, seed } from './theme';

const RED = '#E23B33';
const RED_DOT = '#A91E18';
const CREAM = '#F6EEE2';
const CARD = '#EFE5D6';
const MARKER = '#2340D8';
const MISPRINT = '#FF4F8B';
const ZAP = '#37E0E6';

type Props = {
  id: string;
  value: string;
  hello?: string;
  label?: string;
  /** turns the name into an editable field */
  onChangeText?: (t: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Font size shrinks as the name grows, like squeezing a tag onto a sticker. */
function sizeFor(len: number) {
  if (len <= 8) return 44;
  if (len <= 14) return 36;
  if (len <= 22) return 29;
  return 23;
}

/** Print-style halftone fading out from the top-right corner. */
function halftoneDots(w: number, h: number) {
  const step = 8;
  const reach = Math.max(w, h) * 0.75;
  const out: [number, number, number][] = [];
  for (let row = 0; row * step < h + step; row++) {
    for (let col = 0; col * step < w + step; col++) {
      const x = col * step + (row % 2) * (step / 2);
      const y = row * step;
      const t = 1 - Math.hypot(w - x, y) / reach;
      if (t > 0.08) out.push([x, y, 0.6 + t * 2.4]);
    }
  }
  return out;
}

/** Hand-cut cyan "electric" squiggle. */
function Zap({ x, y, w, flip }: { x: number; y: number; w: number; flip?: boolean }) {
  const s = flip ? -1 : 1;
  const d = `M${x} ${y} l${w * 0.25 * s} ${-5} l${-w * 0.05 * s} ${7} l${w * 0.3 * s} ${-6} l${-w * 0.06 * s} ${7} l${w * 0.4 * s} ${-7}`;
  return <Path d={d} stroke={ZAP} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
}

/** Spider eyes peeking from the corner. */
function Eyes({ x, y }: { x: number; y: number }) {
  // inner-bottom corner -> sharp outer tip up top -> round belly back
  const eye = (ox: number, m: number) => {
    const X = x + ox;
    return `M${X} ${y - 2} Q${X - 3 * m} ${y - 12} ${X - 18 * m} ${y - 17} Q${X - 17 * m} ${y - 4} ${X - 8 * m} ${y + 1} Q${X - 3 * m} ${y + 2} ${X} ${y - 2} Z`;
  };
  return (
    <>
      <Path d={eye(0, 1)} stroke={RED} strokeWidth={2.2} fill="#fff" strokeLinejoin="round" />
      <Path d={eye(6, -1)} stroke={RED} strokeWidth={2.2} fill="#fff" strokeLinejoin="round" />
    </>
  );
}

/**
 * "HELLO my name is" sticker, spider-verse style: red halftone band,
 * cream card, marker-scrawled name with a misregistered pink print behind it.
 */
export function NameTag({
  id,
  value,
  hello = 'OLÁ',
  label = 'meu nome é',
  onChangeText,
  onSubmit,
  placeholder = 'escreve aqui',
  maxLength,
  autoFocus,
  style,
}: Props) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [card, setCard] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (set: typeof setSize) => (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    set((p) => (p && Math.abs(p.w - w) < 0.5 && Math.abs(p.h - h) < 0.5 ? p : { w, h }));
  };

  const s = seed(id);
  const dots = useMemo(() => (size ? halftoneDots(size.w, size.h) : []), [size]);
  const [inputH, setInputH] = useState(0);
  const tilt = -1.5 - s * 2;
  const shown = value || placeholder;
  const fontSize = sizeFor(shown.length);
  const nameStyle = [styles.name, { fontSize, lineHeight: fontSize * 1.15 }];
  const empty = !value;

  return (
    <View style={[{ transform: [{ rotate: `${tilt}deg` }] }, style]}>
      <View style={styles.shadow} />
      <View style={styles.tag} onLayout={onLayout(setSize)}>
        {size && (
          <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill} pointerEvents="none">
            {dots.map(([cx, cy, r], i) => (
              <Circle key={i} cx={cx} cy={cy} r={r} fill={RED_DOT} />
            ))}
          </Svg>
        )}

        <Text style={styles.hello}>{hello}</Text>
        <Text style={styles.label}>{label}</Text>

        <View style={styles.card} onLayout={onLayout(setCard)}>
          {card && (
            <Svg width={card.w} height={card.h} style={StyleSheet.absoluteFill} pointerEvents="none">
              <Zap x={10} y={22} w={34} />
              <Zap x={16} y={34} w={26} />
              <Zap x={card.w - 10} y={30} w={34} flip />
              <Zap x={card.w - 16} y={42} w={24} flip />
              <Zap x={14} y={card.h - 14} w={30} />
              <Eyes x={card.w - 30} y={card.h - 9} />
            </Svg>
          )}

          <View style={styles.nameWrap}>
            {/* misregistered print behind the marker */}
            {!empty && (
              <Text
                onLayout={(e) => setInputH(e.nativeEvent.layout.height)}
                style={[nameStyle, styles.misprint, { transform: [{ translateX: fontSize / 16 }, { translateY: fontSize / 16 }] }]} aria-hidden>
                {value}
              </Text>
            )}
            {onChangeText ? (
              <TextInput
                style={[nameStyle, styles.input, { height: empty ? fontSize * 1.15 : Math.max(fontSize * 1.15, inputH) }]}
                scrollEnabled={false}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#2340D855"
                maxLength={maxLength}
                autoFocus={autoFocus}
                multiline
                submitBehavior="submit"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                cursorColor={MISPRINT}
                selectionColor={MISPRINT + '66'}
              />
            ) : (
              <Text style={nameStyle}>{shown}</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute', left: 6, top: 6, right: -6, bottom: -6, borderRadius: 18, backgroundColor: colors.shadow },
  tag: {
    backgroundColor: RED,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.ink,
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  hello: {
    fontFamily: fonts.comic,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: 3,
    color: CREAM,
    textAlign: 'center',
  },
  label: {
    fontFamily: fonts.handBold,
    fontSize: 19,
    lineHeight: 22,
    color: CREAM,
    textAlign: 'center',
    marginTop: -6,
    marginBottom: 8,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 6,
    minHeight: 120,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 26,
  },
  nameWrap: { transform: [{ rotate: '-4deg' }] },
  name: {
    fontFamily: fonts.marker,
    color: MARKER,
    textAlign: 'center',
    includeFontPadding: false,
  },
  misprint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    color: MISPRINT,
  },
  input: {
    padding: 0,
    margin: 0,
    textAlignVertical: 'top',
    borderWidth: 0,
    overflow: 'hidden',
    // web: kill the browser focus ring, the sticker is the focus indicator
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});
