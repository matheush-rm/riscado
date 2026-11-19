import { widgetArt } from '../art';
import { computeLayout, WidgetData } from '../layout';

const data = (n: number): WidgetData => ({
  title: 'Mercado',
  total: n,
  items: Array.from({ length: Math.min(n, 12) }, (_, i) => ({ id: `t${i}`, text: `item ${i}` })),
});

describe('widget layout', () => {
  it('hides the add button on small sizes', () => {
    expect(computeLayout(150, 150, data(3)).add).toBeNull();
    expect(computeLayout(330, 80, data(3)).add).toBeNull();
    expect(computeLayout(250, 180, data(3)).add).not.toBeNull();
  });

  it('fits items in the height and summarizes the rest', () => {
    const L = computeLayout(330, 330, data(20));
    const last = L.items[L.items.length - 1];
    expect(last.kind).toBe('more');
    expect(last.text).toContain(`+${20 - (L.items.length - 1)}`);
    for (const it of L.items) expect(it.y + it.h).toBeLessThanOrEqual(330);
  });

  it('shows items instead of only a summary when space is tight', () => {
    const L = computeLayout(150, 150, data(7));
    expect(L.items.map((i) => i.kind)).toEqual(['todo']);
  });

  it('stamps NADA on an empty list', () => {
    expect(computeLayout(250, 180, data(0)).empty).not.toBeNull();
  });

  it('draws an svg sized to the widget', () => {
    const svg = widgetArt(computeLayout(250, 180, data(3)));
    expect(svg).toMatch(/^<svg[^>]+width="250" height="180"/);
  });
});
