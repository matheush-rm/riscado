const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Short id, valid as Obsidian block id (^id). */
export function newId(len = 6): string {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}
