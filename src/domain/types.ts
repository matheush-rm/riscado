export const MAX_TEXT = 120;

export type Todo = {
  id: string;
  text: string;
  notes: string;
  done: boolean;
  /** epoch ms; only meaningful when done */
  doneAt?: number;
};

export type SyncState = {
  /** path inside repo, ex: "todos/mercado.md" */
  path: string;
  /** blob sha of last synced remote file */
  sha?: string;
  /** markdown content at last successful sync (merge base) */
  base?: string;
  lastSyncAt?: number;
  error?: string;
};

export type TodoList = {
  id: string;
  name: string;
  /** pending items in display order + done items (any order, sorted by doneAt) */
  todos: Todo[];
  sync?: SyncState;
};
