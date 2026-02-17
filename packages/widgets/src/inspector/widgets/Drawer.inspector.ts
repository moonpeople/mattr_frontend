import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'title',
  'description',
  'open',
  'side',
  'size',
  'showHeader',
  'showFooter',
  'showOverlay',
  'closeOnOutsideClick',
  'padding',
  'bordered',
  'background',
  'events',
]

export const DrawerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  title: {
    placeholder: 'Drawer title',
  },
  description: {
    placeholder: 'Optional description',
  },
  size: {
    type: 'select',
    options: [
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
      { label: 'Large', value: 'lg' },
      { label: 'Full', value: 'full' },
    ],
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"toggle","type":"query","queryName":"onDrawerToggle"}]',
  },
})
