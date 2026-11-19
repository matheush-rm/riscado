import { encodeBase64, decodeBase64 } from '@/github/base64';

jest.mock('@/store/storage', () => {
  const { createJSONStorage } = jest.requireActual('zustand/middleware');
  const mem = new Map<string, string>();
  return {
    sqliteStorage: createJSONStorage(() => ({
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    })),
  };
});
jest.mock('@/github/auth', () => ({ getToken: async () => 'tok' }));

// --- fake GitHub contents API -------------------------------------------
type File = { content: string; sha: string };
const files = new Map<string, File>();
let shaN = 0;
const put = (path: string, content: string) => files.set(path, { content, sha: `sha${++shaN}` });
const json = (status: number, body: unknown) =>
  ({ ok: status < 300, status, statusText: '', json: async () => body }) as Response;

(globalThis as any).fetch = jest.fn(async (url: string, init: RequestInit = {}) => {
  const u = new URL(url);
  if (u.pathname === '/repos/me/vault') return json(200, { full_name: 'me/vault', default_branch: 'main' });
  const m = /^\/repos\/me\/vault\/contents\/(.*)$/.exec(u.pathname);
  if (!m) return json(404, { message: 'nope' });
  const path = decodeURIComponent(m[1]);
  const method = init.method ?? 'GET';
  if (method === 'GET') {
    const f = files.get(path);
    if (f) return json(200, { path, sha: f.sha, content: encodeBase64(f.content) });
    const dir = [...files.keys()].filter((k) => k.startsWith(path + '/'));
    if (dir.length) return json(200, dir.map((k) => ({ name: k.split('/').pop(), path: k, type: 'file' })));
    return json(404, { message: 'Not Found' });
  }
  if (method === 'PUT') {
    const body = JSON.parse(init.body as string);
    const cur = files.get(path);
    if (cur && body.sha !== cur.sha) return json(409, { message: 'conflict' });
    if (!cur && body.sha) return json(409, { message: 'conflict' });
    put(path, decodeBase64(body.content));
    return json(201, { content: { sha: files.get(path)!.sha } });
  }
  return json(405, {});
});

// -------------------------------------------------------------------------
import { useLists } from '@/store/lists';
import { useSettings } from '@/store/settings';

import { syncAll } from '../engine';

const L = () => useLists.getState();
const current = () => L().lists[L().currentId];
const texts = () => current().todos.map((t) => (t.done ? `~${t.text}` : t.text));

beforeEach(() => {
  files.clear();
  useSettings.getState().setGithub({ repo: 'me/vault', folder: 'todos', branch: '' });
  const id = L().order[0];
  // reset to single empty list
  L().order.slice(1).forEach((x) => L().deleteList(x));
  L().setTodos(id, []);
  L().setSync(id, null);
  L().renameList(id, 'Tarefas');
});

it('first sync creates the file', async () => {
  L().addTodo('leite');
  L().addTodo('pão');
  await syncAll();
  expect(files.get('todos/tarefas.md')?.content).toMatch(/^# Tarefas\n\n- pão \^\w+\n- leite \^\w+\n$/);
});

it('merges remote edits (Obsidian) with local edits', async () => {
  L().addTodo('a');
  L().addTodo('b');
  await syncAll();
  // Obsidian: risca "a" and appends new item without id
  const f = files.get('todos/tarefas.md')!;
  put('todos/tarefas.md', f.content.replace(/- a (\^\w+)/, '- ~~a~~ $1') + '- do obsidian\n');
  // app: adds "c" meanwhile
  L().addTodo('c');
  await syncAll();
  expect(texts()).toEqual(['c', 'b', 'do obsidian', '~a']);
  expect(files.get('todos/tarefas.md')!.content.split('\n').filter((l) => l.startsWith('-')).length).toBe(4);
  expect(files.get('todos/tarefas.md')!.content).toMatch(/- do obsidian \^\w+/);
});

it('new device links default list to existing remote file and imports others', async () => {
  put('todos/tarefas.md', '# Tarefas\n\n- x ^aaaaaa\n');
  put('todos/mercado.md', '# Mercado\n\n- ovos ^bbbbbb\n');
  await syncAll();
  const names = L().order.map((id) => L().lists[id].name);
  expect(names).toEqual(['Tarefas', 'Mercado']);
  expect(texts()).toEqual(['x']);
  const mercado = L().lists[L().order[1]];
  expect(mercado.todos.map((t) => t.text)).toEqual(['ovos']);
  expect(mercado.sync?.path).toBe('todos/mercado.md');
});

it('second sync without changes does not write', async () => {
  L().addTodo('a');
  await syncAll();
  const sha = files.get('todos/tarefas.md')!.sha;
  await syncAll();
  expect(files.get('todos/tarefas.md')!.sha).toBe(sha);
});
