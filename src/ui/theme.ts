export const colors = {
  bg: '#15131A',
  bgDot: '#2B2633',
  ink: '#1B1820',
  paperText: '#1B1820',
  text: '#F3EEE3',
  muted: '#9A93A6',
  line: '#3A3443',
  accent: '#FF5A4E',
  accentInk: '#2A0B08',
  shadow: '#000000',
  donePaper: '#5B5563',
  doneText: '#D9D3CC',
  strike: '#FF5A4E',
};

/** Post-it papers, a bit muted so they don't burn eyes in the dark. */
export const papers = ['#F4D35E', '#F78FA7', '#7FD1DE', '#B5E17B', '#F6A75F', '#C9A8F2'];

export const fonts = {
  comic: 'Bangers_400Regular',
  hand: 'Kalam_400Regular',
  handBold: 'Kalam_700Bold',
  marker: 'PermanentMarker_400Regular',
};

/** Deterministic small hash of an id. */
export function seed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export const paperFor = (id: string) => papers[Math.floor(seed(id) * papers.length) % papers.length];

/** tilt in degrees, -2..2 */
export const tiltFor = (id: string) => (seed(id + 't') - 0.5) * 4;

/** pseudo random generator from seed, for stable jitter */
export function rng(s: number) {
  let x = Math.floor(s * 2 ** 31) || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  };
}

/** Max width of list column, keeps post-its post-it shaped on wide screens. */
export const MAX_CONTENT = 540;
