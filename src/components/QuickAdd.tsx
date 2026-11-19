import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_TEXT } from '@/domain/types';
import { useLists } from '@/store/lists';
import { Paper } from '@/ui/Paper';
import { colors, fonts } from '@/ui/theme';

/** Bottom input. "Enviar" adds and keeps keyboard open for the next one. */
export function QuickAdd() {
  const [text, setText] = useState('');
  const add = useLists((s) => s.addTodo);
  const insets = useSafeAreaInsets();

  const submit = () => {
    if (!text.trim()) return;
    add(text);
    setText('');
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <Paper id="quick-add" color={colors.text} style={styles.paper} contentStyle={styles.row} shadow={4} rough={2.5}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Nova tarefa…"
          placeholderTextColor="#8B8478"
          maxLength={MAX_TEXT}
          returnKeyType="send"
          enterKeyHint="send"
          submitBehavior="submit"
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
          <Text style={styles.plus}>+</Text>
        </Pressable>
      </Paper>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 14, paddingTop: 8 },
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
  plus: { fontFamily: fonts.comic, fontSize: 30, lineHeight: 34, color: colors.ink },
});
