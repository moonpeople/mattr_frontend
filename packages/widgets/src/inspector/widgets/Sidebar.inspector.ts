import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'description',
  'side',
  'width',
  'collapsible',
  'open',
  'showHeader',
  'showFooter',
  'headerPadding',
  'footerPadding',
  'bordered',
  'background',
]

export const SidebarInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  description: {
    placeholder: 'Optional description',
  },
  side: {
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ],
  },
  width: {
    section: 'Appearance',
    min: 120,
    max: 640,
    step: 10,
  },
})
