import { memo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Todo } from '@/domain/types';
import { useLists } from '@/store/lists';
import { Paper } from '@/ui/Paper';
import { StrikeText } from '@/ui/StrikeText';
import { colors, fonts, tiltFor } from '@/ui/theme';

const fmt = (ms?: number) => {
  if (!ms) return '';
  const d = new Date(ms);
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

function DoneCardBase({ todo }: { todo: Todo }) {
  const restore = useLists((s) => s.restoreTodo);
  const del = useLists((s) => s.deleteTodo);
  const tilt = tiltFor(todo.id);
  const out = useSharedValue(0);
  const h = useSharedValue(0);

  const doRestore = () => restore(todo.id);
  const onUndo = () => {
    out.value = withTiming(1, { duration: 280, easing: Easing.in(Easing.back(1.6)) }, (f) => {
      if (f) scheduleOnRN(doRestore);
    });
  };
  const onDelete = () =>
    Alert.alert('Apagar de vez?', todo.text, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => del(todo.id) },
    ]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - out.value,
    transform: [{ translateY: -out.value * 60 }, { rotate: `${tilt - out.value * 8}deg` }, { scale: 1 + out.value * 0.06 }],
  }));
  const wrap = useAnimatedStyle(() => (out.value === 0 ? {} : { height: h.value * (1 - out.value) }));

  return (
    <Animated.View
      style={[styles.wrap, wrap]}
      onLayout={(e) => {
        if (out.value === 0) h.value = e.nativeEvent.layout.height;
      }}
    >
      <Animated.View style={style}>
        <Pressable onLongPress={onDelete} delayLongPress={400}>
          <Paper id={todo.id} color={colors.donePaper} shadow={4} contentStyle={styles.content}>
            <View style={{ flex: 1 }}>
              <StrikeText id={todo.id} style={styles.text}>
                {todo.text}
              </StrikeText>
              {!!todo.notes && (
                <Text style={styles.notes} numberOfLines={2}>
                  {todo.notes}
                </Text>
              )}
              <Text style={styles.date}>{fmt(todo.doneAt)}</Text>
            </View>
            <Pressable onPress={onUndo} hitSlop={10} style={({ pressed }) => [styles.undo, pressed && { transform: [{ scale: 0.9 }, { rotate: '6deg' }] }]}>
              <Text style={styles.undoIcon}>↩</Text>
              <Text style={styles.undoLabel}>VOLTA</Text>
            </Pressable>
          </Paper>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export const DoneCard = memo(DoneCardBase);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingVertical: 6 },
  content: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 10, paddingVertical: 10, gap: 10 },
  text: { fontFamily: fonts.hand, fontSize: 18, lineHeight: 24, color: colors.doneText, alignSelf: 'flex-start' },
  notes: { fontFamily: fonts.hand, fontSize: 13, color: colors.doneText, opacity: 0.6, marginTop: 2 },
  date: { fontFamily: fonts.comic, fontSize: 12, letterSpacing: 1, color: colors.doneText, opacity: 0.55, marginTop: 2 },
  undo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.doneText,
    borderStyle: 'dashed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: '-3deg' }],
  },
  undoIcon: { fontSize: 18, color: colors.doneText, lineHeight: 20 },
  undoLabel: { fontFamily: fonts.comic, fontSize: 11, letterSpacing: 1, color: colors.doneText },
});
