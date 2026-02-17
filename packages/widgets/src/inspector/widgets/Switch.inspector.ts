import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'labelVariant',
  'checked',
  'labelOn',
  'labelOff',
  'required',
  'helperText',
  'disabled',
  'events',
]

export const SwitchInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  labelVariant: {
    section: 'Content',
  },
  checked: {
    section: 'Content',
  },
  labelOn: {
    section: 'Content',
    placeholder: 'On label',
  },
  labelOff: {
    section: 'Content',
    placeholder: 'Off label',
  },
  required: {
    section: 'Interaction',
  },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onToggle"}]',
  },
})
