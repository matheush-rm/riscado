import { normalize } from './todos';
import { Todo } from './types';

type Field = 'text' | 'notes' | 'done';
const FIELDS: Field[] = ['text', 'notes', 'done'];

const changed = (a: Todo, b?: Todo) => !b || FIELDS.some((f) => a[f] !== b[f]);

/**
 * Three-way merge by id.
 * - field level: side that changed vs base wins; both changed -> local wins
 * - deleted on one side + untouched on other -> deleted
 * - deleted on one side + edited on other -> kept
 * - pending order: side that reordered wins; items new to that order are
 *   inserted after their predecessor in their own side (or at top);
 *   items appended at the end of their side stay at the end
 */
export function merge(base: Todo[], local: Todo[], remote: Todo[], now = Date.now()): Todo[] {
  const B = new Map(base.map((t) => [t.id, t]));
  const L = new Map(local.map((t) => [t.id, t]));
  const R = new Map(remote.map((t) => [t.id, t]));

  const ids = [...new Set([...local.map((t) => t.id), ...remote.map((t) => t.id)])];
  const result = new Map<string, Todo>();

  ids.forEach((id, i) => {
    const b = B.get(id);
    const l = L.get(id);
    const r = R.get(id);
    let out: Todo | undefined;

    if (l && r) {
      out = { ...r };
      for (const f of FIELDS) {
        if (!b || l[f] !== b[f]) (out as any)[f] = l[f];
      }
      const doneFromLocal = !b || l.done !== b.done;
      out.doneAt = doneFromLocal ? l.doneAt : (r.doneAt ?? l.doneAt ?? b?.doneAt);
    } else if (l) {
      out = b && !changed(l, b) ? undefined : l;
    } else if (r) {
      out = b && !changed(r, b) ? undefined : { ...r, doneAt: r.doneAt ?? b?.doneAt };
    }

    if (out) {
      if (out.done) out.doneAt = out.doneAt ?? now - i;
      else delete out.doneAt;
      result.set(id, out);
    }
  });

  const order = (xs: Todo[]) => xs.filter((t) => !t.done).map((t) => t.id);
  const baseOrder = order(base);
  const localOrder = order(local);
  const remoteOrder = order(remote);

  const sameRelative = (a: string[], b: string[]) => {
    const common = new Set(a.filter((x) => b.includes(x)));
    const fa = a.filter((x) => common.has(x));
    const fb = b.filter((x) => common.has(x));
    return fa.every((x, i) => x === fb[i]);
  };
  const localReordered = !sameRelative(localOrder, baseOrder);
  const [primary, secondary] = localReordered || base.length === 0
    ? [localOrder, remoteOrder]
    : [remoteOrder, localOrder];

  const isPending = (id: string) => result.get(id) && !result.get(id)!.done;
  const seq = primary.filter(isPending);
  // items pending in result but absent from primary order (new, or restored)
  const extra = [...result.values()].filter((t) => !t.done && !seq.includes(t.id)).map((t) => t.id);
  for (const id of extra) {
    const src = secondary.includes(id) ? secondary : primary;
    const idx = src.indexOf(id);
    if (base.length === 0 || (idx > 0 && idx === src.length - 1)) {
      // first sync, or appended at end on its side -> keep at end
      seq.push(id);
      continue;
    }
    let pos = 0;
    for (let k = idx - 1; k >= 0; k--) {
      const at = seq.indexOf(src[k]);
      if (at >= 0) {
        pos = at + 1;
        break;
      }
    }
    seq.splice(pos, 0, id);
  }

  const done = [...result.values()].filter((t) => t.done);
  return normalize([...seq.map((id) => result.get(id)!), ...done]);
}
