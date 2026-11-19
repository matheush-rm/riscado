import { createJSONStorage } from 'zustand/middleware';

/** Web (dev preview only): localStorage. */
export const sqliteStorage = createJSONStorage(() => localStorage);
