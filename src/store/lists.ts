import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { newId } from '@/domain/id';
import { cleanText, normalize, pending } from '@/domain/todos';
import { SyncState, Todo, TodoList } from '@/domain/types';

import { sqliteStorage } from './storage';

type State = {
  lists: Record<string, TodoList>;
  order: string[];
  currentId: string;
};

type Actions = {
  addList: (name: string) => string;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  selectList: (id: string) => void;

  addTodo: (text: string) => void;
  updateTodo: (id: string, patch: Partial<Pick<Todo, 'text' | 'notes'>>) => void;
  completeTodo: (id: string) => void;
  restoreTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  /** reorder pending items */
  moveTodo: (from: number, to: number) => void;

  setTodos: (listId: string, todos: Todo[]) => void;
  setSync: (listId: string, sync: Partial<SyncState> | null) => void;
  importList: (name: string, todos: Todo[], sync: SyncState) => void;
};

const makeList = (name: string): TodoList => ({ id: newId(8), name: name.trim() || 'Lista', todos: [] });

const initial = (): State => {
  const l = makeList('Tarefas');
  return { lists: { [l.id]: l }, order: [l.id], currentId: l.id };
};

export const useLists = create<State & Actions>()(
  persist(
    (set, get) => {
      const updateCurrent = (fn: (todos: Todo[]) => Todo[]) =>
        set((s) => {
          const l = s.lists[s.currentId];
          if (!l) return s;
          return { lists: { ...s.lists, [l.id]: { ...l, todos: normalize(fn(l.todos)) } } };
        });

      return {
        ...initial(),

        addList: (name) => {
          const l = makeList(name);
          set((s) => ({ lists: { ...s.lists, [l.id]: l }, order: [...s.order, l.id], currentId: l.id }));
          return l.id;
        },
        renameList: (id, name) =>
          set((s) => {
            const l = s.lists[id];
            if (!l || !name.trim()) return s;
            return { lists: { ...s.lists, [id]: { ...l, name: name.trim() } } };
          }),
        deleteList: (id) =>
          set((s) => {
            const { [id]: _, ...rest } = s.lists;
            let order = s.order.filter((x) => x !== id);
            if (!order.length) {
              const fresh = initial();
              return fresh;
            }
            return { lists: rest, order, currentId: s.currentId === id ? order[0] : s.currentId };
          }),
        selectList: (id) => set((s) => (s.lists[id] ? { currentId: id } : s)),

        addTodo: (text) => {
          const clean = cleanText(text);
          if (!clean) return;
          updateCurrent((todos) => [{ id: newId(), text: clean, notes: '', done: false }, ...todos]);
        },
        updateTodo: (id, patch) =>
          updateCurrent((todos) =>
            todos.map((t) => {
              if (t.id !== id) return t;
              const text = patch.text !== undefined ? cleanText(patch.text) || t.text : t.text;
              const notes = patch.notes !== undefined ? patch.notes.trim() : t.notes;
              return { ...t, text, notes };
            }),
          ),
        completeTodo: (id) =>
          updateCurrent((todos) => todos.map((t) => (t.id === id ? { ...t, done: true, doneAt: Date.now() } : t))),
        restoreTodo: (id) =>
          updateCurrent((todos) => {
            const t = todos.find((x) => x.id === id);
            if (!t) return todos;
            const { doneAt: _, ...rest } = t;
            return [{ ...rest, done: false }, ...todos.filter((x) => x.id !== id)];
          }),
        deleteTodo: (id) => updateCurrent((todos) => todos.filter((t) => t.id !== id)),
        moveTodo: (from, to) =>
          updateCurrent((todos) => {
            const p = pending(todos);
            if (from === to || from < 0 || to < 0 || from >= p.length || to >= p.length) return todos;
            const [it] = p.splice(from, 1);
            p.splice(to, 0, it);
            return [...p, ...todos.filter((t) => t.done)];
          }),

        setTodos: (listId, todos) =>
          set((s) => {
            const l = s.lists[listId];
            if (!l) return s;
            return { lists: { ...s.lists, [listId]: { ...l, todos: normalize(todos) } } };
          }),
        setSync: (listId, sync) =>
          set((s) => {
            const l = s.lists[listId];
            if (!l) return s;
            const next = sync === null ? undefined : ({ ...l.sync, ...sync } as SyncState);
            return { lists: { ...s.lists, [listId]: { ...l, sync: next } } };
          }),
        importList: (name, todos, sync) => {
          const l = { ...makeList(name), todos: normalize(todos), sync };
          set((s) => ({ lists: { ...s.lists, [l.id]: l }, order: [...s.order, l.id] }));
        },
      };
    },
    {
      name: 'riscado-lists',
      version: 1,
      storage: sqliteStorage,
      partialize: ({ lists, order, currentId }) => ({ lists, order, currentId }),
    },
  ),
);

export const useCurrentList = () => useLists((s) => s.lists[s.currentId]);
