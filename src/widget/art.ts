import { colors, paperFor, rng, seed } from '@/ui/theme';

import type { Box, WidgetLayout } from './layout';

/**
 * Background art of the widget as an svg string: comic panel with halftone,
 * speed lines and "misprinted" offset layers (cyan / red plates slipping off
 * register), the look of a frame from Spider-Verse. Texts go on top as real
 * views; the svg only carries shapes.
 */

const CYAN = '#3FE0F0';
const MAGENTA = '#FF2E88';
const YELLOW = '#F4D35E';

const f = (n: number) => n.toFixed(1);

/** Jagged cut-paper polygon, local coords (0..w, 0..h). */
function cut(w: number, h: number, s: number, rough = 3) {
  const r = rng(s);
  const j = () => (r() - 0.5) * rough;
  const a = () => Math.abs(j());
  const pts: [number, number][] = [];
  const step = 22;
  for (let x = 0; x < w; x += step) pts.push([x + j(), a()]);
  pts.push([w - a(), a()]);
  for (let y = step; y < h; y += step) pts.push([w - a(), y + j()]);
  pts.push([w - a(), h - a()]);
  for (let x = w - step; x > 0; x -= step) pts.push([x + j(), h - a()]);
  pts.push([a(), h - a()]);
  for (let y = h - step; y > 0; y -= step) pts.push([a(), y + j()]);
  return pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
}

/** Star burst polygon centered at (cx, cy). */
function burst(cx: number, cy: number, ro: number, ri: number, n: number, s: number) {
  const r = rng(s);
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const ang = (Math.PI * i) / n - Math.PI / 2;
    const rad = (i % 2 ? ri : ro) * (0.9 + r() * 0.2);
    pts.push(`${f(cx + Math.cos(ang) * rad)},${f(cy + Math.sin(ang) * rad)}`);
  }
  return pts.join(' ');
}

/** A box drawn as a group: translated to its origin and rotated around its center. */
const place = (b: Box, body: string, dx = 0, dy = 0) =>
  `<g transform="translate(${f(b.x + dx)},${f(b.y + dy)}) rotate(${b.rot} ${f(b.w / 2)} ${f(b.h / 2)})">${body}</g>`;

