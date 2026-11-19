import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComicButton } from '@/components/ComicButton';
import { Header } from '@/components/Header';
import { CLIENT_ID, clearToken, DeviceCode, getToken, pollDeviceFlow, setToken, startDeviceFlow } from '@/github/auth';
import { getRepo, getUser } from '@/github/client';
import { useLists } from '@/store/lists';
import { useSettings } from '@/store/settings';
import { syncAll, unlinkAll, useSyncStatus } from '@/sync/engine';
import { Halftone } from '@/ui/Halftone';
import { Paper } from '@/ui/Paper';
import { colors, fonts } from '@/ui/theme';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function Panel({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Paper id={id} color={colors.text} shadow={5} contentStyle={styles.panel} style={styles.panelWrap}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </Paper>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <View style={{ gap: 2 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#0005"
        autoCapitalize="none"
        autoCorrect={false}
        cursorColor={colors.accent}
        {...rest}
      />
    </View>
  );
}

function Account() {
  const login = useSettings((s) => s.github.login);
  const setGithub = useSettings((s) => s.setGithub);
  const [code, setCode] = useState<DeviceCode | null>(null);
  const [pat, setPat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const finish = async (token: string) => {
    const user = await getUser(token);
    await setToken(token);
    setGithub({ login: user.login });
    syncAll().catch(() => {});
  };

  const device = async () => {
    setError(undefined);
    setBusy(true);
    try {
      const c = await startDeviceFlow();
      setCode(c);
      abort.current = new AbortController();
      const token = await pollDeviceFlow(c, abort.current.signal);
      await finish(token);
    } catch (e) {
      if (!abort.current?.signal.aborted) setError(errMsg(e));
    } finally {
      setCode(null);
      setBusy(false);
    }
  };

  const savePat = async () => {
    setError(undefined);
    setBusy(true);
    try {
      await finish(pat.trim());
      setPat('');
    } catch (e) {
      setError('Token inválido: ' + errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (login) {
    return (
      <Panel id="acc" title="CONTA">
        <View style={styles.row}>
          <Text style={styles.big}>@{login}</Text>
          <View style={{ flex: 1 }} />
          <ComicButton
            label="Sair"
            variant="ghost"
            onPress={async () => {
              await clearToken();
              setGithub({ login: undefined });
            }}
          />
        </View>
      </Panel>
    );
  }

  return (
    <Panel id="acc" title="CONTA">
      {code ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.p}>Cola esse código no GitHub:</Text>
          <Text style={styles.code} selectable>
            {code.user_code}
          </Text>
          <ComicButton
            label="Copiar e abrir GitHub"
            onPress={async () => {
              await Clipboard.setStringAsync(code.user_code);
              Linking.openURL(code.verification_uri);
            }}
          />
          <View style={styles.row}>
            <ActivityIndicator color={colors.ink} />
            <Text style={styles.p}>esperando autorização…</Text>
            <View style={{ flex: 1 }} />
            <ComicButton label="Cancelar" variant="ghost" onPress={() => abort.current?.abort()} />
          </View>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {!!CLIENT_ID && <ComicButton label="Entrar com GitHub" onPress={device} disabled={busy} />}
          <Text style={styles.p}>
            {CLIENT_ID ? 'ou cola um token pessoal' : 'Cola um token pessoal'} (fine-grained, permissão Contents: read/write no repo):
          </Text>
          <Field label="TOKEN" value={pat} onChangeText={setPat} placeholder="github_pat_…" secureTextEntry />
          <ComicButton label="Salvar token" variant="dark" onPress={savePat} disabled={busy || !pat.trim()} />
          <ComicButton
            label="Criar token no GitHub"
            variant="ghost"
            onPress={() => Linking.openURL('https://github.com/settings/personal-access-tokens/new')}
          />
        </View>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </Panel>
  );
}

function Repo() {
  const github = useSettings((s) => s.github);
  const setGithub = useSettings((s) => s.setGithub);
  const [repo, setRepo] = useState(github.repo);
  const [branch, setBranch] = useState(github.branch);
  const [folder, setFolder] = useState(github.folder);
  const [status, setStatus] = useState<{ ok: boolean; msg: string }>();
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const r = repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, '');
    const f = folder.trim().replace(/^\/+|\/+$/g, '');
    const b = branch.trim();
    setBusy(true);
    setStatus(undefined);
    try {
      const token = await getToken();
      if (!token) throw new Error('Faz login primeiro');
      const info = await getRepo({ token, repo: r });
      if (info.permissions && !info.permissions.push) throw new Error('Sem permissão de escrita nesse repo');
      const changed = r !== github.repo || f !== github.folder || b !== github.branch;
      if (changed) unlinkAll();
      setGithub({ repo: info.full_name, branch: b, folder: f });
      setRepo(info.full_name);
      setStatus({ ok: true, msg: `OK! branch ${b || info.default_branch}` });
      syncAll().catch(() => {});
    } catch (e) {
      setStatus({ ok: false, msg: errMsg(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel id="repo" title="REPOSITÓRIO">
      <Field label="REPO" value={repo} onChangeText={setRepo} placeholder="usuario/meu-vault" />
      <Field label="BRANCH (vazio = padrão)" value={branch} onChangeText={setBranch} placeholder="main" />
      <Field label="PASTA" value={folder} onChangeText={setFolder} placeholder="todos" />
      <Text style={styles.hint}>
        Cada lista vira um arquivo: {folder.trim() || '.'}/nome-da-lista.md. Arquivos .md que já estiverem na pasta viram listas.
      </Text>
      <ComicButton label={busy ? 'Testando…' : 'Salvar e testar'} onPress={save} disabled={busy || !repo.trim()} />
      {status && <Text style={status.ok ? styles.ok : styles.error}>{status.msg}</Text>}
    </Panel>
  );
}

function Sync() {
  const github = useSettings((s) => s.github);
  const setGithub = useSettings((s) => s.setGithub);
  const { running, lastError, lastRunAt } = useSyncStatus();
  const { lists, order } = useLists();

  return (
    <Panel id="sync" title="SINCRONIA">
      <View style={styles.row}>
        <Text style={[styles.p, { flex: 1 }]}>Sincronizar sozinho (ao abrir e depois de editar)</Text>
        <Switch
          value={github.autoSync}
          onValueChange={(v) => setGithub({ autoSync: v })}
          thumbColor={github.autoSync ? colors.accent : '#ccc'}
          trackColor={{ true: '#0004', false: '#0002' }}
        />
      </View>
      <ComicButton
        label={running ? 'Sincronizando…' : 'Sincronizar agora'}
        variant="dark"
        disabled={running || !github.repo || !github.login}
        onPress={() => syncAll().catch(() => {})}
      />
      {lastRunAt && !lastError && <Text style={styles.ok}>última: {new Date(lastRunAt).toLocaleTimeString()}</Text>}
      {!!lastError && <Text style={styles.error}>{lastError}</Text>}
      {!!github.repo && (
        <View style={{ gap: 4, marginTop: 4 }}>
          {order.map((id) => (
            <Text key={id} style={styles.mono} numberOfLines={1}>
              {lists[id].sync?.path ?? '(ainda não vinculada)'} {lists[id].sync?.error ? '⚠' : ''}
            </Text>
          ))}
        </View>
      )}
    </Panel>
  );
}

export default function GithubScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <Halftone />
      <Header title="GitHub" subtitle="sincroniza com Obsidian via .md" />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 22, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <Account />
          <Repo />
          <Sync />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  panelWrap: {},
  panel: { padding: 16, gap: 10 },
  panelTitle: { fontFamily: fonts.comic, fontSize: 22, letterSpacing: 1.5, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  big: { fontFamily: fonts.handBold, fontSize: 20, color: colors.ink },
  p: { fontFamily: fonts.hand, fontSize: 15, color: colors.ink },
  hint: { fontFamily: fonts.hand, fontSize: 13, color: '#0009' },
  label: { fontFamily: fonts.comic, fontSize: 13, letterSpacing: 1, color: '#000a' },
  input: { fontFamily: fonts.hand, fontSize: 17, color: colors.ink, borderBottomWidth: 2, borderColor: colors.ink, paddingVertical: 4 },
  code: { fontFamily: fonts.comic, fontSize: 40, letterSpacing: 4, color: colors.ink, textAlign: 'center' },
  error: { fontFamily: fonts.handBold, fontSize: 14, color: '#C0261B' },
  ok: { fontFamily: fonts.handBold, fontSize: 14, color: '#2F7D32' },
  mono: { fontFamily: 'monospace', fontSize: 12, color: '#000a' },
});
