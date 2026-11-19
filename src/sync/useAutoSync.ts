import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useLists } from '@/store/lists';
import { useSettings } from '@/store/settings';

import { syncAll } from './engine';

const DEBOUNCE_MS = 4000;
/** pull remote changes (ex: Obsidian) while the app stays open */
const POLL_MS = 30000;

/** Sync on start, on foreground, every POLL_MS while active and (debounced) after local edits. */
export function useAutoSync() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const enabled = () => useSettings.getState().github.autoSync;
    const schedule = () => {
      if (!enabled()) return;
      clearTimeout(timer);
      timer = setTimeout(() => syncAll().catch(() => {}), DEBOUNCE_MS);
    };

    if (enabled()) syncAll().catch(() => {});

    const poll = setInterval(() => {
      if (enabled() && AppState.currentState === 'active') syncAll().catch(() => {});
    }, POLL_MS);

    const unsubLists = useLists.subscribe((s, prev) => {
      if (s.lists === prev.lists) return;
      const changed = s.order.some((id) => s.lists[id]?.todos !== prev.lists[id]?.todos || s.lists[id]?.name !== prev.lists[id]?.name);
      if (changed) schedule();
    });
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active' && enabled()) syncAll().catch(() => {});
      if (st === 'background' && timer && enabled()) {
        clearTimeout(timer);
        syncAll().catch(() => {});
      }
    });
    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      unsubLists();
      sub.remove();
    };
  }, []);
}
