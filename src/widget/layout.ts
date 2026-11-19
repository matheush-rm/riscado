/**
 * Pure geometry of the home screen widget. Everything is in dp, computed from
 * the size the launcher gives us, so the art (svg) and the texts on top of it
 * line up exactly.
 */

export const WIDGET_NAME = 'Riscado';

export type WidgetItem = { id: string; text: string };
export type WidgetData = { title: string; items: WidgetItem[]; total: number };

export type Box = { x: number; y: number; w: number; h: number; rot: number };
export type ItemBox = Box & { id: string; text: string; kind: 'todo' | 'more' };

export type WidgetLayout = {
  w: number;
  h: number;
  radius: number;
  titleSize: number;
  caption: Box;
  subtitle: Box;
  items: ItemBox[];
  /** "NADA!" stamp when the list is empty and there is room for it */
  empty: Box | null;
  /** add button, only on bigger sizes */
  add: Box | null;
};

/** Below this the "+" button is hidden: the widget is just a glance + shortcut. */
export const ADD_MIN_W = 190;
export const ADD_MIN_H = 130;

export const showAddButton = (w: number, h: number) => w >= ADD_MIN_W && h >= ADD_MIN_H;

const PAD = 12;
const ITEM_H = 30;
const ITEM_GAP = 8;
const BTN = 50;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Small integer tilt (android only rotates views by whole degrees). */
const tilt = (i: number) => [-1, 1, 0, -2, 1, -1, 2, 0][i % 8];

export function computeLayout(width: number, height: number, data: WidgetData): WidgetLayout {
  const w = Math.max(60, Math.round(width));
  const h = Math.max(40, Math.round(height));
  const add = showAddButton(w, h) ? { x: w - PAD - BTN + 4, y: PAD - 4, w: BTN, h: BTN, rot: 8 } : null;

  const titleSize = w < 170 ? 17 : 20;
  const captionMax = w - 2 * PAD - (add ? BTN + 4 : 0);
  // Bangers is narrow: ~0.5em per glyph is a good enough estimate.
  const est = Math.ceil(data.title.length * titleSize * 0.5 + 22);
  const caption: Box = { x: PAD, y: PAD, w: clamp(est, 64, captionMax), h: titleSize + 12, rot: -2 };
  const subtitle: Box = { x: PAD + 4, y: caption.y + caption.h + 6, w: captionMax - 4, h: 18, rot: 0 };

  const top = subtitle.y + subtitle.h + 8;
  const avail = h - PAD - top;
  const slots = Math.max(0, Math.floor((avail + ITEM_GAP) / (ITEM_H + ITEM_GAP)));

  const items: ItemBox[] = [];
  // the "+N outras" row only pays off when there is room for a few items too
  const overflow = slots >= 3 && (data.items.length > slots || data.total > data.items.length);
  const shown = overflow ? slots - 1 : Math.min(slots, data.items.length);
  const iw = w - 2 * PAD - 4;
  for (let i = 0; i < shown; i++) {
    const it = data.items[i];
    items.push({
      ...it,
      kind: 'todo',
      x: PAD + (i % 2 ? 4 : 0),
      y: top + i * (ITEM_H + ITEM_GAP),
      w: iw,
      h: ITEM_H,
      rot: tilt(i),
    });
  }
  if (overflow) {
    const rest = data.total - shown;
    items.push({
      id: 'more',
      text: `+${rest} ${rest === 1 ? 'OUTRA' : 'OUTRAS'}…`,
      kind: 'more',
      x: PAD,
      y: top + shown * (ITEM_H + ITEM_GAP),
      w: iw,
      h: ITEM_H,
      rot: 0,
    });
  }

  const empty = data.total === 0 && avail >= 44 ? { x: PAD, y: top, w: w - 2 * PAD, h: Math.min(avail, 90), rot: -6 } : null;

  return { w, h, radius: 22, titleSize, caption, subtitle, items, empty, add };
}
