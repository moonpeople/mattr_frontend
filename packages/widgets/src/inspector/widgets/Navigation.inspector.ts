import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'itemMode',
  'menuItems',
  'data',
  'labels',
  'iconByIndex',
  'captionByIndex',
  'tooltipByIndex',
  'parentKeyByIndex',
  'highlightByIndex',
  'hiddenByIndex',
  'disabledByIndex',
  'logo',
  'disabled',
  'orientation',
  'horizontalAlignment',
  'overflowMode',
  'margin',
  'textColor',
  'activeTextColor',
  'activeBackground',
  'hoverBackground',
  'iconColor',
  'activeIconColor',
  'itemBorderRadius',
]

export const NavigationInspector: WidgetInspectorConfig =
  buildInspectorConfig(fieldKeys)
