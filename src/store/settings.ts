import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { sqliteStorage } from './storage';

export type GithubSettings = {
  /** "owner/repo" */
  repo: string;
  /** empty -> repo default branch */
  branch: string;
  /** folder inside repo where list files live, ex: "todos" */
  folder: string;
  /** logged user login (display only) */
  login?: string;
  autoSync: boolean;
};

type State = {
  github: GithubSettings;
  setGithub: (patch: Partial<GithubSettings>) => void;
};

export const useSettings = create<State>()(
  persist(
    (set) => ({
      github: { repo: '', branch: '', folder: 'todos', autoSync: true },
      setGithub: (patch) => set((s) => ({ github: { ...s.github, ...patch } })),
    }),
    { name: 'riscado-settings', version: 1, storage: sqliteStorage },
  ),
);
