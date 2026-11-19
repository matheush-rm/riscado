import { MAX_TEXT, Todo } from './types';

export function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
}

export function pending(todos: Todo[]): Todo[] {
  return todos.filter((t) => !t.done);
}

/** Done items, most recent first. */
export function done(todos: Todo[]): Todo[] {
  return todos.filter((t) => t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
}

/** Canonical order: pending (as is) then done (most recent first). */
export function normalize(todos: Todo[]): Todo[] {
  return [...pending(todos), ...done(todos)];
}