/** Ben-Day dots fading out from a corner. */
function halftone(w: number, h: number, ox: number, oy: number, reach: number, step: number, maxR: number, color: string, op: number) {
  const out: string[] = [];
  for (let row = 0, y = 0; y <= h + step; row++, y += step * 0.87) {
    for (let x = row % 2 ? step / 2 : 0; x <= w + step; x += step) {
      const d = Math.hypot(x - ox, y - oy) / reach;
      const r = maxR * (1 - d);
      if (r > 0.45) out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`);
    }
  }
  return `<g fill="${color}" fill-opacity="${op}">${out.join('')}</g>`;
}

/** Speed lines radiating from a point outside the panel. */
function speedLines(w: number, h: number, s: number) {
  const r = rng(s);
  const cx = w * 0.92;
  const cy = -h * 0.35;
  const far = Math.hypot(w, h) * 1.6;
  const out: string[] = [];
  for (let i = 0; i < 16; i++) {
    const ang = Math.PI * (0.52 + r() * 0.45);
    const spread = 0.012 + r() * 0.02;
    const p = (a: number) => `${f(cx + Math.cos(a) * far)},${f(cy + Math.sin(a) * far)}`;
    out.push(`<polygon points="${f(cx)},${f(cy)} ${p(ang - spread)} ${p(ang + spread)}"/>`);
  }
  return `<g fill="${colors.text}" fill-opacity="0.05">${out.join('')}</g>`;
}

/** Thin horizontal slices slipping sideways, like a glitching frame. */
function glitch(w: number, h: number, s: number) {
  const r = rng(s);
  const out: string[] = [];
  for (let i = 0; i < 5; i++) {
    const y = h * (0.15 + r() * 0.8);
    const x = w * (0.35 + r() * 0.45);
    const len = w * (0.12 + r() * 0.3);
    const th = 1.5 + r() * 3;
    const c = i % 2 ? CYAN : MAGENTA;
    out.push(`<rect x="${f(x)}" y="${f(y)}" width="${f(len)}" height="${f(th)}" fill="${c}" fill-opacity="0.55"/>`);
  }
  return out.join('');
}

export function widgetArt(L: WidgetLayout, id = 'riscado'): string {
  const { w, h, radius } = L;
  const s = seed(id);
  const parts: string[] = [];

  parts.push(`<rect width="${w}" height="${h}" fill="${colors.bg}"/>`);
  parts.push(halftone(w, h, w, 0, Math.max(w, h) * 0.85, 9, 3.6, colors.accent, 0.5));
  parts.push(halftone(w, h, 0, h, Math.max(w, h) * 0.6, 7, 2.4, CYAN, 0.32));
  parts.push(speedLines(w, h, s));
  parts.push(glitch(w, h, s + 0.3));

  // title caption box, with the two misaligned plates behind it
  {
    const c = L.caption;
    const poly = cut(c.w, c.h, s + 0.1, 2.5);
    parts.push(place(c, `<polygon points="${poly}" fill="${CYAN}"/>`, -3, -2));
    parts.push(place(c, `<polygon points="${poly}" fill="${MAGENTA}"/>`, 3, 3));
    parts.push(place(c, `<polygon points="${poly}" fill="${YELLOW}" stroke="${colors.ink}" stroke-width="2"/>`));
  }

  for (const it of L.items) {
    if (it.kind === 'more') {
      // dashed "torn off" strip
      parts.push(
        place(
          it,
          `<rect x="1" y="3" width="${f(it.w - 2)}" height="${f(it.h - 6)}" fill="none" stroke="${colors.muted}" stroke-width="1.5" stroke-dasharray="5 4"/>`,
        ),
      );
      continue;
    }
    const poly = cut(it.w, it.h, seed(it.id), 3);
    const box = it.h / 2 - 6;
    parts.push(
      place(
        it,
        `<polygon points="${poly}" fill="#000" transform="translate(3,3)"/>` +
          `<polygon points="${poly}" fill="${paperFor(it.id)}"/>` +
          `<rect x="0" y="0" width="${f(it.w)}" height="${f(it.h * 0.25)}" fill="#fff" fill-opacity="0.12"/>` +
          `<rect x="9" y="${f(box)}" width="12" height="12" fill="none" stroke="${colors.ink}" stroke-width="2"/>`,
      ),
    );
  }

  if (L.empty) {
    const e = L.empty;
    const cx = e.w / 2;
    const cy = e.h / 2;
    const ro = Math.min(e.w * 0.32, e.h * 0.62);
    parts.push(place(e, `<polygon points="${burst(cx, cy, ro, ro * 0.68, 11, s + 0.7)}" fill="${MAGENTA}" fill-opacity="0.85"/>`, 4, 3));
    parts.push(
      place(
        e,
        `<polygon points="${burst(cx, cy, ro, ro * 0.68, 11, s + 0.7)}" fill="${colors.accent}" stroke="${colors.ink}" stroke-width="2.5"/>`,
      ),
    );
  }

  if (L.add) {
    const b = L.add;
    const c = b.w / 2;
    const star = burst(c, c, c, c * 0.72, 9, s + 0.5);
    const plus =
      `<rect x="${f(c - 10)}" y="${f(c - 2.75)}" width="20" height="5.5" fill="${colors.ink}"/>` +
      `<rect x="${f(c - 2.75)}" y="${f(c - 10)}" width="5.5" height="20" fill="${colors.ink}"/>`;
    parts.push(place(b, `<polygon points="${star}" fill="#000"/>`, 3, 3));
    parts.push(place(b, `<polygon points="${star}" fill="${CYAN}"/>`, -3, -2));
    parts.push(place(b, `<polygon points="${star}" fill="${colors.accent}" stroke="${colors.ink}" stroke-width="2.5"/>${plus}`));
  }

  // panel frame
  parts.push(
    `<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="${radius - 1}" fill="none" stroke="#000" stroke-width="3"/>`,
  );

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><clipPath id="panel"><rect width="${w}" height="${h}" rx="${radius}"/></clipPath></defs>` +
    `<g clip-path="url(#panel)">${parts.join('')}</g></svg>`
  );
}
