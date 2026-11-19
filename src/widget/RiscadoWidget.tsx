'use no memo';
import { FlexWidget, OverlapWidget, SvgWidget, TextWidget, type HexColor } from 'react-native-android-widget';

import { colors } from '@/ui/theme';

import { widgetArt } from './art';
import { Box, computeLayout, WidgetData } from './layout';

/** Deep links handled by the todo screen (src/app/index.tsx). */
export const LINK_LIST = 'riscado://';
export const LINK_ADD = 'riscado://?add=1';

const COMIC = 'Bangers_400Regular';
const HAND = 'Kalam_700Bold';
const CYAN = '#3FE0F0';
const MAGENTA = '#FF2E88';
const hex = (c: string) => c as HexColor;

/** Absolute positioning inside an OverlapWidget = margins from the top-left. */
const at = (b: Box, dx = 0, dy = 0) =>
  ({ marginLeft: b.x + dx, marginTop: b.y + dy, width: b.w, height: b.h, rotation: b.rot }) as const;

/**
 * Same text printed three times, slightly off register. Returns an array (the
 * widget tree builder flattens children arrays but does not support Fragment).
 */
function misprint(key: string, box: Box, text: string, size: number, color: string, align: 'left' | 'center' = 'left') {
  const layer = (c: string, dx: number, dy: number) => (
    <FlexWidget key={key + c} style={{ ...at(box, dx, dy), justifyContent: 'center', alignItems: align === 'center' ? 'center' : 'flex-start' }}>
      <TextWidget
        text={text}
        maxLines={1}
        truncate="END"
        allowFontScaling={false}
        style={{ fontFamily: COMIC, fontSize: size, color: hex(c), letterSpacing: 1, textAlign: align }}
      />
    </FlexWidget>
  );
  return [layer(CYAN, -1.5, -1), layer(MAGENTA, 2, 1.5), layer(color, 0, 0)];
}

export function RiscadoWidget({ width, height, data }: { width: number; height: number; data: WidgetData }) {
  const L = computeLayout(width, height, data);
  const subtitle = data.total ? `${data.total} PRA FAZER` : 'TUDO RISCADO!';

  return (
    <OverlapWidget
      style={{ width: 'match_parent', height: 'match_parent' }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: LINK_LIST }}
      accessibilityLabel={`${data.title}: ${subtitle}`}
    >
      <SvgWidget svg={widgetArt(L)} style={{ width: L.w, height: L.h }} />

      <FlexWidget style={{ ...at(L.caption), justifyContent: 'center', paddingHorizontal: 10 }}>
        <TextWidget
          text={data.title.toUpperCase()}
          maxLines={1}
          truncate="END"
          allowFontScaling={false}
          style={{ fontFamily: COMIC, fontSize: L.titleSize, color: hex(colors.ink), letterSpacing: 1 }}
        />
      </FlexWidget>

      {misprint('sub', L.subtitle, subtitle, 14, colors.text)}

      {L.items.map((it) =>
        it.kind === 'more' ? (
          <FlexWidget key={it.id} style={{ ...at(it), justifyContent: 'center', alignItems: 'center' }}>
            <TextWidget
              text={it.text}
              allowFontScaling={false}
              style={{ fontFamily: COMIC, fontSize: 14, color: hex(colors.muted), letterSpacing: 1.5 }}
            />
          </FlexWidget>
        ) : (
          <FlexWidget key={it.id} style={{ ...at(it), justifyContent: 'center', paddingLeft: 28, paddingRight: 10 }}>
            <TextWidget
              text={it.text}
              maxLines={1}
              truncate="END"
              allowFontScaling={false}
              style={{ fontFamily: HAND, fontSize: 14, color: hex(colors.paperText) }}
            />
          </FlexWidget>
        ),
      )}

      {L.empty && misprint('empty', L.empty, 'NADA!', Math.round(Math.min(34, L.empty.h * 0.45)), colors.text, 'center')}

      {L.add && (
        <FlexWidget
          style={{ ...at(L.add), borderRadius: L.add.w / 2 }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: LINK_ADD }}
          accessibilityLabel="Nova tarefa"
        />
      )}
    </OverlapWidget>
  );
}
