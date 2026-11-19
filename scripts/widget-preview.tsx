/// <reference types="node" />
/**
 * Generates assets/images/widget-preview.png: the image the launcher shows in
 * the widget picker. Builds the real widget tree (same code the headless task
 * uses), turns it into html and screenshots it with headless Chrome.
 *
 *   npm run widget:preview
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { buildWidgetTree } from 'react-native-android-widget/src/api/build-widget-tree';

import { RiscadoWidget } from '@/widget/RiscadoWidget';

// 3x2 cells on a typical launcher
const W = 260;
const H = 172;
const SCALE = 3;
const OUT = path.join(__dirname, '../assets/images/widget-preview.png');

const sample = {
  title: 'Mercado',
  items: [
    { id: 'leite', text: 'Leite integral' },
    { id: 'pao', text: 'Pão de forma' },
    { id: 'cafe', text: 'Café' },
    { id: 'banana', text: 'Bananas' },
  ],
  total: 4,
};

const FONTS: Record<string, string> = {
  Bangers_400Regular: 'node_modules/@expo-google-fonts/bangers/400Regular/Bangers_400Regular.ttf',
  Kalam_700Bold: 'node_modules/@expo-google-fonts/kalam/700Bold/Kalam_700Bold.ttf',
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const dim = (v: unknown) => (v === 'match_parent' ? '100%' : v === 'wrap_content' || v == null ? 'auto' : `${v}px`);

/** Android Gravity -> flex alignment (column layout). */
function gravity(g = 0x800033) {
  const h = g & 0x07;
  const v = g & 0x70;
  return {
    alignItems: h === 1 ? 'center' : h === 5 ? 'flex-end' : 'flex-start',
    justifyContent: v === 0x10 ? 'center' : v === 0x50 ? 'flex-end' : 'flex-start',
  };
}

/** Tree as sent to the native side (type is the native class name). */
type Node = { type: string; props: unknown; children?: Node[] };

function toHtml(node: Node, absolute: boolean): string {
  const p = node.props as Record<string, any>;
  const css: string[] = [`width:${dim(p.width)}`, `height:${dim(p.height)}`, 'box-sizing:border-box'];
  if (absolute) css.push('position:absolute', `left:${p.margin?.left ?? 0}px`, `top:${p.margin?.top ?? 0}px`);
  if (p.rotation) css.push(`transform:rotate(${p.rotation}deg)`);
  if (p.padding) css.push(`padding:${p.padding.top}px ${p.padding.right}px ${p.padding.bottom}px ${p.padding.left}px`);
  const kids = (node.children ?? []).map((c) => toHtml(c, node.type === 'FrameLayoutWidget')).join('');

  switch (node.type) {
    case 'FrameLayoutWidget':
      return `<div style="${css.join(';')};position:${absolute ? 'absolute' : 'relative'}">${kids}</div>`;
    case 'LinearLayoutWidget': {
      const g = gravity(p.gravity);
      const dir = p.orientation === 'HORIZONTAL' ? 'row' : 'column';
      return `<div style="${css.join(';')};display:flex;flex-direction:${dir};align-items:${g.alignItems};justify-content:${g.justifyContent}">${kids}</div>`;
    }
    case 'SvgWidget':
      return `<div style="${css.join(';')}">${p.svgString}</div>`;
    case 'TextWidget':
      return (
        `<div style="font-family:'${p.fontFamily}';font-size:${p.fontSize}px;color:${p.color};` +
        `letter-spacing:${p.letterSpacing ?? 0}px;text-align:${p.textAlign ?? 'left'};white-space:nowrap;overflow:hidden;` +
        `text-overflow:ellipsis;max-width:100%">${esc(p.text)}</div>`
      );
    default:
      throw new Error(`widget-preview: ${node.type} not supported`);
  }
}

function findChrome() {
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    try {
      return execFileSync('which', [bin]).toString().trim();
    } catch {}
  }
  throw new Error('widget-preview: Chrome/Chromium not found');
}

it('renders the widget picker preview', () => {
  const tree = buildWidgetTree(<RiscadoWidget width={W} height={H} data={sample} />) as Node;
  const root = path.join(__dirname, '..');
  const fontFaces = Object.entries(FONTS)
    .map(([name, file]) => `@font-face{font-family:'${name}';src:url('file://${path.join(root, file)}')}`)
    .join('');
  const html =
    `<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces}` +
    `html,body{margin:0;background:transparent;overflow:hidden}svg{display:block}</style></head>` +
    `<body><div style="width:${W}px;height:${H}px">${toHtml(tree, false)}</div></body></html>`;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'widget-preview-'));
  const file = path.join(dir, 'index.html');
  fs.writeFileSync(file, html);
  execFileSync(findChrome(), [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    '--default-background-color=00000000',
    `--force-device-scale-factor=${SCALE}`,
    `--window-size=${W},${H}`,
    '--virtual-time-budget=2000',
    `--screenshot=${OUT}`,
    `file://${file}`,
  ], { stdio: 'ignore' });
  fs.rmSync(dir, { recursive: true, force: true });

  expect(fs.statSync(OUT).size).toBeGreaterThan(1000);
});
