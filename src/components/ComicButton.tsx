import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts } from '@/ui/theme';

type Variant = 'accent' | 'dark' | 'ghost' | 'light';

/** Chunky comic button: thick outline + hard shadow, presses down. */
export function ComicButton({
  label,
  onPress,
  variant = 'accent',
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = { accent: colors.accent, dark: colors.ink, ghost: 'transparent', light: colors.text }[variant];
  const fg = variant === 'dark' ? colors.text : colors.ink;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[style, disabled && { opacity: 0.45 }]}>
      {({ pressed }) => (
        <View>
          {variant !== 'ghost' && <View style={[styles.shadow]} />}
          <View
            style={[
              styles.btn,
              { backgroundColor: bg, borderColor: variant === 'ghost' ? 'transparent' : colors.ink },
              pressed && { transform: [{ translateX: 3 }, { translateY: 3 }] },
            ]}
          >
            <Text style={[styles.label, { color: fg }, variant === 'ghost' && styles.ghostLabel]}>{label}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute', left: 3, top: 3, right: -3, bottom: -3, backgroundColor: colors.shadow },
  btn: { borderWidth: 2.5, paddingHorizontal: 14, paddingVertical: 7, alignItems: 'center' },
  label: { fontFamily: fonts.comic, fontSize: 18, letterSpacing: 1 },
  ghostLabel: { textDecorationLine: 'underline' },
});
