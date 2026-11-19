import { useEffect } from 'react';

import { useCurrentList } from '@/store/lists';

import { refreshWidgets } from './native';

/** Keeps the home screen widget in step with the current list. */
export function useWidgetSync() {
  const list = useCurrentList();
  useEffect(() => {
    const t = setTimeout(refreshWidgets, 500);
    return () => clearTimeout(t);
  }, [list]);
}
