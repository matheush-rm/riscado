import { pending } from '@/domain/todos';
import { useLists } from '@/store/lists';

import type { WidgetData } from './layout';

/** What the widget shows: pending items of the current list. */
export function widgetData(): WidgetData {
  const s = useLists.getState();
  const l = s.lists[s.currentId];
  const p = l ? pending(l.todos) : [];
  return { title: l?.name ?? 'Riscado', items: p.slice(0, 12).map(({ id, text }) => ({ id, text })), total: p.length };
}
