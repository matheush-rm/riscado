'use no memo';
import { registerWidgetTaskHandler, requestWidgetUpdate } from 'react-native-android-widget';

import { widgetData } from './data';
import { WIDGET_NAME } from './layout';
import { RiscadoWidget } from './RiscadoWidget';
import { widgetTaskHandler } from './task-handler';

export function registerWidget() {
  registerWidgetTaskHandler(widgetTaskHandler);
}

/** Re-render every Riscado widget on the home screen with fresh data. */
export function refreshWidgets() {
  const data = widgetData();
  requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: ({ width, height }) => <RiscadoWidget width={width} height={height} data={data} />,
  }).catch(() => {});
}
