import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Paper } from '@/ui/Paper';
import { colors, fonts } from '@/ui/theme';

import { ComicButton } from './ComicButton';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
};

/** Comic-styled replacement for Alert.alert confirmations. */
export function ConfirmDialog({ visible, title, message, confirmLabel = 'OK', onConfirm, onClose }: Props) {
  // keep last message while fading out
  const [shown, setShown] = useState(message);
  if (visible && message !== shown) setShown(message);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Paper id={'confirm' + title} color={colors.text} contentStyle={styles.body} tape shadow={7}>
          <Text style={styles.title}>{title}</Text>
          {!!shown && (
            <Text style={styles.msg} numberOfLines={4}>
              “{shown}”
            </Text>
          )}
          <View style={styles.actions}>
            <ComicButton label="Cancelar" variant="ghost" onPress={onClose} />
            <View style={{ flex: 1 }} />
            <ComicButton
              label={confirmLabel}
              onPress={() => {
                onConfirm();
                onClose();
              }}
            />
          </View>
        </Paper>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000a', justifyContent: 'center', padding: 28 },
  body: { padding: 18, paddingTop: 20, gap: 10 },
  title: { fontFamily: fonts.comic, fontSize: 26, color: colors.ink, letterSpacing: 1 },
  msg: { fontFamily: fonts.hand, fontSize: 16, color: colors.ink },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
});
