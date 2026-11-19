import { merge } from '../merge';
import { Todo } from '../types';

const t = (id: string, text = id, extra: Partial<Todo> = {}): Todo => ({
  id,
  text,
  notes: '',
  done: false,
  ...extra,
});
const ids = (xs: Todo[]) => xs.map((x) => (x.done ? `~${x.id}` : x.id));

describe('merge', () => {
  const base = [t('a'), t('b'), t('c')];

  it('no changes', () => {
    expect(merge(base, base, base)).toEqual(base);
  });

  it('local add on top + remote add at bottom', () => {
    const local = [t('n1'), ...base];
    const remote = [...base, t('n2')];
    expect(ids(merge(base, local, remote))).toEqual(['n1', 'a', 'b', 'c', 'n2']);
  });

  it('remote completes, local edits text of another', () => {
    const local = [t('a', 'A!'), t('b'), t('c')];
    const remote = [t('a'), t('c'), t('b', 'b', { done: true })];
    const out = merge(base, local, remote, 1000);
    expect(ids(out)).toEqual(['a', 'c', '~b']);
    expect(out[0].text).toBe('A!');
    expect(out[2].doneAt).toBeDefined();
  });

  it('both edit same field -> local wins; different fields -> both kept', () => {
    const local = [t('a', 'local'), t('b'), t('c')];
    const remote = [t('a', 'remote', { notes: 'nota' }), t('b'), t('c')];
    const out = merge(base, local, remote);
    expect(out[0]).toMatchObject({ text: 'local', notes: 'nota' });
  });

  it('delete vs untouched -> deleted; delete vs edit -> kept', () => {
    const local = [t('b', 'B edit'), t('c')]; // deleted a, edited b
    const remote = [t('a'), t('c')]; // deleted b
    expect(ids(merge(base, local, remote))).toEqual(['b', 'c']);
  });

  it('local reorder wins over remote order', () => {
    const local = [t('c'), t('a'), t('b')];
    const remote = [t('a'), t('b'), t('c'), t('d')];
    expect(ids(merge(base, local, remote))).toEqual(['c', 'a', 'b', 'd']);
  });

  it('remote reorder applied when local did not reorder', () => {
    const local = [t('x'), ...base];
    const remote = [t('b'), t('a'), t('c')];
    expect(ids(merge(base, local, remote))).toEqual(['x', 'b', 'a', 'c']);
  });

  it('restore locally (done -> pending) keeps local position at top', () => {
    const b2 = [t('a'), t('b'), t('z', 'z', { done: true, doneAt: 5 })];
    const local = [t('z'), t('a'), t('b')];
    expect(ids(merge(b2, local, b2))).toEqual(['z', 'a', 'b']);
  });

  it('first sync (no base) unions both, local first', () => {
    expect(ids(merge([], [t('l1')], [t('r1'), t('r2')]))).toEqual(['l1', 'r1', 'r2']);
  });

  it('done items ordered by doneAt desc, keeps local doneAt', () => {
    const b2 = [t('a', 'a', { done: true, doneAt: 1 }), t('b', 'b', { done: true, doneAt: 2 })];
    const remote = b2.map((x) => ({ ...x, doneAt: undefined }));
    const out = merge(b2, b2, remote);
    expect(ids(out)).toEqual(['~b', '~a']);
    expect(out.map((x) => x.doneAt)).toEqual([2, 1]);
  });
});
