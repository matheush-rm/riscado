import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { pending } from '@/domain/todos';
import { useLists } from '@/store/lists';
import { deleteListEverywhere } from '@/sync/engine';
import { Halftone } from '@/ui/Halftone';
import { Paper } from '@/ui/Paper';
import { colors, fonts, paperFor } from '@/ui/theme';

import { ListDialog } from './ListDialog';

type Dialog = { mode: 'new' } | { mode: 'edit'; id: string } | null;

export function DrawerMenu({ navigation, state }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { lists, order, currentId, selectList, addList, renameList } = useLists();
  const [dialog, setDialog] = useState<Dialog>(null);
  const route = state.routes[state.index]?.name;

  const go = (name: string) => navigation.navigate(name);
  const editing = dialog?.mode === 'edit' ? lists[dialog.id] : undefined;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 12 }]}>
      <Halftone />
      <View style={styles.logoWrap}>
        <Text style={styles.logo}>RISCADO</Text>
        <View style={styles.logoStrike} />
      </View>

      <Text style={styles.section}>LISTAS</Text>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
        {order.map((id) => {
          const l = lists[id];
          const active = id === currentId;
          const n = pending(l.todos).length;
          return (
            <Pressable
              key={id}
              onPress={() => {
                selectList(id);
                if (route !== 'index' && route !== 'feitas') go('index');
                else navigation.closeDrawer();
              }}
              onLongPress={() => setDialog({ mode: 'edit', id })}
            >
              <Paper
                id={id + 'menu'}
                color={active ? paperFor(id) : '#2A2631'}
                shadow={active ? 5 : 3}
                style={{ transform: [{ rotate: active ? '-1.5deg' : '0deg' }], marginHorizontal: active ? 0 : 8 }}
                contentStyle={styles.listItem}
              >
                <Text style={[styles.listName, { color: active ? colors.ink : colors.text }]} numberOfLines={1}>
                  {l.name}
                </Text>
                <Text style={[styles.listCount, { color: active ? colors.ink : colors.muted }]}>{n || ''}</Text>
              </Paper>
            </Pressable>
          );
        })}
        <Pressable onPress={() => setDialog({ mode: 'new' })} style={styles.newList}>
          <Text style={styles.newListText}>+ nova lista</Text>
        </Pressable>
        <Text style={styles.tip}>segura uma lista pra renomear ou apagar</Text>
      </ScrollView>

      <View style={styles.nav}>
        {[
          ['index', 'A FAZER'],
          ['feitas', 'RISCADOS'],
          ['github', 'GITHUB'],
        ].map(([name, label]) => (
          <Pressable key={name} onPress={() => go(name)} style={styles.navItem}>
            <Text style={[styles.navText, route === name && styles.navActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <ListDialog
        visible={!!dialog}
        title={dialog?.mode === 'new' ? 'Nova lista' : 'Renomear'}
        initial={editing?.name ?? ''}
        linked={!!editing?.sync?.path}
        onClose={() => setDialog(null)}
        onSubmit={(name) => {
          if (dialog?.mode === 'new') {
            addList(name);
            go('index');
          } else if (dialog?.mode === 'edit') renameList(dialog.id, name);
        }}
        onDelete={
          dialog?.mode === 'edit'
            ? (remote) => {
                deleteListEverywhere(dialog.id, remote).catch(() => {});
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 18, borderRightWidth: 3, borderColor: colors.ink, backgroundColor: colors.bg },
  logoWrap: { alignSelf: 'flex-start', marginBottom: 22 },
  logo: { fontFamily: fonts.comic, fontSize: 44, letterSpacing: 2, color: colors.text, transform: [{ rotate: '-3deg' }] },
  logoStrike: {
    position: 'absolute',
    left: -6,
    right: -10,
    top: '52%',
    height: 6,
    backgroundColor: colors.accent,
    transform: [{ rotate: '-6deg' }],
    borderRadius: 3,
  },
  section: { fontFamily: fonts.comic, fontSize: 16, letterSpacing: 2, color: colors.muted, marginBottom: 4 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  listName: { flex: 1, fontFamily: fonts.handBold, fontSize: 18 },
  listCount: { fontFamily: fonts.comic, fontSize: 18 },
  newList: { paddingVertical: 10, paddingHorizontal: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.line, marginHorizontal: 8 },
  newListText: { fontFamily: fonts.hand, fontSize: 17, color: colors.muted },
  tip: { fontFamily: fonts.hand, fontSize: 12, color: colors.muted, opacity: 0.7, marginHorizontal: 8 },
  nav: { borderTopWidth: 2, borderColor: colors.line, paddingTop: 10, gap: 2 },
  navItem: { paddingVertical: 8 },
  navText: { fontFamily: fonts.comic, fontSize: 22, letterSpacing: 1.5, color: colors.muted },
  navActive: { color: colors.text, textShadowColor: colors.accent, textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0 },
});
