import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DoneCard } from '@/components/DoneCard';
import { Header } from '@/components/Header';
import { done } from '@/domain/todos';
import { useCurrentList } from '@/store/lists';
import { Halftone } from '@/ui/Halftone';
import { colors, fonts } from '@/ui/theme';

export default function DoneScreen() {
  const list = useCurrentList();
  const items = useMemo(() => (list ? done(list.todos) : []), [list]);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Halftone />
      <Header title="Riscados" subtitle={`${list?.name ?? ''} · ${items.length}`} />
      <FlatList
        data={items}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <DoneCard todo={item} />}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyBig}>NADA RISCADO</Text>
            <Text style={styles.emptySmall}>Arrasta uma tarefa pro lado pra riscar.</Text>
          </View>
        }
        ListFooterComponent={
          items.length ? <Text style={styles.footer}>segura pra apagar de vez · VOLTA devolve pro topo</Text> : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: 8, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyBig: { fontFamily: fonts.comic, fontSize: 40, color: colors.muted, transform: [{ rotate: '3deg' }] },
  emptySmall: { fontFamily: fonts.hand, fontSize: 16, color: colors.muted },
  footer: { textAlign: 'center', fontFamily: fonts.hand, fontSize: 13, color: colors.muted, marginTop: 14 },
});
