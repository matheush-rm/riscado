import { ComponentRef, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_TEXT } from '@/domain/types';
import { useLists } from '@/store/lists';
import { Paper } from '@/ui/Paper';
import { colors, fonts, MAX_CONTENT } from '@/ui/theme';

/**
 * Bottom input. "Enviar" adds and keeps keyboard open for the next one.
 * `focusRequest` focuses it (widget "+" deep link), then calls `onFocused`.
 */
export function QuickAdd({ focusRequest, onFocused }: { focusRequest?: boolean; onFocused?: () => void }) {
  const [text, setText] = useState('');
  const ref = useRef<ComponentRef<typeof TextInput>>(null);
  const add = useLists((s) => s.addTodo);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!focusRequest) return;
    // wait for the screen/keyboard controller to settle after a cold start
    const t = setTimeout(() => {
      ref.current?.focus();
      onFocused?.();
    }, 350);
    return () => clearTimeout(t);
  }, [focusRequest, onFocused]);

  const submit = () => {
    if (!text.trim()) return;
    add(text);
    setText('');
    ref.current?.focus();
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <Paper id="quick-add" color={colors.text} style={styles.paper} contentStyle={styles.row} shadow={4} rough={2.5}>
        <TextInput
          ref={ref}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Nova tarefa…"
          placeholderTextColor="#8B8478"
          maxLength={MAX_TEXT}
          returnKeyType="send"
          enterKeyHint="send"
          submitBehavior="submit"
          blurOnSubmit={false}
          onSubmitEditing={submit}
          cursorColor={colors.accent}
          selectionColor={colors.accent + '66'}
        />
        {text.length >= MAX_TEXT - 30 && (
          <Text style={[styles.count, text.length >= MAX_TEXT && { color: colors.accent }]}>
            {MAX_TEXT - text.length}
          </Text>
        )}
        <Pressable onPress={submit} hitSlop={8} style={({ pressed }) => [styles.btn, pressed && { transform: [{ scale: 0.92 }] }]}>
          <View style={styles.plusH} />
          <View style={styles.plusV} />
        </Pressable>
      </Paper>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 14, paddingTop: 8, width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center' },
  paper: {},
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 6, minHeight: 54 },
  input: { flex: 1, fontFamily: fonts.hand, fontSize: 18, color: colors.paperText, paddingVertical: 10 },
  count: { fontFamily: fonts.comic, fontSize: 15, color: '#8B8478', marginHorizontal: 6 },
  btn: {
    width: 42,
    height: 42,
    backgroundColor: colors.accent,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '4deg' }],
  },
  plusH: { position: 'absolute', width: 20, height: 4.5, backgroundColor: colors.ink },
  plusV: { position: 'absolute', width: 4.5, height: 20, backgroundColor: colors.ink },
});
