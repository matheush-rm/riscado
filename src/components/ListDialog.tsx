import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { Paper } from '@/ui/Paper';
import { colors, fonts } from '@/ui/theme';

import { ComicButton } from './ComicButton';

type Props = {
  visible: boolean;
  title: string;
  initial?: string;
  /** shows delete action (rename mode) */
  onDelete?: (alsoRemote: boolean) => void;
  linked?: boolean;
  onSubmit: (name: string) => void;
  onClose: () => void;
};

export function ListDialog({ visible, title, initial = '', onDelete, linked, onSubmit, onClose }: Props) {
  const [name, setName] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const [remote, setRemote] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initial);
      setConfirm(false);
      setRemote(false);
    }
  }, [visible, initial]);

  const submit = () => {
    if (name.trim()) onSubmit(name.trim());
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Paper id={'dlg' + title} color={colors.text} contentStyle={styles.body} tape shadow={7}>
          <Text style={styles.title}>{confirm ? 'Apagar lista?' : title}</Text>
          {confirm ? (
            <>
              <Text style={styles.msg}>“{initial}” e todos os itens somem deste aparelho.</Text>
              {linked && (
                <View style={styles.row}>
                  <Switch value={remote} onValueChange={setRemote} thumbColor={remote ? colors.accent : '#ccc'} trackColor={{ true: '#0004', false: '#0002' }} />
                  <Text style={styles.msg}>Apagar o .md no GitHub também</Text>
                </View>
              )}
              <View style={styles.actions}>
                <ComicButton label="Cancelar" variant="ghost" onPress={() => setConfirm(false)} />
                <View style={{ flex: 1 }} />
                <ComicButton
                  label="Apagar"
                  onPress={() => {
                    onDelete?.(remote);
                    onClose();
                  }}
                />
              </View>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoFocus
                placeholder="Nome da lista"
                placeholderTextColor="#0006"
                maxLength={60}
                returnKeyType="done"
                onSubmitEditing={submit}
                cursorColor={colors.accent}
              />
              <View style={styles.actions}>
                {onDelete && <ComicButton label="Apagar" variant="ghost" onPress={() => setConfirm(true)} />}
                <View style={{ flex: 1 }} />
                <ComicButton label="OK" onPress={submit} disabled={!name.trim()} />
              </View>
            </>
          )}
        </Paper>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000a', justifyContent: 'center', padding: 28 },
  body: { padding: 18, paddingTop: 20, gap: 10 },
  title: { fontFamily: fonts.comic, fontSize: 26, color: colors.ink, letterSpacing: 1 },
  msg: { fontFamily: fonts.hand, fontSize: 16, color: colors.ink, flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    fontFamily: fonts.hand,
    fontSize: 20,
    color: colors.ink,
    borderBottomWidth: 2.5,
    borderColor: colors.ink,
    paddingVertical: 6,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
});
