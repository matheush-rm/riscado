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

export type Parsed = { name?: string; todos: Todo[] };

export function parse(md: string): Parsed {
  const todos: Todo[] = [];
  let name: string | undefined;
  let current: { todo: Todo; notes: string[] } | null = null;
  let pendingBlanks = 0;

  const flush = () => {
    if (current) {
      current.todo.notes = current.notes.join('\n').trim();
      todos.push(current.todo);
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

    const note = current && NOTE_RE.exec(raw);
    if (current && note) {
      for (; pendingBlanks > 0; pendingBlanks--) current.notes.push('');
      current.notes.push(note[2].replace(/\s+$/, ''));
      continue;
    }

    const item = ITEM_RE.exec(line);
    if (item) {
      flush();
      current = { todo: parseItem(item[1]), notes: [] };
      continue;
    }

    flush();
    const h = /^#\s+(.*)$/.exec(line);
    if (h && name === undefined) name = h[1].trim();
  }
  flush();

  const seen = new Set<string>();
  for (const t of todos) {
    while (seen.has(t.id)) t.id = newId();
    seen.add(t.id);
  }
  return { name, todos: todos.filter((t) => t.text) };
}

function parseItem(body: string): Todo {
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
  return { id: id ?? newId(), text: cleanText(text), notes: '', done };
}
