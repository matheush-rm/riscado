import { parse, serialize } from '../markdown';
import { Todo } from '../types';

const t = (id: string, text: string, extra: Partial<Todo> = {}): Todo => ({
  id,
  text,
  notes: '',
  done: false,
  ...extra,
});

describe('serialize', () => {
  it('writes pending then done, notes indented', () => {
    const md = serialize('Mercado', [
      t('aaa', 'Pão', { done: true, doneAt: 1 }),
      t('bbb', 'Leite', { notes: 'integral\n\n2L' }),
      t('ccc', 'Café', { done: true, doneAt: 2 }),
      t('ddd', 'Ovos'),
    ]);
    expect(md).toBe(
      [
        '# Mercado',
        '',
        '- Leite ^bbb',
        '    integral',
        '',
        '    2L',
        '- Ovos ^ddd',
        '- ~~Café~~ ^ccc',
        '- ~~Pão~~ ^aaa',
        '',
      ].join('\n'),
    );
  });

  it('empty list', () => {
    expect(serialize('X', [])).toBe('# X\n');
  });
});

describe('parse', () => {
  it('roundtrips', () => {
    const todos = [
      t('bbb', 'Leite', { notes: 'integral\n\n2L' }),
      t('ddd', 'Ovos'),
      t('ccc', 'Café', { done: true }),
    ];
    const parsed = parse(serialize('Mercado', todos));
    expect(parsed.name).toBe('Mercado');
    expect(parsed.todos).toEqual(todos);
  });

  it('accepts hand-written items without ids, checkboxes and other bullets', () => {
    const { todos } = parse(
      ['# L', '', '* um', '- [ ] dois', '- [x] tres', '+ ~~quatro~~', 'texto solto', '- cinco'].join('\n'),
    );
    expect(todos.map((x) => [x.text, x.done])).toEqual([
      ['um', false],
      ['dois', false],
      ['tres', true],
      ['quatro', true],
      ['cinco', false],
    ]);
    expect(new Set(todos.map((x) => x.id)).size).toBe(5);
    todos.forEach((x) => expect(x.id).toMatch(/^[a-z0-9]{6}$/));
  });

  it('notes with tabs and trailing blank lines', () => {
    const { todos } = parse('- a ^x1\n\tnota\n\n\n- b ^x2\n');
    expect(todos[0].notes).toBe('nota');
    expect(todos[1].text).toBe('b');
  });

  it('dedupes repeated ids', () => {
    const { todos } = parse('- a ^dup\n- b ^dup\n');
    expect(todos[0].id).toBe('dup');
    expect(todos[1].id).not.toBe('dup');
  });

  it('truncates text to 120 chars and ignores empty items', () => {
    const { todos } = parse(`- ${'x'.repeat(200)}\n- \n-   ^abc\n`);
    expect(todos).toHaveLength(1);
    expect(todos[0].text).toHaveLength(120);
  });

  it('handles CRLF', () => {
    expect(parse('- a ^i1\r\n    n\r\n').todos[0]).toEqual(t('i1', 'a', { notes: 'n' }));
  });

  it('ignores git conflict markers and reports ids it generated', () => {
    const { todos, added } = parse(
      ['# L', '<<<<<<< ours', '- a ^aaa', '- b ^bbb', '=======', '- novo', '- ~~a~~ ^aaa', '>>>>>>> theirs', '- c ^ccc'].join('\n'),
    );
    expect(todos.map((x) => [x.text, x.done])).toEqual([
      ['a', true],
      ['b', false],
      ['novo', false],
      ['c', false],
    ]);
    expect(added).toEqual([todos[2].id]);
  });
});
