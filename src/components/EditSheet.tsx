import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_TEXT, Todo } from '@/domain/types';
import { useLists } from '@/store/lists';
import { Paper } from '@/ui/Paper';
import { colors, fonts, paperFor } from '@/ui/theme';

import { ComicButton } from './ComicButton';

/** Edit text + notes of a pending item. Closing saves. */
export function EditSheet({ todo, onClose }: { todo: Todo | null; onClose: () => void }) {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const update = useLists((s) => s.updateTodo);
  const del = useLists((s) => s.deleteTodo);
  const complete = useLists((s) => s.completeTodo);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (todo) {
      setText(todo.text);
      setNotes(todo.notes);
    }
  }, [todo]);

  const save = () => {
    if (todo && (text !== todo.text || notes !== todo.notes)) update(todo.id, { text, notes });
    onClose();
  };

  return (
    <Modal visible={!!todo} transparent animationType="fade" onRequestClose={save} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.backdrop, { paddingBottom: 40 + insets.bottom }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={save} />
        <KeyboardAvoidingView behavior="padding" style={styles.avoider} pointerEvents="box-none">
          {todo && (
            <Paper id={todo.id + 'edit'} color={paperFor(todo.id)} style={styles.sheet} contentStyle={styles.body} tape shadow={8}>
              <TextInput
                style={styles.text}
                value={text}
                onChangeText={(t) => setText(t.replace(/\n/g, ' '))}
                maxLength={MAX_TEXT}
                multiline
                submitBehavior="blurAndSubmit"
                placeholder="Tarefa"
                placeholderTextColor="#0006"
                cursorColor={colors.ink}
              />
              <Text style={styles.count}>
                {text.length}/{MAX_TEXT}
              </Text>
              <View style={styles.rule} />
              <TextInput
                style={styles.notes}
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="Notas (opcional)"
                placeholderTextColor="#0006"
                cursorColor={colors.ink}
                textAlignVertical="top"
              />
              <View style={styles.actions}>
                <ComicButton
                  label="Apagar"
                  variant="ghost"
                  onPress={() => {
                    del(todo.id);
                    onClose();
                  }}
                />
                <View style={{ flex: 1 }} />
                <ComicButton
                  label="Riscar"
                  variant="dark"
                  onPress={() => {
                    if (text !== todo.text || notes !== todo.notes) update(todo.id, { text, notes });
                    complete(todo.id);
                    onClose();
                  }}
                />
                <ComicButton label="Salvar" onPress={save} />
              </View>
            </Paper>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000a', padding: 16 },
  avoider: { flex: 1, justifyContent: 'flex-end' },
  sheet: { transform: [{ rotate: '-1deg' }] },
  body: { padding: 18, paddingTop: 22 },
  text: { fontFamily: fonts.handBold, fontSize: 22, lineHeight: 28, color: colors.paperText, padding: 0 },
  count: { alignSelf: 'flex-end', fontFamily: fonts.comic, fontSize: 13, color: '#0008' },
  rule: { height: 2, backgroundColor: colors.ink, opacity: 0.25, marginVertical: 8 },
  notes: { fontFamily: fonts.hand, fontSize: 17, lineHeight: 23, color: colors.paperText, minHeight: 90, maxHeight: 260, padding: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
});
