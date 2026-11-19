declare const Buffer: { from(s: string, enc?: string): { toString(enc: string): string } };
import { decodeBase64, encodeBase64 } from '../base64';

describe('base64 utf8', () => {
  it.each(['', 'a', 'ab', 'abc', 'Pão ~~café~~ ção', 'emoji 🍞🔥', '# L\n\n- x ^a\n'])('roundtrip %p', (s) => {
    expect(decodeBase64(encodeBase64(s))).toBe(s);
    expect(encodeBase64(s)).toBe(Buffer.from(s, 'utf8').toString('base64'));
  });
  it('decodes github style with newlines', () => {
    const b = Buffer.from('linha 1\nlinha 2 ação').toString('base64');
    expect(decodeBase64(b.slice(0, 8) + '\n' + b.slice(8))).toBe('linha 1\nlinha 2 ação');
  });
});
