import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import ReorderableList, { ReorderableListReorderEvent } from 'react-native-reorderable-list';

import { EditSheet } from '@/components/EditSheet';
import { Header } from '@/components/Header';
import { QuickAdd } from '@/components/QuickAdd';
import { TodoCard } from '@/components/TodoCard';
import { pending } from '@/domain/todos';
import { Todo } from '@/domain/types';
import { useCurrentList, useLists } from '@/store/lists';
import { Halftone } from '@/ui/Halftone';
import { colors, fonts } from '@/ui/theme';

function Empty() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyBig}>NADA!</Text>
      <Text style={styles.emptySmall}>Lista limpa. Escreve algo aí embaixo.</Text>
    </View>
  );
}

export default function TodoScreen() {
  const list = useCurrentList();
  const move = useLists((s) => s.moveTodo);
  const [editing, setEditing] = useState<Todo | null>(null);
  const items = useMemo(() => (list ? pending(list.todos) : []), [list]);

  const onReorder = useCallback(({ from, to }: ReorderableListReorderEvent) => move(from, to), [move]);
  const renderItem = useCallback(({ item }: { item: Todo }) => <TodoCard todo={item} onOpen={setEditing} />, []);

  const count = items.length;
  return (
    <View style={styles.root}>
      <Halftone />
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Header title={list?.name ?? ''} subtitle={count ? `${count} pra fazer` : undefined} />
        <ReorderableList
          data={items}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          onReorder={onReorder}
          shouldUpdateActiveItem
          style={styles.list}
          contentContainerStyle={styles.content}
          ListEmptyComponent={Empty}
          keyboardShouldPersistTaps="handled"
        />
        <QuickAdd />
      </KeyboardAvoidingView>
      <EditSheet todo={editing} onClose={() => setEditing(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  content: { paddingTop: 10, paddingBottom: 24, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 6 },
  emptyBig: {
    fontFamily: fonts.comic,
    fontSize: 64,
    color: colors.text,
    textShadowColor: colors.accent,
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
    transform: [{ rotate: '-4deg' }],
  },
  emptySmall: { fontFamily: fonts.hand, fontSize: 16, color: colors.muted },
});
