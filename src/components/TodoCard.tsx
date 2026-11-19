import { memo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useIsActive, useReorderableDrag } from 'react-native-reorderable-list';
import { scheduleOnRN } from 'react-native-worklets';

import { Todo } from '@/domain/types';
import { useLists } from '@/store/lists';
import { useImpacts } from '@/ui/impact/store';
import { Paper } from '@/ui/Paper';
import { colors, fonts, MAX_CONTENT, paperFor, tiltFor } from '@/ui/theme';

type Props = { todo: Todo; onOpen: (t: Todo) => void };

function TodoCardBase({ todo, onOpen }: Props) {
  const { width } = useWindowDimensions();
  const drag = useReorderableDrag();
  const active = useIsActive();
  const complete = useLists((s) => s.completeTodo);
  const fire = useImpacts((s) => s.fire);
  const color = paperFor(todo.id);
  const tilt = tiltFor(todo.id);

  const tx = useSharedValue(0);
  const height = useSharedValue(0);
  const collapse = useSharedValue(1);

  const finish = () => complete(todo.id);
  const thrown = (dir: 1 | -1, y: number) => {
    fire({ side: dir, y, color });
    collapse.value = withTiming(0, { duration: 240, easing: Easing.inOut(Easing.quad) }, (f) => {
      if (f) scheduleOnRN(finish);
    });
  };

  const pan = Gesture.Pan()
    // Activate early on horizontal movement and tolerate the vertical drift of a thumb arc;
    // the old 14/12 thresholds made diagonal swipes fail and the card looked stuck.
    .activeOffsetX([-8, 8])
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      tx.value = e.translationX;
    })
    .onEnd((e) => {
      const dir = (Math.sign(e.translationX || e.velocityX) || 1) as 1 | -1;
      const far = Math.abs(e.translationX) > width * 0.32;
      const fast = Math.abs(e.velocityX) > 900 && Math.sign(e.velocityX) === dir;
      if (far || fast) {
        const y = e.absoluteY;
        tx.value = withTiming(dir * (width + 60), { duration: 170, easing: Easing.in(Easing.quad) }, (f) => {
          if (f) scheduleOnRN(thrown, dir, y);
        });
      } else {
        tx.value = withSpring(0, { damping: 14, stiffness: 180 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const p = tx.value / width;
    return {
      transform: [
        { translateX: tx.value },
        { translateY: -Math.abs(p) * 18 },
        { rotate: `${p * 14}deg` },
      ],
    };
  });
  const wrapStyle = useAnimatedStyle(() =>
    collapse.value === 1 ? {} : { height: height.value * collapse.value, opacity: collapse.value },
  );
  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(tx.value), [10, width * 0.32], [0, 1], 'clamp'),
  }));

  return (
    <Animated.View
      style={[styles.wrap, wrapStyle]}
      onLayout={(e) => {
        if (collapse.value === 1) height.value = e.nativeEvent.layout.height;
      }}
    >
      <Animated.Text style={[styles.hint, hintStyle]}>RISCA!</Animated.Text>
      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <Pressable
            onPress={() => onOpen(todo)}
            onLongPress={drag}
            delayLongPress={280}
            style={{ transform: [{ rotate: `${tilt}deg` }] }}
          >
            <Paper
              id={todo.id}
              color={color}
              tape={todo.id.charCodeAt(0) % 3 === 0}
              shadow={active ? 10 : 5}
              contentStyle={styles.content}
            >
              <Text style={styles.text}>{todo.text}</Text>
              {!!todo.notes && (
                <View style={styles.notesRow}>
                  <View style={styles.notesMark} />
                  <Text style={styles.notes} numberOfLines={1}>
                    {todo.notes}
                  </Text>
                </View>
              )}
            </Paper>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

export const TodoCard = memo(TodoCardBase);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingVertical: 9, overflow: 'visible', width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center' },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    fontFamily: fonts.comic,
    fontSize: 22,
    letterSpacing: 2,
    color: colors.accent,
  },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22, minHeight: 84, justifyContent: 'center' },
  text: { fontFamily: fonts.hand, fontSize: 21, lineHeight: 28, color: colors.paperText },
  notesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  notesMark: { width: 10, height: 2, backgroundColor: colors.paperText, opacity: 0.5 },
  notes: { flex: 1, fontFamily: fonts.hand, fontSize: 15, color: colors.paperText, opacity: 0.7 },
});
