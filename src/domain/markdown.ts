import { newId } from './id';
import { cleanText, normalize } from './todos';
import { Todo } from './types';

/*
 * Format (Obsidian friendly):
 *
 *   # Lista
 *
 *   - Comprar leite ^k3f9a2
 *       integral, 2L
 *   - ~~Pão~~ ^e5f6g7
 *
 * Pending first (in order), done after (most recent first).
 * Done = ~~strikethrough~~. Notes = indented lines below item.
 */

const ITEM_RE = /^[-*+]\s+(.*)$/;
const ID_RE = /(?:^|\s+)\^([A-Za-z0-9-]+)\s*$/;
const CHECKBOX_RE = /^\[( |x|X)\]\s+/;
const STRIKE_RE = /^~~(.*)~~$/;
const NOTE_RE = /^(\t| {2,})(.*)$/;
/** git conflict markers (ex: Obsidian Git stash pop): `<<<<<<< x`, `=======`, `>>>>>>> y`, `||||||| base` */
const CONFLICT_RE = /^(<{7}|={7}|>{7}|\|{7})(\s.*)?$/;

export function serialize(name: string, todos: Todo[]): string {
  const lines = [`# ${name}`, ''];
  for (const t of normalize(todos)) {
    const text = t.done ? `~~${t.text}~~` : t.text;
    lines.push(`- ${text} ^${t.id}`);
    if (t.notes) {
      for (const n of t.notes.split('\n')) lines.push(n ? `    ${n}` : '');
    }
  }
  return lines.join('\n').trimEnd() + '\n';
}

export type Parsed = {
  name?: string;
  todos: Todo[];
  /** ids generated here: items written by hand without ^id (or copied with a repeated id) */
  added: string[];
};

export function parse(md: string): Parsed {
  const items: { todo: Todo; hadId: boolean; conflict?: number }[] = [];
  let name: string | undefined;
  let current: { todo: Todo; hadId: boolean; notes: string[] } | null = null;
  let pendingBlanks = 0;
  // conflict block counter; undefined = outside a conflict
  let conflict: number | undefined;
  let conflicts = 0;

  const flush = () => {
    if (current) {
      current.todo.notes = current.notes.join('\n').trim();
      items.push({ todo: current.todo, hadId: current.hadId, conflict });
    }
    current = null;
    pendingBlanks = 0;
  };

  for (const raw of md.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.replace(/\s+$/, '');

    if (!line) {
      if (current) pendingBlanks++;
      continue;
    }

    const marker = CONFLICT_RE.exec(line);
    if (marker) {
      flush();
      if (marker[1][0] === '<') conflict = ++conflicts;
      else if (marker[1][0] === '>') conflict = undefined;
      continue;
    }

    const note = current && NOTE_RE.exec(raw);
    if (current && note) {
      for (; pendingBlanks > 0; pendingBlanks--) current.notes.push('');
      current.notes.push(note[2].replace(/\s+$/, ''));
      continue;
    }

    const item = ITEM_RE.exec(line);
    if (item) {
      flush();
      const { todo, hadId } = parseItem(item[1]);
      current = { todo, hadId, notes: [] };
      continue;
    }

    flush();
    const h = /^#\s+(.*)$/.exec(line);
    if (h && name === undefined) name = h[1].trim();
  }
  flush();

  const todos: Todo[] = [];
  const added: string[] = [];
  const seen = new Map<string, { todo: Todo; conflict?: number }>();
  for (const { todo, hadId, conflict: c } of items) {
    if (!todo.text) continue;
    const prev = hadId ? seen.get(todo.id) : undefined;
    if (prev && c !== undefined && prev.conflict === c) {
      // same item on both sides of a conflict: keep one, completion wins, later side's text/notes
      Object.assign(prev.todo, { text: todo.text, notes: todo.notes || prev.todo.notes, done: prev.todo.done || todo.done });
      continue;
    }
    if (!hadId || prev) {
      while (seen.has(todo.id)) todo.id = newId();
      added.push(todo.id);
    }
    seen.set(todo.id, { todo, conflict: c });
    todos.push(todo);
  }
  return { name, todos, added };
}

function parseItem(body: string): { todo: Todo; hadId: boolean } {
  let text = body;
  let id: string | undefined;
  let done = false;

  const idm = ID_RE.exec(text);
  if (idm) {
    id = idm[1];
    text = text.slice(0, idm.index);
  }
  const cb = CHECKBOX_RE.exec(text);
  if (cb) {
    done = cb[1] !== ' ';
    text = text.slice(cb[0].length);
  }
  const strike = STRIKE_RE.exec(text.trim());
  if (strike) {
    done = true;
    text = strike[1];
  }
  return { todo: { id: id ?? newId(), text: cleanText(text), notes: '', done }, hadId: !!id };
}
