import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['variant', 'size', 'tooltipText', 'disabled', 'events']

export const CloseButtonInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  variant: {
    type: 'select',
    options: [
      { label: 'Text', value: 'text' },
      { label: 'Default', value: 'default' },
      { label: 'Outline', value: 'outline' },
      { label: 'Secondary', value: 'secondary' },
    ],
  },
  size: {
    type: 'select',
    options: [
      { label: 'Tiny', value: 'tiny' },
      { label: 'Small', value: 'small' },
      { label: 'Medium', value: 'medium' },
    ],
  },
  tooltipText: {
    section: 'Content',
    placeholder: 'Close',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"click","type":"query","queryName":"onClick"}]',
  },
})
