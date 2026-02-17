import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'placeholder', 'value', 'helperText', 'disabled', 'required', 'events']

export const ColorInputInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  placeholder: {
    section: 'Content',
    placeholder: 'Enter a color',
  },
  value: {
    section: 'Content',
    placeholder: '#2563eb',
  },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
  events: {
    placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]',
  },
})
