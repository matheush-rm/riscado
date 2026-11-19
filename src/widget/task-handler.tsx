'use no memo';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { widgetData } from './data';
import { WIDGET_NAME } from './layout';
import { RiscadoWidget } from './RiscadoWidget';

/** Runs headless when the launcher asks for a (re)render: added, resized, periodic update. */
export async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetInfo.widgetName !== WIDGET_NAME) return;
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  renderWidget(<RiscadoWidget width={widgetInfo.width} height={widgetInfo.height} data={widgetData()} />);
}
