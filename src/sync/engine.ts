import { create } from 'zustand';

import { parse, serialize } from '@/domain/markdown';
import { merge } from '@/domain/merge';
import { TodoList } from '@/domain/types';
import { getToken } from '@/github/auth';
import { Ctx, deleteFile, getFile, getRepo, isConflict, listDir, putFile } from '@/github/client';
import { useLists } from '@/store/lists';
import { useSettings } from '@/store/settings';

type SyncStatus = { running: boolean; lastError?: string; lastRunAt?: number };
export const useSyncStatus = create<SyncStatus>(() => ({ running: false }));

export function slugify(name: string): string {
  const s = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'lista';
}

const joinPath = (folder: string, file: string) =>
  [folder.replace(/^\/+|\/+$/g, ''), file].filter(Boolean).join('/');

const fileName = (path: string) => path.split('/').pop()!.replace(/\.md$/i, '');

export async function getCtx(): Promise<Ctx | null> {
  const { repo, branch } = useSettings.getState().github;
  const token = await getToken();
  if (!token || !/^[^/\s]+\/[^/\s]+$/.test(repo)) return null;
  return { token, repo, branch: branch || undefined };
}

export const isDirty = (l: TodoList) => !l.sync?.base || serialize(l.name, l.todos) !== l.sync.base;

/** Items written by hand in the file (no ^id) go to the top, keeping their file order. */
function toTop(todos: TodoList['todos'], ids: string[]) {
  if (!ids.length) return todos;
  const set = new Set(ids);
  const top = todos.filter((t) => set.has(t.id) && !t.done);
  return [...top, ...todos.filter((t) => !top.includes(t))];
}

async function syncOne(ctx: Ctx, listId: string, attempt = 0): Promise<void> {
  const { lists, setTodos, setSync } = useLists.getState();
  const list = lists[listId];
  if (!list?.sync?.path) return;
  const { path, sha, base } = list.sync;
  const snapshot = list.todos;

  try {
    const remote = await getFile(ctx, path);
    let merged = snapshot;
    let remoteSha = remote?.sha;
    const message = `riscado: ${list.name}`;

    if (remote && remote.sha !== sha) {
      const baseTodos = base ? parse(base).todos : [];
      const theirs = parse(remote.content);
      merged = toTop(merge(baseTodos, snapshot, theirs.todos), theirs.added);
    }
    const md = serialize(list.name, merged);
    if (!remote || md !== remote.content) {
      remoteSha = await putFile(ctx, path, md, remote?.sha, message);
    }

    // user may have edited while we were on the network: replay those edits on top
    const current = useLists.getState().lists[listId]?.todos;
    if (!current) return;
    const final = current === snapshot ? merged : merge(snapshot, current, merged);
    if (serialize(list.name, final) !== serialize(list.name, current)) setTodos(listId, final);
    setSync(listId, { sha: remoteSha, base: md, lastSyncAt: Date.now(), error: undefined });
  } catch (e) {
    if (isConflict(e) && attempt < 2) return syncOne(ctx, listId, attempt + 1);
    setSync(listId, { error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

/** Gives a path to every unlinked list and imports remote .md files not linked to any list. */
async function linkAndImport(ctx: Ctx) {
  const { folder } = useSettings.getState().github;
  const remoteFiles = (await listDir(ctx, folder)).filter((f) => f.type === 'file' && /\.md$/i.test(f.name));
  const { order, setSync, importList } = useLists.getState();
  const lists = { ...useLists.getState().lists };

  const linked = new Set(order.map((id) => lists[id].sync?.path).filter(Boolean));
  const taken = new Set([...linked, ...remoteFiles.map((f) => f.path)]);

  for (const f of remoteFiles) {
    if (linked.has(f.path)) continue;
    // same-named unlinked local list (ex: default list on a new device) -> link instead of duplicating
    const twin = order.find((id) => !lists[id].sync?.path && joinPath(folder, `${slugify(lists[id].name)}.md`) === f.path);
    if (twin) {
      setSync(twin, { path: f.path });
      lists[twin] = { ...lists[twin], sync: { path: f.path } };
      linked.add(f.path);
      continue;
    }
    const file = await getFile(ctx, f.path);
    if (!file) continue;
    const parsed = parse(file.content);
    importList(parsed.name || fileName(f.path), parsed.todos, {
      path: f.path,
      sha: file.sha,
      base: file.content,
      lastSyncAt: Date.now(),
    });
    linked.add(f.path);
  }

  for (const id of order) {
    const l = lists[id];
    if (l.sync?.path) continue;
    const slug = slugify(l.name);
    let path = joinPath(folder, `${slug}.md`);
    for (let n = 2; taken.has(path); n++) path = joinPath(folder, `${slug}-${n}.md`);
    taken.add(path);
    setSync(id, { path });
  }
}

let running: Promise<void> | null = null;
let again = false;

/** Full sync. Concurrent calls coalesce into one extra run. */
export function syncAll(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    useSyncStatus.setState({ running: true });
    try {
      do {
        again = false;
        const ctx = await getCtx();
        if (!ctx) return;
        if (!ctx.branch) ctx.branch = (await getRepo(ctx)).default_branch;
        await linkAndImport(ctx);
        const { order } = useLists.getState();
        const errors: string[] = [];
        for (const id of order) {
          try {
            await syncOne(ctx, id);
          } catch (e) {
            errors.push(e instanceof Error ? e.message : String(e));
          }
        }
        useSyncStatus.setState({ lastError: errors[0], lastRunAt: Date.now() });
      } while (again);
    } catch (e) {
      useSyncStatus.setState({ lastError: e instanceof Error ? e.message : String(e), lastRunAt: Date.now() });
    } finally {
      useSyncStatus.setState({ running: false });
      running = null;
    }
  })();
  return running;
}

/** Remove list locally and (optionally) its file on GitHub. */
export async function deleteListEverywhere(listId: string, remote: boolean) {
  const list = useLists.getState().lists[listId];
  useLists.getState().deleteList(listId);
  if (!remote || !list?.sync?.path) return;
  const ctx = await getCtx();
  if (!ctx) return;
  const file = await getFile(ctx, list.sync.path);
  if (file) await deleteFile(ctx, list.sync.path, file.sha, `riscado: remove ${list.name}`);
}

/** Forget sync metadata (ex: repo changed / logout). */
export function unlinkAll() {
  const { order, setSync } = useLists.getState();
  order.forEach((id) => setSync(id, null));
}
