import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'placeholder', 'value', 'rows', 'helperText', 'disabled', 'events']

export const TextEditorInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  placeholder: {
    section: 'Content',
    placeholder: 'Enter content',
  },
  value: {
    type: 'textarea',
    placeholder: 'Content',
  },
  rows: {
    min: 4,
    max: 20,
    step: 1,
  },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
  events: {
    placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]',
  },
})
