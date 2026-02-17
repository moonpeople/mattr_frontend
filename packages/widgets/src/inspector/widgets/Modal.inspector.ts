import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'title',
  'description',
  'open',
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

export const ModalInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  title: {
    placeholder: 'Modal title',
  },
  description: {
    placeholder: 'Optional description',
  },
  size: {
    type: 'select',
    options: [
      { label: 'Small', value: 'small' },
      { label: 'Medium', value: 'medium' },
      { label: 'Large', value: 'large' },
      { label: 'Extra large', value: 'xlarge' },
    ],
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"toggle","type":"query","queryName":"onModalToggle"}]',
  },
})
